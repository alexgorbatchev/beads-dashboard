default:
    @just --list

# Prepare dependencies for local development.
setup:
    bun install --frozen-lockfile
    bun x playwright install chromium
    bd --version

run:
    bun run dev:all
