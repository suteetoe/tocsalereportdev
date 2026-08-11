# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working in this repository.

## Repository Layout

This repository uses a Git submodule layout:

```text
repo1       Superproject / orchestration repository (this repository)
backend/    Git submodule pointing to repo2 — Go API (Hexagonal Architecture), see backend/AGENTS.md
frontend/   Git submodule pointing to repo3 — Vue.js SPA (3-Layer Architecture + shadcn-vue), see frontend/AGENTS.md
```

`backend/` and `frontend/` are independent repositories mounted into `repo1` as
submodules. Each submodule is self-contained (own dependency manifest, own
build/test tooling). There is no shared build system at the repo1 root — always
`cd` into the relevant submodule before running project commands.

When cloning or updating repo1, initialize submodules explicitly:

```sh
git clone --recurse-submodules <repo1-url>
git submodule update --init --recursive
```

## Agent Roles & Workflow

This repository is worked on by a team of agents coordinated by a Project Manager, not a single agent doing everything end to end.

### Main agent — Project Manager (PM)

- The PM is the single point of contact with the Product Owner (PO — the human directing the work). All requests come in through the PM.
- **The PM never writes or edits code.** Every change to a file under `backend/`, `frontend/`, or `qa/` is delegated to the matching subagent below — no exceptions.
- The PM may work directly on: reading and exploring the codebase, planning, breaking a request into tasks, reviewing subagent output and test results, root-level repo1 files, submodule pointer updates, and reporting back to the PO.
- The PM decides sequencing across subagents: parallel when the work is independent, sequential when one depends on another's output (e.g. frontend needs an API contract backend is still building).
- The PM does not deploy, push, or roll out changes on its own — final rollout is a PO decision.

### Subagents

| Agent | Scope | Defined in |
| --- | --- | --- |
| `backend-agent` | `backend/` only | `.agents/agents/backend-agent.md` |
| `frontend-agent` | `frontend/` only | `.agents/agents/frontend-agent.md` |
| `qa-agent` | `qa/` only | `.agents/agents/qa-agent.md` |

`qa-agent` owns `qa/` — an independent third project (its own `package.json` and Playwright config), not nested inside `frontend/`, so its ownership never overlaps with `frontend-agent`'s.

### Workflow

1. The PO sends a request to the PM.
2. The PM assesses scope:
   - **Multi-domain** (touches more than one of backend/frontend): the PM must present a breakdown of who does what and get explicit PO approval before dispatching any subagent.
   - **Single-domain and unambiguous**: the PM may dispatch directly and summarize what it did afterward.
3. The PM dispatches `backend-agent` and/or `frontend-agent` — in parallel when independent, sequentially when one depends on the other's output.
4. Once the dispatched implementer agent(s) finish and their own tests pass, the PM always dispatches `qa-agent` to run the Playwright e2e suite before anything is considered ready for rollout. This step is never skipped, even for single-domain changes.
5. If `qa-agent` reports failures, the PM routes them back to the responsible implementer agent(s) for fixes, then re-runs `qa-agent`. This repeats until e2e passes, up to **3 rounds** — if still failing after that, the PM stops and reports the blocker to the PO instead of continuing to loop.
6. When submodule work is complete, the PM verifies that repo2/repo3 commits are pushed or otherwise available to repo1, then updates and commits the corresponding submodule pointer in repo1.
7. The PM reports the outcome to the PO: repositories changed, commits/submodule pointers updated, test results at every layer (unit/integration/e2e), and any open issues. The PO makes the final rollout call.

---

## backend/

Go 1.25.1 API following Hexagonal Architecture (Ports & Adapters) with a module-based structure under `internal/core/`. **Read [backend/AGENTS.md](backend/AGENTS.md) before writing or modifying backend code** — it defines strict, non-negotiable rules for this project:

- The core domain layer (`internal/core/<module>/`) must stay pure Go with zero framework/DB imports; cross-module calls go through interfaces declared in each module's own `port.go` (never import another module's package directly).
- HTTP concerns (DTOs, status mapping, validation) live only in `internal/adapters/http/`; business logic never belongs in handlers.
- DB models with GORM/SQL tags live only in `internal/adapters/repositories/models/`, mapped back to domain models via helper methods.
- Concrete dependency wiring happens only in `internal/app/` (bootstrapping) and `cmd/api/main.go` / `cmd/service/main.go` (entry points).
- Core services require table-driven unit tests with 100% coverage using mocked ports (see the template in backend/AGENTS.md); repositories are integration-tested only, never unit-mocked. Genuinely unreachable branches (e.g. defensive panics) may be excluded with an inline justification comment rather than padded with low-value tests.

