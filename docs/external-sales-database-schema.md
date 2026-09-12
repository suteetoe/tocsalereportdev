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

## 3. ตาราง `sales_transactions` (ตารางรายการยอดขาย)

### 3.1 วัตถุประสงค์
ใช้เก็บรายการยอดขายรายไตรมาสหรือรายการสรุปยอดขายจากระบบต้นทาง เพื่อนำมาคำนวณ Attribution และรวมยอดขาย (Aggregation) เข้าสู่ตารางสรุปของระบบ

### 3.2 โครงสร้างฟิลด์ (Field Specifications)

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Data Type) | Nullable | คีย์ / ดัชนี (Key / Index) | คำอธิบายและข้อกำหนด | ตัวอย่างข้อมูล |
|---|---|:---:|:---:|---|---|
| **`id`** | `VARCHAR(100)` | YES | Index / Unique | รหัสอ้างอิงธุรกรรมหรือเลขที่บิลจากระบบต้นทาง (สำหรับใช้สอบทาน/Deduplication) | `'TX-2025-001'` |
| **`company_code`** | `VARCHAR(10)` | NO | Index | รหัสบริษัทที่เกิดรายการขาย (`TOC`, `PTOC`, `TOL`, `TOP`) | `'TOC'` |
| **`product_code`** | `VARCHAR(100)` | NO | Index | รหัสสินค้าตามระบบ ERP ต้นทาง | `'PROD-001'` |
| **`product_name`** | `VARCHAR(255)` | NO | - | ชื่อของสินค้า (ภาษาไทยหรืออังกฤษ) | `'ยาลดไข้พาราเซตามอล 500 มก.'` |
| **`unit`** | `VARCHAR(50)` | YES | - | หน่วยนับสินค้า เช่น ขวด, กล่อง, แผง, เม็ด (สามารถเป็นค่าว่าง/NULL ได้) | `'ขวด'` |
| **`year`** | `INTEGER` | NO | Index | ปีปฏิทินที่เกิดยอดขาย (ค.ศ. เช่น `2024`, `2025`) | `2025` |
| **`quarter`** | `VARCHAR(10)` | NO | Index | ไตรมาสที่เกิดยอดขาย ต้องระบุเป็น `Q1`, `Q2`, `Q3`, หรือ `Q4` (Case-insensitive) | `'Q1'` |
| **`qty`** | `NUMERIC(18,4)` | NO | - | ปริมาณ/จำนวนสินค้าที่ขายได้ในงวด | `1500.0000` |
| **`value`** | `NUMERIC(18,4)` | NO | - | มูลค่ายอดขายสุทธิ (บาท) ไม่รวมภาษีและส่วนลด | `75000.0000` |

### 3.3 กฎทางธุรกิจและการประมวลผล (Business Rules)
1. **Product Discovery & Auto-Registration:**
   - หากพบรายการขายของสินค้าที่ยังไม่มีในตาราง `sales_products` ของระบบ ระบบจะทำการบันทึกสินค้าใหม่ลงตารางโดยอัตโนมัติ โดยสร้าง Primary Key:
     $$\text{ID} = \text{company\_code} + \text{"-"} + \text{product\_code}$$
     (เช่น `TOC-PROD-001`) และตั้งค่าเริ่มต้นเป็น Non-Push (`push_years = ""`) เพื่อไม่ให้ยอดขายรวมของบริษัทตกหล่น
2. **Push Attribution:**
   - ในแต่ละรายการขาย ระบบจะนำปี `year` ของรายการนั้นไปเทียบกับ `push_years` ของสินค้า:
     - หาก $\text{year} \in \text{push\_years} \rightarrow$ นับยอดขายเข้าสู่ช่องทาง **Push**
     - หาก $\text{year} \notin \text{push\_years} \rightarrow$ นับยอดขายเข้าสู่ช่องทาง **Non-Push**
3. **Data Aggregation & Storage:**
   - รวมยอด `qty` และ `value` แยกตาม `(company_code, channel, year, quarter)` ลงตาราง **`sales_company_quarterly_metrics`**
   - รวมยอด `qty` และ `value` แยกตาม `(product_id, year, quarter)` ลงตาราง **`sales_product_quarterly_records`**
   - บันทึกด้วยวิธี **Upsert** (`ON CONFLICT DO UPDATE`) ภายใน Database Transaction แบบ Atomic

---

## 4. ตัวอย่าง DDL Script สำหรับสร้างตารางใน PostgreSQL (Reference DDL)

ทีม DBA หรือระบบต้นทางสามารถใช้สคริปต์ SQL ด้านล่างนี้เพื่อสร้างตารางหรือจัดทำ Database View ให้สอดคล้องกับระบบ:

```sql
-- 1. ตาราง push_products
CREATE TABLE IF NOT EXISTS push_products (
    company_code   VARCHAR(10)  NOT NULL,
    product_code   VARCHAR(100) NOT NULL,
    push_years     VARCHAR(100) NOT NULL,
    display_order  INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_code, product_code)
);

CREATE INDEX IF NOT EXISTS idx_push_products_company ON push_products(company_code);
CREATE INDEX IF NOT EXISTS idx_push_products_code ON push_products(product_code);

-- 2. ตาราง sales_transactions
CREATE TABLE IF NOT EXISTS sales_transactions (
    id             VARCHAR(100),
    company_code   VARCHAR(10)    NOT NULL,
    product_code   VARCHAR(100)   NOT NULL,
    product_name   VARCHAR(255)   NOT NULL,
    unit           VARCHAR(50),
    year           INTEGER        NOT NULL,
    quarter        VARCHAR(10)    NOT NULL,
    qty            NUMERIC(18, 4) NOT NULL DEFAULT 0,
    value          NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_tx_year ON sales_transactions(year);
CREATE INDEX IF NOT EXISTS idx_sales_tx_company_year ON sales_transactions(company_code, year);
CREATE INDEX IF NOT EXISTS idx_sales_tx_prod_year_qtr ON sales_transactions(product_code, year, quarter);
```

---

## 5. ตัวอย่างข้อมูลทดสอบ (Sample Data)

### 5.1 ตาราง `push_products`
```sql
INSERT INTO push_products (company_code, product_code, push_years, display_order) VALUES
('TOC', 'PARA-500', '2023,2024,2025', 1),
('TOC', 'AMOX-500', '2024,2025', 2),
('PTOC', 'CETRI-10', '2025', 1),
('TOL', 'SYRUP-60', '2023,2024', 1);
```

### 5.2 ตาราง `sales_transactions`
```sql
INSERT INTO sales_transactions (id, company_code, product_code, product_name, unit, year, quarter, qty, value) VALUES
('TX001', 'TOC', 'PARA-500', 'Paracetamol 500mg', 'ขวด', 2025, 'Q1', 12000.0000, 360000.0000),
('TX002', 'TOC', 'AMOX-500', 'Amoxicillin 500mg', 'กล่อง', 2025, 'Q1', 5000.0000, 250000.0000),
('TX003', 'TOC', 'ASPIR-81', 'Aspirin 81mg', 'แผง', 2025, 'Q1', 8000.0000, 160000.0000),
('TX004', 'PTOC', 'CETRI-10', 'Cetirizine 10mg', 'กล่อง', 2025, 'Q1', 3500.0000, 105000.0000);
```
*(หมายเหตุ: ในตัวอย่างข้างต้น `ASPIR-81` ไม่มีใน `push_products` ระบบจะจัดเป็น Non-Push โดยอัตโนมัติ)*
