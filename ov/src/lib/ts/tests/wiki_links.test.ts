import { describe, expect, it } from 'vitest';
import { plain_links } from '../utilities/Markdown_Blocks';

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
