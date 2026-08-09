import { T_Edge, folded_height, gap_inside, thickness_of } from '../utilities/Sectioning';
import { describe, expect, it } from 'vitest';
import { k } from '../common/Constants';

// A section is a rectangle bounded above and below, holding equal gap around its content. The
// evenness is the whole rule: every spacing fault it exists to prevent came from two places
// doing their own arithmetic and drifting apart.

describe('the line at a boundary', () => {
	it('is the heavy one between sections', () => {
		expect(thickness_of(T_Edge.thick)).toBe(k.thickness.huge);
	});

	it('is a hair between subsections', () => {
		expect(thickness_of(T_Edge.thin)).toBe(k.thickness.normal);
	});

	it('is nothing at all at an edge of the view — no line, and no gap held for one', () => {
		expect(thickness_of(T_Edge.view)).toBe(0);
	});
});

describe('the gap inside a section', () => {
	it('is the same above and below, which is the whole rule', () => {
		expect(gap_inside(false)).toBe(k.gap.normal);
	});

	it('is nothing while folded — there is no content to stand clear of', () => {
		expect(gap_inside(true)).toBe(0);
	});
});

describe('a section told to hold a different gap', () => {
	it('holds that one, above and below alike', () => {
		expect(gap_inside(false, k.gap.fat)).toBe(k.gap.fat);
	});

	it('still holds none while folded', () => {
		expect(gap_inside(true, k.gap.fat)).toBe(0);
	});

	it('stands that tall while folded, so its two lines still do not meet', () => {
		expect(folded_height(k.gap.fat)).toBe(k.gap.fat + k.gap.tiny);
	});
});

describe('a section holding subsections', () => {
	it('holds none of its own, since its children hold one at those very boundaries', () => {
		expect(gap_inside(false, k.gap.normal, true)).toBe(0);
	});

	it('ignores whatever gap it was given', () => {
		expect(gap_inside(false, k.gap.fat, true)).toBe(0);
		expect(gap_inside(false, k.gap.huge, true)).toBe(0);
	});

	it('still holds none while folded', () => {
		expect(gap_inside(true, k.gap.normal, true)).toBe(0);
	});
});

describe('a folded section', () => {
	it('stands its own gap tall and a tiny one over, so its two lines do not meet', () => {
		expect(folded_height()).toBe(k.gap.normal + k.gap.tiny);
		expect(folded_height()).toBeGreaterThan(0);
	});

	it('stands flat when it asks for no gap at all', () => {
		expect(folded_height(0)).toBe(0);
	});
});
