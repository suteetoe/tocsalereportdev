# External Sales Database Schema Specification

เอกสารระบุโครงสร้างและข้อกำหนดของตารางข้อมูลในฐานข้อมูลภายนอก (PostgreSQL) สำหรับกระบวนการนำเข้าข้อมูลยอดขายและสินค้าผลักดัน (**In-Process Goroutine Cron Sales Push Ingestion**) เข้าสู่ระบบ **Sale & BI Report**

---

## 1. ภาพรวม (Overview)

กระบวนการนำเข้าข้อมูล (`backend/internal/sales/adapter/out/postgres/external_repository.go`) จะทำการเชื่อมต่อไปยังฐานข้อมูลภายนอกผ่าน Environment Variable `EXTERNAL_SALES_DB_DSN` และอ่านข้อมูลจาก 2 ตาราง/View หลัก:

1. **`push_products`** (กำหนดผ่าน `EXTERNAL_PUSH_TABLE_NAME`, Default: `"push_products"`): ตารางกำหนดรายชื่อสินค้าผลักดันและปีที่มีผลของแต่ละบริษัท
2. **`sales_transactions`** (กำหนดผ่าน `EXTERNAL_SALES_TABLE_NAME`, Default: `"sales_transactions"`): ตารางรายการยอดขายสำหรับนำมาประมวลผลจัดกลุ่มรายไตรมาส

---

## 2. ตาราง `push_products` (ตารางกำหนดสินค้าผลักดัน)

### 2.1 วัตถุประสงค์
ใช้กำหนดว่าสินค้าตัวใดของบริษัทใด ถูกจัดเป็นสินค้าผลักดัน (**Sale Push Channel**) ในปีปฏิทินใดบ้าง เพื่อใช้ในการคำนวณ **Push Attribution**

### 2.2 โครงสร้างฟิลด์ (Field Specifications)

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Data Type) | Nullable | คีย์ / ดัชนี (Key / Index) | คำอธิบายและข้อกำหนด | ตัวอย่างข้อมูล |
|---|---|:---:|:---:|---|---|
| **`company_code`** | `VARCHAR(10)` | NO | PK (Part 1) / Index | รหัสบริษัทผู้จำหน่าย ต้องเป็นหนึ่งใน 4 บริษัทหลัก: `TOC`, `PTOC`, `TOL`, `TOP` (Case-insensitive) | `'TOC'` |
| **`product_code`** | `VARCHAR(100)` | NO | PK (Part 2) / Index | รหัสสินค้าตามระบบ ERP ต้นทาง | `'PROD-001'` |
| **`push_years`** | `VARCHAR(100)` | NO | - | รายการปีปฏิทิน (ค.ศ.) ที่สินค้านี้เป็นสินค้า Push คั่นด้วยเครื่องหมายจุลภาค (Comma-separated) | `'2023,2024,2025'` |
| **`display_order`** | `INTEGER` | NO | - | ลำดับการแสดงผลในรายงานหน้ารายละเอียดสินค้า (เรียงจากน้อยไปมาก, Default: `0`) | `1` |

### 2.3 กฎทางธุรกิจและการแปลงข้อมูล (Business Rules)
- ข้อมูลจากตารางนี้จะถูกนำไปอัปเดตฟิลด์ `push_years` และ `display_order` ในตาราง `sales_products` ของระบบรายงาน
- สินค้าที่มี `push_years` อย่างน้อย 1 ปี จะถือเป็นสินค้ากลุ่มผลักดัน (**Push Product Classification**) และจะถูกจัดแสดงในแท็บ **"Push"** ในหน้ารายละเอียดสินค้า (Product Detail Report)
- หากสินค้าใดไม่มีระบุในตารางนี้ ระบบจะถือว่า `push_years = ""` (เป็นสินค้ากลุ่ม Non-Push ทั้งหมด)

---

## 3. ตาราง/View `sales_transactions` (ยอดขายจากระบบ ERP ต้นทาง)

### 3.1 วัตถุประสงค์
จัดทำเป็น Database View บนฐานข้อมูล ERP (ดึงจากตาราง `ic_trans_detail` และ `ic_inventory`) สรุปยอดขายระดับรายเดือน (`[product_code, year, month]`) เพื่อนำเข้าสู่ระบบ โดยระบบจะทำการ **Inner Join** กับตาราง `push_products` บนระบบรายงาน เพื่อระบุบริษัท (`company_code`) และปีผลักดัน (`push_years`)

