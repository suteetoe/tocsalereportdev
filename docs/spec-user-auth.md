# Spec: ระบบยืนยันตัวตนผู้ใช้งาน (User Auth) - v1

สถานะ: Implemented

เอกสารนี้เป็น baseline ของระบบ authentication ที่ implement แล้วใน `backend/` และเชื่อมใช้งานแล้วใน `frontend/` โดย Swagger/OpenAPI ที่ `backend/docs/` เป็น source of truth สำหรับ contract รายละเอียดเชิงเครื่องอ่าน

## Decisions ที่ล็อกแล้ว

- Role: 2 ระดับ - `admin` / `user`
- User status: `active` / `disabled`
- Token: JWT stateless access token + refresh token เก็บ hash ใน DB และ revoke ได้
- ไม่รวม self-registration - สร้าง user ได้ผ่าน initial-user CLI และ Admin API เท่านั้น
- HTTP API base path: `/tocsalereportapi/api/v1`

## 1. ขอบเขตที่มีแล้ว

Backend auth อยู่ภายใต้โมดูล `internal/auth` ตาม Hexagonal Architecture:

```text
backend/internal/auth/
  domain/                 User, RefreshToken, domain errors
  port/in/                AuthUseCase
  port/out/               UserRepository, RefreshTokenRepository, PasswordHasher, TokenIssuer
  usecase/                login, refresh, logout, profile, admin user management
  adapter/in/http/         auth/profile/admin-user handlers + JWT middleware
  adapter/out/postgres/    bi_users และ bi_refresh_tokens repositories
  adapter/out/token/       HMAC JWT issuer/verifier
  adapter/out/bcrypt/      password และ refresh-token hashing
```

Wiring อยู่ที่ `backend/internal/app/server.go` และ initial admin bootstrap อยู่ที่ `backend/cmd/init-user`.

## 2. Data Model

```text
bi_users
  id                    uuid/string PK
  username              unique
  email                 unique
  password_hash         bcrypt hash
  full_name
  role                  admin | user
  status                active | disabled
  created_by
  must_change_password
  created_at
  updated_at
  last_login_at nullable

bi_refresh_tokens
  id                    uuid/string PK
  user_id
  token_hash            bcrypt hash ของ raw refresh token
  expires_at
  revoked_at nullable
  created_at
```

ระบบไม่เก็บ raw password หรือ raw refresh token ในฐานข้อมูล

## 3. Initial Admin CLI

ใช้ `cmd/init-user` เพื่อสร้าง admin คนแรกหรือ bootstrap environment:

```sh
go run ./cmd/init-user --email admin@example.com --name "Admin User" --password "change-me"
```

ทางเลือกที่ลดการทิ้ง password ใน shell history:

```sh
INIT_USER_PASSWORD="change-me" go run ./cmd/init-user --email admin@example.com --name "Admin User"
```

พฤติกรรมปัจจุบัน:

- โหลด `.env` โดย default หรือระบุ `--env-file <path>` ได้
- ต้องมี `DB_DSN` และ `AUTH_TOKEN_SECRET`
- รัน auth auto-migration ก่อนสร้าง user
- สร้าง user role `admin`, username จากส่วนหน้า `@` ของ email, `must_change_password=false`
- แสดงเฉพาะ user id และ email หลังสร้างสำเร็จ

## 4. Admin User API

ทุก endpoint อยู่ใต้ `/tocsalereportapi/api/v1` และต้องใช้ `Authorization: Bearer <accessToken>` ของ user role `admin`

| Method | Endpoint | คำอธิบาย |
| --- | --- | --- |
| POST | `/admin/users` | สร้าง user ใหม่ พร้อม generated temporary password และ `mustChangePassword=true` |
| GET | `/admin/users` | list user รองรับ `page`, `pageSize`, `search`, `role`, `status` |
| GET | `/admin/users/{id}` | ดูรายละเอียด user |
| PATCH | `/admin/users/{id}` | แก้ `role` และ/หรือ `status` |
| POST | `/admin/users/{id}/reset-password` | reset password, คืน temporary password ใหม่ และ revoke refresh token ทั้งหมดของ user |
| DELETE | `/admin/users/{id}` | disable user และ revoke refresh token ทั้งหมดของ user |

