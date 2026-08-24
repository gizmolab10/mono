import { address_of_file, file_path_of, folder_path_of, moved_into, obsidian_link, path_of_address, reaches_under_work, site_of_file, renamed_path } from '../utilities/Saving';
import { describe, expect, it } from 'vitest';
import { T_Bundle } from '../types/File';

describe('reading a path in the repo back into a collection and a folder', () => {
	it('reads a shared guide', () => {
		expect(site_of_file('notes/guides/pre-flight/always.md'))
			.toEqual({ bundle: T_Bundle.mono, path: 'pre-flight/always.md', is_design: false });
	});

	it('reads the repo\'s own CLAUDE file', () => {
		expect(site_of_file('CLAUDE.MD'))
			.toEqual({ bundle: T_Bundle.mono, path: 'CLAUDE.MD', is_design: false });
	});

	it('reads a project\'s CLAUDE file, either spelling', () => {
		expect(site_of_file('lv/CLAUDE.MD'))
			.toEqual({ bundle: T_Bundle.lv, path: 'CLAUDE.MD', is_design: false });
		expect(site_of_file('ov/CLAUDE.md'))
			.toEqual({ bundle: T_Bundle.ov, path: 'CLAUDE.md', is_design: false });
	});

	it('places no CLAUDE file below a collection\'s top', () => {
		expect(site_of_file('lv/notes/CLAUDE.MD')).toBeNull();
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

	it('keeps a work note inside one of the named folders, and its folder in the path', () => {
		expect(site_of_file('di/notes/work/now/learn.md'))
			.toEqual({ bundle: T_Bundle.di, path: 'work/now/learn.md', is_design: false });
		expect(site_of_file('ji/notes/work/proposals/ov.md'))
			.toEqual({ bundle: T_Bundle.ji, path: 'work/proposals/ov.md', is_design: false });
	});

	it('reads a work note in a folder nothing links to as nothing', () => {
		expect(site_of_file('di/notes/work/mothballs/old.md')).toBe(null);
		expect(site_of_file('notes/work/jeff/a.md')).toBe(null);
	});

	it('reads a work note two folders down as nothing, whatever it sits under', () => {
		expect(site_of_file('notes/work/done/docs/README.md')).toBe(null);
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

	it('reads a memory file, whole path and all, under the shared collection', () => {
		expect(site_of_file('memory/index.md'))
			.toEqual({ bundle: T_Bundle.mono, path: 'memory/index.md', is_design: false });
		expect(site_of_file('memory/shared/truth/protocol.md'))
			.toEqual({ bundle: T_Bundle.mono, path: 'memory/shared/truth/protocol.md', is_design: false });
		expect(file_path_of(T_Bundle.mono, 'memory/shared/truth/protocol.md')).toBe('memory/shared/truth/protocol.md');
		expect(folder_path_of(T_Bundle.mono, 'memory/shared/truth')).toBe('memory/shared/truth');
	});

	it('reads anything that is not a guide as nothing', () => {
		expect(site_of_file('ov/src/lib/main.css')).toBe(null);
		expect(site_of_file('notes/guides/a folder')).toBe(null);
		expect(site_of_file('')).toBe(null);
	});
});

// A link is written relative to whoever wrote it, so it never says where it sits in the repo. The
// dead-link check follows one into a work note like any other, and passes over only what points
// somewhere under a work folder that the app lists nothing from — the same line site_of_file draws.

describe('a link reaching under a work folder', () => {
	it('lets a note at the top of a work folder through', () => {
		expect(reaches_under_work('../../work/handoff.md')).toBe(false);
		expect(reaches_under_work('work/code debt.md')).toBe(false);
		expect(reaches_under_work('../../../ov/notes/work/work journal.md')).toBe(false);
	});

	it('lets a note inside one of the named folders through', () => {
		expect(reaches_under_work('../../work/now/learn.md')).toBe(false);
		expect(reaches_under_work('../work/proposals/ov.md')).toBe(false);
		expect(reaches_under_work('work/milestones/one.md')).toBe(false);
		expect(reaches_under_work('work/next/pacing.md')).toBe(false);
		expect(reaches_under_work('work/done/january.md')).toBe(false);
	});

	it('turns away a folder nothing links to', () => {
		expect(reaches_under_work('../../work/mothballs/old.md')).toBe(true);
		expect(reaches_under_work('work/jeff/a.md')).toBe(true);
	});

	it('turns away anything two folders down, whatever it sits under', () => {
		expect(reaches_under_work('notes/work/done/docs/history/PHASE1-FINAL.md')).toBe(true);
	});

	it('lets a link naming no work folder through', () => {
		expect(reaches_under_work('pre-flight/always.md')).toBe(false);
		expect(reaches_under_work('always.md')).toBe(false);
		expect(reaches_under_work('')).toBe(false);
	});

	it('reads only a whole folder called work, never a name that merely holds the letters', () => {
		expect(reaches_under_work('../workflow/steps/one.md')).toBe(false);
		expect(reaches_under_work('homework/a/b.md')).toBe(false);
	});

	it('agrees with the line drawn by reading a path in the repo', () => {
		for (const where of ['ov/notes/work/handoff.md', 'notes/work/learn.md',
			'di/notes/work/now/learn.md', 'ji/notes/work/proposals/ov.md']) {
			expect(site_of_file(where)).not.toBe(null);
			expect(reaches_under_work(where)).toBe(false);
		}
		for (const where of ['di/notes/work/mothballs/old.md', 'notes/work/done/docs/README.md']) {
			expect(site_of_file(where)).toBe(null);
			expect(reaches_under_work(where)).toBe(true);
		}
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
	it('answers with a collection\'s own guides folder when the folder has no path inside it', () => {
		expect(folder_path_of(T_Bundle.mono, '')).toBe('notes/guides');
		expect(folder_path_of(T_Bundle.di, '')).toBe('di/notes/guides');
	});

	it('adds the folder\'s path inside its collection', () => {
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

	it('puts it at the top of a collection when the folder has no path of its own', () => {
		expect(moved_into('', 'roadmap.md')).toBe('roadmap.md');
	});

	it('keeps a name with spaces whole', () => {
		expect(moved_into('pre-flight', 'adding a guide.md')).toBe('pre-flight/adding a guide.md');
	});
});

// A rename gives a file a different name and leaves it exactly where it sits. Building the new
// path out of the folder it hangs under sends a work note into the guides folder, since a work
// note hangs straight off its project — so the new path is built out of its own old path.

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

	it('reads back as the very path it was built from', () => {
		for (const full of ['/x/always.md', '/x/worth it?.md', '/x/why #2.md', '/x/100% done.md', '/a b/c d/e.md']) {
			expect(path_of_address(address_of_file(full))).toBe(full);
		}
	});
});

// Typing in the search field works the whole list out again, which hands the viewer a fresh
// record of the very same file on every letter. The path that record names is the same text as
// before, so the words on screen are left alone; reading and drawing them again is what blinked.

describe('the path a file sits at, from one record of it to the next', () => {
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
