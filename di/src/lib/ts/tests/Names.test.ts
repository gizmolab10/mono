import { describe, it, expect } from 'vitest';
import { full_name, measurement_name, dimensional_name } from '../common/Names';

// Minimal stand-ins shaped like the only bits the name builder reads: a name,
// and a path up to the parent's smart object. ROOT has no parent above it.
function node(name: string, parent: unknown | null): any {
	return { name, scene: { parent: parent ? { so: parent } : null } };
}

const ROOT = node('ROOT', null);
const WALL = node('wall', ROOT);
const STUD = node('stud', WALL);

describe('full_name', () => {
	it('the root returns its own name', () => {
		expect(full_name(ROOT)).toBe('ROOT');
	});

	it('a part directly under the root is just its own name (root left off)', () => {
		expect(full_name(WALL)).toBe('wall');
	});

	it('a deeper part joins its line of parents with dots, root left off', () => {
		expect(full_name(STUD)).toBe('wall.stud');
	});
});

describe('measurement_name', () => {
	it('x is width, y is depth, z is height', () => {
		expect(measurement_name('x')).toBe('width');
		expect(measurement_name('y')).toBe('depth');
		expect(measurement_name('z')).toBe('height');
	});
});

describe('dimensional_name', () => {
	it('is the owning part full name plus the measurement', () => {
		expect(dimensional_name(STUD, 'z')).toBe('wall.stud.height');
		expect(dimensional_name(WALL, 'x')).toBe('wall.width');
	});

	it('a dimensional on the root uses the root name', () => {
		expect(dimensional_name(ROOT, 'y')).toBe('ROOT.depth');
	});
});
