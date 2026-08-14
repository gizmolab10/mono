import { BETWEEN, ELLIPSIS, words_that_fit } from '../utilities/Fitting';
import { describe, expect, it } from 'vitest';

// How much of a run of words fits. Width is one unit a character here, so the numbers in these
// tests read as the count of characters there is space for.
const one_each = (text: string) => text.length;

describe('a run of words that fits', () => {
	it('comes back whole, with nothing added', () => {
		expect(words_that_fit(['ai', 'fix'], 100, one_each)).toBe(`ai${BETWEEN}fix`);
	});

	it('comes back whole where it fits exactly', () => {
		const whole = `ai${BETWEEN}fix`;
		expect(words_that_fit(['ai', 'fix'], whole.length, one_each)).toBe(whole);
	});

	it('is nothing at all where there are no words', () => {
		expect(words_that_fit([], 0, one_each)).toBe('');
	});
});

describe('a run of words that does not fit', () => {
	it('drops whole words from the end, and the comma before each', () => {
		const two = `ai${BETWEEN}fix${ELLIPSIS}`;
		expect(words_that_fit(['ai', 'fix', 'done'], two.length, one_each)).toBe(two);
	});

	it('drops as many as it must', () => {
		expect(words_that_fit(['ai', 'fix', 'done'], 5, one_each)).toBe(`ai${ELLIPSIS}`);
	});

	it('is the ellipsis alone where not even the first word fits', () => {
		expect(words_that_fit(['bedrock', 'fix'], 3, one_each)).toBe(ELLIPSIS);
	});

	it('is the ellipsis alone where there is no space at all', () => {
		expect(words_that_fit(['ai'], 0, one_each)).toBe(ELLIPSIS);
	});
});
