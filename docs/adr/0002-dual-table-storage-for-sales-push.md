# 0002 Dual Table Storage for Sales Push Data

## Status
Accepted

## Context
The legacy mock templates provide company quarterly summary data across all quarters (Q1-Q4) for years 2023-2025, but only provide product-level line items for Q1. Deriving company summaries strictly from product rows would leave Q2-Q4 empty in the summary dashboard.

## Decision
Adopt a dual-table persistence model in PostgreSQL:
1. `sales_company_quarterly_metrics`: stores aggregated company-level quarterly metrics (seeded for Q1-Q4 from `sales-data-template.json`).
2. `sales_products` & `sales_product_quarterly_records`: stores individual product master data and quarterly sales records (seeded for Q1 from product detail templates).

Both tables are migrated and seeded automatically upon server startup if empty.

## Consequences
- The summary report immediately supports all quarters (Q1-Q4) without synthetic product generation.
- The product detail report renders genuine Q1 product rows with YoY comparison.
- Future ERP sync jobs can populate both tables or compute summaries when full year product data becomes available.
