import { centers_of, distances_between } from '../utilities';
import { describe, expect, it } from 'vitest';

/** A line's box, given where its top edge stands and how thick it is drawn. */
function line(top: number, height: number): DOMRect {
	return { top, height, bottom: top + height, left: 0, right: 0, width: 100, x: 0, y: top,
		toJSON: () => ({}) } as DOMRect;
}

describe('where a line stands', () => {
	it('is its middle, not its top edge', () => {
		expect(centers_of([line(10, 8)])).toEqual([14]);
	});

	it('is the same however thick the line is drawn', () => {
		expect(centers_of([line(10, 8)])).toEqual(centers_of([line(13, 2)]));
	});

	it('reads top to bottom, whatever order they were found in', () => {
		expect(centers_of([line(100, 2), line(10, 2), line(50, 2)])).toEqual([11, 51, 101]);
	});
});

describe('how far apart the lines stand', () => {
	it('is each middle to the next one down', () => {
		expect(distances_between([10, 30, 100])).toEqual([20, 70]);
	});

	it('is nothing at all when only one line is on screen', () => {
		expect(distances_between([10])).toEqual([]);
	});

	it('is nothing at all when no line is on screen', () => {
		expect(distances_between([])).toEqual([]);
	});
});
