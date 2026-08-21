import { KIND_UNTIL_TOLD, NEEDS_A_LOOK, TAG_WHEN_NEW, blank_file, free_name, has_labels, kind_from_where, label_block, labels_for, labels_from, moment_written_out, with_labels_added, with_labels_replaced } from '../utilities/Labels';
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

	it('marks every one as the one being worked on and for a person to look at, and starts at one kind', () => {
		const { labels, tags } = labels_for('# a title\n\nwords.', 'x.md', TODAY);
		expect(tags).toEqual([TAG_WHEN_NEW, NEEDS_A_LOOK]);
		expect(labels.kind).toBe(KIND_UNTIL_TOLD);
		expect(labels.date).toBe(TODAY);
	});
});

describe('what the folders above a file say it is', () => {
	it('says nothing, whatever the folder is called', () => {
		// A designs folder used to make its files designs. That kind is gone, so every one of
		// these falls back and the stale mark asks for a real answer.
		expect(kind_from_where('designs/roadmap.md')).toBe(KIND_UNTIL_TOLD);
		expect(kind_from_where('design/constants.md')).toBe(KIND_UNTIL_TOLD);
		expect(kind_from_where('project/design/notes.md')).toBe(KIND_UNTIL_TOLD);
		expect(kind_from_where('develop/add a file.md')).toBe(KIND_UNTIL_TOLD);
		expect(kind_from_where('work/handoff.md')).toBe(KIND_UNTIL_TOLD);
	});

	it('reaches the composed labels', () => {
		expect(labels_for('# a title\n\nwords.', 'x.md', TODAY, 'design/x.md').labels.kind).toBe(KIND_UNTIL_TOLD);
	});
});

describe('putting a composed block at the top of a file', () => {
	it('leaves the file\'s own words exactly as they are', () => {
		const text = '# a title\n\nWords.\n';
		const done = with_labels_added(text, 'x.md', TODAY);
		expect(done.endsWith(text)).toBe(true);
		expect(done.startsWith(`---\nkind: ${KIND_UNTIL_TOLD}\n`)).toBe(true);
		expect(done).toContain(`tags: [${TAG_WHEN_NEW}, ${NEEDS_A_LOOK}]`);
	});

	it('hands back a file that already has labels, untouched', () => {
		const text = '---\nkind: rule\ntitle: "A"\n---\n\n# a title';
		expect(with_labels_added(text, 'x.md', TODAY)).toBe(text);
	});
});

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

// A guide made from nothing: labeled before it holds a word, so it never shows as unlabeled
// and never needs a person to go and label it.

describe('a brand new guide', () => {
	it('opens with a full block and its own heading', () => {
		const made = blank_file('unnamed', TODAY, T_Kind.analyze, ['now']);
		expect(made.startsWith('---\n')).toBe(true);
		expect(made).toContain(`kind: ${T_Kind.analyze}`);
		expect(made).toContain('tags: [now]');
		expect(made).toContain(`date: ${TODAY}`);
		expect(made.endsWith('---\n# unnamed\n')).toBe(true);   // no blank line between them
	});

	it('wears whatever kind and tags it is given', () => {
		const made = blank_file('unnamed', TODAY, T_Kind.howto, ['prose', 'team']);
		expect(made).toContain(`kind: ${T_Kind.howto}`);
		expect(made).toContain('tags: [prose, team]');
	});

	it('is read back as labeled, with the name as its title', () => {
		const made = blank_file('a second try', TODAY, T_Kind.analyze, ['now']);
		expect(has_labels(made)).toBe(true);
		expect(made).toContain('title: "a second try"');
	});

	it('marks a quote mark in the name as standing for itself', () => {
		expect(blank_file('the "one"', TODAY, T_Kind.analyze, ['now'])).toContain('title: "the \\"one\\""');
	});
});

// A name nobody else in the folder is using. The first is plain; after that a number.

describe('finding a free name', () => {
	it('takes the plain name when the folder has none', () => {
		expect(free_name('unnamed', [])).toBe('unnamed');
		expect(free_name('unnamed', ['index', 'murk'])).toBe('unnamed');
	});

	it('counts up until nothing answers to it', () => {
		expect(free_name('unnamed', ['unnamed'])).toBe('unnamed 2');
		expect(free_name('unnamed', ['unnamed', 'unnamed 2'])).toBe('unnamed 3');
		expect(free_name('unnamed', ['unnamed', 'unnamed 3'])).toBe('unnamed 2');
	});

	it('ignores how a name is capitalized, the way a filesystem does', () => {
		expect(free_name('unnamed', ['Unnamed'])).toBe('unnamed 2');
	});
});

// A report is kept across a reload, so it says when it was made. Written the way it is read aloud,
// never the way a file writes its date.

describe('a moment written out for reading', () => {
	it('names the day, the month, the year and the clock', () => {
		expect(moment_written_out(new Date(2026, 7, 14, 13, 56))).toBe('14 August, 2026 at 1:56 PM');
	});

	it('counts the clock in twelves, saying which half of the day', () => {
		expect(moment_written_out(new Date(2026, 0, 1, 9, 5))).toBe('1 January, 2026 at 9:05 AM');
		expect(moment_written_out(new Date(2026, 11, 31, 23, 59))).toBe('31 December, 2026 at 11:59 PM');
	});

	it('says midnight and midday as twelve, never as nothing', () => {
		expect(moment_written_out(new Date(2026, 5, 2, 0, 0))).toBe('2 June, 2026 at 12:00 AM');
		expect(moment_written_out(new Date(2026, 5, 2, 12, 0))).toBe('2 June, 2026 at 12:00 PM');
	});
});

// The tags a file names, in either of the two shapes one can be written in. This app writes them
// all on one line; Obsidian writes them one to a line, and rewrites a file into that shape the
// moment its tags are touched there.

describe('reading the tags off a file', () => {
	it('reads them from one line, in brackets', () => {
		const text = ['---', 'kind: specify', 'tags: [journal, now, proposal]', '---', '# A'].join('\n');
		expect(labels_from(text, 'a').tags).toEqual(['journal', 'now', 'proposal']);
	});

	it('reads them one to a line, under a bare label', () => {
		const text = ['---', 'kind: specify', 'tags:', '  - journal', '  - now', '  - proposal', '---', '# A'].join('\n');
		expect(labels_from(text, 'a').tags).toEqual(['journal', 'now', 'proposal']);
	});

	it('stops at the next label rather than reading on', () => {
		const text = ['---', 'tags:', '  - now', 'date: 2026-08-17', '---', '# A'].join('\n');
		const read = labels_from(text, 'a');
		expect(read.tags).toEqual(['now']);
		expect(read.labels.date).toBe('2026-08-17');
	});

	it('drops a name that is not on the closed list, keeping the rest', () => {
		const text = ['---', 'tags:', '  - now', '  - invented', '  - proposal', '---', '# A'].join('\n');
		expect(labels_from(text, 'a').tags).toEqual(['now', 'proposal']);
	});

	it('gives a file no tags where it names none', () => {
		const text = ['---', 'kind: specify', 'tags:', '---', '# A'].join('\n');
		expect(labels_from(text, 'a').tags).toEqual([]);
	});
});
