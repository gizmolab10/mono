import { all_folded, foldable_headings, hidden_pieces, own_words, section_span, top_headings } from '../common/Core';
import { describe, expect, it } from 'vitest';

// A drawn file, written as the level of each piece in order: one for the top heading, two for
// the next, and a zero for anything that is not a heading.
//
//   0  # Top
//   1  words
//   2  ## First
//   3  words
//   4  ### Inside
//   5  words
//   6  ## Second
//   7  words
const page = [1, 0, 2, 0, 3, 0, 2, 0];

describe('what a heading owns', () => {
	it('runs to the next heading of its own level', () => {
		expect(section_span(page, 2)).toEqual([3, 6]);       // the first second-level heading
	});

	it('runs to the end when nothing of its level follows', () => {
		expect(section_span(page, 6)).toEqual([7, 8]);       // the last one
	});

	it('takes the deeper headings inside it', () => {
		const [from, to] = section_span(page, 2);
		expect(page.slice(from, to)).toEqual([0, 3, 0]);     // words, a deeper heading, its words
	});

	it('stops at a heading of a higher level', () => {
		expect(section_span(page, 4)).toEqual([5, 6]);       // the third-level one stops at the next second
	});

	it('gives the top heading everything below it', () => {
		expect(section_span(page, 0)).toEqual([1, 8]);
	});

	it('gives a piece that is not a heading nothing', () => {
		expect(section_span(page, 1)).toEqual([2, 2]);
	});
});

describe('which headings carry a mark', () => {
	it('every one below the top', () => {
		expect(foldable_headings(page)).toEqual([2, 4, 6]);
	});

	it('none at all in a file with only a title', () => {
		expect(foldable_headings([1, 0, 0])).toEqual([]);
	});
});

describe('the mark on the top heading', () => {
	it('finds the top heading', () => {
		expect(top_headings(page)).toEqual([0]);
	});

	it('reads as open while any section below is open', () => {
		expect(all_folded(page, [])).toBe(false);
		expect(all_folded(page, [2, 4])).toBe(false);       // the last one is still open
	});

	it('reads as folded only when every one below is folded', () => {
		expect(all_folded(page, [2, 4, 6])).toBe(true);
	});

	it('reads as open in a file with nothing below the top', () => {
		expect(all_folded([1, 0, 0], [])).toBe(false);
	});
});

describe('a heading\'s own words', () => {
	it('stops at the very next heading, whatever its level', () => {
		expect(own_words(page, 0)).toEqual([1, 2]);        // the top heading: one paragraph
		expect(own_words(page, 2)).toEqual([3, 4]);        // stops at the deeper heading below it
	});

	it('runs to the end when no heading follows', () => {
		expect(own_words(page, 6)).toEqual([7, 8]);
	});
});

describe('what is out of sight', () => {
	it('hides exactly what one folded heading owns', () => {
		expect([...hidden_pieces(page, [6])]).toEqual([7]);
	});

	it('takes the deeper headings with it', () => {
		expect([...hidden_pieces(page, [2])].sort()).toEqual([3, 4, 5]);
	});

	it('folding an outer and an inner hides the outer run once', () => {
		expect([...hidden_pieces(page, [2, 4])].sort()).toEqual([3, 4, 5]);
	});

	it('hides nothing when nothing is folded', () => {
		expect(hidden_pieces(page, []).size).toBe(0);
	});

	it('folding the top heading hides only its own words, leaving the headings below', () => {
		expect([...hidden_pieces(page, [0])]).toEqual([1]);
	});

	it('folding everything leaves the headings below the top on screen', () => {
		const gone = hidden_pieces(page, [0, 2, 4, 6]);
		expect(gone.has(2)).toBe(false);                   // the first second-level heading stays
		expect(gone.has(6)).toBe(false);                   // and so does the last
		expect(gone.has(1)).toBe(true);                    // the top heading's own words go
	});
});
