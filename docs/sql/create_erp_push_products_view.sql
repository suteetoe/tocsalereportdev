-- ======================================================================================
-- View Name: push_products
-- Target Database: External ERP Database (PostgreSQL)
-- Description:
--   สร้าง Database View สำหรับดึงข้อมูลสินค้าผลักดัน (Push Products) และการสังกัดบริษัท
--   จากตารางมาสเตอร์สินค้า (ic_inventory) และรายละเอียดสินค้า (ic_inventory_detail)
--   เพื่อใช้เป็นแหล่งข้อมูลกำหนดสินค้าผลักดันและสังกัดบริษัทให้กับระบบ Sale & BI Report (tocsalereport-api)
--
-- Reference: docs/external-sales-database-schema.md
-- ======================================================================================

CREATE OR REPLACE VIEW push_products AS
SELECT 
    ic_inventory.code AS product_code, 
    ic_inventory.name_1 AS product_name, 
    ic_inventory_detail.dimension_1 AS company_code, 
    ic_inventory_detail.dimension_45 AS push_years
FROM ic_inventory 
JOIN ic_inventory_detail ON ic_inventory_detail.ic_code = ic_inventory.code;
