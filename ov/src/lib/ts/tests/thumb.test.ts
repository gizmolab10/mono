import { SHORTEST_PART, free_thumb } from '../utilities/Thumb';
import { describe, expect, it } from 'vitest';

describe('where the browser would put the thumb', () => {
	it('draws nothing when everything fits', () => {
		expect(free_thumb(400, 400, 0).shows).toBe(false);
		expect(free_thumb(400, 380, 0).shows).toBe(false);
	});

	it('draws nothing when there is no lane at all', () => {
		expect(free_thumb(0, 4000, 0).shows).toBe(false);
	});

	it('is as long as the share of the contents on screen', () => {
		expect(free_thumb(400, 1600, 0).length).toBe(100);    // a quarter fits, a quarter of the lane
	});

	it('says nothing while the two agree', () => {
		expect(free_thumb(400, 1600, 0).shows).toBe(false);   // a quarter is above the fifth
	});

	it('says so once the browser would go under the floor', () => {
		const found = free_thumb(400, 4000, 0);
		expect(found.length).toBe(40);                        // a tenth of the lane
		expect(found.shows).toBe(true);
	});

	it('follows the scrolling', () => {
		expect(free_thumb(400, 4000, 0).top).toBe(0);
		expect(free_thumb(400, 4000, 2000).top).toBe(200);    // halfway down
	});

	it('is pushed down by whatever sits above the lane', () => {
		expect(free_thumb(400, 4000, 0, 30).top).toBe(30);
		expect(free_thumb(400, 4000, 2000, 30).top).toBe(230);
	});

	it('holds the thumb to a fifth of its lane', () => {
		expect(SHORTEST_PART).toBe(5);
	});
});
