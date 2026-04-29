# beads-dashboard

React + Vite frontend with an Express/WebSocket backend for browsing Beads projects. This repo is single-package; use this file as the root instruction set.

## Commands

- Install: `bun install`
- Start packaged dashboard: `npx beads-dashboard [path]` (requires Bun on `PATH`)
- Start frontend + API: `bun dev:all`
- Start API only: `bun dev:server`
- Start frontend only: `bun dev:ui`
- Lint: `bun lint`
- Build: `bun run build`
- Root validation: `bun run validate` (lint, build, frontend Vitest/Storybook browser tests, and Bun server tests)
- Frontend tests: `bun run test`
- Full server tests: `bun run test:server`
- Format check: `bun run format:check`
- Format: `bun run format`
- Targeted server test: `bun test server/__tests__/db.test.ts`
- Targeted project settings test: `bun test server/__tests__/projectSettings.test.ts`

## Setup

- Default flow: start the app, then use **Manage Projects** in the UI to add local Beads project paths. This creates `.projects.json` in the server working directory; once that file exists, it becomes the source of truth and automatic `BEADS_ROOT` scanning stops.
- `npx beads-dashboard [path]` changes the server working directory to the provided path, or the current directory when no path is provided, and serves the built UI plus API from one Express server on `PORT`.
- `BEADS_ROOT` is optional and only applies when `.projects.json` does not exist. In that mode, the server scans `BEADS_ROOT` or the current working directory.
- Use `bun --cwd /path/to/beads-dashboard run ...` when launching from inside a Beads project directory instead of the dashboard repo.
- The dev server is intentionally exposed on `0.0.0.0`; the frontend reaches the backend through Vite proxying for `/api` and `/ws`.
- Set `ALLOWED_HOSTS` in `.env` as a comma-separated list when you need Vite to answer to named hosts such as `devbox`.

## Conventions

- Keep frontend API calls in `src/lib/api.ts` same-origin by default. Do not hardcode `localhost:3001`; use `VITE_API_BASE_URL` / `VITE_WS_URL` only when explicit overrides are needed.
- Treat the `bd` CLI as the Beads data source. Do not read Beads storage files directly for project discovery, issue lists, detail panels, stats, labels, relationships, comments, history, or mutations.
- Keep issue detail reads routed through `server/getIssueFromBeadsCli.ts`, which runs `bd show --json --long` from the configured project path.
- Keep backend tests adjacent to the backend code under `server/__tests__/`. The canonical CLI-backed project source coverage is `server/__tests__/db.test.ts`.

## Documentation maintenance

- Always update checked-in docs in the same change when commands, setup, validation policy, runtime behavior, storage support, API behavior, or contributor workflows change.
- Keep `README.md`, this `AGENTS.md`, and relevant `docs/internal/` files consistent with the scripts and behavior in the repository; do not leave stale command names or policy gaps behind.

## Local skills

- This repository does not currently have repo-local skills. If local skills are added, store them under `.agents/skills/<skill-name>/SKILL.md` and document when agents must load them.

## Shipping policy

- This repository has no supported server deploy process today; it is maintained as a local-only dashboard run with Bun commands from this repo or through the `beads-dashboard` package command.
- Package execution depends on the `bin/beads-dashboard.ts` entrypoint, the Express static fallback in `server/app.ts`, and frontend assets produced by `prepack`/`bun run build`.
- Never describe `bun run build`, `bun preview`, or copied `dist/` output as a standalone deploy artifact. If a deploy or publish workflow is added later, add the checked-in workflow or runbook, gate it on `bun run validate`, and update `README.md` and this file in the same change.

## Gotchas

- `bun dev:ui` starts only Vite. If `/api/*` requests fail with `ECONNREFUSED 127.0.0.1:3001`, start `bun dev:all` or `bun dev:server` too.
- If `.projects.json` exists, missing projects are usually a project-settings problem rather than a `BEADS_ROOT` problem. Update paths through **Manage Projects** or remove `.projects.json` to return to automatic discovery.
- `bun build` runs Bun's built-in bundler command, not this repo's package script. Use `bun run build` for the checked-in build workflow.
- `Unexpected token '<'` while parsing an `/api/*` response means the browser got HTML instead of API JSON. The usual causes are the UI running without the API, or a mis-set `VITE_API_BASE_URL` that points at the frontend origin.
- Remote/LAN access requires the Vite hostname to be explicitly allowed through `ALLOWED_HOSTS` in `.env`. Do not bypass this by setting `allowedHosts: true`.
- If the dashboard reports `Found 0 projects`, verify the `bd` CLI is installed on `PATH` and can run `bd where --json` from the configured project path or automatic discovery root.
- If issue detail panels fail while issue lists still load, verify `bd show <issue-id> --json --long` works from the configured project path.
- The npm package name `beads-dashboard` already exists on the public registry. Before publishing, verify package ownership or choose an owned package name; otherwise `npx beads-dashboard` will resolve to someone else’s published package.

## Boundaries

- Always: run `bun run validate` before claiming completion after changing TypeScript, React, Vite, server code, test configuration, or validation policy.
- Always: run `bun run test` for frontend component, hook, Storybook, Vitest, or browser-test changes; use targeted Storybook/Vitest runs only as an intermediate step, not the final check.
- Always: run `bun run test:server` for backend route, storage, project-discovery, CORS, or response-shape changes; targeted server tests are acceptable during iteration but do not replace the full server suite when backend behavior changes.
- Always: run `bun test server/__tests__/db.test.ts` after changing `server/db.ts`, project discovery, CLI-backed Beads data access, or mutation routing.
- Always: run `bun test server/__tests__/projectSettings.test.ts` after changing configured-project discovery, `.projects.json` handling, or `/api/settings/projects` routes.
- Ask first: dependency changes, CI/workflow edits, broad CORS/host exposure changes, or any plan to bypass the `bd` CLI for Beads data access.
- Never: set `server.allowedHosts: true`, reintroduce bundled executables/raw binary download docs, commit secrets, or reintroduce direct `.beads` storage file reads as dashboard data sources.
- Never: run dev commands in the foreground or without a timeout as those are blocking operations and never exit by default.

## Done policy

- Only claim work is complete when required code changes, docs updates, and the applicable verification commands above are complete and passing.
- If a required check fails, a docs update is still missing, a requested deploy/release step has no supported path, or a blocker remains, report the work as incomplete and name the blocker instead of saying it is done.

## References

- `README.md`
- `server/index.ts`
- `server/db.ts`
- `src/lib/api.ts`
- `vite.config.ts`
