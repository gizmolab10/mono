import { address_of_file, file_path_of, folder_path_of, moved_into, obsidian_link, path_of_address, site_of_file, renamed_path } from '../utilities/Saving';
import { describe, expect, it } from 'vitest';
import { T_Bundle } from '../types/File';

// Every collection's path counts from its own folder at the top of the repo since 14 September
// 2026: memory's from memory, mono's from the repo itself, a project's from its folder. The notes
// layout is gone.

describe('reading a path in the repo back into a collection and a folder', () => {
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
		expect(site_of_file('memory/lv/notes/CLAUDE.MD')).toBeNull();
	});

	it('reads a memory file under the memory collection, prefix stripped', () => {
		expect(site_of_file('memory/index.md'))
			.toEqual({ bundle: T_Bundle.memory, path: 'index.md', is_design: false });
		expect(site_of_file('memory/shared/truth/protocol.md'))
			.toEqual({ bundle: T_Bundle.memory, path: 'shared/truth/protocol.md', is_design: false });
		expect(site_of_file('memory/ov/logs/log.md'))
			.toEqual({ bundle: T_Bundle.memory, path: 'ov/logs/log.md', is_design: false });
	});

	it('reads a file at the top of the repo as mono\'s, and one below a project\'s folder as that project\'s', () => {
		expect(site_of_file('unfinished.md'))
			.toEqual({ bundle: T_Bundle.mono, path: 'unfinished.md', is_design: false });
		expect(site_of_file('ov/notes.md'))
			.toEqual({ bundle: T_Bundle.ov, path: 'notes.md', is_design: false });
	});

	it('is the other way round from working out where a guide sits', () => {
		for (const [bundle, path] of [
			[T_Bundle.mono, 'unfinished.md'],
			[T_Bundle.ji, 'roadmap.md'],
			[T_Bundle.ov, 'CLAUDE.md'],
			[T_Bundle.memory, 'ov/logs/log.md'],
		] as Array<[T_Bundle, string]>) {
			expect(site_of_file(file_path_of(bundle, path))).toEqual({ bundle, path, is_design: false });
		}
	});

	it('reads an svg file under memory as a drawing of the memory collection, its ending kept', () => {
		expect(site_of_file('memory/shared/truth/artwork/cadence.svg'))
			.toEqual({ bundle: T_Bundle.memory, path: 'shared/truth/artwork/cadence.svg', is_design: false });
		expect(file_path_of(T_Bundle.memory, 'shared/truth/artwork/cadence.svg')).toBe('memory/shared/truth/artwork/cadence.svg');
	});

	it('reads anything that is neither markdown nor svg as nothing', () => {
		expect(site_of_file('ov/src/lib/main.css')).toBe(null);
		expect(site_of_file('memory/shared/zone/architecture/app.png')).toBe(null);
		expect(site_of_file('memory/shared/zone/a folder')).toBe(null);
		expect(site_of_file('')).toBe(null);
	});
});

// Where a guide sits, counting from the top of the repo. This is the one thing the write
// server is told, so it has to be exactly right — a wrong answer here writes to the wrong
// file, or to none at all.

describe('working out where a guide sits', () => {
	it('puts a memory file under memory', () => {
		expect(file_path_of(T_Bundle.memory, 'shared/truth/protocol.md')).toBe('memory/shared/truth/protocol.md');
	});

	it('puts mono\'s file at the top of the repo, and a project\'s under its folder', () => {
		expect(file_path_of(T_Bundle.mono, 'unfinished.md')).toBe('unfinished.md');
		expect(file_path_of(T_Bundle.mono, 'CLAUDE.md')).toBe('CLAUDE.md');
		expect(file_path_of(T_Bundle.di, 'CLAUDE.md')).toBe('di/CLAUDE.md');
	});

	it('adds the ending when the path has none, and keeps the spelling of one it has', () => {
		expect(file_path_of(T_Bundle.ji, 'roadmap')).toBe('ji/roadmap.md');
		expect(file_path_of(T_Bundle.lv, 'CLAUDE.MD')).toBe('lv/CLAUDE.MD');
	});
});

describe('working out where a folder sits', () => {
	it('answers with the collection\'s own folder when the folder has no path inside it', () => {
		expect(folder_path_of(T_Bundle.memory, '')).toBe('memory');
		expect(folder_path_of(T_Bundle.mono, '')).toBe('');
		expect(folder_path_of(T_Bundle.di, '')).toBe('di');
	});

	it('adds the folder\'s path inside its collection', () => {
		expect(folder_path_of(T_Bundle.memory, 'shared/truth')).toBe('memory/shared/truth');
		expect(folder_path_of(T_Bundle.mono, 'tools')).toBe('tools');
		expect(folder_path_of(T_Bundle.di, 'zone')).toBe('di/zone');
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
		expect(file_path_of(T_Bundle.ov, 'memory/shared/notes/guides/always.md'))
			.toBe(file_path_of(T_Bundle.ov, 'memory/shared/notes/guides/always.md'));
	});
});

describe('handing a file to obsidian', () => {
	it('names the vault and the file inside it', () => {
		expect(obsidian_link('mono', 'memory/shared/notes/guides/pre-flight/always.md'))
			.toBe('obsidian://open?vault=mono&file=memory%2Fshared%2Fnotes%2Fguides%2Fpre-flight%2Falways.md');
	});

	it('spells out a space in a name', () => {
		expect(obsidian_link('mono', 'memory/ov/notes/guides/adding a guide.md'))
			.toContain('adding%20a%20guide.md');
	});

	it('spells out a vault name with a space in it', () => {
		expect(obsidian_link('my vault', 'a.md')).toContain('vault=my%20vault');
	});
});
