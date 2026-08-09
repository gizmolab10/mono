import { KIND_UNTIL_TOLD, NEEDS_A_LOOK, has_labels, kind_from_where, label_block, labels_for, with_labels_added, with_labels_replaced } from '../utilities/Labels';
import { T_Kind } from '../types/File';
import { describe, expect, it } from 'vitest';
import type { Labels } from '../types/File';

// A file added to the guides since the app last looked carries no labels at all. One is
// composed from its own words and marked for a person to look at.

const TODAY = '2026-08-06';

describe('labeling a file that has none', () => {
	it('knows a file that is already labeled from one that is not', () => {
		expect(has_labels('---\nkind: rule\n---\n\n# a title')).toBe(true);
		expect(has_labels('# a title\n\nwords')).toBe(false);
		expect(has_labels('---\nkind: rule\n')).toBe(false);       // opened but never closed
		expect(has_labels('')).toBe(false);
	});

	it('takes the title from the first heading', () => {
		const { labels } = labels_for('# design trade-offs\n\nwhat was weighed.', 'research.md', TODAY);
		expect(labels.title).toBe('design trade-offs');
	});

	it('falls back to the file\'s own name, tidied, when there is no heading', () => {
		const { labels } = labels_for('just words', 'pitch - aaron good.md', TODAY);
		expect(labels.title).toBe('Pitch   aaron good');
	});

	it('takes the description from the first thing the file says, to its first full stop', () => {
		const { labels } = labels_for('# a title\n\nWhat ji should become. Nothing here is built yet.', 'x.md', TODAY);
		expect(labels.description).toBe('What ji should become');
	});

	it('walks past headings, rules, lists, quotes and code to find that', () => {
		const text = '# a title\n\n---\n\n- a list\n\n> a quote\n\n```\ncode. not this\n```\n\nThe real words.';
		expect(labels_for(text, 'x.md', TODAY).labels.description).toBe('The real words');
	});

	it('leaves the description empty when the file says nothing plain', () => {
		expect(labels_for('# only a title', 'x.md', TODAY).labels.description).toBe('');
	});

	it('marks every one for a person to look at, and starts at one kind', () => {
		const { labels, tags } = labels_for('# a title\n\nwords.', 'x.md', TODAY);
		expect(tags).toEqual([NEEDS_A_LOOK]);
		expect(labels.kind).toBe(KIND_UNTIL_TOLD);
		expect(labels.date).toBe(TODAY);
	});
});

describe('what the folders above a file say it is', () => {
	it('calls it a design under a folder named design or designs', () => {
		expect(kind_from_where('designs/roadmap.md')).toBe(T_Kind.design);
		expect(kind_from_where('design/constants.md')).toBe(T_Kind.design);
		expect(kind_from_where('project/design/notes.md')).toBe(T_Kind.design);
	});

	it('calls it work under a folder named work', () => {
		expect(kind_from_where('work/handoff.md')).toBe(T_Kind.work);
	});

	it('falls back when no folder says anything', () => {
		expect(kind_from_where('develop/add a file.md')).toBe(KIND_UNTIL_TOLD);
		// A word that merely starts the same is not the folder it names.
		expect(kind_from_where('designers/notes.md')).toBe(KIND_UNTIL_TOLD);
	});

	it('reaches the composed labels', () => {
		expect(labels_for('# a title\n\nwords.', 'x.md', TODAY, 'design/x.md').labels.kind).toBe(T_Kind.design);
	});
});

describe('putting a composed block at the top of a file', () => {
	it('leaves the file\'s own words exactly as they are', () => {
		const text = '# a title\n\nWords.\n';
		const done = with_labels_added(text, 'x.md', TODAY);
		expect(done.endsWith(text)).toBe(true);
		expect(done.startsWith(`---\nkind: ${KIND_UNTIL_TOLD}\n`)).toBe(true);
		expect(done).toContain(`tags: [${NEEDS_A_LOOK}]`);
	});

	it('hands back a file that already has labels, untouched', () => {
		const text = '---\nkind: rule\ntitle: "A"\n---\n\n# a title';
		expect(with_labels_added(text, 'x.md', TODAY)).toBe(text);
	});
});

// The five labels are the one part of a guide the app itself reads, so writing them back
// has to come out exactly as a guide's top is written by hand.

const five: Labels = {
	kind        : 'step',
	title       : 'Adding a Guide',
	description : 'What a new guide needs.',
	date        : '2026-08-02',
	labeled     : true,
};

describe('writing the five labels', () => {
	it('writes them in their settled order, fenced above and below', () => {
		expect(label_block(five, ['notes', 'setup'])).toBe([
			'---',
			'kind: step',
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
		expect(after.startsWith('---\nkind: step')).toBe(true);
		expect(after.endsWith('\n# Just words\n\nhere')).toBe(true);
	});

	it('leaves a file whose labels never close alone below the block it adds', () => {
		const odd = '---\nkind: rule\nno closing fence';
		const after = with_labels_replaced(odd, five, []);
		expect(after).toContain('no closing fence');
		expect(after.startsWith('---\nkind: step')).toBe(true);
	});

	it('changes nothing but the block when the labels are the same', () => {
		const same = with_labels_replaced(file, { kind: 'rule', title: 'Old', description: 'Was.', date: '2026-01-01', labeled: true }, ['prose']);
		expect(same).toBe(file);
	});
});
