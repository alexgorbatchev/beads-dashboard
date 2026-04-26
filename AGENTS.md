# beads-dashboard

React + Vite frontend with an Express/WebSocket backend for browsing Beads projects. This repo is single-package; use this file as the root instruction set.

## Commands
- Install: `npm install`
- Start frontend + API: `BEADS_ROOT=/path/to/projects npm run dev:all`
- Start API only: `BEADS_ROOT=/path/to/projects npm run dev:server`
- Start frontend only: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Format check: `npm run format:check`
- Format: `npm run format`
- Targeted server test: `bun test server/__tests__/db.test.ts`

## Setup
- Set `BEADS_ROOT` to the directory that contains the Beads projects you want to scan. If unset, the server scans the current working directory.
- Use `npm --prefix /path/to/beads-dashboard ...` when launching from inside a Beads project directory instead of the dashboard repo.
- The dev server is intentionally exposed on `0.0.0.0`; the frontend reaches the backend through Vite proxying for `/api` and `/ws`.

## Conventions
- Keep frontend API calls in `src/lib/api.ts` same-origin by default. Do not hardcode `localhost:3001`; use `VITE_API_BASE_URL` / `VITE_WS_URL` only when explicit overrides are needed.
- Copy backend storage handling patterns from `server/db.ts`. SQLite-backed projects are writable; JSONL-backed projects are read-only and must be surfaced through the same read APIs.
- Guard non-SQLite mutations at the route layer like `ensureProjectWritable()` in `server/index.ts`.
- Put backend tests adjacent to the backend code under `server/__tests__/`. The canonical JSONL coverage example is `server/__tests__/db.test.ts`.

## Gotchas
- `npm run dev` starts only Vite. If `/api/*` requests fail with `ECONNREFUSED 127.0.0.1:3001`, start `npm run dev:all` or `npm run dev:server` too.
- Remote/LAN access requires the Vite hostname to be explicitly allowed in `vite.config.ts`. Add hostnames to `server.allowedHosts`; do not bypass this by setting `allowedHosts: true`.
- If the dashboard reports `Found 0 projects`, inspect the target repo’s `.beads/` directory. This dashboard supports `.beads/*.db` and `.beads/issues.jsonl`; it will not discover arbitrary Beads layouts.
- JSONL support is intentionally read-only. Do not mutate exported `issues.jsonl` / `interactions.jsonl` as if they were the authoritative store.

## Boundaries
- Always: run `npm run lint` and `npm run build` after changing TypeScript, React, Vite, or server code.
- Always: run `bun test server/__tests__/db.test.ts` after changing `server/db.ts`, storage discovery, JSONL handling, or route write guards.
- Ask first: dependency changes, CI/workflow edits, broad CORS/host exposure changes, or any plan to make JSONL/Dolt-backed projects writable.
- Never: set `server.allowedHosts: true`, reintroduce bundled executables/raw binary download docs, commit secrets, or remove read-only protections for JSONL-backed projects without implementing the real storage contract.

## References
- `README.md`
- `server/index.ts`
- `server/db.ts`
- `src/lib/api.ts`
- `vite.config.ts`
