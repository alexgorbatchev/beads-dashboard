# Repository Policy Audit

Git SHA: 11417ac667aecc7bf91131cd8009daa920a11228
Overall: FAIL
Repo kind: application
Detected stacks: TypeScript, React, Vite, Bun, Express, WebSocket, Vitest, Storybook, Playwright, SQLite
Files examined: AGENTS.md, README.md, package.json, vitest.config.ts, .storybook/main.ts, .storybook/vitest.setup.ts, vite.config.ts, ARCHITECTURE.md, server/__tests__/db.test.ts, server/__tests__/projectSettings.test.ts, server/__tests__/corsOrigins.test.ts, server/__tests__/readApiResponse.test.ts, src/components/__tests__/MarkdownContent.test.tsx, src/hooks/__tests__/useTheme.test.ts, src/**/*.stories.tsx, .github/workflows/* (missing), .husky/* (missing), .pre-commit-config.yaml (missing), lefthook.yml (missing), references/policy-rubric.md (missing in repo)
Summary: This is a single-package React/Vite dashboard with a Bun/Express backend and real automated tests, but the repository policy is incomplete and not enforced: the frontend Storybook/Vitest path is broken, the documented validation path omits active tests, and there is no checked-in CI, pre-commit, or deploy/release policy.

## Action checklist

- [x] Define and document a single canonical root validation command that exercises every discovered test artifact, including Vitest/Storybook and Bun server tests, and keep it passing.
- [x] Repair the broken Vitest/Storybook test system and include both active test systems in the canonical validation path.
- [ ] Fix the Vitest/Storybook startup errors so the canonical test command emits only expected reporter output.
- [ ] Update AGENTS.md to describe the actual repo-wide validation path, including all active test systems and root verification commands.
- [ ] Add mandatory documentation-maintenance instructions to AGENTS.md that require updating README.md, AGENTS.md, and other checked-in docs whenever commands, behavior, or policies change.
- [ ] Add concrete agent instructions for running `bun run test` and `bun run test:server`, and define when full-suite versus targeted test runs are required.
- [ ] Document the repository's actual deploy or release procedure in checked-in instructions, or explicitly state that the repository has no supported shipping path.
- [ ] Add an explicit done policy to AGENTS.md that forbids claiming completion when required checks, docs updates, or blockers remain.
- [ ] Add the concrete repository-local skills folder path to AGENTS.md, or state the exact path contributors must use when adding local skills.
- [ ] Add a checked-in CI validation workflow.
- [ ] Make CI install dependencies and run the repository's canonical lint, build, Vitest/Storybook, and Bun server validation steps.
- [ ] Trigger validation CI on normal pre-ship paths such as pull requests or pushes to the default branch before any shipping workflow.
- [ ] Add a checked-in pre-commit hook system.
- [ ] Configure pre-commit to run lint, format, or other validation before commits are created.
- [ ] Document how this application/service is shipped, or explicitly document that it is for local-only use and has no deploy or release process.
- [ ] Add a concrete checked-in deploy or release workflow, script, or step-by-step reproducible procedure.
- [ ] Gate any deploy or release path on successful validation or explicitly documented validated artifacts.

## Automated tests exist

Status: PASS
Evidence: Non-trivial shipped frontend and backend code exists under `src/` and `server/` (`src/App.tsx`, `server/index.ts`). Checked-in automated tests exist for the frontend in `src/components/__tests__/MarkdownContent.test.tsx` and `src/hooks/__tests__/useTheme.test.ts`, and for the backend in `server/__tests__/db.test.ts`, `server/__tests__/projectSettings.test.ts`, `server/__tests__/corsOrigins.test.ts`, and `server/__tests__/readApiResponse.test.ts`. Runnable Storybook/browser tests are also configured through `.storybook/main.ts:9-10` and `vitest.config.ts:25-45`, which bind stories under `src/**/*.stories.*` into the Vitest project.
Recommendations: None

## All discovered tests are exercised

Status: FAIL
Evidence: The repo has multiple discovered automated test artifacts: frontend Vitest unit tests (`vitest.config.ts:16-23`, `src/components/__tests__/MarkdownContent.test.tsx`, `src/hooks/__tests__/useTheme.test.ts`), Storybook/browser tests (`.storybook/main.ts:9-10`, `vitest.config.ts:25-45`, `src/**/*.stories.tsx`), and Bun server tests (`package.json:18`, `server/__tests__/db.test.ts`, `server/__tests__/projectSettings.test.ts`, `server/__tests__/corsOrigins.test.ts`, `server/__tests__/readApiResponse.test.ts`). The documented root validation procedure in `README.md:149-154` runs only `bun lint` and `bun run build`. Root scripts expose separate test entrypoints in `package.json:16-19`, but there is no single documented root path that exercises every discovered test artifact. Executed command `bun run test` failed before exercising the Vitest/Storybook-owned tests (stderr `.tmp/audit/test.stderr:1-14`), while executed command `bun run test:server` exercised only the Bun server suite (stderr `.tmp/audit/test-server.stderr:1-6`).
Recommendations: Define and document a single canonical root validation command that exercises every discovered test artifact, including Vitest/Storybook and Bun server tests, and keep it passing.

## All discovered test systems are exercised

Status: FAIL
Evidence: The active test systems are Vitest with a `unit` project and a Storybook/browser project (`vitest.config.ts:12-45`) and Bun test for server suites (`package.json:18`, `server/__tests__/*`). Executed command `bun run test:server` passed and exercised Bun test (stderr `.tmp/audit/test-server.stderr:1-6`), but executed command `bun run test` failed during startup with a Storybook/Vitest configuration error before the Vitest-owned system could run (stderr `.tmp/audit/test.stderr:1-14`). Because one active test system does not execute successfully, not all discovered test systems are exercised.
Recommendations: Repair the broken Vitest/Storybook test system and include both active test systems in the canonical validation path.

## A test runner is configured

Status: PASS
Evidence: The repository defines concrete executable test entrypoints in `package.json:16-19` (`bun run test`, `bun run test:server`, and `bun run storybook`). Vitest is configured in `vitest.config.ts:12-45`, Storybook is configured in `.storybook/main.ts:4-23`, and executed command `bun run test:server` proves the server runner is callable (stderr `.tmp/audit/test-server.stderr:1-6`).
Recommendations: None

## Test runs are free of unexpected output noise

Status: FAIL
Evidence: Executed command `bun run test` emitted unexpected startup error output instead of clean runner output: stderr shows `failed to load config`, a `Startup Error`, and a `SyntaxError` in Storybook/Vitest startup (`.tmp/audit/test.stderr:1-14`). Although executed command `bun run test:server` was clean reporter output only (stdout `.tmp/audit/test-server.stdout:1`, stderr `.tmp/audit/test-server.stderr:1-6`), the canonical frontend test command is not clean, so this check fails conservatively.
Recommendations: Fix the Vitest/Storybook startup errors so the canonical test command emits only expected reporter output.

## A root-level validation entrypoint exists

Status: PASS
Evidence: The root README defines a canonical validation procedure with `bun lint` and `bun run build` (`README.md:147-154`), and the underlying scripts exist in `package.json:10-14`.
Recommendations: None

## A root AGENTS file exists

Status: PASS
Evidence: The repository has a root agent file at `AGENTS.md:1-57`.
Recommendations: None

## Root agent docs describe repo-wide checks

Status: FAIL
Evidence: `AGENTS.md:43-49` documents `bun lint`, `bun run build`, and two targeted server tests, but it does not describe the active root `bun run test` path from `package.json:16` or the full server-suite path from `package.json:18`. The repository's active test surface includes Vitest unit tests and Storybook/browser tests (`vitest.config.ts:12-45`, `.storybook/main.ts:9-10`) plus Bun server tests (`server/__tests__/*`), so the root agent docs describe only a partial validation picture.
Recommendations: Update AGENTS.md to describe the actual repo-wide validation path, including all active test systems and root verification commands.

## Agent instructions include success checks

Status: PASS
Evidence: The root agent file gives concrete success checks with exact commands and conditions, including `Always: run bun lint and bun run build` and targeted server tests after specific backend changes (`AGENTS.md:45-47`).
Recommendations: None

## Agent instructions include verification steps

Status: PASS
Evidence: The root agent file provides explicit verification commands and when to apply them (`AGENTS.md:45-47`), and it anchors those steps to checked-in files such as `server/db.ts`, `server/index.ts`, `src/lib/api.ts`, and `vite.config.ts` (`AGENTS.md:28-31`, `AGENTS.md:51-57`).
Recommendations: None

## Agent instructions use strong, reinforcing validation language

Status: PASS
Evidence: The root agent file uses strong mandatory language such as `Always`, `Ask first`, and `Never` around validation and boundaries (`AGENTS.md:43-49`).
Recommendations: None

## Agent instructions require documentation maintenance

Status: FAIL
Evidence: `AGENTS.md:1-57` contains commands, setup notes, conventions, gotchas, and boundaries, but it does not require contributors or agents to update checked-in docs when commands, workflows, or behavior change. The absence of that policy already shows in stale checked-in documentation: `README.md:125-135` says `bun lint` runs ESLint, `bun run lint:fix` exists, and formatting uses Prettier, but `package.json:11-14` actually defines `oxfmt` and `oxlint` scripts and has no `lint:fix` script.
Recommendations: Add mandatory documentation-maintenance instructions to AGENTS.md that require updating README.md, AGENTS.md, and other checked-in docs whenever commands, behavior, or policies change.

## Agent instructions explain how to run tests

Status: FAIL
Evidence: The root agent file only documents targeted backend tests (`AGENTS.md:45-47`) and does not explain how to run the active frontend `bun run test` path from `package.json:16` or the full backend suite from `package.json:18`. Because the repository owns frontend Vitest/Storybook tests (`vitest.config.ts:12-45`, `.storybook/main.ts:9-10`) and server Bun tests (`server/__tests__/*`), the current agent test guidance is partial and not fully aligned with the repository.
Recommendations: Add concrete agent instructions for running `bun run test` and `bun run test:server`, and define when full-suite versus targeted test runs are required.

## Agent instructions explain how to deploy or release

Status: FAIL
Evidence: The repository ships application and service code (`src/App.tsx`, `server/index.ts`), but `AGENTS.md:1-57` and `README.md:77-155` only describe local development, configuration, usage, and validation. No checked-in deploy or release guidance was found in `DEPLOY*`, `.github/workflows/*`, `Dockerfile*`, `fly.toml`, `netlify.toml`, `vercel.json`, `railway.json`, or `Procfile`.
Recommendations: Document the repository's actual deploy or release procedure in checked-in instructions, or explicitly state that the repository has no supported shipping path.

## Agent instructions define when work is done

Status: FAIL
Evidence: `AGENTS.md:43-49` defines some required checks and boundaries, but it does not tell the agent when it may claim completion or when it must instead report incomplete work, failed verification, missing documentation updates, skipped steps, or blockers.
Recommendations: Add an explicit done policy to AGENTS.md that forbids claiming completion when required checks, docs updates, or blockers remain.

## Agent instructions specify the local skills folder path

Status: FAIL
Evidence: `AGENTS.md:1-57` does not name any repository-local skills folder path or state where local skills should be added.
Recommendations: Add the concrete repository-local skills folder path to AGENTS.md, or state the exact path contributors must use when adding local skills.

## Every major repository unit has an AGENTS file

Status: PASS
Evidence: The repository is explicitly described as a single-package project whose root agent file is the instruction set (`AGENTS.md:3`). The main units of ownership are the frontend under `src/` and backend under `server/`, and the root AGENTS file covers both frontend and backend behavior, validation, and boundaries (`AGENTS.md:28-49`). No checked-in evidence suggests separate package-level contributor rules that would require nested AGENTS files.
Recommendations: None

## AGENTS files are not stale

Status: PASS
Evidence: The commands and paths named in `AGENTS.md` exist and still map to checked-in repository reality: `bun lint`, `bun run build`, `bun run format`, and `bun run format:check` exist in `package.json:10-14`; targeted server test paths exist in `server/__tests__/db.test.ts` and `server/__tests__/projectSettings.test.ts`; and referenced files `server/index.ts`, `server/db.ts`, `src/lib/api.ts`, and `vite.config.ts` all exist.
Recommendations: None

## CI is configured

Status: FAIL
Evidence: No checked-in CI validation workflow was found under `.github/workflows/*`, `.gitlab-ci.yml`, `.circleci/*`, or `Jenkinsfile`.
Recommendations: Add a checked-in CI validation workflow.

## CI runs the relevant validation steps

Status: FAIL
Evidence: Because no CI configuration exists under `.github/workflows/*`, `.gitlab-ci.yml`, `.circleci/*`, or `Jenkinsfile`, there is no checked-in CI path that installs dependencies or runs the repository's local validation commands from `README.md:149-154` and `package.json:10-19`.
Recommendations: Make CI install dependencies and run the repository's canonical lint, build, Vitest/Storybook, and Bun server validation steps.

## CI runs at the right time

Status: FAIL
Evidence: No checked-in CI workflow exists, so there are no triggers on pull requests, pushes, or other pre-ship contribution paths.
Recommendations: Trigger validation CI on normal pre-ship paths such as pull requests or pushes to the default branch before any shipping workflow.

## A pre-commit hook system exists

Status: FAIL
Evidence: No checked-in pre-commit configuration was found under `.husky/*`, `.pre-commit-config.yaml`, `lefthook.yml`, `lint-staged`, or `nano-staged`.
Recommendations: Add a checked-in pre-commit hook system.

## Pre-commit runs lint, format, or checks

Status: FAIL
Evidence: No checked-in pre-commit hook system exists, so there is no repository-defined pre-commit path that runs lint, format, or other validation before a commit is created.
Recommendations: Configure pre-commit to run lint, format, or other validation before commits are created.

## Deploy or release policy is documented

Status: FAIL
Evidence: `README.md:77-155` documents local usage and validation only, and `AGENTS.md:1-57` documents development setup, conventions, and boundaries only. No checked-in deploy or release documentation was found in `DEPLOY*`, release docs, or platform-specific deployment files.
Recommendations: Document how this application/service is shipped, or explicitly document that it is for local-only use and has no deploy or release process.

## Deploy or release is automated or reproducible

Status: FAIL
Evidence: No checked-in deploy or release workflow, script, or reproducible step-by-step procedure was found in `package.json`, `.github/workflows/*`, `DEPLOY*`, or platform configuration files. The checked-in docs stop at local development and validation (`README.md:77-155`, `AGENTS.md:1-57`).
Recommendations: Add a concrete checked-in deploy or release workflow, script, or step-by-step reproducible procedure.

## Deploy or release is gated by checks

Status: FAIL
Evidence: No checked-in deploy or release path was found, so there is also no checked-in evidence that any shipping action depends on successful validation, a validated job, or validated artifacts.
Recommendations: Gate any deploy or release path on successful validation or explicitly documented validated artifacts.
