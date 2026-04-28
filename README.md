# Beads Dashboard

> [!WARNING]
> This repository preserves and continues work originally authored by [Vasileios Lagios](https://github.com/lagiosv) (`@lagiosv`).
> Early commits in this history and the original README referenced `lagiosv/beads-dashboard`; the original public repository was not publicly locatable when this copy was adopted.

A web dashboard for [beads](https://github.com/steveyegge/beads), the local-first issue tracker for software projects.

![Beads Dashboard](docs/dark_theme.png)

## Features

- Multi-project issue browsing across beads databases
- Built-in project manager for adding and persisting local project paths
- SQLite-backed project editing and JSONL-backed project browsing
- List and Kanban views
- Inline editing for titles, descriptions, notes, labels, and due dates
- Statistics and project-level summaries
- Keyboard shortcuts for common issue-navigation actions
- WebSocket-based live refresh between the frontend and API server

## Requirements

- Bun
- One or more projects that use [beads](https://github.com/steveyegge/beads)

## Installation

Clone the repository from the trusted location you intend to use, then install dependencies:

```bash
git clone <repository-url>
cd beads-dashboard
bun install
```

## Configuration

Start the app, open **Manage Projects** in the UI, and add the local Beads
project paths you want to browse. Those entries are stored in a local
`.projects.json` file at the dashboard repo root.

If `.projects.json` does not exist yet, the API falls back to automatic discovery. In that mode it scans from
`BEADS_ROOT`, or from the current working directory when `BEADS_ROOT` is unset.

| Variable        | Description                                                                        | Default                                                                                   |
| --------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `HOST`          | Interface for the API server and WebSocket server                                  | `0.0.0.0`                                                                                 |
| `PORT`          | API server port                                                                    | `3001`                                                                                    |
| `BEADS_ROOT`    | Optional root directory to scan for Beads projects when not using `.projects.json` | current working directory                                                                 |
| `CORS_ORIGIN`   | Comma-separated allowed browser origins                                            | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173` |
| `ALLOWED_HOSTS` | Comma-separated Vite dev-server host allowlist                                     | empty                                                                                     |

Optional automatic-discovery example:

```bash
BEADS_ROOT=/path/to/projects bun dev:all
```

To allow named hosts such as `devbox` or `devbox.local` in development, set `ALLOWED_HOSTS` in `.env`:

```ini
ALLOWED_HOSTS=devbox,devbox.local
```

### Supported Beads storage

The dashboard recognizes Beads projects by inspecting each project's `.beads/` directory:

- `.beads/*.db` — supported for read and write operations
- `.beads/issues.jsonl` — supported for read-only browsing

JSONL-backed projects can be viewed in the dashboard, but mutations are rejected by the API. If your Beads project
uses Dolt or exports JSONL files from another backend, treat the dashboard as a reader unless the real storage
contract is implemented.

## Usage

Start the frontend and API server together:

```bash
bun dev:all
```

Or run them separately:

```bash
# Terminal 1
bun dev:server

# Terminal 2
bun dev:ui
```

Then open `http://localhost:5173` in your browser.

Use **Manage Projects** in the UI to add one or more local Beads project paths. Adding the first project creates
`.projects.json`, which becomes the source of truth for project discovery.

If you prefer automatic discovery from a single root instead of managing explicit project entries, point
`BEADS_ROOT` at the directory that contains your Beads projects:

```bash
BEADS_ROOT=/path/to/projects bun dev:all
```

If you are already inside the directory that contains your Beads projects, you can launch the dashboard repo with
`bun --cwd` while pointing `BEADS_ROOT` at the current folder:

```bash
BEADS_ROOT="$PWD" bun --cwd /path/to/beads-dashboard run dev:all
```

### Remote / LAN development access

The Vite dev server and API server bind to `0.0.0.0` for local network access. In development, the frontend reaches
the backend through Vite proxying for `/api` and `/ws`, so remote browsers should use the dashboard origin instead of
calling `localhost:3001` directly.

If you access the dashboard through a hostname such as `http://devbox:5173`, add that name to `ALLOWED_HOSTS` in
`.env` and restart the dev server. When running through Bun, `.env` is loaded automatically.

## Scripts

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `bun dev:ui`           | Start the Vite frontend dev server                |
| `bun dev:server`       | Start the API server with Bun watch mode          |
| `bun dev:all`          | Start both development servers                    |
| `bun run build`        | Build the frontend bundle                         |
| `bun run validate`     | Run lint, build, frontend tests, and server tests |
| `bun lint`             | Run oxlint with warnings denied                   |
| `bun run test`         | Run Vitest unit and Storybook browser tests       |
| `bun run test:server`  | Run Bun server tests                              |
| `bun run format`       | Format source files with oxfmt                    |
| `bun run format:check` | Check TypeScript source formatting                |
| `bun preview`          | Preview the frontend production build             |

## Screenshots

### Statistics Panel

![Statistics](docs/statistics.png)

### Issue Detail

![Issue Detail](docs/task.png)

## Development

Validate the repository with:

```bash
bun run validate
```

`bun run validate` is the canonical root check. It runs linting, the production build, the frontend Vitest/Storybook
browser suite, and the Bun server suite.

### Pre-commit hooks

This repository includes a `.pre-commit-config.yaml` with a local hook that runs `bun run validate` before commits. If
you use the Python `pre-commit` tool, install the hook with:

```bash
pre-commit install
```

## Shipping policy

This repository has no supported deploy or release process. It is maintained as a local-only dashboard that contributors
run from the checked-out repository with Bun. Do not treat `bun run build`, `bun preview`, or copied `dist/` files as a
supported shipping path unless a future change adds a checked-in deploy or release workflow and gates it on
`bun run validate`.

## License

MIT
