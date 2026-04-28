# Repository Policy Audit

Git SHA: ff0b0727c7a8e763f757e885df62c98b2c74a2e8
Overall: PASS
Repo kind: application
Detected stacks: TypeScript, React, Vite, Bun, Express, WebSocket, Vitest, Storybook, Playwright, SQLite, GitHub Actions, pre-commit
Files examined: AGENTS.md, README.md, package.json, vitest.config.ts, .storybook/main.ts, .storybook/vitest.setup.ts, vite.config.ts, ARCHITECTURE.md, .github/workflows/validate.yml, .pre-commit-config.yaml, server/__tests__/db.test.ts, server/__tests__/projectSettings.test.ts, server/__tests__/corsOrigins.test.ts, server/__tests__/readApiResponse.test.ts, src/components/__tests__/MarkdownContent.test.tsx, src/hooks/__tests__/useTheme.test.ts, src/**/*.stories.tsx
Summary: This single-package React/Vite dashboard with a Bun/Express backend now has a canonical root validation command, checked-in CI and pre-commit validation paths, complete AGENTS.md contributor policy, and explicit local-only shipping policy.

## Action checklist

- [x] No action items.

## Automated tests exist

Status: PASS
Evidence: Non-trivial shipped frontend and backend code exists under `src/` and `server/` (`src/App.tsx`, `server/index.ts`). Checked-in automated tests exist for the frontend in `src/components/__tests__/MarkdownContent.test.tsx` and `src/hooks/__tests__/useTheme.test.ts`, for Storybook/browser coverage through `.storybook/main.ts:9-10` and `src/**/*.stories.tsx`, and for the backend in `server/__tests__/db.test.ts`, `server/__tests__/projectSettings.test.ts`, `server/__tests__/corsOrigins.test.ts`, and `server/__tests__/readApiResponse.test.ts`.
Recommendations: None

## All discovered tests are exercised

Status: PASS
Evidence: The canonical root command is `bun run validate` in `package.json:12`, which expands to `bun lint && bun run build && bun run test && bun run test:server`. `bun run test` is `vitest run` (`package.json:18`) and covers the `unit` project plus the Storybook/browser project configured in `vitest.config.ts:14-47`; `bun run test:server` is `bun test server/__tests__` (`package.json:20`) and covers the server suites. Executed command `bun run validate` passed, with stdout showing Vitest `25 passed (25)` test files and Bun server `8 pass` across 4 files.
Recommendations: None

## All discovered test systems are exercised

Status: PASS
Evidence: Active test systems are Vitest unit tests, Storybook/browser tests through `@storybook/addon-vitest`, and Bun server tests (`vitest.config.ts:14-47`, `.storybook/main.ts:9-10`, `package.json:18-20`). `package.json:12` includes both frontend and server test commands in the root validation path. Executed command `bun run validate` passed and exercised both `vitest run` and `bun test server/__tests__`.
Recommendations: None

## A test runner is configured

Status: PASS
Evidence: `package.json:18-20` defines concrete test entrypoints: `bun run test`, `bun run test:watch`, and `bun run test:server`. Vitest and Storybook/browser configuration is checked in at `vitest.config.ts:14-47` and `.storybook/main.ts:4-23`; Bun server tests run from `server/__tests__` through `package.json:20`.
Recommendations: None

## Test runs are free of unexpected output noise

Status: PASS
Evidence: Executed command `bun run validate` passed. Its test output was normal runner/reporter output: Vitest reported `25 passed (25)` test files and Bun reported `8 pass`, `0 fail`, and 33 expectations across 4 server files. No startup errors, stack traces, incidental application logs, browser console errors, or uncaught-rejection output appeared during the test phases.
Recommendations: None

## A root-level validation entrypoint exists

Status: PASS
Evidence: `package.json:12` defines `validate` as the canonical root command, and `README.md:149-158` documents `bun run validate` as the root check that runs linting, production build, frontend Vitest/Storybook browser tests, and Bun server tests.
Recommendations: None

## A root AGENTS file exists

Status: PASS
Evidence: The repository has a root agent file at `AGENTS.md:1-82`.
Recommendations: None

## Root agent docs describe repo-wide checks

Status: PASS
Evidence: `AGENTS.md:5-19` lists install, development, lint, build, root validation, frontend test, full server test, format, and targeted test commands. `AGENTS.md:60-66` requires `bun run validate`, `bun run test`, and `bun run test:server` in the applicable change areas.
Recommendations: None

## Agent instructions include success checks

Status: PASS
Evidence: `AGENTS.md:60-74` defines success and completion gates with exact commands and conditions, including root validation, frontend tests, server tests, targeted storage/settings tests, and the rule that work may only be claimed complete when required checks and docs updates are done and passing.
Recommendations: None

## Agent instructions include verification steps

Status: PASS
Evidence: `AGENTS.md:60-66` gives concrete verification commands and when each applies. The root validation command is backed by `package.json:12`, frontend tests by `package.json:18`, full server tests by `package.json:20`, and targeted backend tests by the checked-in server test paths named in `AGENTS.md:65-66`.
Recommendations: None

