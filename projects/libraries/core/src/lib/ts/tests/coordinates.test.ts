import { Point, Rect, Size } from '../types';
import { describe, expect, it } from 'vitest';

// Whether a rectangle stands somewhere else than the one it is asked about. The hits manager holds
// every rectangle rather than reading it, so this is how it catches one that has gone stale.

/** A rectangle at a place, of a size. */
function box(x: number, y: number, width = 10, height = 10): Rect {
	return new Rect(new Point(x, y), new Size(width, height));
}

describe('whether a rectangle has moved', () => {
	it('has not, where it stands in the same place at the same size', () => {
		expect(box(10, 20).differs_from(box(10, 20), 0.5)).toBe(false);
	});

	it('has not, where the difference is inside the slack', () => {
		expect(box(10, 20).differs_from(box(10.4, 20.4), 0.5)).toBe(false);
	});

	it('has, where it stands further off than the slack', () => {
		expect(box(10, 20).differs_from(box(10, 26), 0.5)).toBe(true);
	});

	it('has, where it stands the same but is drawn another size', () => {
		expect(box(10, 20).differs_from(box(10, 20, 10, 40), 0.5)).toBe(true);
	});

	it('has, where there is nothing to compare it with', () => {
		expect(box(10, 20).differs_from(null, 0.5)).toBe(true);
	});
});
