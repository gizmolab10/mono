import { label_block, with_labels_replaced } from '../utilities/Labels';
import { describe, expect, it } from 'vitest';
import type { Labels } from '../types/Guide';

// The five labels are the one part of a guide the app itself reads, so writing them back
// has to come out exactly as a guide's top is written by hand.

const five: Labels = {
	kind        : 'howto',
	title       : 'Adding a Guide',
	description : 'What a new guide needs.',
	date        : '2026-08-02',
	labeled     : true,
};

describe('writing the five labels', () => {
	it('writes them in their settled order, fenced above and below', () => {
		expect(label_block(five, ['notes', 'setup'])).toBe([
			'---',
			'kind: howto',
			'title: "Adding a Guide"',
			'description: "What a new guide needs."',
			'tags: [notes, setup]',
			'date: 2026-08-02',
			'---',
		].join('\n'));
	});

	it('writes an empty tag list when there are none', () => {
		expect(label_block(five, [])).toContain('tags: []');
	});

	it('keeps a quote mark inside a title from breaking the line', () => {
		expect(label_block({ ...five, title: 'The "Big" One' }, [])).toContain('title: "The \\"Big\\" One"');
	});
});

describe('putting the labels back into a file', () => {
	const file = ['---', 'kind: rule', 'title: "Old"', 'description: "Was."', 'tags: [prose]', 'date: 2026-01-01', '---', '', '# Old', '', 'words'].join('\n');

	it('swaps the block and leaves every word below it alone', () => {
		const after = with_labels_replaced(file, five, ['notes']);
		expect(after).toContain('title: "Adding a Guide"');
		expect(after.endsWith('\n\n# Old\n\nwords')).toBe(true);
		expect(after).not.toContain('title: "Old"');
	});

	it('gives a file with no labels a block at the very top', () => {
		const bare = '# Just words\n\nhere';
		const after = with_labels_replaced(bare, five, ['notes']);
		expect(after.startsWith('---\nkind: howto')).toBe(true);
		expect(after.endsWith('\n# Just words\n\nhere')).toBe(true);
	});

	it('leaves a file whose labels never close alone below the block it adds', () => {
		const odd = '---\nkind: rule\nno closing fence';
		const after = with_labels_replaced(odd, five, []);
		expect(after).toContain('no closing fence');
		expect(after.startsWith('---\nkind: howto')).toBe(true);
	});

	it('changes nothing but the block when the labels are the same', () => {
		const same = with_labels_replaced(file, { kind: 'rule', title: 'Old', description: 'Was.', date: '2026-01-01', labeled: true }, ['prose']);
		expect(same).toBe(file);
	});
});
