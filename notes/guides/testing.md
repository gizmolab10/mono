# Testing

## Quick Reference

```bash
yarn test        # watch mode
yarn test:run    # single run
```

## Coverage

| File | Tests | Notes |
|------|-------|-------|
| `types/Coordinates.ts` | 40 | Point, Size, Rect, Point3, Polar |
| `types/Angle.ts` | 51 | quadrant, octant, orientation, cursor |
| `utilities/Testworthy_Utilities.ts` | 41 | arrays, cumulative sum, conversions |
| `utilities/Colors.ts` | 32 | luminance, blending, color parsing |
| `common/Extensions.ts` | 42 | Number and String prototype extensions |
| **Total** | **206** | |

Test files live in `src/lib/ts/tests/`.

## Known Issues

Discovered during testing — worth revisiting:

| File | Issue | Status |
|------|-------|--------|
| `Angle.ts` | `cursor_forAngle` treated angle 0 as falsy | **Fixed** |
| `Angle.ts` | `orientation_ofAngle` wrong at quadrant boundaries | **Fixed** |
| `Colors.ts` | `darkerBy` can't darken white | Limitation: `(1-lume)*(1+ratio)` = 0 when lume=1 |
| `Colors.ts` | `darkerBy` returns original on dark colors + high ratios | Limitation: target darkness > 1 |
| `Colors.ts` | `blend` ignores foreground when background is white | Returns 'lightgray' — intentional? |
| `Extensions.ts` | `removeWhiteSpace` inconsistent | Newlines → space, tabs → removed |

## Not Yet Tested

| Category | Why |
|----------|-----|
| `render/*` (Animation, Camera, Input, Render, Scene) | Canvas/WebGL dependencies |
| Svelte components | Needs @testing-library/svelte |

## Adding Tests

1. Create `Foo.test.ts` in `src/lib/ts/tests/`
2. Import from relative path: `import { Foo } from '../path/to/Foo'`
3. Import Extensions if needed: `import '../common/Extensions'`

```typescript
import { describe, it, expect } from 'vitest';
import { Thing } from '../types/Thing';

describe('Thing', () => {
  it('does something', () => {
    expect(new Thing().value).toBe(42);
  });
});
```

## Config

- `vitest.config.ts` — test configuration
- `src/lib/ts/tests/Render.test.ts` — excluded (app entry point, not tests)
