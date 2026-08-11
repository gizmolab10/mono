import { link_agrees, parts_of_link } from '../utilities/Following_Links';
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
