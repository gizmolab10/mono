# Testing

## Quick Reference

```bash
yarn test        # watch mode
yarn test:run    # single run
```

## Test Structure

Test files live alongside source or in a `tests/` directory:
- `src/lib/ts/tests/` — TypeScript unit tests
- Name pattern: `Foo.test.ts`

## Adding Tests

1. Create `Foo.test.ts` in your tests directory
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

## Common Patterns

### Testing Pure Functions

```typescript
describe('calculateTotal', () => {
  it('sums array of numbers', () => {
    expect(calculateTotal([1, 2, 3])).toBe(6);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
```

### Testing Classes

```typescript
describe('Point', () => {
  it('creates with x and y', () => {
    const p = new Point(10, 20);
    expect(p.x).toBe(10);
    expect(p.y).toBe(20);
  });

  it('calculates distance', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(3, 4);
    expect(p1.distanceTo(p2)).toBe(5);
  });
});
```

### Testing Edge Cases

```typescript
describe('Angle', () => {
  it('handles zero correctly', () => {
    // 0 is falsy but valid angle
    expect(cursor_forAngle(0)).toBe('e-resize');
  });

  it('handles boundary values', () => {
    expect(quadrant_forAngle(0)).toBe(1);
    expect(quadrant_forAngle(90)).toBe(2);
    expect(quadrant_forAngle(360)).toBe(1); // wraps
  });
});
```

## What to Test

**Good candidates:**
- Pure functions (no side effects)
- Geometry/math utilities
- Data transformations
- String/array helpers
- State transitions

**Skip for now:**
- Canvas/WebGL rendering
- Svelte components (needs @testing-library/svelte)
- Browser APIs
- Async network calls

## Config

- `vitest.config.ts` — test configuration
- Exclude app entry points from test discovery

## Debugging Tests

```bash
# Run specific test file
yarn test Angle.test.ts

# Run tests matching pattern
yarn test -t "calculates distance"

# Show console output
yarn test --reporter=verbose
```
