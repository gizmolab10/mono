import { describe, expect, it } from 'vitest';
import { body_of, links_in, plain_links } from '../utilities/Links';

// Obsidian's own way of naming another guide is two square brackets round its name. The reader
// knows only the ordinary form, so each one is turned into that before the words are drawn —
// then the finding, the mending and the dead-link check all go on knowing one shape.

describe('turning double brackets into ordinary links', () => {
	it('names the guide and points at its file', () => {
		expect(plain_links('read [[composition]] first')).toBe('read [composition](composition.md) first');
	});

	it('keeps a name with spaces whole', () => {
		expect(plain_links('see [[adding a guide]]')).toBe('see [adding a guide](adding%20a%20guide.md)');
	});

	it('carries a named heading through', () => {
		expect(plain_links('[[composition#separator]]')).toBe('[composition](composition.md#separator)');
	});

	it('shows the words given after a bar, and points at the name before it', () => {
		expect(plain_links('[[composition|how it fits together]]'))
			.toBe('[how it fits together](composition.md)');
	});

	it('turns every one on a line', () => {
		expect(plain_links('[[one]] and [[two]]')).toBe('[one](one.md) and [two](two.md)');
	});

	it('leaves ordinary links exactly as they are', () => {
		const already = 'see [composition](composition.md) and [up](../up.md)';
		expect(plain_links(already)).toBe(already);
	});

	it('leaves a chunk of code alone, so a guide can show the form itself', () => {
		const text = 'before\n\n```\n[[composition]]\n```\n\nafter [[real]]';
		expect(plain_links(text)).toBe('before\n\n```\n[[composition]]\n```\n\nafter [real](real.md)');
	});

	it('leaves words between single backticks alone', () => {
		expect(plain_links('write `[[name]]` like this')).toBe('write `[[name]]` like this');
	});

	it('leaves an empty pair alone — there is no name to point at', () => {
		expect(plain_links('[[]]')).toBe('[[]]');
	});

	it('changes nothing in a guide that has none', () => {
		const text = '# a title\n\nJust words, and a [link](x.md).';
		expect(plain_links(text)).toBe(text);
	});

	// Each piece of a drawn guide is stamped with the lines it came from, and this runs before
	// that stamping. Any change to how many lines there are would put every stamp out by that
	// much, and an edit would then write over the wrong lines.
	it('never changes how many lines there are', () => {
		const text = '# a title\n\n[[one]] and [[two]]\n\n```\n[[in code]]\n```\n\n- [[a|b]]\n';
		expect(plain_links(text).split('\n').length).toBe(text.split('\n').length);
	});
});

// The other two readers. Their cases came from markdown_blocks.test at step 11 of the plan, when
// the drawing went to ai and the readers stayed kb's.

// A link is two things: where it points, and what it reads as. Both are wanted, because only the
// words are ever drawn on the page — so a search through those words can never find an address.

describe('the links a guide holds', () => {
	const addresses = (text: string) => links_in(text).map((one) => one.address);

	it('finds one in a sentence and one in a list', () => {
		expect(addresses('see [that](./that.md) for more\n\n- [other](../other/other.md)'))
			.toEqual(['./that.md', '../other/other.md']);
	});

	it('keeps a link to a heading in the same guide', () => {
		expect(addresses('jump to [naming](#naming)')).toEqual(['#naming']);
	});

	it('leaves out anything that says outright it is on the web', () => {
		expect(addresses('[here](https://example.com) and [there](./there.md)')).toEqual(['./there.md']);
	});

	it('leaves out what a fenced chunk of code is showing', () => {
		const text = 'real [one](./one.md)\n\n```\nshown [two](./two.md)\n```\n\nreal [three](./three.md)';
		expect(addresses(text)).toEqual(['./one.md', './three.md']);
	});

	it('finds nothing in a guide with no links', () => {
		expect(links_in('# just words\n\nnothing to follow')).toEqual([]);
	});

	it('hands back the words each link reads as, beside where it points', () => {
		expect(links_in('see [thin proxy proposal](../work/proposals/thin%20proxy%20proposal.md).'))
			.toEqual([{ address: '../work/proposals/thin%20proxy%20proposal.md', words: 'thin proxy proposal' }]);
	});

	it('hands back nothing for words where a link has none', () => {
		expect(links_in('[](./bare.md)')).toEqual([{ address: './bare.md', words: '' }]);
	});

	it('sees Obsidian\'s own form once it is turned into the ordinary one, the way the drawing does', () => {
		const text = 'see [[thin proxy proposal]] for how.';
		expect(links_in(text)).toEqual([]);
		expect(links_in(plain_links(text)))
			.toEqual([{ address: 'thin%20proxy%20proposal.md', words: 'thin proxy proposal' }]);
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
