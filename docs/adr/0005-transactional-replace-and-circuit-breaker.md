# 0005 Transactional Replace and Circuit Breaker for Sales Ingestion

## Status

Accepted

## Context

The initial sales ingestion pipeline implemented an incremental `UPSERT` (`INSERT ... ON CONFLICT DO UPDATE`) strategy for incoming transactions. While effective for appending new data, this approach creates critical data consistency risks when upstream ERP transactions are deleted, voided (`last_status != 0`), reclassified, or when products are unmapped from `push_products`. 

In such scenarios, old records in `sales_product_monthly_records`, `sales_product_quarterly_records`, and `sales_company_quarterly_metrics` are never purged or zeroed out. Consequently, reports display stale, orphaned data and artificially inflated sales numbers that no longer match the ERP source of truth.

Furthermore, naive full deletion prior to ingestion risks catastrophic data loss if an upstream failure (such as view timeout, database network partition, or partial data fetch) returns an empty or severely truncated dataset.

## Decision

1. **Transactional Replace (Atomic Dual-Year Wipe-and-Reload)**:
   - For any import run targeting year $Y$, the synchronized years ($Y$ and $Y-1$) are updated atomically within a **single database transaction**.
   - Within the transaction, existing records matching `year IN (Y-1, Y)` in the following transactional tables are deleted before inserting the freshly aggregated datasets:
     - `sales_product_monthly_records`
     - `sales_product_quarterly_records`
     - `sales_company_quarterly_metrics`
   - Master data in `sales_products` is **never deleted**, only inserted or updated, ensuring referential integrity for historical records across other years.
   - Any database failure rolls back the entire transaction, leaving existing data untouched.

2. **Circuit Breaker (Data Drop Guard)**:
   - Before executing the deletion and replacement, the ingestion service validates row counts against historical baselines derived from the latest successful `sales_import_logs`:
     - **Year $Y$ (Current / Target Year)**: Aborts if fetched transaction rows equal `0`.
     - **Year $Y-1$ (Prior Closed Year)**: Aborts if fetched transaction rows drop by more than **50%** relative to the prior successful run baseline (evaluated when baseline is $\ge 50$ rows).
   - If triggered without an override, the transaction is aborted, rolled back, and logged with status `FAILED` and error code `circuit_breaker_triggered`. The API responds with HTTP 422 Unprocessable Entity and detailed diagnostic metrics.

3. **Force Sync Override (`force=true`)**:
   - Administrative endpoints (`POST /admin/sales/sync-push`) support an optional `force=true` query parameter and request body field.
   - When `force=true` is set, Circuit Breaker thresholds are bypassed, permitting deliberate data restructuring or historical purges performed by authorized operators.

## Consequences

- **Guaranteed Consistency**: Sales reports perfectly match ERP records after each run with zero orphaned records.
- **Resilience**: The Circuit Breaker prevents accidental truncation due to upstream database glitches, partial queries, or network drops.
- **Operational Control**: Authorized administrators retain the capability to execute manual overrides via `force=true`.
- **Atomic Rollback**: Multi-year comparisons (YoY Month and YTD) remain mutually consistent; either both years sync successfully or neither changes.
