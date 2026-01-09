# Beads Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

A modern web dashboard for [beads](https://github.com/steveyegge/beads), the local-first issue tracker for software projects.

![Beads Dashboard](docs/dark_theme.png)

## Features

- **Multi-project support** - View and manage issues across all your beads projects
- **List and Kanban views** - Switch between list and board views for your workflow
- **Inline editing** - Edit titles, descriptions, notes, and due dates directly
- **Label management** - Add and remove labels from the UI
- **Drag-and-drop** - Move issues between columns in Kanban view
- **Filtering** - Filter by status, labels, ready issues, and overdue items
- **Keyboard shortcuts** - Navigate and manage issues without leaving the keyboard
- **Dark mode** - Automatic theme detection with manual override
- **Real-time updates** - WebSocket connection for live data sync

## Prerequisites

- Node.js 18+
- One or more projects using [beads](https://github.com/steveyegge/beads) for issue tracking

## Installation

```bash
git clone https://github.com/lagiosv/beads-dashboard.git
cd beads-dashboard
npm install
```

## Configuration

The dashboard scans for beads databases starting from a root directory.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BEADS_ROOT` | Root directory to scan for beads projects | `~` (home directory) |
| `PORT` | API server port | `3001` |

Example:
```bash
BEADS_ROOT=/path/to/projects npm run dev:all
```

## Usage

Start both the API server and frontend in development mode:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1: API server
npm run dev:server

# Terminal 2: Frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `↓` | Move down in issue list |
| `k` / `↑` | Move up in issue list |
| `Enter` / `o` | Open selected issue |
| `Escape` | Close detail panel |
| `/` | Focus search |
| `r` | Refresh data |
| `p` | Toggle pin (when issue open) |
| `1-5` | Set status (when issue open) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run dev:server` | Start API server with hot reload |
| `npm run dev:all` | Start both concurrently |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix auto-fixable lint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4
- **UI Components**: shadcn/ui with Base UI primitives (@basecn registry), Lucide icons
- **Backend**: Express 5, better-sqlite3, WebSocket
- **Tooling**: ESLint, Prettier

## Project Structure

```
beads-dashboard/
├── src/
│   ├── components/     # React components
│   │   └── ui/         # shadcn/ui components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API client and utilities
│   └── types.ts        # TypeScript types
├── server/
│   ├── index.ts        # Express API server
│   └── db.ts           # SQLite database layer
└── dist/               # Production build
```

## Screenshots

### Statistics Panel
View aggregated statistics across all projects with breakdowns by status and project.

![Statistics](docs/statistics.png)

### Issue Detail
Full issue details with inline editing for title, description, notes, labels, and due dates.

![Issue Detail](docs/task.png)

## Roadmap

- [ ] Create new issues from the dashboard
- [ ] Add comments to issues
- [ ] Manage dependencies between issues
- [ ] Time tracking with start/stop timer
- [ ] Bulk operations (multi-select)
- [ ] Export issues to markdown/CSV
- [ ] Search across all projects

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
