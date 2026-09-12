# 0004 Monthly Granularity, Cost Metric, and Dual-Year Sync for Sale By Product YTD Reporting

## Status

Accepted

## Context

The initial sales reporting system operated exclusively at quarterly granularity (Q1–Q4) with revenue value and quantity metrics for Sale Push tracking. The business requires a new analytical capability: **Sale By Product (YTD)** with comparative evaluation between the **Current Month** and the **Same Month Last Year (YoY Month)**, alongside **Year-To-Date (YTD)** performance against the prior year's YTD.

Quarterly aggregation cannot isolate individual months or accurately compute Month-to-Date / YTD metrics at arbitrary points within a quarter. Furthermore, business evaluation requires Cost of Goods Sold (COGS) to calculate Gross Profit and Profit Margin alongside revenue and volume. In the source ERP database, company ownership is not directly stored in transaction lines; rather, `push_products` maintained in the sales report system defines product-to-company mapping and annual push designations.

## Decision

1. **Monthly Data Granularity in ERP View**:
   - The ERP database view `sales_transactions` aggregates transactions at the `[product_code, year, month]` level, projecting `year`, `month` (1–12), derived `quarter` (`Q1`–`Q4`), `qty`, `value` (sales amount), and `cost` (COGS).
   - Date ranges are not hardcoded in the view, allowing dynamic queries.
2. **Inner Join Product Mapping in Ingestion**:
   - The sales report system's `push_products` table serves as the authoritative source for company attribution (`company_code`) and annual push classifications (`push_years`).
   - During ingestion, raw transactions from the ERP view are inner-joined with local product definitions. Transactions for unmapped products are excluded, ensuring clean multi-company attribution.
3. **Dual Storage Architecture (Zero Regression)**:
   - Introduce `sales_product_monthly_records` (`product_id`, `year`, `month`, `quarter`, `qty`, `value`, `cost`) to store monthly granular data.
   - The import service populates monthly records and automatically rolls them up into `sales_product_quarterly_records` and `sales_company_quarterly_metrics`, preserving 100% backward compatibility with existing Sale Push summary and detail reports.
4. **Automated Dual-Year Sync ($Y$ and $Y-1$)**:
   - When importing a target year $Y$, the import service automatically synchronizes both year $Y$ and prior year $Y-1$. This guarantees that comparative baselines (YoY Month and YTD) are always populated without manual intervention.
5. **Target Month and Default State**:
   - For YTD reporting, the target month defaults to the latest calendar month with recorded sales data in the target year, falling back to the current system month. Users can select any month (1–12) via a dropdown filter.

## Consequences

- Monthly records provide the foundation for MoM, YoY Month, YTD, and Quarterly reporting from a single import pipeline.
- Existing Sale Push dashboards remain fully operational without breaking changes.
- Profit margin metrics (`Gross Profit = value - cost`, `Margin % = (Gross Profit / value) * 100`) become readily available for product analysis.
- Storage footprint increases moderately to store 12 monthly rows per product/year instead of 4 quarterly rows, which is well within standard relational capacity.
