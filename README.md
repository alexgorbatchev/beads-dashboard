# Beads Dashboard

> [!WARNING]
> This repository preserves and continues work originally authored by [Vasileios Lagios](https://github.com/lagiosv) (`@lagiosv`).
> Early commits in this history and the original README referenced `lagiosv/beads-dashboard`; the original public repository was not publicly locatable when this copy was adopted.

A web dashboard for [beads](https://github.com/steveyegge/beads), the local-first issue tracker for software projects.

![Beads Dashboard](docs/dark_theme.png)

## Features

- Multi-project issue browsing through the `bd` CLI
- Built-in project manager for adding and persisting local project paths
- Issue listing, details, statistics, labels, and edits routed through `bd`
- List and Kanban views
- Inline editing for titles, descriptions, notes, labels, and due dates
- On-demand git branch/worktree diffs for ticket branches whose branch name or worktree path contains the issue ID
- Statistics and project-level summaries
- Keyboard shortcuts for common issue-navigation actions
- WebSocket-based live refresh between the frontend and API server

## Requirements

- Bun
- Node.js/npm when using the `npx` package-entry form
- `bd` CLI on `PATH` for project discovery, issue reads, and issue mutations
- One or more projects that use [beads](https://github.com/steveyegge/beads)

## Installation

Run the packaged dashboard for the current directory or for an explicit directory:

```bash
npx beads-dashboard .
npx beads-dashboard /path/to/projects
```

The `npx` form downloads and invokes the package command; Bun must still be installed and available on `PATH`.

For repository development, clone the repository from the trusted location you intend to use, then install dependencies:

```bash
git clone <repository-url>
cd beads-dashboard
bun install
```

## Configuration

Start the app, open **Manage Projects** in the UI, and add the local Beads project paths you want to browse. Those
entries are stored in a local `.projects.json` file in the dashboard working directory. With the package command, that
working directory is the provided path, or the current directory when no path is provided. With the repository
development commands, that working directory is the dashboard repo root.

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

### Beads data access

The dashboard treats the `bd` CLI as the Beads data source. Project discovery runs `bd where --json` from candidate
directories. Issue lists, detail panels, statistics, labels, and mutations run the relevant `bd` commands from the
configured project path.

The server does not read Beads storage files directly. If a path does not work with `bd where --json`, the dashboard
does not treat it as a supported project.

## Usage

Use the package command to serve the built dashboard UI and API from one server:

```bash
npx beads-dashboard .
```

Then open `http://localhost:3001` in your browser.

For repository development, start the frontend and API server together:

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

From an issue detail panel, use **Load diff** under **Worktree / Branch Diff** to inspect git changes for that ticket.
The dashboard looks for a local branch or linked git worktree whose name/path contains the issue ID, compares committed
branch changes against `origin/HEAD`, `main`, or `master`, and also shows uncommitted changes from the matching worktree
when one exists.

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

The package command accepts the target path directly instead:

```bash
npx beads-dashboard "$PWD"
```

### Remote / LAN development access

The Vite dev server and API server bind to `0.0.0.0` for local network access. In development, the frontend reaches
the backend through Vite proxying for `/api` and `/ws`, so remote browsers should use the dashboard origin instead of
calling `localhost:3001` directly.

If you access the dashboard through a hostname such as `http://devbox:5173`, add that name to `ALLOWED_HOSTS` in
`.env` and restart the dev server. When running through Bun, `.env` is loaded automatically.

## Scripts

| Command                 | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `npx beads-dashboard .` | Start the packaged dashboard for the current path |
| `bun dev:ui`            | Start the Vite frontend dev server                |
| `bun dev:server`        | Start the API server with Bun watch mode          |
| `bun dev:all`           | Start both development servers                    |
| `bun run build`         | Build the frontend bundle                         |
| `bun run validate`      | Run lint, build, frontend tests, and server tests |
| `bun lint`              | Run oxlint with warnings denied                   |
| `bun run test`          | Run Vitest unit and Storybook browser tests       |
| `bun run test:server`   | Run Bun server tests                              |
| `bun run format`        | Format source files with oxfmt                    |
| `bun run format:check`  | Check TypeScript source formatting                |
| `bun preview`           | Preview the frontend production build             |

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

This repository has no supported server deployment process. The package metadata defines the `beads-dashboard` command
for package execution with `npx`, and `prepack` builds the frontend assets included in the package. Do not treat
`bun run build`, `bun preview`, or copied `dist/` files as a standalone deployment path unless a future change adds a
checked-in deploy workflow and gates it on `bun run validate`.

## License

MIT
