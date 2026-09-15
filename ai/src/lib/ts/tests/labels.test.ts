import { NEEDS_A_LOOK, kind_from_where, labels_for } from '../utilities/Labels';
import { customizations } from '../common/Customizations';
import { describe, expect, it } from 'vitest';

// Composing labels, ai's since step 12 of the plan. An unlabeled file, one the db holds no row
// for, is given labels composed from its own words the first time it is opened, and marked for
// a person to look at. The cases came from kb's labels test with the code.

const TODAY = '2026-08-06';

describe('the kind and the tag ai gives a new or unlabeled file', () => {
	it('are analyze and now, and stale goes on beside now when the labels were composed', () => {
		expect(customizations.kind_when_new).toBe('analyze');
		expect(customizations.tag_when_new).toBe('now');
		expect(NEEDS_A_LOOK).toBe('stale');
	});
});

describe('labeling a file that has none', () => {
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
		expect(tags).toEqual([customizations.tag_when_new, NEEDS_A_LOOK]);
		expect(labels.kind).toBe(customizations.kind_when_new);
		expect(labels.date).toBe(TODAY);
	});
});

describe('what the folders above a file say it is', () => {
	it('says nothing, whatever the folder is called', () => {
		// A designs folder used to make its files designs. That kind is gone, so every one of
		// these falls back and the stale mark asks for a real answer.
		expect(kind_from_where('designs/roadmap.md')).toBe(customizations.kind_when_new);
		expect(kind_from_where('design/constants.md')).toBe(customizations.kind_when_new);
		expect(kind_from_where('project/design/notes.md')).toBe(customizations.kind_when_new);
		expect(kind_from_where('develop/add a file.md')).toBe(customizations.kind_when_new);
		expect(kind_from_where('work/handoff.md')).toBe(customizations.kind_when_new);
	});

	it('reaches the composed labels', () => {
		expect(labels_for('# a title\n\nwords.', 'x.md', TODAY, 'design/x.md').labels.kind).toBe(customizations.kind_when_new);
	});
});
