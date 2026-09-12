# คู่มือการสั่งรัน Import ข้อมูลยอดขาย (Sales Ingestion Guide)

เอกสารแนะนำวิธีการตั้งค่าและสั่งรันกระบวนการนำเข้าข้อมูลยอดขายจาก Database View บนระบบ ERP (`sales_transactions`) เข้าสู่ระบบ **Sale & BI Report**

---

## 1. ภาพรวมกระบวนการ (Overview)

```mermaid
flowchart LR
    ERP[(ERP Database<br/>sales_transactions VIEW)] -->|1. Query By Year| Import[Backend Ingestion Engine]
    Push[(Local DB<br/>push_products)] -->|2. Inner Join & Map Company| Import
    Import -->|3. Monthly Aggregation| MRec[(sales_product_monthly_records)]
    Import -->|4. Quarterly Rollup| QRec[(sales_product_quarterly_records)]
    Import -->|5. Company Summary| CRec[(sales_company_quarterly_metrics)]
    Import -->|6. Audit Log| Log[(sales_import_logs)]
```

- **Dual-Year Sync:** เมื่อสั่ง Import ปีเป้าหมาย $Y$ ระบบจะทำการดึงและประมวลผลข้อมูลทั้งปี **$Y-1$** และปี **$Y$** ให้อัตโนมัติ เพื่อให้มีข้อมูลปีก่อนหน้าพร้อมสำหรับการเปรียบเทียบ YoY Month และ YTD เสมอ
- **Inner Join Policy:** ระบบจะนำรายการขายไปจับคู่กับตาราง `push_products` บนระบบรายงาน รายการสินค้าที่มีการลงทะเบียนเท่านั้นที่จะถูกนำเข้าและกำหนดรหัสบริษัท (`company_code`) อย่างถูกต้อง
- **Concurrency Control:** มีการใช้ PostgreSQL Advisory Lock ป้องกันการรัน Import ซ้อนกันในเวลาเดียวกัน

---

## 2. การตั้งค่า Environment Variables (`backend/.env`)

ก่อนเริ่มสั่งรัน ให้ตรวจสอบและกำหนดค่าในไฟล์ `.env` ของ Backend ให้ครบถ้วน:

```env
# 1. ฐานข้อมูลของระบบรายงานเอง (Internal DB)
DB_DSN=postgres://user:password@localhost:5432/tocsalereport?sslmode=disable

# 2. ฐานข้อมูล ERP ที่สร้าง View sales_transactions ไว้ (External ERP DB)
EXTERNAL_SALES_DB_DSN=postgres://erp_user:erp_password@erp-host:5432/erp_database?sslmode=disable
EXTERNAL_SALES_TABLE_NAME=sales_transactions
EXTERNAL_PUSH_TABLE_NAME=push_products

# 3. ตั้งค่าการรันอัตโนมัติด้วย Cron (เลือกเปิด/ปิดได้)
SALES_IMPORT_CRON_ENABLED=false
SALES_IMPORT_CRON_SCHEDULE=0 2 * * *
```

---

## 3. วิธีการสั่งรัน Import ข้อมูล

คุณสามารถเลือกสั่งรันได้ 3 วิธีตามความเหมาะสม:

### วิธีที่ 1: สั่งรันผ่าน Swagger UI (แนะนำสำหรับ Manual Test)

1. เปิดเบราว์เซอร์ไปที่:
   ```text
   http://localhost:8080/swagger/index.html
   ```
2. กดปุ่ม **Authorize** (มุมขวาบน) และกรอก Access Token:
   ```text
   Bearer <YOUR_ACCESS_TOKEN>
   ```
3. เลื่อนลงมาที่หมวด **`admin-sales`**
4. เลือก Endpoint:
   ```http
   POST /tocsalereportapi/api/v1/admin/sales/sync-push
   ```
5. กด **Try it out**
6. กำหนดค่าในช่อง `year` (เช่น `2026`) หรือระบุใน Request Body:
   ```json
   {
     "targetYear": 2026
   }
   ```
7. กดปุ่ม **Execute** เพื่อสั่งรัน

---

### วิธีที่ 2: สั่งรันผ่าน cURL / Script / Postman

#### ขั้นตอนที่ 2.1: ขอ Access Token (หากยังไม่มี)
```bash
curl -s -X POST http://localhost:8080/tocsalereportapi/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@example.com",
    "password": "your-password"
  }'
```
*(คัดลอกค่า `data.accessToken` จากผลลัพธ์ที่ได้)*

#### ขั้นตอนที่ 2.2: สั่งรัน Import
```bash
curl -X POST "http://localhost:8080/tocsalereportapi/api/v1/admin/sales/sync-push?year=2026" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```

**ตัวอย่าง Response เมื่อสำเร็จ (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "targetYear": 2026,
    "triggerType": "MANUAL",
    "status": "SUCCESS",
    "executionMs": 1420,
    "processedRows": 15600,
    "importedRows": 840
  }
}
```

---

### วิธีที่ 3: ตั้งค่ารันอัตโนมัติตามตารางเวลา (In-Process Goroutine Cron)

หากต้องการให้ระบบดึงข้อมูลจาก ERP อัตโนมัติทุกวัน ให้เปิดใช้งาน Cron ในไฟล์ `.env`:

```env
SALES_IMPORT_CRON_ENABLED=true
SALES_IMPORT_CRON_SCHEDULE=0 2 * * *
```
*(ตารางเวลาข้างต้นจะสั่งรันทุกวันเวลา 02:00 น. โดยจะใช้ `targetYear` เป็นปีปัจจุบันโดยอัตโนมัติ)*

---

## 4. การตรวจสอบผลการนำเข้าและประวัติการทำงาน (Monitoring)

### 1. เรียกดูประวัติการ Import ผ่าน API:
```bash
curl -X GET "http://localhost:8080/tocsalereportapi/api/v1/admin/sales/import-logs?limit=10" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

### 2. ตรวจสอบโดยตรงในฐานข้อมูล PostgreSQL (Internal DB):
```sql
-- ดูประวัติการรันล่าสุด 5 รายการ
SELECT id, trigger_type, target_year, status, execution_ms, processed_rows, imported_rows, error_message, created_at
FROM sales_import_logs
ORDER BY created_at DESC
LIMIT 5;

-- ดูตัวอย่างข้อมูลยอดขายระดับเดือนที่ถูกนำเข้า
SELECT product_id, year, month, quarter, qty, value, cost
FROM sales_product_monthly_records
ORDER BY year DESC, month DESC
LIMIT 20;
```

---

## 5. การจัดการข้อผิดพลาดที่พบบ่อย (Troubleshooting)

| Error Code | HTTP Status | สาเหตุและการแก้ไข |
|---|:---:|---|
| `sync_already_running` | 409 Conflict | มี Job นำเข้าข้อมูลกำลังทำงานอยู่ (ติด Advisory Lock) ให้รอจนกว่า Job ปัจจุบันจะเสร็จสิ้น |
| `import_service_unavailable` | 503 Service Unavailable | ไม่ได้ตั้งค่า `EXTERNAL_SALES_DB_DSN` ใน `.env` หรือระบบไม่สามารถเชื่อมต่อไปยังฐานข้อมูล ERP ได้ |
| `invalid_year` | 400 Bad Request | ระบุปีไม่ถูกต้อง (ระบบรองรับปี ค.ศ. ระหว่าง 2000 ถึง 2100) |
| `unauthorized` | 401 Unauthorized | Token หมดอายุหรือไม่ถูกต้อง ให้ทำการ Login ขอ Token ใหม่อีกครั้ง |
