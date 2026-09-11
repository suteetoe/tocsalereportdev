# Sales & BI Report Context

This context is responsible for aggregating, calculating, and presenting sales performance metrics, quarterly summaries, and product-level reports across company entities.

## Language

**Company**:
An operating enterprise entity within the organization (`TOC`, `PTOC`, `TOL`, `TOP`) that generates sales and product records.
_Avoid_: Group, Manufacturer, Business Unit

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
