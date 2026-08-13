import { body_of, boxes_for_tasks, flipped_task, lines_between, links_in, page_of, stamp_blocks, still_reads, with_lines_replaced, without_words_above_heading } from '../utilities/Markdown_Blocks';
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
		expect(html).toMatch(/<h1 id="a-title" data-number="2" data-from="4" data-to="5" data-depth="1">/);
	});

	it('gives every link its own hover words', () => {
		expect(page_of(reader, file)).toContain('data-tip="visit link"');
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

describe('the addresses a guide links to', () => {
	it('finds one in a sentence and one in a list', () => {
		expect(links_in('see [that](./that.md) for more\n\n- [other](../other/other.md)'))
			.toEqual(['./that.md', '../other/other.md']);
	});

	it('keeps a link to a heading in the same guide', () => {
		expect(links_in('jump to [naming](#naming)')).toEqual(['#naming']);
	});

	it('leaves out anything that says outright it is on the web', () => {
		expect(links_in('[here](https://example.com) and [there](./there.md)')).toEqual(['./there.md']);
	});

	it('leaves out what a fenced chunk of code is showing', () => {
		const text = 'real [one](./one.md)\n\n```\nshown [two](./two.md)\n```\n\nreal [three](./three.md)';
		expect(links_in(text)).toEqual(['./one.md', './three.md']);
	});

	it('finds nothing in a guide with no links', () => {
		expect(links_in('# just words\n\nnothing to follow')).toEqual([]);
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

// A file's words start at its top heading. Anything above that heading and below the labels is
// left over — a stray line, a run of blanks — and goes the first time the file is opened.

describe('clearing whatever sits above the top heading', () => {
	const labels = ['---', 'kind: refer', 'title: "A"', '---'].join('\n');

	it('takes out a stray line above the heading', () => {
		const text = `${labels}\n\nleft over\n\n# A\n\nwords`;
		expect(without_words_above_heading(text)).toBe(`${labels}\n# A\n\nwords`);
	});

	it('takes out blank lines alone', () => {
		expect(without_words_above_heading(`${labels}\n\n\n# A\n`)).toBe(`${labels}\n# A\n`);
	});

	it('leaves a file whose heading already follows its labels', () => {
		const text = `${labels}\n# A\n\nwords`;
		expect(without_words_above_heading(text)).toBe(text);
	});

	it('leaves a file with no heading at all exactly as it was', () => {
		const text = `${labels}\n\nwords with no heading\n\nand more of them`;
		expect(without_words_above_heading(text)).toBe(text);
	});

	it('leaves a file with no labels, clearing only what is above its heading', () => {
		expect(without_words_above_heading('stray\n\n# A\n\nwords')).toBe('# A\n\nwords');
	});

	it('keeps everything below the heading, the heading included', () => {
		const text = `${labels}\nstray\n# A\n\n# a second one\n\nwords`;
		expect(without_words_above_heading(text)).toBe(`${labels}\n# A\n\n# a second one\n\nwords`);
	});

	it('starts at the first heading, whatever its rank', () => {
		expect(without_words_above_heading(`${labels}\n\n\n## Edge stretch\n\nwords`))
			.toBe(`${labels}\n## Edge stretch\n\nwords`);
		expect(without_words_above_heading(`${labels}\n\n### deeper still\n`)).toBe(`${labels}\n### deeper still\n`);
	});

	it('keeps every heading from the first one down', () => {
		const text = `${labels}\n\n## not the top\n\n# A`;
		expect(without_words_above_heading(text)).toBe(`${labels}\n## not the top\n\n# A`);
	});

	it('finds a heading held off the left edge, and takes those spaces too', () => {
		expect(without_words_above_heading(`${labels}\n\n # A\n\nwords`)).toBe(`${labels}\n# A\n\nwords`);
		expect(without_words_above_heading(`${labels}\n   # A\n`)).toBe(`${labels}\n# A\n`);
	});

	it('leaves a line stepped in four or more, which is no heading at all', () => {
		const text = `${labels}\n\n    # A\n`;
		expect(without_words_above_heading(text)).toBe(text);
	});

	it('says a heading already hard against the labels needs nothing done', () => {
		const text = `${labels}\n# A\n\nwords`;
		expect(without_words_above_heading(text)).toBe(text);
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

	it('stamps a list whole, and each of its items with its own one line', () => {
		expect(stamps('- one\n- two\n- three')).toEqual([[0, 3], [0, 1], [1, 2], [2, 3]]);
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

	// Beside the two numbers that put words back sits a third, the one shown in the left margin.
	// It counts the rows shown, from one, with the labels at the top left out — so the first row
	// on screen always reads 1 however many label lines sit above it.
	it('counts the rows shown from one, whatever the labels took', () => {
		expect([...stamp_blocks(reader, 'hello\n\nthere', 4).matchAll(/data-number="(\d+)"/g)].map((hit) => hit[1]))
			.toEqual(['1', '3']);
		expect([...stamp_blocks(reader, 'hello\n\nthere', 0).matchAll(/data-number="(\d+)"/g)].map((hit) => hit[1]))
			.toEqual(['1', '3']);
	});


	it('moves all four out of a fenced chunk of code, onto the box around it', () => {
		const html = stamp_blocks(reader, '```\nsome code\n```', 0);
		expect(html).toContain('<pre data-number="1" data-from="0" data-to="3" data-depth="2">');
		expect(html).not.toContain('<code data-');
	});
});

// A rule is a shape the browser fills in itself and will not hang a number on, so it is drawn
// as an ordinary row carrying the very same numbers.

describe('a line of three dashes', () => {
	it('is drawn as an ordinary row, keeping every number it was stamped with', () => {
		const html = page_of(reader, 'words\n\n---\n\nmore');
		expect(html).not.toContain('<hr');
		expect(html).toContain('<div class="rule" data-number="3" data-from="2" data-to="3" data-depth="2"></div>');
	});
});

// How deep each piece sits: a heading's own number, and one deeper than that for everything
// under it. Before the first heading, a piece counts as sitting under the title.

describe('how deep each piece sits', () => {
	const depths = (markdown: string) =>
		[...stamp_blocks(reader, markdown, 0).matchAll(/data-depth="(\d+)"/g)].map((hit) => Number(hit[1]));

	it('gives a heading its own number', () => {
		expect(depths('# one\n\n## two\n\n### three\n\n###### six')).toEqual([1, 2, 3, 6]);
	});

	it('puts a paragraph one deeper than the heading above it', () => {
		expect(depths('## two\n\nwords\n\n### three\n\nmore')).toEqual([2, 3, 3, 4]);
	});

	it('counts a piece before any heading as sitting under the title', () => {
		expect(depths('words\n\n## two')).toEqual([2, 2]);
	});
});

// A list item beginning with a pair of brackets is a thing to be done. The brackets are drawn
// as a box, filled when the letter x sits between them, and pressing the box writes the other
// letter back into the file — so every item carries the one line it came from.

describe('a list item that is a thing to be done', () => {
	it('draws an empty pair of brackets as an empty box', () => {
		const drawn = boxes_for_tasks('<ul>\n<li>[ ] one</li>\n</ul>');
		expect(drawn).toContain('<li class="task"><span class="task-box">');
		expect(drawn).toContain("<path class='square' d=");
		expect(drawn).toContain("<path class='check' d=");
		expect(drawn.endsWith('</span> one</li>\n</ul>')).toBe(true);
	});

	it('draws a pair holding an x as a filled box, whichever letter it is', () => {
		expect(boxes_for_tasks('<li>[x] one</li>')).toContain('task-box done');
		expect(boxes_for_tasks('<li>[X] one</li>')).toContain('task-box done');
	});

	it('names a finished item itself, so its words can be struck through', () => {
		expect(boxes_for_tasks('<li>[x] one</li>')).toContain('<li class="task done">');
		expect(boxes_for_tasks('<li>[ ] one</li>')).toContain('<li class="task">');
	});

	it('reaches inside a list whose items are wrapped in paragraphs', () => {
		expect(boxes_for_tasks('<li>\n<p>[ ] one</p>\n</li>'))
			.toContain('<li class="task">\n<p><span class="task-box">');
	});

	it('leaves the line an item was stamped with alone', () => {
		expect(boxes_for_tasks('<li data-line="3">[ ] one</li>')).toContain('data-line="3"');
	});

	it('leaves an ordinary item, and brackets standing anywhere else, alone', () => {
		expect(boxes_for_tasks('<li>one</li>')).toBe('<li>one</li>');
		expect(boxes_for_tasks('<li>one [ ] two</li>')).toBe('<li>one [ ] two</li>');
		expect(boxes_for_tasks('<p>[ ] one</p>')).toBe('<p>[ ] one</p>');
	});

	it('reaches the whole drawn guide', () => {
		expect(page_of(reader, '- [ ] one\n- [x] two')).toContain('class="task-box"');
	});

	it('gives every item the one line it begins on, so a press opens that line alone', () => {
		const html = stamp_blocks(reader, '- one\n- two', 0);
		expect(html).toContain('data-from="0" data-to="1"');
		expect(html).toContain('data-from="1" data-to="2"');
	});

	it('counts an item\'s line against the whole file, labels included', () => {
		expect(stamp_blocks(reader, '- one', 4)).toContain('data-from="4" data-to="5"');
	});

	it('tells every item which line of the file it came from', () => {
		const html = page_of(reader, '# title\n\n- [ ] one\n- [x] two');
		expect([...html.matchAll(/data-line="(\d+)"/g)].map((hit) => hit[1])).toEqual(['2', '3']);
	});

	it('counts that line from the file, not from the words, when labels were taken off', () => {
		const html = page_of(reader, '---\nkind: refer\n---\n- [ ] one');
		expect(html).toContain('data-line="3"');
	});
});

// Pressing a box writes the other letter back into the file. Only the one line changes, and
// only the brackets on it — everything else on that line stands.

describe('flipping a thing to be done', () => {
	it('fills an empty pair of brackets', () => {
		expect(flipped_task('- [ ] port Hits.ts')).toBe('- [x] port Hits.ts');
	});

	it('empties a full pair, whichever letter it holds', () => {
		expect(flipped_task('- [x] port Hits.ts')).toBe('- [ ] port Hits.ts');
		expect(flipped_task('- [X] port Hits.ts')).toBe('- [ ] port Hits.ts');
	});

	it('keeps the step in, and the bullet, exactly as they were', () => {
		expect(flipped_task('\t\t* [ ] one')).toBe('\t\t* [x] one');
		expect(flipped_task('  3. [ ] one')).toBe('  3. [x] one');
	});

	it('answers with nothing for a line that is not a thing to be done', () => {
		expect(flipped_task('- ordinary')).toBe(null);
		expect(flipped_task('[ ] no bullet')).toBe(null);
		expect(flipped_task('')).toBe(null);
	});
});
