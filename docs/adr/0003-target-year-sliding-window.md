# 0003 Target Year and 3-Year Sliding Window for Sale Push Reports

## Status
Accepted

## Context
Sale Push reports previously hardcoded the analysis to the years 2023–2025. Users need the ability to select the year they wish to analyze. However, the core reporting visualizations (quarterly clustered bar charts, YoY growth rates, and product comparison tables) require multiple consecutive years to provide meaningful trend analysis.

## Decision
1. Introduce **Target Year** ($Y$) as the user-selectable parameter (defaulting to the latest available year in the database).
2. Dynamically project a **Reporting Window** of up to three consecutive calendar years terminating at the Target Year ($[Y-2, Y-1, Y]$).
3. If historical data is not present for the full three years (e.g. at the system's earliest recorded years), the system gracefully renders only the available years without fabricating zero-value data, and displays YoY growth as N/A (`-`) where prior-year base is missing.
4. Synchronize the selected Target Year across both Summary and Product Detail views via URL query parameter (`?year=...`).
5. Expose `GET /tocsalereportapi/api/v1/sales/push/years` to provide available years and default target year, and generalize growth in summary quarterly records to a dynamic map keyed by year (`growth: Record<string, number>`).

## Consequences
- Preserves the 3-bar quarterly layout and comparative table structure across arbitrary historical or future years.
- Generalizes backend API contracts from hardcoded `from2023To2024` struct fields to dynamic YoY representations.
- Ensures bookmarkable and shareable report URLs with explicit year state.
