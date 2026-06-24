import { describe, it, expect } from 'vitest';
import { order_part_axis_by_descending_mm, select_within_count } from '../render/Dimension_Placement';

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

// Count gate (spec 2.1.6): keep the first N in-frustum candidates biggest-first,
// plus every forced (selected-fully-in-frustum or hovered) entry on top.
describe('select_within_count', () => {
	const E = (mm: number, base = true, forced = false) => ({ mm, base, forced });

	it('count 0 keeps only the forced entries (dimensions off)', () => {
		const kept = select_within_count([E(300), E(200), E(100, true, true)], 0);
		expect(kept.length).toBe(1);
		expect(kept[0].forced).toBe(true);
	});

	it('keeps the first N candidates, biggest-first', () => {
		const ordered = order_part_axis_by_descending_mm([E(100), E(300), E(50), E(200)]);
		expect(select_within_count(ordered, 2).map(e => e.mm)).toEqual([300, 200]);
	});

	it('a count at or above the pool shows them all', () => {
		const ordered = order_part_axis_by_descending_mm([E(100), E(300), E(200)]);
		expect(select_within_count(ordered, 99).map(e => e.mm)).toEqual([300, 200, 100]);
	});

	it('forced entries are kept on top of the count and do not consume a slot', () => {
		// biggest-first: 300 base, 250 forced, 200 base, 100 base
		const kept = select_within_count([E(300), E(250, true, true), E(200), E(100)], 2);
		expect(kept.map(e => e.mm)).toEqual([300, 250, 200]);
	});

	it('excludes non-forced entries that are not in-frustum candidates', () => {
		const kept = select_within_count([E(300, false, false), E(200, true, false)], 5);
		expect(kept.map(e => e.mm)).toEqual([200]);
	});
});
