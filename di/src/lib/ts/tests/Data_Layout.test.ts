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

// ═══════════════════════════════════════════════════════════════════
// Rule 4 — a number cell can simply hold a plain number
// ═══════════════════════════════════════════════════════════════════

describe('a cell can hold a plain number', () => {
	it('writing a plain number to a cell stores that number unchanged', () => {
		const so = make_so('thing');
		so.attributes_dict_byName['x_min'].value = 17;
		expect(so.attributes_dict_byName['x_min'].value).toBe(17);
		// Without a formula the cell is a plain number — no compiled tree, no formula text.
		expect(so.attributes_dict_byName['x_min'].compiled).toBeNull();
		expect(so.attributes_dict_byName['x_min'].has_formula).toBe(false);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rule 7 — each direction has exactly one recomputed cell
// ═══════════════════════════════════════════════════════════════════

describe('each direction has exactly one recomputed cell', () => {
	it('the recomputed marker on every direction is a single index pointing at one of the three cells', () => {
		const so = make_so('thing');
		for (const axis of so.axes) {
			// The marker is one number, not a list. Its value is one of {0, 1, 2}.
			expect(typeof axis.invariant).toBe('number');
			expect([0, 1, 2]).toContain(axis.invariant);
		}
	});

	it('changing the recomputed marker on one direction does not change it on the others', () => {
		const so = make_so('thing');
		so.axes[0].invariant = 0;
		so.axes[1].invariant = 1;
		so.axes[2].invariant = 2;
		expect(so.axes[0].invariant).toBe(0);
		expect(so.axes[1].invariant).toBe(1);
		expect(so.axes[2].invariant).toBe(2);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rule 38 — every block has a visibility flag and a flag that hides children
// ═══════════════════════════════════════════════════════════════════

describe('every block has visibility flags', () => {
	it('a fresh block is visible and shows its children by default', () => {
		const so = make_so('thing');
		expect(so.visible).toBe(true);
		expect(so.hide_children).toBe(false);
	});

	it('flipping the visibility flag and the hide-children flag preserves both values', () => {
		const so = make_so('thing');
		so.visible = false;
		so.hide_children = true;
		expect(so.visible).toBe(false);
		expect(so.hide_children).toBe(true);
	});

	it('a hidden block still serializes — it stays in the data pipeline', () => {
		const so = make_so('thing');
		so.visible = false;
		so.hide_children = true;
		const data = so.serialize();
		expect(data.visible).toBe(false);
		expect(data.hide_children).toBe(true);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rule 47 — every SO is shaped like a box: 8 corners, 12 edges, 6 faces
// ═══════════════════════════════════════════════════════════════════

describe('every SO is shaped like a box', () => {
	it('exposes eight corner positions', () => {
		const so = make_so('thing');
		expect(so.vertices.length).toBe(8);
	});

	it('the standard cube wiring connects those eight corners with twelve edges', () => {
		const so = make_so('thing');
		expect(so.scene!.edges.length).toBe(12);
	});

	it('exposes six distinct face directions', () => {
		const so = make_so('thing');
		const directions = new Set<string>();
		for (let i = 0; i < 6; i++) {
			const n = so.face_normal(i);
			directions.add(`${n[0]},${n[1]},${n[2]}`);
		}
		expect(directions.size).toBe(6);
	});
});
