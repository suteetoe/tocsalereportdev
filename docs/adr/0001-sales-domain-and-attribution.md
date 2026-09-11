# 0001 Sales Domain Modeling and Push Attribution

## Status
Accepted

## Context
Frontend previously used static JSON templates to render Sale Push reports and product details. The system needs a domain model and backend API to replace these mock data sources with PostgreSQL-backed data.

## Decision
1. Organize the domain under a unified `sales` module in `internal/sales/`.
2. Treat the Backend as the single source of truth for all business calculations (Combo = Push + Non-Push, All Companies = Sum of Companies, YoY growth rates, and product group totals).
3. Distinguish between two distinct concepts of "Push":
   - **Temporal Attribution (Summary Panels)**: Sales in year $Y$ count toward the Push channel if and only if $Y \in \text{push\_years}$, otherwise Non-Push.
   - **Product Classification (Product Detail Table)**: Any product that was ever pushed ($\text{len}(\text{push\_years}) > 0$) is categorized in the Push tab for cross-year comparison.
4. Persist data in PostgreSQL with normalized schema and seed initial data from existing JSON templates.
