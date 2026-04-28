import { describe, it, expect, beforeEach } from 'vitest';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { constraints } from '../algebra';

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const cube_edges: [number, number][] = [
	[0, 1], [1, 2], [2, 3], [3, 0],
	[4, 5], [5, 6], [6, 7], [7, 4],
	[0, 4], [1, 5], [2, 6], [3, 7],
];

function make_root(name: string, bounds?: Partial<Record<Bound, number>>): Smart_Object {
	const so = new Smart_Object(name);
	if (bounds) {
		for (const [key, value] of Object.entries(bounds)) {
			so.set_bound(key as Bound, value);
		}
	}
	for (const axis of so.axes) {
		axis.length.value = axis.end.value - axis.start.value;
	}
	const so_scene = scene.create({ so, edges: cube_edges });
	so.scene = so_scene;
	return so;
}

beforeEach(() => {
	scene.clear();
});

// ═══════════════════════════════════════════════════════════════════
// Rule 9 — the topmost block has nothing above it
// ═══════════════════════════════════════════════════════════════════

describe('the topmost block has nothing above it', () => {
	it('a freshly built topmost block has no parent wired in', () => {
		const root = make_root('root', { x_min: 0, x_max: 10, y_min: 0, y_max: 10, z_min: 0, z_max: 10 });
		expect(root.scene?.parent).toBeFalsy();
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rule 10 — the recomputed cell on each direction is the far end
// ═══════════════════════════════════════════════════════════════════

describe('the recomputed cell on each direction is the far end', () => {
	it('on a fresh block, the recomputed marker on every direction points at the far end', () => {
		const root = make_root('root');
		// The marker uses 0 = near, 1 = far, 2 = length.
		expect(root.axes[0].invariant).toBe(1);
		expect(root.axes[1].invariant).toBe(1);
		expect(root.axes[2].invariant).toBe(1);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rule 12 — the topmost block's length can be locked
// ═══════════════════════════════════════════════════════════════════

describe('the topmost block\'s length can be locked', () => {
	it('once length is locked, writing to the far end leaves the length unchanged', () => {
		const root = make_root('root', { x_min: 0, x_max: 10 });

		root.axes[0].length.value = 10;
		root.axes[0].length.is_locked = true;

		root.set_bound('x_max', 25);

		expect(root.axes[0].length.value).toBe(10);
	});

	it('once length is locked, propagation does not rewrite it', () => {
		const root = make_root('root', { x_min: 0, x_max: 10 });

		root.axes[0].length.value = 10;
		root.axes[0].length.is_locked = true;

		constraints.propagate(root);

		expect(root.axes[0].length.value).toBe(10);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rule 11 — the topmost block's near ends stay at zero on every direction
// (the running app sets them to zero at startup; this test pins down that
// once they are zero, normal scene operations leave them at zero)
// ═══════════════════════════════════════════════════════════════════

describe('the topmost block\'s near ends stay at zero', () => {
	it('after building children, moving children, and running propagation, the near ends are still zero', () => {
		const root = make_root('root', { x_min: 0, x_max: 20, y_min: 0, y_max: 20, z_min: 0, z_max: 20 });

		const child_scene = scene.create({ so: new Smart_Object('child'), edges: cube_edges, parent: root.scene! });
		const child = child_scene.so;
		child.scene = child_scene;
		child.set_bound('x_min', 2);
		child.set_bound('x_max', 8);
		child.axes[0].length.value = 6;

		// Drag the child around — should not touch the root's near ends.
		child.set_bound('x_min', 4);
		child.set_bound('y_min', 1);
		constraints.propagate(child);
		constraints.propagate_all();

		expect(root.axes[0].start.value).toBe(0);
		expect(root.axes[1].start.value).toBe(0);
		expect(root.axes[2].start.value).toBe(0);
	});

	it('after locking the length on every direction and running propagation, the near ends are still zero', () => {
		const root = make_root('root', { x_min: 0, x_max: 30, y_min: 0, y_max: 30, z_min: 0, z_max: 30 });

		for (const axis of root.axes) {
			axis.length.is_locked = true;
		}

		constraints.propagate(root);
		constraints.propagate_all();

		expect(root.axes[0].start.value).toBe(0);
		expect(root.axes[1].start.value).toBe(0);
		expect(root.axes[2].start.value).toBe(0);
	});
});
