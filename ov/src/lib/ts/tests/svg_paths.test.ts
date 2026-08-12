import { CHECKBOX, svg_paths } from '../utilities/SVG_Paths';
import { describe, expect, it } from 'vitest';

/** Every number in a drawn path, in the order it is written. */
function numbers_in(path: string): number[] {
	return (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
}

describe('the box beside a thing to be done', () => {
	it('draws a square of the size it is given, with four rounded corners', () => {
		const drawn = svg_paths.checkbox(15, 3);
		expect(drawn.match(/A /g)?.length).toBe(4);
		expect(Math.max(...numbers_in(drawn))).toBe(15);
		expect(Math.min(...numbers_in(drawn))).toBe(0);
	});

	it('falls back to the one size and corner everything else asks for', () => {
		expect(svg_paths.checkbox()).toBe(svg_paths.checkbox(CHECKBOX.size, CHECKBOX.radius));
	});

	it('grows with the size it is given', () => {
		expect(Math.max(...numbers_in(svg_paths.checkbox(40, 3)))).toBe(40);
	});

	it('never curves further than half a side, however large the corner asked for', () => {
		expect(svg_paths.checkbox(10, 99)).toBe(svg_paths.checkbox(10, 5));
	});
});

describe('the check inside a finished box', () => {
	it('is one stroke of two straight runs, down then up', () => {
		const drawn = svg_paths.checkmark(20);
		expect(drawn.match(/L /g)?.length).toBe(2);
		const [, from_y, , mid_y, , to_y] = numbers_in(drawn);
		expect(mid_y).toBeGreaterThan(from_y);          // down to the corner
		expect(to_y).toBeLessThan(mid_y);               // then up, higher than it started
		expect(to_y).toBeLessThan(from_y);
	});

	it('stays inside the box it is given', () => {
		for (const found of numbers_in(svg_paths.checkmark(20))) {
			expect(found).toBeGreaterThanOrEqual(0);
			expect(found).toBeLessThanOrEqual(20);
		}
	});

	it('falls back to the same size the box does', () => {
		expect(svg_paths.checkmark()).toBe(svg_paths.checkmark(CHECKBOX.size));
	});
});

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
