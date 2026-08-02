import { body_of, lines_between, page_of, stamp_blocks, still_reads, with_lines_replaced } from '../utilities/Blocks';
import { describe, expect, it } from 'vitest';
import MarkdownIt from 'markdown-it';

// What a stamped block must be able to say: which lines of the file it came from.
// The whole of editing rests on these numbers, so they are checked on their own,
// with no app and no screen involved.

const reader = new MarkdownIt({ html: false, linkify: true, typographer: true });
reader.linkify.set({ fuzzyLink: false });

// The lines every stamped block claims, in the order they were drawn.
function stamps(markdown: string, skipped = 0): Array<[number, number]> {
	const html = stamp_blocks(reader, markdown, skipped);
	const found: Array<[number, number]> = [];
	for (const hit of html.matchAll(/data-from="(\d+)" data-to="(\d+)"/g)) {
		found.push([Number(hit[1]), Number(hit[2])]);
	}
	return found;
}

// The lines every stamped piece of a whole drawn guide claims, in the order drawn.
function page_stamps(text: string): Array<[number, number]> {
	const html = page_of(reader, text);
	const found: Array<[number, number]> = [];
	for (const hit of html.matchAll(/data-from="(\d+)" data-to="(\d+)"/g)) {
		found.push([Number(hit[1]), Number(hit[2])]);
	}
	return found;
}

describe('drawing a whole guide', () => {
	const file = ['---', 'kind: rule', '---', '', '# a title', '', 'one', '', 'see [there](there.md)'].join('\n');

	it('counts its lines against the whole file, labels included', () => {
		expect(page_stamps(file)).toEqual([[4, 5], [6, 7], [8, 9]]);
	});

	it('names each heading after its own words, and stamps it too', () => {
		const html = page_of(reader, file);
		expect(html).toContain('id="a-title"');
		expect(html).toMatch(/<h1 id="a-title" data-from="4" data-to="5">/);
	});

	it('gives every link its own hover words', () => {
		expect(page_of(reader, file)).toContain('data-tip="follow this link"');
	});

	it('agrees with the file after a change that adds lines', () => {
		const changed = with_lines_replaced(file, 6, 7, 'one\ntwo\nthree');
		// The paragraph now runs three lines, so everything below it moves down by two.
		expect(page_stamps(changed)).toEqual([[4, 5], [6, 9], [10, 11]]);
		expect(page_of(reader, changed)).toContain('three');
	});

	it('agrees with the file after a change that removes lines', () => {
		const changed = with_lines_replaced(file, 4, 7, '# a title');
		expect(page_stamps(changed)).toEqual([[4, 5], [6, 7]]);
	});

	it('draws nothing at all for an empty guide', () => {
		expect(page_of(reader, '')).toBe('');
	});
});

describe('taking the labels off', () => {
	it('leaves the words and says how many lines went', () => {
		const text = ['---', 'kind: rule', 'title: "A"', '---', '', 'hello'].join('\n');
		const { body, skipped } = body_of(text);
		expect(body).toBe('\nhello');
		expect(skipped).toBe(4);
	});

	it('leaves a file with no labels exactly as it was', () => {
		const text = 'hello\n\nthere';
		const { body, skipped } = body_of(text);
		expect(body).toBe(text);
		expect(skipped).toBe(0);
	});

	it('leaves a file whose labels never close alone', () => {
		const text = '---\nkind: rule\nhello';
		const { body, skipped } = body_of(text);
		expect(body).toBe(text);
		expect(skipped).toBe(0);
	});
});

describe('taking one block\'s own words back out of the file', () => {
	const file = ['---', 'kind: rule', '---', '', '# a title', '', 'one', 'two', '', '- a', '- b'].join('\n');

	it('gives back a single line', () => {
		expect(lines_between(file, 4, 5)).toBe('# a title');
	});

	it('gives back a run of lines, joined as they sit in the file', () => {
		expect(lines_between(file, 6, 8)).toBe('one\ntwo');
	});

	it('gives back a list whole', () => {
		expect(lines_between(file, 9, 11)).toBe('- a\n- b');
	});

	it('gives back the very first line', () => {
		expect(lines_between(file, 0, 1)).toBe('---');
	});

	it('gives back nothing when the run is empty or backwards', () => {
		expect(lines_between(file, 4, 4)).toBe('');
		expect(lines_between(file, 6, 2)).toBe('');
	});

	it('gives back only the lines the file has', () => {
		expect(lines_between(file, 10, 99)).toBe('- b');
		expect(lines_between(file, 99, 120)).toBe('');
	});

	it('keeps a blank line and indenting exactly as they sit', () => {
		const text = 'a\n\n    indented\n';
		expect(lines_between(text, 0, 3)).toBe('a\n\n    indented');
	});
});

