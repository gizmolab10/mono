import { likeliest, link_agrees, parts_of_link, resolved_from, steps_between, words_shared } from '../utilities/Following_Links';
import { describe, expect, it } from 'vitest';

// A link is followed by taking the first guide of that name in the folders above. On its own
// that lets a link naming a work note land on a guide sharing its last word — which is how a
// link to di's own notes opened the very file it was written in.

describe('the parts a link names', () => {
	it('drops the ending', () => {
		expect(parts_of_link('always.md')).toEqual(['always']);
	});

	it('drops the dots that climb out of a folder', () => {
		expect(parts_of_link('../../../di/notes/work/lessons.md')).toEqual(['di', 'notes', 'work', 'lessons']);
	});

	it('drops a leading this-folder mark', () => {
		expect(parts_of_link('./banned words.md')).toEqual(['banned words']);
	});
});

describe('whether the guide found really answers the link', () => {
	it('takes any guide when the link names only a word', () => {
		expect(link_agrees(['lessons'], 'develop/lessons')).toBe(true);
		expect(link_agrees(['lessons'], 'somewhere/else/entirely/lessons')).toBe(true);
	});

	it('takes the guide when it sits under exactly the folders named', () => {
		expect(link_agrees(['pre-flight', 'always'], 'pre-flight/always')).toBe(true);
		expect(link_agrees(['develop', 'lessons'], 'guides/develop/lessons')).toBe(true);
	});

	it('refuses a guide sitting somewhere else', () => {
		expect(link_agrees(['di', 'notes', 'work', 'lessons'], 'develop/lessons')).toBe(false);
		expect(link_agrees(['philosophy', 'lessons'], 'develop/lessons')).toBe(false);
	});

	it('refuses when the link names more folders than the guide has', () => {
		expect(link_agrees(['a', 'b', 'c', 'lessons'], 'develop/lessons')).toBe(false);
	});

	it('ignores capitals, the way every other name in the app does', () => {
		expect(link_agrees(['Develop', 'Lessons'], 'develop/lessons')).toBe(true);
	});
});

// The question is asked of a file's whole place, counting from the top of the repo. A file's place
// inside its own collection has the project and the notes and guides folders stripped off it, so a
// link written the long way round could never agree with anything — and every one read as dead.

describe('a link written the long way round', () => {
	it('takes a file named by its whole place in the repo', () => {
		expect(link_agrees(parts_of_link('../../../notes/guides/pre-flight/always.md'),
			'notes/guides/pre-flight/always.md')).toBe(true);
		expect(link_agrees(parts_of_link('../../../di/notes/guides/pre-flight/lexicon.md'),
			'di/notes/guides/pre-flight/lexicon.md')).toBe(true);
	});

	it('takes a file named from part way along', () => {
		expect(link_agrees(parts_of_link('../guides/pre-flight/lexicon.md'),
			'ji/notes/guides/pre-flight/lexicon.md')).toBe(true);
	});

	it('takes a work note named by its whole place', () => {
		expect(link_agrees(parts_of_link('../../ov/notes/work/code%20debt.md'.replace(/%20/g, ' ')),
			'ov/notes/work/code debt.md')).toBe(true);
	});

	it('still refuses a file the link does not actually name', () => {
		expect(link_agrees(parts_of_link('collaborate/organize.md'), 'ov/notes/work/organize.md')).toBe(false);
		expect(link_agrees(parts_of_link('../work/db spec.md'), 'ji/notes/guides/project/db spec.md')).toBe(false);
	});
});

// Naming a likely file in a report is a different question from answering a press. Nothing is
// opened and nothing is written, so a good guess is the whole point — and where two guesses are
// equally good, none is offered.

// A link is written relative to the file it sits in and never says where that file stands. Read as
// the words it happens to spell, a link written inside a work folder names no work folder at all —
// which is how every one of those was called dead.

