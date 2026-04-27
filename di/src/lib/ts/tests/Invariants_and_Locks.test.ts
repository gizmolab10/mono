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

function add_so(name: string, bounds?: Partial<Record<Bound, number>>): Smart_Object {
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

function wire_child(child: Smart_Object, parent: Smart_Object): void {
	const all = scene.get_all();
	const parent_scene = all.find(o => o.so.id === parent.id)!;
	const child_scene = all.find(o => o.so.id === child.id)!;
	child_scene.parent = parent_scene;
	child.scene = child_scene;
}

function ref(so: Smart_Object, attr: string): string {
	return `${so.id}.${attr}`;
}

beforeEach(() => {
	scene.clear();
});

// ═══════════════════════════════════════════════════════════════════
// Test 1 — Storage round-trip
// ═══════════════════════════════════════════════════════════════════

describe('storage round-trip', () => {
	it('a value written to a cell on a child is preserved when read back', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 20 });
		const child = add_so('child');
		wire_child(child, parent);

		child.attributes_dict_byName['x_min'].value = 5;

		expect(child.attributes_dict_byName['x_min'].value).toBe(5);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Tests 2 to 4 — Invariant rule on this object's own three cells
// ═══════════════════════════════════════════════════════════════════

describe('invariant rule on this object', () => {
	it('test 2: invariant on x writes x = X minus w', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 20 });
		const child = add_so('child');
		wire_child(child, parent);

		child.axes[0].invariant = 0;
		child.attributes_dict_byName['x_max'].value = 7;
		child.axes[0].length.value = 4;
		child.attributes_dict_byName['x_min'].value = 999;

		constraints.enforce_invariants(child);

		expect(child.attributes_dict_byName['x_min'].value).toBe(3);
	});

	it('test 3: invariant on X writes X = x plus w', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 20 });
		const child = add_so('child');
		wire_child(child, parent);

		child.axes[0].invariant = 1;
		child.attributes_dict_byName['x_min'].value = 3;
		child.axes[0].length.value = 4;
		child.attributes_dict_byName['x_max'].value = 999;

		constraints.enforce_invariants(child);

		expect(child.attributes_dict_byName['x_max'].value).toBe(7);
	});

	it('test 4: invariant on w writes w = X minus x', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 20 });
		const child = add_so('child');
		wire_child(child, parent);

		child.axes[0].invariant = 2;
		child.attributes_dict_byName['x_min'].value = 3;
		child.attributes_dict_byName['x_max'].value = 7;
		child.axes[0].length.value = 999;

		constraints.enforce_invariants(child);

		expect(child.axes[0].length.value).toBe(4);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Test 5 — Locked w is protected
// ═══════════════════════════════════════════════════════════════════

describe('locked length is protected', () => {
	it('test 5: writing to X does not overwrite a locked w', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 20 });
		const child = add_so('child');
		wire_child(child, parent);

		child.axes[0].length.value = 6;
		child.axes[0].length.is_locked = true;

		child.set_bound('x_max', 10);

		expect(child.axes[0].length.value).toBe(6);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Test 6 — Reverse propagation refuses a locked target
// ═══════════════════════════════════════════════════════════════════

describe('reverse propagation refuses a locked target', () => {
	it('test 6: write_free_constant skips when the target attribute is locked', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 20 });
		const child = add_so('child');
		wire_child(child, parent);

		const attr = child.attributes_dict_byName['x_min'];
		attr.value = 5;
		attr.is_locked = true;

		constraints.write_free_constant({ kind: 'attr', so: child, attr }, 999);

		expect(attr.value).toBe(5);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Test 7 — w write does not stomp on other cells
// ═══════════════════════════════════════════════════════════════════

describe('w write does not stomp on other cells', () => {
	it('test 7: writing w when x is invariant leaves X alone and recomputes x', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 30 });
		const child = add_so('child');
		wire_child(child, parent);

		child.axes[0].invariant = 0;
		child.attributes_dict_byName['x_max'].value = 17;
		child.axes[0].length.value = 5;

		child.axes[0].length.value = 8;
		constraints.propagate(child);

		expect(child.attributes_dict_byName['x_max'].value).toBe(17);
		expect(child.axes[0].length.value).toBe(8);
		expect(child.attributes_dict_byName['x_min'].value).toBe(9);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Test 8 — w write with formula on X
// ═══════════════════════════════════════════════════════════════════

describe('w write with formula on X', () => {
	it('test 8: writing w when X carries a formula keeps X following the formula', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 17 });
		const child = add_so('child');
		wire_child(child, parent);

		child.axes[0].invariant = 0;
		const err = constraints.set_formula(child, 'x_max', `${ref(parent, 'x_max')}`);
		expect(err).toBeNull();

		child.axes[0].length.value = 5;
		child.axes[0].length.value = 8;
		constraints.propagate(child);

		expect(child.attributes_dict_byName['x_max'].value).toBe(17);
		expect(child.axes[0].length.value).toBe(8);
		expect(child.attributes_dict_byName['x_min'].value).toBe(9);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Test 9 — Invariant cell is recomputed by propagate_all
// ═══════════════════════════════════════════════════════════════════

describe('invariant cell is recomputed', () => {
	it('test 9: propagate_all recomputes the invariant cell ignoring its stored wrong value', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 20 });
		const child = add_so('child');
		wire_child(child, parent);

		child.axes[0].invariant = 0;
		child.attributes_dict_byName['x_max'].value = 7;
		child.axes[0].length.value = 4;
		child.attributes_dict_byName['x_min'].value = 999;

		constraints.propagate_all();

		expect(child.attributes_dict_byName['x_min'].value).toBe(3);
	});
});