## 5. Authentication API

ทุก endpoint อยู่ใต้ `/tocsalereportapi/api/v1`

| Method | Endpoint | Auth | คำอธิบาย |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | login ด้วย `identifier`, `username`, หรือ `email` + `password`; คืน access token, refresh token, token type และ user |
| POST | `/auth/refresh` | public | รับ `refreshToken`, rotate refresh token เดิม และคืน token pair ใหม่ |
| POST | `/auth/logout` | public | รับ `refreshToken` และ revoke token นั้น |
| POST | `/auth/change-password` | bearer token | เปลี่ยนรหัสผ่านด้วย `oldPassword` และ `newPassword`; เมื่อสำเร็จจะ revoke refresh token ทั้งหมดของ user |
| GET | `/profile/me` | bearer token | คืนข้อมูล user ปัจจุบันจาก access token |

Access token TTL ตั้งค่าด้วย `AUTH_TOKEN_TTL` และ default ปัจจุบันคือ `24h`. Refresh token TTL ปัจจุบันคือ 7 วัน

## 6. Response Contract

ทุก response ใช้ envelope:

```json
{
  "success": true,
  "data": {}
}
```

เมื่อ error:

```json
{
  "success": false,
  "error": {
    "code": "validation_failed",
    "message": "request contains invalid values"
  }
}
```

Auth success data:

```json
{
  "user": {
    "id": "user-id",
    "username": "admin",
    "email": "admin@example.com",
    "fullName": "Admin User",
    "role": "admin",
    "status": "active",
    "mustChangePassword": false,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  },
  "accessToken": "jwt",
  "refreshToken": "raw-refresh-token",
  "tokenType": "Bearer"
}
```

`/profile/me` และ admin user responses ไม่คืน `password_hash` หรือ raw token

## 7. Frontend Integration

Frontend auth เชื่อมผ่าน `VITE_API_BASE_URL` โดย client จะ normalize URL ให้ลงท้ายด้วย `/tocsalereportapi/api/v1`

พฤติกรรมหลัก:

- `BackendAuthRepository` เรียก `/auth/login`, `/profile/me`, `/auth/refresh`, `/auth/logout`
- session เก็บใน `localStorage` ด้วย access token, refresh token, token type และ authenticated timestamp
- route guard restore session ก่อนเข้า route ที่ต้อง login
- ถ้า `/profile/me` ได้ 401 และมี refresh token จะเรียก `/auth/refresh` แล้วเก็บ session ใหม่
- logout จะพยายาม revoke refresh token ที่ backend ก่อน clear local session เสมอ

## 8. Security Checklist

- Password และ refresh token hash ด้วย bcrypt
- Middleware ตรวจ JWT ก่อนเข้า `/profile/me` และ `/auth/change-password`
- Middleware ตรวจ JWT + role admin ก่อนเข้า `/admin/users*`
- Disable user, reset password และ change password จะ revoke refresh token ตาม flow ที่เกี่ยวข้อง
- Handler ไม่คืน password hash และไม่คืน raw token ใน profile/admin user responses
- Rate limit `/auth/login` ยังไม่ปรากฏใน implementation ปัจจุบัน จึงควรถูกติดตามเป็น hardening item ถัดไป

## 9. Verification

Backend:

```sh
cd backend
go test ./... -cover
go run github.com/swaggo/swag/cmd/swag@v1.16.6 init -g cmd/api/main.go -o docs
```

Frontend:

```sh
cd frontend
pnpm lint
pnpm type-check
pnpm test:unit
pnpm build
```

QA:

```sh
cd qa
npx playwright test
```
