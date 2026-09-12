# Sales & BI Report Context

This context is responsible for aggregating, calculating, and presenting sales performance metrics, quarterly summaries, and product-level reports across company entities.

## Language

**Company**:
An operating enterprise entity within the organization (`TOC`, `PTOC`, `TOL`, `TOP`) that generates sales and product records.
_Avoid_: Group, Manufacturer, Business Unit, Brand

**Sale Push (Channel)**:
A strategic categorization of products tagged for targeted sales promotion and growth acceleration in specific years.
_Avoid_: Campaign Product, Focus Item

**Non-Push (Channel)**:
Products that are not categorized as Push products for a specified year.
_Avoid_: Regular, Normal, Standard

**Combo (Channel)**:
The combined channel aggregation of Push and Non-Push sales (`Combo = Push + Non-Push`).
_Avoid_: Combined, Total Channel

**Push Tag (`push_years`)**:
A comma-separated list of years (e.g. `"2023,2024,2025"`) associated with a product designating the specific years in which that product is classified as a Push product.
_Avoid_: Push Flag, Promotion Status

**Push Product (Classification)**:
A product that has been designated as a Push product in at least one year (`len(push_years) > 0`). In the Product Detail Report, any product ever pushed is grouped into the Push channel tab.
_Avoid_: Campaign Item, Focus SKU

**Push Attribution (Calculation)**:
The temporal attribution of sales metrics where a product's sales in year $Y$ count toward Push if and only if $Y \in \text{push\_years}$, and toward Non-Push otherwise.
_Avoid_: Static Channel Mapping

**All Companies**:
The consolidated total across all active operating companies (`All = TOC + PTOC + TOL + TOP`).
_Avoid_: Global, Overall Group

**Target Year**:
The reference calendar year selected by the user to anchor the sales analysis.
_Avoid_: Base Year, Selected Year, Filter Year

**Reporting Window**:
The sliding sequence of up to three consecutive calendar years terminating at the Target Year ($[Y-2, Y-1, Y]$) used for quarterly and YoY comparative evaluation.
_Avoid_: Date Range, Year Span, Timeframe

**Sales Import Job (Run)**:
A scheduled or on-demand execution that ingests raw transactional sales records from an external PostgreSQL database, performs quarterly aggregation and push attribution, and upserts the result into reporting metrics.
_Avoid_: Sync Daemon, Data Puller, Cron Script

**Import Audit Log (`sales_import_logs`)**:
An immutable operational log record tracking each import attempt, capturing status (`SUCCESS`, `FAILED`), trigger type (`CRON`, `MANUAL`), target year, execution duration, row counts, and error details.
_Avoid_: History Table, Job Log, Sync Log

**Advisory Lock**:
A PostgreSQL application-level lock (`pg_try_advisory_lock`) utilized by the in-process cron worker to guarantee mutual exclusion across horizontally scaled application instances.
_Avoid_: Distributed Lock, Redis Lock, Semaphore

**Target Month**:
The specific calendar month ($1 \le M \le 12$) selected by the user within the Target Year for month-level and cumulative YTD evaluation.
_Avoid_: Selected Month, As-Of Month

**Year-To-Date (YTD)**:
The cumulative sales performance aggregated from Month 1 (January) through the Target Month ($M$) within a given calendar year.
_Avoid_: Year Aggregate, Running Total

**Same Month Last Year (YoY Month)**:
The comparative evaluation between the Target Month ($M$) in Target Year ($Y$) and the identical calendar month ($M$) in the immediately preceding year ($Y-1$).
_Avoid_: Prior Month, SMLY, Last Year Month

**Sale Cost (`cost`)**:
The recorded cost of goods sold (COGS) aggregated alongside sales quantity and revenue amount, used for Gross Profit (`value - cost`) and Gross Margin analysis.
_Avoid_: Expense, COGS Tag

**Monthly Granularity**:
The foundational temporal resolution ($[Year, Month]$) for transactional sales records, enabling monthly comparative reporting, YTD aggregations, and seamless quarterly rollups.
_Avoid_: Daily Sales, Period Buckets
