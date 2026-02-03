# Testing

Unit tests for pure logic. Vitest runner.

## Location

`src/lib/ts/tests/*.test.ts`

## Run

```bash
yarn test              # all tests
yarn test --run        # single run (no watch)
yarn test --run src/lib/ts/tests/hits_3d.test.ts  # single file
```

## Our Current Tests

Pure functions and math — things that don't need DOM or canvas:

- **Coordinates** — Point, Size, Rect arithmetic, transformations
- **Angle** — normalization, conversion, comparison
- **Colors** — parsing, blending, HSL/RGB conversion
- **Extensions** — array/number utilities
- **hits_3d** — geometry: point-in-polygon, segment proximity, front-facing detection

## Style

```typescript
import { describe, it, expect } from 'vitest';

describe('function_name', () => {
  it('does specific thing', () => {
    expect(result).toBe(expected);
  });
});
```

- One `describe` per function or concept
- Test names describe behavior, not implementation
- Use `toBeCloseTo` for floating point
- Inline helper functions for test data (e.g., `proj(x, y, z, w)`)

## Adding Tests

1. Create `<name>.test.ts` in `src/lib/ts/tests/`
2. Import from source: `import { Thing } from '../types/Thing'`
3. For private methods, copy the function into test file (tests the algorithm, not the class)

## Visual Testing (future)

Vitest runs in Node — no browser, no canvas. For visual regression testing, add Playwright:

```bash
yarn add -D @playwright/test
npx playwright install
```

Workflow: captures screenshots, diffs against baseline PNGs in repo. Update baselines with `--update-snapshots`.
