import { describe, it, expect } from 'vitest';
import { order_part_axis_by_descending_mm, draw_largest_n } from '../render/Dimension_Placement';

// Step 3h (rule 19): the (part, axis) work list is processed
// biggest-measurement-first. These pin the ordering the main loop relies on.
describe('order_part_axis_by_descending_mm', () => {
	it('(a) returns the entries in descending millimetre order', () => {
		const entries = [
			{ name: 'small', mm: 120 },
			{ name: 'big', mm: 3050 },
			{ name: 'mid', mm: 800 },
		];
		const ordered = order_part_axis_by_descending_mm(entries);
		expect(ordered.map(e => e.mm)).toEqual([3050, 800, 120]);
	});

	it('(b) puts the bigger measurement first so it claims its spot before a smaller one', () => {
		// Two parts competing: the bigger one must come first in the walk.
		const entries = [
			{ name: 'short wall', mm: 900 },
			{ name: 'long wall', mm: 3000 },
		];
		const ordered = order_part_axis_by_descending_mm(entries);
		expect(ordered[0].name).toBe('long wall');
		expect(ordered[1].name).toBe('short wall');
	});

	it('(c) empties cleanly: empty input gives empty output, input is not mutated', () => {
		expect(order_part_axis_by_descending_mm([])).toEqual([]);
		const input = [{ mm: 10 }, { mm: 20 }];
		const ordered = order_part_axis_by_descending_mm(input);
		expect(input.map(e => e.mm)).toEqual([10, 20]); // original untouched
		expect(ordered.map(e => e.mm)).toEqual([20, 10]);
	});

	it('keeps equal-millimetre entries in their incoming order (stable)', () => {
		const entries = [
			{ name: 'first', mm: 500 },
			{ name: 'second', mm: 500 },
			{ name: 'third', mm: 500 },
		];
		const ordered = order_part_axis_by_descending_mm(entries);
		expect(ordered.map(e => e.name)).toEqual(['first', 'second', 'third']);
	});
});

// Count threshold (spec 4.1): the whole valid list is computed first; this last
// step draws the N largest by length plus every always-eligible one.
describe('draw_largest_n', () => {
	const E = (mm: number, always_eligible = false) => ({ mm, always_eligible });

	it('draws the N largest by length', () => {
		const kept = draw_largest_n([E(100), E(300), E(50), E(200)], 2);
		expect(kept.map(e => e.mm)).toEqual([300, 200]);
	});

	it('sorts by length itself — input order does not matter', () => {
		const kept = draw_largest_n([E(50), E(200), E(300), E(100)], 2);
		expect(kept.map(e => e.mm)).toEqual([300, 200]);
	});

	it('an always-eligible entry among the N largest counts as one of the N', () => {
		// two largest are 300 and 250; 250 is always-eligible and IS the 2nd.
		const kept = draw_largest_n([E(300), E(250, true), E(200), E(100)], 2);
		expect(kept.map(e => e.mm)).toEqual([300, 250]);
	});

	it('an always-eligible entry below the cut still draws, on top of the N', () => {
		// N=2 draws 300 and 250; 120 is always-eligible below the cut, so it also
		// draws; the ordinary 200 below the cut does not.
		const kept = draw_largest_n([E(300), E(250), E(200), E(120, true)], 2);
		expect(kept.map(e => e.mm)).toEqual([300, 250, 120]);
	});

	it('count 0 draws only the always-eligible ones', () => {
		const kept = draw_largest_n([E(300), E(200), E(100, true)], 0);
		expect(kept.map(e => e.mm)).toEqual([100]);
	});

	it('a count at or above the pool draws them all', () => {
		const kept = draw_largest_n([E(100), E(300), E(200)], 99);
		expect(kept.map(e => e.mm)).toEqual([300, 200, 100]);
	});
});
