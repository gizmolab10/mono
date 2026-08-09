import { natural_height } from '../utilities/Smooth_Height';
import { describe, expect, it } from 'vitest';

// A row of pills that wraps changes the height of the box holding it, and everything below jumps.
// Nothing in the styling changed — the box was left to find its own height and still is — so
// there is nothing for a browser to slide between. The number has to be worked out and stated.

describe('how tall a box would stand on its own', () => {
	it('is the bottom of its lowest thing', () => {
		expect(natural_height([{ top: 0, height: 22 }])).toBe(22);
	});

	it('grows when the pills take a second row', () => {
		expect(natural_height([{ top: 0, height: 22 }, { top: 0, height: 22 }])).toBe(22);
		expect(natural_height([{ top: 0, height: 22 }, { top: 30, height: 22 }])).toBe(52);
	});

	it('reads the lowest thing, whatever order they come in', () => {
		expect(natural_height([{ top: 30, height: 22 }, { top: 0, height: 22 }])).toBe(52);
	});

	it('is nothing at all when the box holds nothing', () => {
		expect(natural_height([])).toBe(0);
	});

	// Where a thing starts is counted from the box's own top. Counted from anywhere else — the
	// page, or some box further up — every number is wrong by however far down the box itself sits.
	it('counts from the box, so a box sitting far down the page still measures its own contents', () => {
		expect(natural_height([{ top: 0, height: 22 }])).toBe(22);
		expect(natural_height([{ top: 125, height: 22 }])).toBe(147);
	});
});
