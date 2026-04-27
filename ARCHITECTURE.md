---
file_kind: architecture
scope: project
compaction_threshold: 10
changes_since_compaction: 0
last_compacted_at: null
---

# Architecture & Conventions

This project enforces strict code quality and structure conventions through custom lint rules.

## Component Ownership

- All components must have a corresponding storybook file under a sibling `stories/` directory.
- Components must export the component function directly (e.g., `export function MyComponent() {}`).
- Component root elements must have a `data-testid` matching the component name (e.g., `data-testid="MyComponent"`).

## Type Safety

- No inline type expressions (unions, intersections, function signatures, object literals) in function signatures or declarations. Always extract these into named types/interfaces.

## Testing

- Tests must be colocated in a sibling `__tests__/` directory.
