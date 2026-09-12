-- ======================================================================================
-- View Name: sales_transactions
-- Target Database: External ERP Database (PostgreSQL)
-- Description:
--   สร้าง Database View สำหรับสรุปยอดขายระดับรายเดือน (Monthly Granularity)
--   จากตารางรายการเอกสารสินค้า (ic_trans_detail) และมาสเตอร์สินค้า (ic_inventory)
--   เพื่อใช้เป็นแหล่งข้อมูลให้กับระบบ Sale & BI Report (tocsalereport-api)
--   ในการประมวลผลรายงาน Sale By Product (YTD) และ Sale Push Reports
--
-- Reference: docs/adr/0004-monthly-granularity-and-dual-year-sync.md
--            docs/external-sales-database-schema.md
-- ======================================================================================

CREATE OR REPLACE VIEW sales_transactions AS
SELECT 
    -- สร้าง ID ที่ไม่ซ้ำกันต่อแถวจาก Product Code, ปี, และ เดือน
    MD5(CONCAT(
        ic_trans_detail.item_code, '-', 
        EXTRACT(YEAR FROM ic_trans_detail.doc_date), '-', 
        EXTRACT(MONTH FROM ic_trans_detail.doc_date)
    )) AS id,

    -- รหัสและชื่อสินค้า
    ic_trans_detail.item_code AS product_code,
    ic_inventory.name_1       AS product_name,
    ic_trans_detail.unit_code AS unit,

    -- ปี, เดือน (1-12), และ ไตรมาส (Q1-Q4)
    EXTRACT(YEAR FROM ic_trans_detail.doc_date)::int           AS year,
    EXTRACT(MONTH FROM ic_trans_detail.doc_date)::int          AS month,
    'Q' || EXTRACT(QUARTER FROM ic_trans_detail.doc_date)::text AS quarter,

    -- ปริมาณขายสุทธิ (หักใบลดหนี้/รับคืน trans_flag = 48)
    SUM(CASE 
        WHEN ic_trans_detail.trans_flag = 48 THEN -1 * ic_trans_detail.qty 
        ELSE ic_trans_detail.qty 
    END) AS qty,

    -- มูลค่ายอดขายสุทธิ (หักใบลดหนี้/รับคืน trans_flag = 48)
    SUM(CASE 
        WHEN ic_trans_detail.trans_flag = 48 THEN -1 * ic_trans_detail.sum_amount 
        ELSE ic_trans_detail.sum_amount 
    END) AS value,

    -- ต้นทุนขายสุทธิ (หักใบลดหนี้/รับคืน trans_flag = 48) สำหรับคำนวณ Gross Profit & Margin
    SUM(CASE 
        WHEN ic_trans_detail.trans_flag = 48 THEN -1 * ic_trans_detail.sum_of_cost 
        ELSE ic_trans_detail.sum_of_cost 
    END) AS cost

FROM ic_trans_detail
JOIN ic_inventory ON ic_inventory.code = ic_trans_detail.item_code
WHERE ic_trans_detail.last_status = 0               -- เฉพาะเอกสารปกติ ไม่ถูกยกเลิก (Void/Cancel)
  AND ic_trans_detail.trans_flag IN (44, 46, 48)    -- 44=ขายสด, 46=ขายเชื่อ, 48=รับคืน/ลดหนี้
  AND ic_trans_detail.item_code IS NOT NULL         -- กรองรายการที่ไม่มีรหัสสินค้า
  AND TRIM(ic_trans_detail.item_code) <> ''
GROUP BY 
    ic_trans_detail.item_code,
    ic_inventory.name_1,
    ic_trans_detail.unit_code,
    EXTRACT(YEAR FROM ic_trans_detail.doc_date),
    EXTRACT(MONTH FROM ic_trans_detail.doc_date),
    EXTRACT(QUARTER FROM ic_trans_detail.doc_date);