### 3.2 โครงสร้างฟิลด์ (Field Specifications)

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Data Type) | Nullable | คีย์ / ดัชนี (Key / Index) | คำอธิบายและข้อกำหนด | ตัวอย่างข้อมูล |
|---|---|:---:|:---:|---|---|
| **`id`** | `VARCHAR(100)` | YES | Index / Unique | รหัสอ้างอิงธุรกรรมหรือ MD5 Hash (`product_code + year + month`) | `'c2e4...b1'` |
| **`product_code`** | `VARCHAR(100)` | NO | Index | รหัสสินค้าตามระบบ ERP ต้นทาง (`ic_trans_detail.item_code`) | `'PROD-001'` |
| **`product_name`** | `VARCHAR(255)` | NO | - | ชื่อของสินค้า (`ic_inventory.name_1`) | `'ยาลดไข้พาราเซตามอล 500 มก.'` |
| **`unit`** | `VARCHAR(50)` | YES | - | หน่วยนับสินค้า เช่น ขวด, กล่อง, แผง, เม็ด | `'ขวด'` |
| **`year`** | `INTEGER` | NO | Index | ปีปฏิทิน ค.ศ. (`EXTRACT(YEAR FROM doc_date)`) | `2026` |
| **`month`** | `INTEGER` | NO | Index | เดือนปฏิทิน 1–12 (`EXTRACT(MONTH FROM doc_date)`) | `8` |
| **`quarter`** | `VARCHAR(10)` | NO | Index | ไตรมาส (`'Q' \|\| EXTRACT(QUARTER FROM doc_date)`) | `'Q3'` |
| **`qty`** | `NUMERIC(18,4)` | NO | - | ปริมาณ/จำนวนสินค้าที่ขายสุทธิ (หักใบลดหนี้/รับคืน `trans_flag = 48`) | `1500.0000` |
| **`value`** | `NUMERIC(18,4)` | NO | - | มูลค่ายอดขายสุทธิ (บาท) | `75000.0000` |
| **`cost`** | `NUMERIC(18,4)` | NO | - | ต้นทุนขายสุทธิ (บาท) สำหรับวิเคราะห์ Gross Profit | `45000.0000` |

### 3.3 กฎทางธุรกิจและการประมวลผล (Business Rules)
1. **Product & Company Mapping (Inner Join):**
   - ระบบรายงานจับคู่รายการขายจาก ERP View กับตาราง `push_products` ด้วย `product_code` แบบ **Inner Join**
   - สินค้าที่มีการระบุใน `push_products` เท่านั้นที่จะถูกนำเข้า และได้รับ `company_code` พร้อม `push_years` ประจำตัว
2. **Push Attribution:**
   - ในแต่ละรายการขาย ระบบนำปี `year` ของรายการนั้นไปเทียบกับ `push_years` ของสินค้า:
     - หาก $\text{year} \in \text{push\_years} \rightarrow$ นับยอดขายเข้าสู่ช่องทาง **Push**
     - หาก $\text{year} \notin \text{push\_years} \rightarrow$ นับยอดขายเข้าสู่ช่องทาง **Non-Push**
3. **Dual Storage Aggregation & Dual-Year Sync:**
   - บันทึกยอดขายระดับรายเดือนลง **`sales_product_monthly_records`** (`qty`, `value`, `cost`)
   - รวมยอด Roll up รายไตรมาสลง **`sales_product_quarterly_records`** และ **`sales_company_quarterly_metrics`**
   - เมื่อทำการ Import ปี $Y$ ระบบจะ Sync ปี $Y$ และ $Y-1$ อัตโนมัติเพื่อให้พร้อมสำหรับการเปรียบเทียบ YoY และ YTD

---

## 4. ตัวอย่างคำสั่งสร้าง VIEW ในฐานข้อมูล ERP PostgreSQL

```sql
CREATE OR REPLACE VIEW sales_transactions AS
SELECT 
    MD5(CONCAT(ic_trans_detail.item_code, '-', EXTRACT(YEAR FROM ic_trans_detail.doc_date), '-', EXTRACT(MONTH FROM ic_trans_detail.doc_date))) AS id,
    ic_trans_detail.item_code AS product_code,
    ic_inventory.name_1 AS product_name,
    ic_trans_detail.unit_code AS unit,
    EXTRACT(YEAR FROM ic_trans_detail.doc_date)::int AS year,
    EXTRACT(MONTH FROM ic_trans_detail.doc_date)::int AS month,
    'Q' || EXTRACT(QUARTER FROM ic_trans_detail.doc_date)::text AS quarter,
    SUM(CASE WHEN ic_trans_detail.trans_flag = 48 THEN -1 * ic_trans_detail.qty ELSE ic_trans_detail.qty END) AS qty,
    SUM(CASE WHEN ic_trans_detail.trans_flag = 48 THEN -1 * ic_trans_detail.sum_amount ELSE ic_trans_detail.sum_amount END) AS value,
    SUM(CASE WHEN ic_trans_detail.trans_flag = 48 THEN -1 * ic_trans_detail.sum_of_cost ELSE ic_trans_detail.sum_of_cost END) AS cost
FROM ic_trans_detail
JOIN ic_inventory ON ic_inventory.code = ic_trans_detail.item_code
WHERE ic_trans_detail.last_status = 0
  AND ic_trans_detail.trans_flag IN (44, 46, 48)
  AND ic_trans_detail.item_code IS NOT NULL 
  AND TRIM(ic_trans_detail.item_code) <> ''
GROUP BY 
    ic_trans_detail.item_code,
    ic_inventory.name_1,
    ic_trans_detail.unit_code,
    EXTRACT(YEAR FROM ic_trans_detail.doc_date),
    EXTRACT(MONTH FROM ic_trans_detail.doc_date),
    EXTRACT(QUARTER FROM ic_trans_detail.doc_date);
```
