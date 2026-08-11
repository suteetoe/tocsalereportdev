# Spec: ระบบยืนยันตัวตนผู้ใช้งาน (User Auth) — v1

สถานะ: ร่าง (draft) — รอ approve ก่อน dispatch ให้ `backend-agent`

## Decisions ที่ล็อกแล้ว

- Role: 2 ระดับ — `admin` / `user`
- Token: JWT stateless (access token) + refresh token เก็บใน DB (revoke ได้)
- ไม่รวม self-registration — สร้าง user ได้แค่ผ่าน CLI และ Admin API เท่านั้น
- HTTP API base URL: ทุก endpoint ใน spec นี้เรียกผ่าน `{API_BASE_URL}/tocsalereportapi/api/v1`

## 1. ขอบเขต (Scope)

โมดูล `internal/core/user` (จัดการ user + credential) และ `internal/core/auth` (login, token) ตาม Hexagonal Architecture ของ [`docs/backend-architecture.md`](backend-architecture.md) โดยมี 2 ช่องทางสร้างผู้ใช้:

| ช่องทาง | ใคร | Interface |
|---|---|---|
| CLI | Dev/Ops ตอน deploy หรือ bootstrap (เช่น สร้าง super admin คนแรก) | `cmd/cli` (Go binary แยกจาก `cmd/api`) |
| Admin | ผู้ดูแลระบบที่ login แล้ว | REST API ผ่าน `{API_BASE_URL}/tocsalereportapi/api/v1/admin/users` (ต้องมี role admin) |

นอกขอบเขตของ spec นี้: self-registration (สมัครเองผ่านหน้าเว็บ), OAuth/SSO, forgot-password ผ่านอีเมล — ตัดออกตามที่ตกลง อาจเพิ่มเป็น phase ถัดไป

## 2. User Model

```
bi_users
  id                    uuid PK
  username              varchar unique
  email                 varchar unique
  password_hash         varchar        -- bcrypt (cost 12) หรือ argon2id
  full_name             varchar
  role                  varchar        -- 'admin' | 'user'
  status                varchar        -- 'active' | 'disabled'
  created_by            varchar        -- 'cli' | admin user_id
  must_change_password  bool
  created_at / updated_at / last_login_at

bi_refresh_tokens
  id            uuid PK
  user_id       uuid FK -> bi_users.id
  token_hash    varchar        -- เก็บ hash ไม่เก็บ raw token
  expires_at    timestamp
  revoked_at    timestamp nullable
  created_at
```

## 3. Flow 1 — สร้างผ่าน CLI

```
go run ./cmd/cli user create --username admin --email admin@toc.com --role admin
go run ./cmd/cli user list
go run ./cmd/cli user disable --username xxx
go run ./cmd/cli user reset-password --username xxx
```

- Password รับผ่าน interactive prompt (masked input) ไม่รับผ่าน flag ตรงๆ (กัน password หลุดใน shell history / process list)
- ใช้ usecase เดียวกับ Admin API (`CreateUserUseCase`) — CLI เป็นแค่ adapter อีกตัวใน `adapter/in/cli` ไม่ duplicate logic
- ต่อ DB ตรงผ่าน config/.env เดียวกับ `cmd/api`
- Use case หลัก: bootstrap super-admin คนแรกตอนระบบยังไม่มี user เลย, หรือ ops สร้าง/reset user แบบ emergency

## 4. Flow 2 — สร้างโดย Admin (REST API)

Endpoint ในตารางนี้เป็น path ใต้ `{API_BASE_URL}/tocsalereportapi/api/v1`

| Method | Endpoint | Auth | คำอธิบาย |
|---|---|---|---|
| POST | `/admin/users` | JWT + role=admin | สร้าง user ใหม่ |
| GET | `/admin/users` | JWT + role=admin | list + pagination/filter |
| GET | `/admin/users/:id` | JWT + role=admin | ดูรายละเอียด |
| PATCH | `/admin/users/:id` | JWT + role=admin | แก้ role/status |
| POST | `/admin/users/:id/reset-password` | JWT + role=admin | reset password ให้ user |
| DELETE | `/admin/users/:id` | JWT + role=admin | soft delete (status=disabled) — ไม่ hard delete |

