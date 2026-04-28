import { describe, it, expect, beforeEach } from 'vitest';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';

const cube_edges: [number, number][] = [
	[0, 1], [1, 2], [2, 3], [3, 0],
	[4, 5], [5, 6], [6, 7], [7, 4],
	[0, 4], [1, 5], [2, 6], [3, 7],
];

function make_so(name: string): Smart_Object {
	const so = new Smart_Object(name);
	const so_scene = scene.create({ so, edges: cube_edges });
	so.scene = so_scene;
	return so;
}

beforeEach(() => {
	scene.clear();
});

// ═══════════════════════════════════════════════════════════════════
// Rule 1 — every block has three directions
// ═══════════════════════════════════════════════════════════════════

describe('every block has three directions', () => {
	it('a fresh block has exactly three directions', () => {
		const so = make_so('thing');
		expect(so.axes.length).toBe(3);
	});

	it('the three directions are named in order: across, depth, up', () => {
		const so = make_so('thing');
		expect(so.axes[0].name).toBe('x');
		expect(so.axes[1].name).toBe('y');
		expect(so.axes[2].name).toBe('z');
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rule 2 — each direction carries three numbers (near end, far end, length)
// ═══════════════════════════════════════════════════════════════════

describe('each direction carries three numbers', () => {
	it('every direction has a near end, a far end, and a length', () => {
		const so = make_so('thing');
		for (const axis of so.axes) {
			expect(axis.start).toBeDefined();
			expect(axis.end).toBeDefined();
			expect(axis.length).toBeDefined();
		}
	});

	it('the near end, far end, and length each carry a number value', () => {
		const so = make_so('thing');
		for (const axis of so.axes) {
			expect(typeof axis.start.value).toBe('number');
			expect(typeof axis.end.value).toBe('number');
			expect(typeof axis.length.value).toBe('number');
		}
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rule 17 — a block sits inside at most one parent
// ═══════════════════════════════════════════════════════════════════

describe('a block sits inside at most one parent', () => {
	it('the parent slot holds a single reference, so wiring a new parent replaces the old', () => {
		const first_parent = make_so('first parent');
		const second_parent = make_so('second parent');
		const child = make_so('child');

		// Wire to the first parent.
		child.scene!.parent = first_parent.scene!;
		expect(child.scene?.parent).toBe(first_parent.scene);

		// Wiring to the second parent replaces, not adds.
		child.scene!.parent = second_parent.scene!;
		expect(child.scene?.parent).toBe(second_parent.scene);
		expect(child.scene?.parent).not.toBe(first_parent.scene);
	});

	it('a freshly built block has no parent at all', () => {
		const so = make_so('alone');
		expect(so.scene?.parent).toBeFalsy();
	});
});