Common commands (run from `backend/`):

```sh
go run ./cmd/api          # run the API locally (reads .env)
go run ./cmd/init-user --email admin@example.com --name "Admin User" --password "change-me"  # create the initial admin user
go test ./...              # run all tests
go test ./... -cover       # run tests with coverage
go test ./internal/auth/... -run TestName   # run a single auth test
go run github.com/swaggo/swag/cmd/swag@v1.16.6 init -g cmd/api/main.go -o docs   # regenerate Swagger docs after handler changes
```

Requires a running PostgreSQL instance and a `.env` file (see backend/README.md for the variable list). Subagents use a shared local dev DB with a dedicated `_test` schema/database for automated tests, so unit/integration runs never touch dev data. Swagger UI is served at `/swagger/index.html` once the API is running.

---

## frontend/

Vue.js SPA following a strict 3-Layer Architecture (Presentation / Domain / Data) with **shadcn-vue** as the base UI kit. **Read [frontend/AGENTS.md](frontend/AGENTS.md) before writing or modifying frontend code** — it defines strict, non-negotiable rules for this project:

- `src/domain/` (entities, use-cases, repository interfaces) must stay pure TypeScript — zero imports of Vue, shadcn-vue, Axios, or any other framework/HTTP library.
- `src/data/` implements the repository interfaces declared in `domain/repositories/` and maps raw API JSON into domain entities; no business logic lives here.
- `src/presentation/` (components, views, composables) handles rendering and user events only — composables act as the adapter that instantiates use-cases/repositories and exposes reactive state; components never call Axios or business logic directly.
- Base shadcn-vue components live under `src/presentation/components/ui/`; feature components compose them.

Common commands (run from `frontend/`):

```sh
pnpm install
pnpm dev
pnpm lint
pnpm type-check
pnpm test:unit
pnpm build
```

The frontend is scaffolded as a Vue 3 + TypeScript + Vite app. Auth is wired through the data layer to backend endpoints under `/tocsalereportapi/api/v1`; `VITE_API_BASE_URL` may point either at the backend root URL or the full versioned API base URL.

---

## Version Control Conventions

- **Repository ownership**:
  - repo1 owns orchestration files, root documentation, `.gitmodules`, CI that coordinates submodules, and submodule pointers.
  - repo2 owns all backend source and backend-local documentation under `backend/`.
  - repo3 owns all frontend source and frontend-local documentation under `frontend/`.
- **Base branch**: `frontend-agent` and `backend-agent` always checkout their feature/task branch from the relevant submodule repository's `develop` branch — never from `main` or from another in-progress feature branch. The PM confirms `develop` is up to date in the relevant submodule before dispatching any subagent that will create a new branch.
- Branching model: each repository gets its own feature branch when it has changes for a PM-dispatched task. Backend changes branch in repo2; frontend changes branch in repo3; orchestration/submodule pointer changes branch in repo1.
- Commit granularity: each subagent commits only inside its owned repository — backend-agent commits in repo2, frontend-agent commits in repo3, and qa-agent commits only in qa if that project exists. The PM commits root-level repo1 changes and submodule pointer updates.
- Submodule pointer updates in repo1 happen only after the target repo2/repo3 commit has passed its required checks and is intentionally selected for integration.
- Do not treat `backend/` or `frontend/` as ordinary folders in repo1. They are nested Git repositories; always check status inside both repo1 and the relevant submodule before reporting work complete.
- Root-level shared files (CI config, `.gitignore`, root `README.md`) are owned by the PM directly; no subagent modifies them without PM instruction.

## Contract Handoff Between Subagents

- When backend-agent changes or adds an API endpoint, the regenerated Swagger/OpenAPI output (`backend/docs/`) is the source of truth frontend-agent consumes — frontend-agent should not hand-guess request/response shapes from backend source code.
- The PM confirms the Swagger docs are regenerated (`swag init`) before dispatching frontend-agent on any task that depends on a backend contract change.
