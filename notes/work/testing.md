# Testing Infrastructure

**Started:** 2026-01-05  
**Status:** Phase 4 complete ✅

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
| `utilities/Colors.ts` | RGBA/HSBA conversions, luminance, blending | Color math, easy to get wrong |

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

- [x] Install vitest ✅
- [x] Create vitest.config.ts ✅
- [x] Add test scripts to package.json ✅
- [x] Verify `yarn test:run` works ✅

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

- [x] Point basics (constructor, getters, arithmetic) ✅
- [x] Point.rotate_by() ✅
- [x] Size basics ✅
- [x] Rect.contains(), Rect.intersects() ✅
- [x] Point3, Size3, Polar ✅

**Result:** 40 tests passing in 549ms

---

## Phase 3: Angle Tests

- [x] quadrant_ofAngle ✅
- [x] octant_ofAngle ✅
- [x] orientation_ofAngle ✅
- [x] cursor_forAngle ✅
- [x] angle_points_* helpers ✅

**Result:** 51 tests passing

**Bugs found and fixed:**
1. `cursor_forAngle` used `!!this.angle` which treated 0 as falsy — fixed to check `!== null && !== undefined`
2. `orientation_ofAngle` used broken modulo logic at quadrant boundaries — fixed to calculate offset within quadrant properly

---

## Phase 4: Utilities Tests

- [x] cumulativeSum ✅
- [x] strip_duplicates ✅
- [x] strip_falsies ✅
- [x] remove / remove_fromArray_byReference ✅
- [x] indexOf_inArray_byReference ✅
- [x] concatenateArrays / uniquely_concatenateArrays ✅
- [x] convert_toNumber ✅
- [x] valueFrom_atIndex ✅
- [x] copyObject / convertToObject ✅

**Result:** 41 tests passing, no bugs found

---

## Phase 5: Colors Tests

- [ ] RGBA_toHex
- [ ] HSBA_toRGBA / RBGA_toHSBA roundtrip
- [ ] luminance_ofColor
- [ ] darkerBy / lighterBy
- [ ] color_fromSeriously (parse seriously format)
- [ ] blend / special_blend

---

## Next Action

**Phase 5:** Add Colors tests (RGBA/HSBA conversions, luminance, blending)
