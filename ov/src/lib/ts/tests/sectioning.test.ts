import { T_Edge, USUAL_GAP, folded_height, gap_above, gap_inside, thickness_of } from '../utilities/Sectioning';
import { describe, expect, it } from 'vitest';
import { k } from '../common/Core';

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

describe('the gap below what a section shows', () => {
	it('is the whole gap, whatever line this section draws at its own top', () => {
		expect(gap_inside(false)).toBe(USUAL_GAP);
	});

	it('is nothing while folded — there is no content to stand clear of', () => {
		expect(gap_inside(true)).toBe(0);
	});

	it('gives nothing back for a line, since the line below belongs to the next section', () => {
		expect(gap_inside(false, k.gap.normal)).toBeGreaterThan(gap_above(false, k.gap.normal, false, k.thickness.huge));
	});
});

describe('a section told to hold a different gap', () => {
	it('holds that one, above and below alike', () => {
		expect(gap_inside(false, k.gap.fat)).toBe(k.gap.fat);
	});

	it('still holds none while folded', () => {
		expect(gap_inside(true, k.gap.fat)).toBe(0);
	});

	it('still stands the one folded height, so a fold looks the same wherever it is', () => {
		expect(folded_height(k.gap.fat)).toBe(folded_height(USUAL_GAP));
		expect(folded_height(k.gap.big)).toBe(folded_height(USUAL_GAP));
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

describe('the gap between a section\'s line and what it shows', () => {
	it('is measured from the line\'s middle, so half the line is given back', () => {
		expect(gap_above(false, k.gap.normal, false, k.thickness.huge))
			.toBe(k.gap.normal - k.thickness.huge / 2);
	});

	it('is the whole gap where no line is drawn at all', () => {
		expect(gap_above(false, k.gap.normal)).toBe(k.gap.normal);
	});

	it('is nothing at all when the line\'s own half is wider than the gap', () => {
		expect(gap_above(false, k.gap.faint, false, k.thickness.huge)).toBe(0);
	});

	it('is nothing while folded, and nothing while it holds subsections', () => {
		expect(gap_above(true, k.gap.normal, false, k.thickness.normal)).toBe(0);
		expect(gap_above(false, k.gap.normal, true, k.thickness.normal)).toBe(0);
	});
});

describe('a folded section', () => {
	it('stands the usual gap tall under the heavy line, so its two lines do not meet', () => {
		expect(folded_height(USUAL_GAP, k.thickness.huge)).toBe(USUAL_GAP);
		expect(folded_height()).toBeGreaterThan(0);
	});

	it('stands taller by whatever the line above it is drawn thinner than the heavy one', () => {
		expect(folded_height(USUAL_GAP, k.thickness.normal))
			.toBeCloseTo(USUAL_GAP + k.thickness.huge - k.thickness.normal, 10);
	});

	it('stands taller by whatever extra it asks for', () => {
		expect(folded_height(USUAL_GAP, k.thickness.normal, k.gap.small))
			.toBeCloseTo(folded_height(USUAL_GAP, k.thickness.normal) + k.gap.small, 10);
	});

	it('stands flat when it asks for no gap at all', () => {
		expect(folded_height(0)).toBe(0);
		expect(folded_height(0, k.thickness.normal, k.gap.small)).toBe(0);
	});
});
