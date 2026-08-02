import { file_path_of } from '../utilities/Saving';
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