Admin สร้าง user โดยระบบ generate temp password ให้ → ตั้ง `must_change_password = true`

## 5. Authentication (Login)

Endpoint ในตารางนี้เป็น path ใต้ `{API_BASE_URL}/tocsalereportapi/api/v1`

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| POST | `/auth/login` | username/email + password → access token (JWT, อายุ 15 นาที) + refresh token (อายุ 7 วัน) |
| POST | `/auth/refresh` | refresh token → access token ใหม่ (rotate refresh token ด้วย) |
| POST | `/auth/logout` | revoke refresh token ปัจจุบัน |
| POST | `/auth/change-password` | user เปลี่ยนรหัสตัวเอง (ต้องใส่รหัสเดิม) |

Revoke ทั้งหมด (เช่น admin สั่ง disable user) → set `revoked_at` ทุกแถวใน `bi_refresh_tokens` ของ user นั้น

## 6. Profile

Endpoint ในตารางนี้เป็น path ใต้ `{API_BASE_URL}/tocsalereportapi/api/v1`

| Method | Endpoint | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/profile/me` | JWT bearer token | ดึงข้อมูล user ปัจจุบันจาก bearer token ที่ส่งมาใน `Authorization: Bearer <access_token>` |

Response ของ `/profile/me` ต้องคืนข้อมูล user จาก token subject โดยไม่คืน `password_hash` หรือ token ดิบใน response

## 7. โครงสร้างโค้ด (Hexagonal, ตาม `docs/backend-architecture.md`)

```
internal/
  core/
    user/
      domain/            # User entity + validation
      port.go             # inbound: CreateUserUseCase, ListUsersUseCase, UpdateUserUseCase, DisableUserUseCase
                            # outbound: UserRepository
      service.go           # usecase implementation
    auth/
      domain/            # Credential, TokenPair
      port.go             # inbound: LoginUseCase, RefreshTokenUseCase, LogoutUseCase, ChangePasswordUseCase
                            # outbound: RefreshTokenStore, PasswordHasher, TokenSigner
      service.go
  adapters/
    http/
      user_handler.go       # admin user endpoints
      auth_handler.go        # /auth/* endpoints
      profile_handler.go     # /profile/me endpoint
      middleware/              # JWT auth middleware (role check)
    repositories/
      user_repository.go       # bi_users
      refresh_token_repository.go  # bi_refresh_tokens
      models/                    # GORM models
  app/                      # wiring: core/user, core/auth service construction + route registration
cmd/
  api/main.go              # มีอยู่แล้ว
  cli/main.go               # ใหม่ — cobra-based, เรียก core/user service เดียวกับ HTTP handler
```

CLI (`cmd/cli`) เป็น adapter อีกตัวที่เรียก `core/user` service ตัวเดียวกับที่ `adapters/http` เรียก — ไม่ duplicate business logic

## 8. Security checklist

- bcrypt cost ≥ 12 สำหรับ password และ refresh token hash
- Rate limit `/auth/login` กัน brute force
- Audit: `created_by` ทุก record, log การ disable/reset-password
- Middleware ตรวจ JWT + role ก่อนเข้า `/admin/*`
- Middleware ตรวจ JWT ก่อนเข้า `/profile/me`
- ไม่ log password/token ดิบ

## 9. Testing (ตามมาตรฐาน `docs/backend-architecture.md`)

- Unit test 100% coverage: `core/user` และ `core/auth` service (mock ports, ไม่แตะ DB/network จริง)
- Integration test: `adapters/repositories` ต่อ DB test schema จริง
- Swagger/OpenAPI ต้อง regenerate หลัง handler เสร็จ (เป็น contract ให้ frontend/QA)

## Next Steps

1. Review/approve spec นี้
2. Dispatch ให้ `backend-agent` implement ใน `backend/` (branch จาก `develop`)
3. `qa-agent` รัน e2e regression ก่อน rollout
