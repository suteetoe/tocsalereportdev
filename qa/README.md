# Sale & BI Report — QA (E2E Testing)

ชุด End-to-End test สำหรับระบบ Sale & BI Report เขียนด้วย **Playwright** เพื่อตรวจสอบคุณภาพของระบบก่อนส่งมอบ

> รายละเอียดมาตรฐานการเขียน test, โครงสร้างโปรเจกต์ และแนวทางสำหรับ AI coding agent ดูที่ [`AGENTS.md`](./AGENTS.md)

## Prerequisites

- Node.js (เวอร์ชันตามที่ระบุใน `package.json` engines)
- ระบบ Frontend และ Backend ต้องรันอยู่ (local หรือชี้ไปยัง environment ทดสอบ)

## Getting Started

```bash
# 1. Clone โปรเจกต์
git clone <repo-url>
cd qa

# 2. ติดตั้ง dependency
npm install

# 3. ติดตั้ง browser ที่ Playwright ต้องใช้
npx playwright install

# 4. ตั้งค่า environment variables
cp .env.example .env
```

## การรัน Test

```bash
# รันทั้งหมด
npx playwright test

# รันแบบ UI mode (ดู step การทำงานแบบ interactive)
npx playwright test --ui

# รันเฉพาะกลุ่ม smoke test
npx playwright test --grep @smoke

# เปิดดูรายงานผลล่าสุด
npx playwright show-report
```

## โครงสร้างโปรเจกต์ (สรุป)

```
e2e/
  tests/       ไฟล์ test แยกตาม feature
  pages/       Page Object Model
  fixtures/    custom fixture ของ Playwright
  data/        test data
  utils/       helper function
playwright.config.ts
```

รายละเอียดหลักการเขียน test, naming convention, และ Definition of Done ดูที่ [`AGENTS.md`](./AGENTS.md)

## Environment Variables (ตัวอย่าง)

| ตัวแปร | คำอธิบาย |
|---|---|
| `BASE_URL` | URL ของ Frontend ที่จะทดสอบ |
| `API_BASE_URL` | URL ของ Backend API (สำหรับ setup ข้อมูล/ตรวจสอบผลลัพธ์) |

> ปรับรายการจริงตาม `.env.example` ของโปรเจกต์

## Test Tag ที่ใช้

| Tag | ความหมาย |
|---|---|
| `@smoke` | flow หลักที่ต้องผ่านเสมอ ก่อน deploy ทุกครั้ง |
| `@regression` | ครอบคลุม feature เดิมทั้งหมด รันก่อน release |
| `@critical` | flow ที่กระทบธุรกิจโดยตรง |

## การรายงานบั๊ก

เมื่อพบบั๊กจากการทดสอบ ให้แนบ:
1. ขั้นตอนทำซ้ำ (reproduce steps)
2. ผลลัพธ์ที่คาดหวัง vs ผลลัพธ์จริง
3. Trace/Screenshot จาก Playwright (`npx playwright show-trace <trace-file>`)

## แนวทางการส่งงาน (Contribution)

1. สร้าง branch จาก `main` ตาม naming convention (`test/...`)
2. เขียน test ตาม Page Object Model และ tag ให้ถูกต้อง
3. รัน test ให้ผ่านทั้งแบบเดี่ยวและแบบ suite เต็มก่อน push
4. เปิด Pull Request พร้อม checklist ตาม `AGENTS.md`
5. รอ review จากอย่างน้อย 1 คนในทีมก่อน merge

## ติดต่อทีม

ระบุช่องทางติดต่อ/Slack channel ของทีม QA ที่นี่
