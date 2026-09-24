import { blank_file, free_name, label_changes, moment_written_out } from '../utilities/Labels';
import { describe, expect, it } from 'vitest';

// What kb still does with labels since step 12 of the plan, when composing labels went to ai
// with its cases, and the label block code, dead since 10 September 2026, went with its five.

describe('the writes that take a file\'s kind and tags in the db from what they were to what they are', () => {
	it('puts on what is new and takes off what is gone', () => {
		expect(label_changes('explain', ['now', 'stale'], 'explain', ['now', 'soon']))
			.toEqual({ on: [['tag', 'soon']], off: [['tag', 'stale']] });
	});

	it('swaps a kind that changed, and leaves one that stayed alone', () => {
		expect(label_changes('explain', [], 'specify', []))
			.toEqual({ on: [['kind', 'specify']], off: [['kind', 'explain']] });
		expect(label_changes('explain', ['now'], 'explain', ['now'])).toEqual({ on: [], off: [] });
	});

	it('gives a file with no kind one without taking anything off, and takes one away to none', () => {
		expect(label_changes('', [], 'analyze', ['now']))
			.toEqual({ on: [['kind', 'analyze'], ['tag', 'now']], off: [] });
		expect(label_changes('analyze', ['now'], '', []))
			.toEqual({ on: [], off: [['kind', 'analyze'], ['tag', 'now']] });
	});
});

// A guide made from nothing: labeled before it holds a word, so it never shows as unlabeled
// and never needs a person to go and label it.

describe('a brand new guide', () => {
	it('is its own heading and nothing else, its labels being the db\'s', () => {
		expect(blank_file('unnamed')).toBe('# unnamed\n');
		expect(blank_file('a second try')).not.toContain('---');
	});

	it('keeps a quote mark in the name as it is', () => {
		expect(blank_file('the "one"')).toBe('# the "one"\n');
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
