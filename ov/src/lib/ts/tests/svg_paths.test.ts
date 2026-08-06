import { svg_paths } from '../utilities/SVG_Paths';
import { describe, expect, it } from 'vitest';

/** Every number in a drawn path, in the order it is written. */
function numbers_in(path: string): number[] {
	return (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
}

describe('the clear mark', () => {
	const SIZE = 20;
	const drawn = svg_paths.circle_slash(SIZE);

	it('is one round shape and one straight line', () => {
		expect(drawn.match(/a /g)?.length).toBe(2);       // two half-turns make the circle
		expect(drawn.match(/L /g)?.length).toBe(1);       // and one line across it
	});

	it('nothing in it is out of the box it is given', () => {
		for (const found of numbers_in(drawn)) {
			expect(found).toBeGreaterThanOrEqual(-SIZE);  // the circle is written as two steps across
			expect(found).toBeLessThanOrEqual(SIZE);
		}
	});

	it('holds back half the stroke, so the edge is never clipped', () => {
		const thick = 4;
		const wide  = svg_paths.circle_slash(SIZE, thick);
		expect(numbers_in(wide)[0]).toBe(thick / 2);      // the circle starts that far in
	});

	it('grows with the size it is given', () => {
		const small = numbers_in(svg_paths.circle_slash(10))[0];
		const big   = numbers_in(svg_paths.circle_slash(40))[0];
		expect(small).toBe(big);                          // both start half a stroke in
		expect(svg_paths.circle_slash(40)).not.toBe(svg_paths.circle_slash(10));
	});

	it('draws the slash from the lower left to the upper right', () => {
		const line = drawn.slice(drawn.indexOf(' M ', 1));
		const [from_x, from_y, to_x, to_y] = numbers_in(line);
		expect(from_x).toBeLessThan(to_x);
		expect(from_y).toBeGreaterThan(to_y);             // down the page is a larger number
	});
});