describe('where a link points, counting from the top of the repo', () => {
	it('puts the link under the folder holding the file it sits in', () => {
		expect(resolved_from('ji/notes/work/handoff.md', 'proposals/full family support.md'))
			.toBe('ji/notes/work/proposals/full family support.md');
	});

	it('climbs one folder for each pair of dots', () => {
		expect(resolved_from('ov/notes/work/murk.md', '../../../notes/guides/pre-flight/always.md'))
			.toBe('notes/guides/pre-flight/always.md');
		expect(resolved_from('ji/notes/work/handoff.md', '../guides/pre-flight/lexicon.md'))
			.toBe('ji/notes/guides/pre-flight/lexicon.md');
	});

	it('stands still for a single dot', () => {
		expect(resolved_from('ws/notes/guides/core/state.md', './ux.md')).toBe('ws/notes/guides/core/ux.md');
	});

	it('spells out an address and drops a heading', () => {
		expect(resolved_from('ov/notes/work/murk.md', '../../../notes/guides/collaborate/chat.md#L249'))
			.toBe('notes/guides/collaborate/chat.md');
		expect(resolved_from('ji/notes/work/handoff.md', 'db%20proposal.md'))
			.toBe('ji/notes/work/db proposal.md');
	});

	it('stops at the top of the repo rather than climbing past it', () => {
		expect(resolved_from('notes/work/learn.md', '../../../../elsewhere.md')).toBe('elsewhere.md');
	});
});

describe('how far apart two files stand', () => {
	it('counts the steps up and the steps down, dropping the folders they share', () => {
		expect(steps_between('ov/notes/work/murk.md', 'ov/notes/guides/pre-flight/always.md')).toBe(3);
		expect(steps_between('ov/notes/work/murk.md', 'notes/guides/pre-flight/always.md')).toBe(6);
	});

	it('is nothing at all for two files in the same folder', () => {
		expect(steps_between('ov/notes/work/murk.md', 'ov/notes/work/handoff.md')).toBe(0);
	});

	it('counts the same either way round', () => {
		expect(steps_between('a/b/one.md', 'a/b/c/d/two.md')).toBe(steps_between('a/b/c/d/two.md', 'a/b/one.md'));
	});
});

describe('how many words a link and a place share', () => {
	it('counts the words that turn up in both', () => {
		expect(words_shared(['pre-flight', 'always'], 'notes/guides/pre-flight/always.md')).toBe(2);
		expect(words_shared(['work', 'handoff'], 'ov/notes/work/handoff.md')).toBe(2);
	});

	it('counts nothing shared as nothing', () => {
		expect(words_shared(['elsewhere', 'entirely'], 'notes/guides/pre-flight/always.md')).toBe(0);
	});

	it('ignores capitals, the way every other name in the app does', () => {
		expect(words_shared(['Pre-Flight'], 'notes/guides/pre-flight/always.md')).toBe(1);
	});
});

describe('the file a dead link most likely meant', () => {
	const link = parts_of_link('pre-flight/always.md');

	it('takes the only one there is', () => {
		expect(likeliest(link, 'ov/notes/work/murk.md', ['notes/guides/pre-flight/always.md']))
			.toBe('notes/guides/pre-flight/always.md');
	});

	it('takes the one sharing the most words', () => {
		expect(likeliest(parts_of_link('collaborate/chat.md'), 'ov/notes/work/murk.md',
			['ov/notes/guides/design/chat.md', 'notes/guides/collaborate/chat.md']))
			.toBe('notes/guides/collaborate/chat.md');
	});

	it('breaks a tie on shared words by taking the closer one', () => {
		expect(likeliest(link, 'ov/notes/work/murk.md',
			['notes/guides/pre-flight/always.md', 'ov/notes/guides/pre-flight/always.md']))
			.toBe('ov/notes/guides/pre-flight/always.md');
	});

	it('offers nothing where two are equal on both counts', () => {
		expect(likeliest(parts_of_link('lexicon.md'), 'notes/work/murk.md',
			['di/notes/lexicon.md', 'ji/notes/lexicon.md'])).toBe(null);
	});

	it('offers nothing where there is nothing to offer', () => {
		expect(likeliest(link, 'ov/notes/work/murk.md', [])).toBe(null);
	});
});