## Agent instructions use strong, reinforcing validation language

Status: PASS
Evidence: `AGENTS.md:60-69` uses mandatory `Always`, `Ask first`, and `Never` language for validation, targeted testing, risky changes, secrets, host exposure, and dev command behavior.
Recommendations: None

## Agent instructions require documentation maintenance

Status: PASS
Evidence: `AGENTS.md:36-39` requires checked-in docs to be updated in the same change when commands, setup, validation policy, runtime behavior, storage support, API behavior, or contributor workflows change, and specifically names `README.md`, `AGENTS.md`, and relevant `docs/internal/` files.
Recommendations: None

## Agent instructions explain how to run tests

Status: PASS
Evidence: `AGENTS.md:13-19` lists root validation, frontend tests, full server tests, and targeted server tests. `AGENTS.md:62-66` defines when full-suite versus targeted test runs are required.
Recommendations: None

## Agent instructions explain how to deploy or release

Status: PASS
Evidence: The repository is explicitly documented as local-only with no supported deploy or release process in `AGENTS.md:45-48` and `README.md:169-174`. The guidance also forbids describing `bun run build`, `bun preview`, or copied `dist/` output as supported release artifacts.
Recommendations: None

## Agent instructions define when work is done

Status: PASS
Evidence: `AGENTS.md:71-74` states that work may only be claimed complete when required code changes, docs updates, and applicable verification commands are complete and passing, and requires reporting incomplete work when checks fail, docs are missing, unsupported deploy/release steps are requested, or blockers remain.
Recommendations: None

## Agent instructions specify the local skills folder path

Status: PASS
Evidence: `AGENTS.md:41-43` states that the repository currently has no repo-local skills and requires any future local skills to be stored under `.agents/skills/<skill-name>/SKILL.md`.
Recommendations: None

## Every major repository unit has an AGENTS file

Status: PASS
Evidence: The repository is a single-package project and `AGENTS.md:3` states that the root file is the instruction set. The root file covers both major shipped areas, including frontend API conventions (`AGENTS.md:31`) and backend storage/testing conventions (`AGENTS.md:32-34`, `AGENTS.md:63-66`), so no nested AGENTS file is currently required.
Recommendations: None

## AGENTS files are not stale

Status: PASS
Evidence: The commands and paths named in `AGENTS.md` map to checked-in scripts and files: `bun run validate`, `bun run test`, and `bun run test:server` exist in `package.json:12`, `package.json:18`, and `package.json:20`; targeted tests exist under `server/__tests__/`; and referenced files `README.md`, `server/index.ts`, `server/db.ts`, `src/lib/api.ts`, and `vite.config.ts` exist.
Recommendations: None

## CI is configured

Status: PASS
Evidence: A checked-in GitHub Actions validation workflow exists at `.github/workflows/validate.yml:1-27`.
Recommendations: None

## CI runs the relevant validation steps

Status: PASS
Evidence: `.github/workflows/validate.yml:17-27` sets up Bun with `oven-sh/setup-bun@v2`, installs dependencies with `bun install --frozen-lockfile`, installs Chromium for Playwright with `bun x playwright install --with-deps chromium`, and runs the canonical `bun run validate` command. The referenced validation command expands to lint, build, frontend Vitest/Storybook tests, and Bun server tests in `package.json:12`.
Recommendations: None

## CI runs at the right time

Status: PASS
Evidence: `.github/workflows/validate.yml:3-7` triggers validation on pull requests and pushes to `main`, which covers normal pre-ship contribution paths before any future shipping workflow.
Recommendations: None

## A pre-commit hook system exists

Status: PASS
Evidence: A checked-in pre-commit configuration exists at `.pre-commit-config.yaml:1-8`, and `README.md:160-167` documents installing it with `pre-commit install`.
Recommendations: None

## Pre-commit runs lint, format, or checks

Status: PASS
Evidence: `.pre-commit-config.yaml:4-8` defines the local `beads-dashboard-validate` hook with `entry: bun run validate`, `language: system`, and `pass_filenames: false`, so the hook runs the repository's canonical validation before commits when installed.
Recommendations: None

## Deploy or release policy is documented

Status: PASS
Evidence: `README.md:169-174` and `AGENTS.md:45-48` explicitly state that the repository has no supported deploy or release process and is maintained as a local-only dashboard run from the checked-out repository with Bun.
Recommendations: None

## Deploy or release is automated or reproducible

Status: PASS
Evidence: No deploy or release workflow is applicable because the checked-in policy states the repository is local-only and has no supported deploy or release process (`README.md:169-174`, `AGENTS.md:45-48`). The same docs forbid treating build output or preview commands as supported release artifacts.
Recommendations: None

## Deploy or release is gated by checks

Status: PASS
Evidence: No current deploy or release path exists to gate. If a future deploy or release path is added, `AGENTS.md:47-48` and `README.md:171-174` require it to be checked in and gated on `bun run validate`.
Recommendations: None
