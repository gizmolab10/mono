import { address_of_file, file_path_of, folder_path_of, moved_into, obsidian_link, path_of_address, site_of_file, renamed_path } from '../utilities/Saving';
import { describe, expect, it } from 'vitest';
import { T_Bundle } from '../types/File';

describe('reading a place in the repo back into a collection and a path', () => {
	it('reads a shared guide', () => {
		expect(site_of_file('notes/guides/pre-flight/always.md'))
			.toEqual({ bundle: T_Bundle.mono, path: 'pre-flight/always.md', is_design: false });
	});

	it('reads a project\'s guide', () => {
		expect(site_of_file('di/notes/guides/core/units.md'))
			.toEqual({ bundle: T_Bundle.di, path: 'core/units.md', is_design: false });
	});

	it('keeps the designs folder in the path, so it can never collide with a guide', () => {
		expect(site_of_file('ws/notes/designs/styles.md'))
			.toEqual({ bundle: T_Bundle.ws, path: 'designs/styles.md', is_design: true });
	});

	it('keeps the work folder in the path, the same as designs', () => {
		expect(site_of_file('ov/notes/work/handoff.md'))
			.toEqual({ bundle: T_Bundle.ov, path: 'work/handoff.md', is_design: false });
		expect(site_of_file('notes/work/learn.md'))
			.toEqual({ bundle: T_Bundle.mono, path: 'work/learn.md', is_design: false });
	});

	it('reads a work note sitting deeper than the top of the work folder as nothing', () => {
		expect(site_of_file('di/notes/work/now/learn.md')).toBe(null);
		expect(site_of_file('ji/notes/work/proposals/ov.md')).toBe(null);
	});

	it('is the other way round from working out where a guide sits', () => {
		for (const [bundle, path] of [
			[T_Bundle.mono, 'pre-flight/always.md'],
			[T_Bundle.ji, 'roadmap.md'],
			[T_Bundle.ov, 'designs/a plan.md'],
			[T_Bundle.ov, 'work/handoff.md'],
		] as Array<[T_Bundle, string]>) {
			expect(site_of_file(file_path_of(bundle, path))).toEqual({ bundle, path, is_design: path.startsWith('designs/') });
		}
	});

	it('reads anything that is not a guide as nothing', () => {
		expect(site_of_file('ov/src/lib/main.css')).toBe(null);
		expect(site_of_file('notes/guides/a folder')).toBe(null);
		expect(site_of_file('')).toBe(null);
	});
});

// Where a guide sits, counting from the top of the repo. This is the one thing the write
// server is told, so it has to be exactly right — a wrong answer here writes to the wrong
// file, or to none at all.

describe('working out where a guide sits', () => {
	it('puts a shared guide straight under the shared guides folder', () => {
		expect(file_path_of(T_Bundle.mono, 'pre-flight/always.md')).toBe('notes/guides/pre-flight/always.md');
	});

	it('puts a project guide under that project', () => {
		expect(file_path_of(T_Bundle.di, 'architecture/core/units.md')).toBe('di/notes/guides/architecture/core/units.md');
		expect(file_path_of(T_Bundle.ov, 'map.md')).toBe('ov/notes/guides/map.md');
	});

	it('handles a guide sitting at the top of its collection', () => {
		expect(file_path_of(T_Bundle.ws, 'roadmap.md')).toBe('ws/notes/guides/roadmap.md');
	});

	it('adds the ending when the path has none', () => {
		expect(file_path_of(T_Bundle.ji, 'roadmap')).toBe('ji/notes/guides/roadmap.md');
	});

	it('puts a design in the designs folder, not under guides', () => {
		expect(file_path_of(T_Bundle.ws, 'designs/styles.md')).toBe('ws/notes/designs/styles.md');
		expect(file_path_of(T_Bundle.mono, 'designs/a plan.md')).toBe('notes/designs/a plan.md');
	});

	it('puts a work note in the work folder, not under guides', () => {
		expect(file_path_of(T_Bundle.ov, 'work/handoff.md')).toBe('ov/notes/work/handoff.md');
		expect(file_path_of(T_Bundle.mono, 'work/learn.md')).toBe('notes/work/learn.md');
	});
});

