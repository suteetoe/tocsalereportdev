# AGENTS.md — QA Team

> เอกสารนี้เขียนขึ้นสำหรับ AI coding agent (เช่น Claude Code) และ QA engineer ที่ทำงานบนโค้ดของทีม QA
> โปรเจกต์: **Sale & BI Report System**

## 1. ภาพรวมโปรเจกต์

ทีม QA รับผิดชอบตรวจสอบคุณภาพของระบบ Sale & BI Report ก่อนส่งมอบ โดยใช้ **Playwright** เขียน End-to-End (E2E) test ครอบคลุม flow การใช้งานจริงของผู้ใช้ ตั้งแต่ฝั่ง Frontend ไปจนถึง Backend API

## 2. Tech Stack

| หมวด | เทคโนโลยี |
|---|---|
| E2E Testing Framework | Playwright (Test Runner) |
| ภาษา | TypeScript |
| CI Integration | ระบุ pipeline ที่ใช้ (เช่น GitHub Actions / GitLab CI) |
| Reporting | Playwright HTML Report (+ เชื่อมต่อ dashboard ถ้ามี) |

## 3. โครงสร้างโฟลเดอร์มาตรฐาน

```
e2e/
  tests/
    <feature>/               # จัดกลุ่ม test ตาม feature เช่น sales-report, auth, dashboard
      <scenario>.spec.ts
  pages/                      # Page Object Model (POM)
    <page-name>.page.ts
  fixtures/                   # test fixture, custom fixture ของ Playwright
  data/                       # test data / mock data
  utils/                      # helper function (auth helper, api helper, ฯลฯ)
playwright.config.ts
```

## 4. หลักการเขียน Test

- ใช้ **Page Object Model (POM)**: locator และ action ของแต่ละหน้าต้องอยู่ใน `pages/` ไม่ hardcode selector ใน test file โดยตรง
- ใช้ locator ที่ทนทานต่อการเปลี่ยนแปลง UI — เรียงลำดับความสำคัญ: `data-testid` > role/label > text > CSS selector (หลีกเลี่ยง CSS selector ที่ผูกกับ implementation)
- ทุก test ต้อง **independent** — รันเดี่ยว ๆ หรือรันพร้อมกัน (parallel) ได้โดยไม่พึ่งพา state จาก test อื่น
- ใช้ fixture ของ Playwright จัดการ setup/teardown (เช่น login, seed data) แทนการเขียนซ้ำในแต่ละ test
- ตั้งชื่อ test ให้สื่อความหมายระดับ business เช่น `"ผู้ใช้สามารถกรองรายงานยอดขายตามช่วงวันที่ได้"`

## 5. Naming Convention

- ไฟล์ test: `<feature>.spec.ts`
- ไฟล์ page object: `<page-name>.page.ts`
- Test tag: ใช้ Playwright tag (`@smoke`, `@regression`, `@critical`) เพื่อคัด scope การรันใน CI

## 6. คำสั่งที่ใช้บ่อย

```bash
npm install
npx playwright install        # ติดตั้ง browser ที่จำเป็น
npx playwright test           # รัน test ทั้งหมด
npx playwright test --ui      # รันแบบ UI mode
npx playwright test <path>    # รันเฉพาะไฟล์/โฟลเดอร์
npx playwright test --grep @smoke   # รันเฉพาะ tag ที่กำหนด
npx playwright show-report    # เปิดดูรายงานผลการทดสอบ
```

## 7. ขอบเขตการทดสอบ

| ประเภท | ตัวอย่าง |
|---|---|
| Smoke Test (`@smoke`) | flow หลักที่ต้องผ่านเสมอ เช่น login, เปิด dashboard ได้ |
| Regression Test (`@regression`) | ครอบคลุม feature เดิมทั้งหมดหลังมีการแก้ไข/เพิ่ม feature ใหม่ |
| Critical Path (`@critical`) | flow ที่กระทบธุรกิจโดยตรง เช่น การสร้างรายงานยอดขาย, export ข้อมูล |
| Cross-browser | รันอย่างน้อยบน Chromium, Firefox, WebKit ตามที่ทีมตกลง |

## 8. เกณฑ์การรับงานก่อนส่งมอบ (Definition of Done)

1. Feature ใหม่ทุกตัวต้องมี E2E test ครอบคลุม happy path อย่างน้อย 1 เคส
2. Test ทั้งหมดใน `@smoke` และ `@regression` ต้องผ่านก่อน merge เข้า `main`/ก่อน release
3. Bug ที่พบต้องถูกบันทึกพร้อม: ขั้นตอนทำซ้ำ (reproduce steps), ผลลัพธ์ที่คาดหวัง vs จริง, screenshot/trace จาก Playwright
4. ใช้ Playwright trace viewer (`npx playwright show-trace`) แนบไฟล์ trace เมื่อรายงานบั๊กที่ reproduce ยาก

## 9. การประสานงานกับทีมอื่น

- ขอให้ Frontend เพิ่ม `data-testid` ให้ element สำคัญที่ยังไม่มี ผ่านการแจ้ง/สร้าง issue แทนการไปแก้โค้ด Frontend เอง
- ขอ mock/test data หรือ endpoint สำหรับ seed ข้อมูลทดสอบจากทีม Backend หากจำเป็น
- Test ควรรันได้ทั้งใน local และ CI โดยไม่ต้อง config เพิ่มเติมมาก

## 10. Git & PR Workflow

- Branch naming: `test/<feature>-<เรื่องย่อ>`
- Commit message: Conventional Commits (`test:`, `fix:`, `docs:`)
- PR checklist:
  - [ ] Test ใหม่ผ่านทั้งแบบรันเดี่ยวและรันพร้อม suite เดิม
  - [ ] ไม่มี hardcoded wait (`page.waitForTimeout`) โดยไม่จำเป็น — ใช้ auto-waiting/assertion ของ Playwright แทน
  - [ ] Locator ใช้ตามลำดับความสำคัญในข้อ 4
  - [ ] อัปเดต tag (`@smoke`/`@regression`/`@critical`) ให้ถูกต้อง

## 11. สิ่งที่ Agent ควรระวังเป็นพิเศษ

- ห้ามใช้ fixed timeout/`sleep` แทน proper wait condition — ทำให้ test flaky
- ห้าม assert ที่ผูกกับข้อมูลที่เปลี่ยนแปลงได้ (เช่น timestamp ปัจจุบัน) โดยไม่มีการ control ค่าที่แน่นอน
- เมื่อ UI เปลี่ยน ต้องอัปเดตที่ Page Object เท่านั้น ไม่ไปแก้ selector กระจายในไฟล์ test หลายไฟล์