describe('putting typed words back in place of a run of lines', () => {
	const file = 'one\ntwo\nthree\nfour';

	it('swaps a single line', () => {
		expect(with_lines_replaced(file, 1, 2, 'TWO')).toBe('one\nTWO\nthree\nfour');
	});

	it('swaps a run for fewer lines', () => {
		expect(with_lines_replaced(file, 1, 3, 'X')).toBe('one\nX\nfour');
	});

	it('swaps a run for more lines', () => {
		expect(with_lines_replaced(file, 1, 2, 'a\nb\nc')).toBe('one\na\nb\nc\nthree\nfour');
	});

	it('leaves an empty line behind when everything is typed away', () => {
		expect(with_lines_replaced(file, 1, 2, '')).toBe('one\n\nthree\nfour');
	});

	it('swaps the very first line', () => {
		expect(with_lines_replaced(file, 0, 1, 'ONE')).toBe('ONE\ntwo\nthree\nfour');
	});

	it('swaps the very last line', () => {
		expect(with_lines_replaced(file, 3, 4, 'FOUR')).toBe('one\ntwo\nthree\nFOUR');
	});

	it('keeps a trailing empty line at the end of the file', () => {
		expect(with_lines_replaced('one\ntwo\n', 0, 1, 'ONE')).toBe('ONE\ntwo\n');
	});

	it('keeps every other line character for character, blank lines and indenting alike', () => {
		const fussy = '# a\n\n    indented\n\n- b\n';
		expect(with_lines_replaced(fussy, 4, 5, '- B')).toBe('# a\n\n    indented\n\n- B\n');
	});

	it('leaves the file alone when the run is empty or backwards', () => {
		expect(with_lines_replaced(file, 2, 2, 'X')).toBe(file);
		expect(with_lines_replaced(file, 3, 1, 'X')).toBe(file);
	});

	it('reaches no further than the end of the file', () => {
		expect(with_lines_replaced(file, 2, 99, 'X')).toBe('one\ntwo\nX');
	});
});

describe('asking whether the file still reads as it did', () => {
	const file = 'one\ntwo\nthree';

	it('says yes when those lines are unchanged', () => {
		expect(still_reads(file, 1, 2, 'two')).toBe(true);
	});

	it('says no when those lines have changed', () => {
		expect(still_reads(file, 1, 2, 'TWO')).toBe(false);
	});

	it('says no when lines were added above, pushing everything down', () => {
		expect(still_reads('new\none\ntwo\nthree', 1, 2, 'two')).toBe(false);
	});

	it('says no when the file has grown shorter than the lines asked for', () => {
		expect(still_reads('one', 1, 2, 'two')).toBe(false);
	});
});

describe('stamping a block with its lines', () => {
	it('gives one paragraph the line it sits on', () => {
		expect(stamps('hello')).toEqual([[0, 1]]);
	});

	it('gives each of two paragraphs its own lines', () => {
		expect(stamps('one\n\ntwo')).toEqual([[0, 1], [2, 3]]);
	});

	it('covers every line of a paragraph that runs on', () => {
		expect(stamps('one\ntwo\nthree')).toEqual([[0, 3]]);
	});

	it('stamps a heading', () => {
		expect(stamps('# a heading\n\nwords')).toEqual([[0, 1], [2, 3]]);
	});

	it('covers a fenced chunk of code from its opening fence to its closing one', () => {
		expect(stamps('```\nsome code\n```')).toEqual([[0, 3]]);
	});

	it('stamps a whole list once, not its items', () => {
		expect(stamps('- one\n- two\n- three')).toEqual([[0, 3]]);
	});

	it('stamps a quote once', () => {
		expect(stamps('> quoted words')).toEqual([[0, 1]]);
	});

	it('leaves bold and links inside a paragraph unstamped', () => {
		expect(stamps('a **bold** word and a [link](there.md)')).toEqual([[0, 1]]);
	});

	it('counts from the file, not from the words, when labels were taken off', () => {
		expect(stamps('hello\n\nthere', 4)).toEqual([[4, 5], [6, 7]]);
	});

	it('says nothing about lines for an empty guide', () => {
		expect(stamps('')).toEqual([]);
	});

	it('still draws the words themselves', () => {
		expect(stamp_blocks(reader, '# title\n\nsome words', 0)).toContain('some words');
	});
});
