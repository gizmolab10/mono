import { file_path_of, moved_into, obsidian_link } from '../utilities/Saving';
import { describe, expect, it } from 'vitest';
import { T_Bundle } from '../types/Guide';

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
