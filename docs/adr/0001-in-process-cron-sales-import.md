# 0001 In-Process Goroutine Cron with PostgreSQL Advisory Lock for Sales Push Ingestion

## Status

Accepted

## Context

The Sales & BI Report system requires automated, periodic synchronization and aggregation of raw sales transactions from an external PostgreSQL database into quarterly reporting metrics (`sales_company_quarterly_metrics` and `sales_product_quarterly_records`), along with on-demand manual triggering capabilities.

## Decision

We will run the scheduler in-process inside the backend API application using a Go goroutine managed by `robfig/cron/v3`, rather than deploying an external scheduler infrastructure (such as Kubernetes CronJob, Temporal, or an OS cron daemon).

To ensure high availability and prevent concurrent execution hazards when the API is scaled to multiple container replicas, the execution will acquire a PostgreSQL session-level Advisory Lock (`pg_try_advisory_lock`) prior to running each sync cycle.

Sync executions will perform an atomic upsert (`ON CONFLICT DO UPDATE`) within a database transaction to ensure read availability during import, and record audit outcomes in a dedicated `sales_import_logs` table.

## Consequences

- Infrastructure complexity is kept minimal with zero external cron runner dependencies.
- Scaling horizontally across multiple pods is safe due to PostgreSQL Advisory Lock mutual exclusion.
- Graceful shutdown of the API server must cleanly wait for in-flight cron import jobs to complete or abort within the shutdown timeout.
- The external PostgreSQL connection must be configured via environment variables (`EXTERNAL_SALES_DB_DSN`, `EXTERNAL_SALES_TABLE_NAME`, `EXTERNAL_PUSH_TABLE_NAME`).
