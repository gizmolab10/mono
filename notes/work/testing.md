# Testing Infrastructure

**Started:** 2026-01-05  
**Status:** Phase 1 in progress

---

## Problem

di has no automated tests. Manual testing (run app, drag to rotate, check console) works for now but doesn't scale.

## Goal

Set up vitest for unit testing pure TypeScript code. Focus on geometry classes first — they're the foundation and have zero DOM dependencies.

---

## Test Candidates

### High Value (pure functions, no DOM)

| File | Classes/Functions | Why |
|------|-------------------|-----|
| `types/Coordinates.ts` | Point, Size, Rect, Point3, Size3, Block | Core geometry, heavily used |
| `types/Angle.ts` | Angle, quadrant/octant calculations | Math-heavy, easy to get wrong |
| `utilities/Testworthy_Utilities.ts` | cumulativeSum, strip_duplicates, etc. | Named "testworthy" for a reason |

### Medium Value (some DOM)

| File | Notes |
|------|-------|
| `types/Coordinates.ts` | `isContainedBy_path()`, `rect_forElement()` need mocking |
| `common/Extensions.ts` | Number extensions — need to check what's there |

### Skip for Now

| File | Why |
|------|-----|
| Managers (Animation, Camera, etc.) | WebGL/canvas dependencies |
| Svelte components | Need @testing-library/svelte, more setup |

---

## Phase 1: Setup Vitest

- [ ] Install vitest
- [ ] Create vitest.config.ts
- [ ] Verify `yarn test` runs
- [ ] Create first test file

### 1.1 Install

```bash
yarn add -D vitest
```

### 1.2 Config

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

### 1.3 Package.json script

Add to scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

---

## Phase 2: Coordinates Tests

- [ ] Point basics (constructor, getters, arithmetic)
- [ ] Point.rotate_by() — tricky math
- [ ] Size basics
- [ ] Rect.contains(), Rect.intersects()
- [ ] Point3, Size3, Block basics

---

## Phase 3: Angle Tests

- [ ] quadrant_ofAngle
- [ ] octant_ofAngle  
- [ ] orientation_ofAngle

---

## Phase 4: Utilities Tests

- [ ] cumulativeSum
- [ ] strip_duplicates
- [ ] remove_fromArray_byReference

---

## Next Action

**Phase 1.1:** Install vitest
