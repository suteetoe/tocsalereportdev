# Frontend Path Prefix

Status: implemented in `frontend` branch `feature/frontend-path-prefix-tocsalereport`.

## Decision

The frontend web application is served under:

```text
/tocsalereport/
```

This is separate from the backend API base path:

```text
/tocsalereportapi/api/v1
```

## Implementation Notes

- Vite uses `base: '/tocsalereport/'` so built assets are emitted with prefixed URLs.
- vue-router already uses `createWebHistory(import.meta.env.BASE_URL)`, so router history follows the Vite base path.
- `index.html` references the favicon through `%BASE_URL%`.
- Docker/nginx serves the built SPA from `/usr/share/nginx/html/tocsalereport`.
- nginx redirects `/tocsalereport` to `/tocsalereport/` and falls back SPA deep links to `/tocsalereport/index.html`.

## Verification Summary

Frontend verification passed:

- `pnpm lint`
- `pnpm type-check`
- `pnpm test:unit`
- `pnpm build`

QA verification passed for:

- `/tocsalereport/`
- `/tocsalereport/login`
- `/tocsalereport/reports`
- prefixed JS/CSS/favicon assets
- nginx `/health`
- nginx redirect from `/tocsalereport` to `/tocsalereport/`
- unauthenticated deep-link redirect behavior after Vue hydration

The `qa/` project is not scaffolded yet, so there was no Playwright suite to run. QA performed runtime checks with Vite dev, Vite preview, nginx, and headless Chrome.

## Next-Round Notes

- When deployment config is added or changed, ensure the reverse proxy routes `/tocsalereport/` to the frontend service.
- Keep frontend URLs and links under `/tocsalereport/`; avoid hardcoded root-relative frontend links such as `/login` unless they are router-managed.
- When QA is scaffolded, add e2e coverage for direct navigation to `/tocsalereport/login` and a protected deep link such as `/tocsalereport/reports`.
