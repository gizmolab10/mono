import { names_ride_in } from '../utilities/Tag_Rows';
import { describe, expect, it } from 'vitest';

// A tag area shows its own name riding above its top edge when it is open, when one tag is all
// that is left of it, or when something inside it is picked. That name reaches toward whatever
// runs above the row, so the row holds a gap — but only when the name belongs to a pill in the
// topmost line. The pills wrap, so which line a pill is on is measured, never reasoned out.
//
// Written over plain numbers so it can be proved without a page: each pill is how far its top
// sits from the top of the run, and whether it carries a name.

describe('whether a name rides in the topmost row', () => {
	it('says no when the run holds nothing', () => {
		expect(names_ride_in([])).toBe(false);
	});

	it('says no when no pill carries a name', () => {
		expect(names_ride_in([{ top: 0, named: false }, { top: 0, named: false }])).toBe(false);
	});

	it('says yes for a name on the one line there is', () => {
		expect(names_ride_in([{ top: 0, named: false }, { top: 0, named: true }])).toBe(true);
	});

	it('says yes for a name anywhere along the topmost line', () => {
		expect(names_ride_in([{ top: 0, named: true }, { top: 40, named: false }])).toBe(true);
		expect(names_ride_in([{ top: 0, named: false }, { top: 0, named: true }, { top: 40, named: false }])).toBe(true);
	});

	it('says no for a name that has wrapped onto a later line', () => {
		expect(names_ride_in([{ top: 0, named: false }, { top: 40, named: true }])).toBe(false);
	});

	it('takes the topmost line as whatever sits highest, not as zero', () => {
		expect(names_ride_in([{ top: 12, named: true }, { top: 52, named: false }])).toBe(true);
		expect(names_ride_in([{ top: 12, named: false }, { top: 52, named: true }])).toBe(false);
	});

	it('reads a row a fraction of a pixel out as one line', () => {
		expect(names_ride_in([{ top: 0, named: false }, { top: 0.4, named: true }])).toBe(true);
		expect(names_ride_in([{ top: 0, named: false }, { top: 2, named: true }])).toBe(false);
	});
});
