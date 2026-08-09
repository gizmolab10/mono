import { file_path_of, folder_path_of, moved_into, obsidian_link, place_of_file } from '../utilities/Saving';
import { describe, expect, it } from 'vitest';
import { T_Bundle } from '../types/File';

describe('reading a place in the repo back into a collection and a path', () => {
	it('reads a shared guide', () => {
		expect(place_of_file('notes/guides/pre-flight/always.md'))
			.toEqual({ bundle: T_Bundle.mono, path: 'pre-flight/always.md', is_design: false });
	});

	it('reads a project\'s guide', () => {
		expect(place_of_file('di/notes/guides/core/units.md'))
			.toEqual({ bundle: T_Bundle.di, path: 'core/units.md', is_design: false });
	});

	it('keeps the designs folder in the path, so it can never collide with a guide', () => {
		expect(place_of_file('ws/notes/designs/styles.md'))
			.toEqual({ bundle: T_Bundle.ws, path: 'designs/styles.md', is_design: true });
	});

	it('is the other way round from working out where a guide sits', () => {
		for (const [bundle, path] of [
			[T_Bundle.mono, 'pre-flight/always.md'],
			[T_Bundle.ji, 'roadmap.md'],
			[T_Bundle.ov, 'designs/a plan.md'],
		] as Array<[T_Bundle, string]>) {
			expect(place_of_file(file_path_of(bundle, path))).toEqual({ bundle, path, is_design: path.startsWith('designs/') });
		}
	});

	it('reads anything that is not a guide as nothing', () => {
		expect(place_of_file('ov/notes/work/handoff.md')).toBe(null);
		expect(place_of_file('ov/src/lib/main.css')).toBe(null);
		expect(place_of_file('notes/guides/a folder')).toBe(null);
		expect(place_of_file('')).toBe(null);
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
