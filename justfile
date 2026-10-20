default:
    @just --list

# Prepare dependencies for local development.
setup:
    bun install --frozen-lockfile
    bd --version

run:
    bun run dev:all
