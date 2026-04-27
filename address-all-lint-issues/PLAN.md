# Plan to address lint issues

## Overview

The codebase has numerous linting violations, categorized by:

1. Component export conventions (must use direct exports).
2. Missing Storybook coverage (missing `stories/` files).
3. Incorrect Storybook exports and titles.
4. Inline type expressions (need to be named).
5. Unused interfaces and loose equality checks (`==`).
6. Missing `data-testid` on component roots.
7. TypeScript errors (missing `@storybook/react`).

## Steps

### Phase 1: Component Export Conventions

- Refactor `export { Component }` to `export function Component() {}` in:
  - `src/components/ui/dropdown-menu.tsx`
  - `src/components/ui/dialog.tsx`
  - `src/components/ui/sheet.tsx`
  - `src/components/ui/scroll-area.tsx`
  - `src/components/ui/tooltip.tsx`
  - `src/App.tsx` (default export -> named export)

### Phase 2: Storybook Fixes

- Create missing story files in correct locations (e.g., `src/components/ui/stories/`).
- Update titles to match `beads-dashboard/components/ui/...` convention.
- Add `play` functions to stories.
- Update export shapes to `const Default: Story = { ... }; export { Default as Name };`.

### Phase 3: TypeScript Improvements

- Extract inline type intersections/unions/objects to named types in:
  - `src/components/ui/dropdown-menu.tsx`
  - `src/components/ui/dialog.tsx`
  - `src/components/ui/sheet.tsx`
  - `src/components/ui/tooltip.tsx`
  - `src/App.tsx`
  - `src/lib/api.ts`
  - `server/db.ts`
  - `src/components/IssueDetail.tsx`
  - `src/components/IssueList.tsx`

### Phase 4: Clean up

- Remove unused interfaces in `server/projectSettings.ts` and `server/db.ts`.
- Replace `==` with `===` in `server/db.ts`.
- Add `data-testid` to component roots in `src/components/` and `src/components/ui/`.

### Phase 5: Dependencies

- Resolve `Cannot find module '@storybook/react'` TS error.

## Status

- Iteration 1/25
- Plan created.
- [x] Fixed `server/projectSettings.ts` interfaces and exports.
- [x] Fixed `server/db.ts` `==` to `===` and unused interfaces.
- [x] Refactored `src/components/ui/dropdown-menu.tsx` exports.
- [x] Fixed `server/db.ts` inline type expressions.