describe('working out where a folder sits', () => {
	it('answers with a collection\'s own guides folder when the folder has no place inside it', () => {
		expect(folder_path_of(T_Bundle.mono, '')).toBe('notes/guides');
		expect(folder_path_of(T_Bundle.di, '')).toBe('di/notes/guides');
	});

	it('adds the folder\'s place inside its collection', () => {
		expect(folder_path_of(T_Bundle.di, 'architecture/core')).toBe('di/notes/guides/architecture/core');
		expect(folder_path_of(T_Bundle.mono, 'pre-flight')).toBe('notes/guides/pre-flight');
	});

	it('puts the designs folder beside guides rather than inside it', () => {
		expect(folder_path_of(T_Bundle.ws, 'designs')).toBe('ws/notes/designs');
		expect(folder_path_of(T_Bundle.ji, 'designs/older')).toBe('ji/notes/designs/older');
	});

	it('puts the work folder beside guides too', () => {
		expect(folder_path_of(T_Bundle.ov, 'work')).toBe('ov/notes/work');
		expect(folder_path_of(T_Bundle.mono, 'work')).toBe('notes/work');
	});
});

describe('where a guide lands when dropped into a folder', () => {
	it('puts it under that folder', () => {
		expect(moved_into('architecture/core', 'units.md')).toBe('architecture/core/units.md');
	});

	it('puts it at the top of a collection when the folder has no place of its own', () => {
		expect(moved_into('', 'roadmap.md')).toBe('roadmap.md');
	});

	it('keeps a name with spaces whole', () => {
		expect(moved_into('pre-flight', 'adding a guide.md')).toBe('pre-flight/adding a guide.md');
	});
});

// A rename gives a file a different name and leaves it exactly where it sits. Building the new
// place out of the folder it hangs under sends a work note into the guides folder, since a work
// note hangs straight off its project — so the new place is built out of its own old place.

describe('where a file sits after it is given a different name', () => {
	it('keeps a guide in its folder', () => {
		expect(renamed_path('architecture/core/units.md', 'measures')).toBe('architecture/core/measures.md');
	});

	it('keeps a file at the top of its collection', () => {
		expect(renamed_path('roadmap.md', 'plans')).toBe('plans.md');
	});

	it('keeps a work note in the work folder', () => {
		expect(renamed_path('work/handoff.md', 'where I am')).toBe('work/where I am.md');
	});

	it('keeps a design in the designs folder', () => {
		expect(renamed_path('designs/styles.md', 'colors')).toBe('designs/colors.md');
	});
});

// A file name is free to hold a question mark, a hash or a percent sign, and each of those
// means something else in an address. Written raw, "worth it?.md" is asked for as "worth it",
// and the server hands back the app's own page instead of the file.

describe('the address a file\'s words are read from', () => {
	it('leaves an ordinary name alone but for its spaces', () => {
		expect(address_of_file('/Users/x/mono/notes/guides/always.md')).toBe('/@fs/Users/x/mono/notes/guides/always.md');
		expect(address_of_file('/x/adding a guide.md')).toBe('/@fs/x/adding%20a%20guide.md');
	});

	it('spells out the characters an address would read as punctuation', () => {
		expect(address_of_file('/x/worth it?.md')).toBe('/@fs/x/worth%20it%3F.md');
		expect(address_of_file('/x/why #2.md')).toBe('/@fs/x/why%20%232.md');
		expect(address_of_file('/x/100% done.md')).toBe('/@fs/x/100%25%20done.md');
	});

	it('leaves the slashes between folders doing their own job', () => {
		expect(address_of_file('/a b/c d/e.md')).toBe('/@fs/a%20b/c%20d/e.md');
		expect(address_of_file('/a/b/c.md')).not.toContain('%2F');
	});

	it('reads back as the very place it was built from', () => {
		for (const full of ['/x/always.md', '/x/worth it?.md', '/x/why #2.md', '/x/100% done.md', '/a b/c d/e.md']) {
			expect(path_of_address(address_of_file(full))).toBe(full);
		}
	});
});

// Typing in the search field works the whole list out again, which hands the viewer a fresh
// record of the very same file on every letter. The place that record names is the same text as
// before, so the words on screen are left alone; reading and drawing them again is what blinked.

describe('the place a file sits, from one record of it to the next', () => {
	it('reads as the very same text, so a fresh record of one file says nothing new', () => {
		expect(file_path_of(T_Bundle.ov, 'notes/guides/always.md'))
			.toBe(file_path_of(T_Bundle.ov, 'notes/guides/always.md'));
	});
});

describe('handing a file to obsidian', () => {
	it('names the vault and the file inside it', () => {
		expect(obsidian_link('mono', 'notes/guides/pre-flight/always.md'))
			.toBe('obsidian://open?vault=mono&file=notes%2Fguides%2Fpre-flight%2Falways.md');
	});

	it('spells out a space in a name', () => {
		expect(obsidian_link('mono', 'ov/notes/guides/adding a guide.md'))
			.toContain('adding%20a%20guide.md');
	});

	it('spells out a vault name with a space in it', () => {
		expect(obsidian_link('my vault', 'a.md')).toContain('vault=my%20vault');
	});
});
