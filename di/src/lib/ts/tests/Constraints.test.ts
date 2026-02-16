import { describe, it, expect, beforeEach } from 'vitest';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { constraints } from '../algebra';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
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
	scene.create({ so, edges: cube_edges });
	return so;
}

/** Build a formula reference using SO's internal id: ref(so, 'x_min') → "NEWabc.x_min" */
function ref(so: Smart_Object, attr: string): string { return `${so.id}.${attr}`; }

beforeEach(() => {
	scene.clear();
});

// ═══════════════════════════════════════════════════════════════════
// FORMULA ON ATTRIBUTE TRIGGERS EVAL
// ═══════════════════════════════════════════════════════════════════

describe('formula on Attribute', () => {

	it('sets formula and evaluates immediately', () => {
		const wall = add_so('wall', { y_min: 0, y_max: 2438.4 });
		const door = add_so('door', { y_min: 0, y_max: 2000 });

		const error = constraints.set_formula(door, 'y_max', `${ref(wall, 'y_max')} - 6"`);
		expect(error).toBeNull();

		// door.y_max should now be wall.y_max - 152.4 = 2438.4 - 152.4 = 2286
		expect(door.y_max).toBeCloseTo(2286);
	});

	it('stores formula text on attribute', () => {
		const wall = add_so('wall', { y_max: 2438.4 });
		const door = add_so('door');

		const formula = `${ref(wall, 'y_max')} - 6"`;
		constraints.set_formula(door, 'y_max', formula);

		const attr = door.attributes_dict_byName['y_max'];
		expect(attr.formula).toBe(formula);
		expect(attr.has_formula).toBe(true);
	});

	it('attribute without formula has no compiled tree', () => {
		const so = add_so('box');
		const attr = so.attributes_dict_byName['x_min'];
		expect(attr.formula).toBeNull();
		expect(attr.compiled).toBeNull();
		expect(attr.has_formula).toBe(false);
	});

	it('returns error on bad formula', () => {
		const so = add_so('box');
		const error = constraints.set_formula(so, 'x_min', '+ +');
		expect(error).toMatch(/Compile error/);
	});

	it('returns error on cycle', () => {
		const a = add_so('a', { x_min: 10 });
		const b = add_so('b', { x_min: 20 });

		constraints.set_formula(a, 'x_min', `${ref(b, 'x_min')} + 1`);
		const error = constraints.set_formula(b, 'x_min', `${ref(a, 'x_min')} + 1`);
		expect(error).toMatch(/Cycle detected/);
	});

	it('clear_formula removes formula, keeps value', () => {
		const wall = add_so('wall', { y_max: 2438.4 });
		const door = add_so('door');

		constraints.set_formula(door, 'y_max', `${ref(wall, 'y_max')} - 6"`);
		const computed = door.y_max; // 2286

		constraints.clear_formula(door, 'y_max');
		expect(door.y_max).toBeCloseTo(computed); // value stays
		expect(door.attributes_dict_byName['y_max'].formula).toBeNull();
	});
});

// ═══════════════════════════════════════════════════════════════════
// PROPAGATION
// ═══════════════════════════════════════════════════════════════════

describe('propagation', () => {

	it('changing wall updates door via formula', () => {
		const wall = add_so('wall', { y_min: 0, y_max: 2438.4 });
		const door = add_so('door', { y_min: 0, y_max: 2000 });

		constraints.set_formula(door, 'y_max', `${ref(wall, 'y_max')} - 6"`);
		expect(door.y_max).toBeCloseTo(2286); // initial eval

		// Change wall height
		wall.set_bound('y_max', 4000);
		constraints.propagate(wall);

		// door.y_max should now be 4000 - 152.4 = 3847.6
		expect(door.y_max).toBeCloseTo(3847.6);
	});

	it('propagation cascades through chain', () => {
		const a = add_so('a', { x_min: 0, x_max: 100 });
		const b = add_so('b');
		const c = add_so('c');

		constraints.set_formula(b, 'x_max', `${ref(a, 'x_max')} * 2`);    // b.x_max = 200
		constraints.set_formula(c, 'x_max', `${ref(b, 'x_max')} + 10`);   // c.x_max = 210

		expect(b.x_max).toBeCloseTo(200);
		expect(c.x_max).toBeCloseTo(210);

		// Change a
		a.set_bound('x_max', 150);
		constraints.propagate(a);     // updates b
		constraints.propagate(b);     // updates c

		expect(b.x_max).toBeCloseTo(300);
		expect(c.x_max).toBeCloseTo(310);
	});

	it('unrelated SOs are not affected', () => {
		const wall = add_so('wall', { y_max: 2438.4 });
		const door = add_so('door');
		const table = add_so('table', { x_max: 500 });

		constraints.set_formula(door, 'y_max', `${ref(wall, 'y_max')} - 6"`);

		wall.set_bound('y_max', 3000);
		constraints.propagate(wall);

		// table should be untouched
		expect(table.x_max).toBeCloseTo(500);
	});
});

// ═══════════════════════════════════════════════════════════════════
// SERIALIZE / DESERIALIZE
// ═══════════════════════════════════════════════════════════════════

describe('serialize/deserialize formulas', () => {

	it('serializes formula strings', () => {
		const wall = add_so('wall', { y_max: 2438.4 });
		const door = add_so('door');

		const formula = `${ref(wall, 'y_max')} - 6"`;
		constraints.set_formula(door, 'y_max', formula);

		const data = door.serialize();
		expect(data.y.attributes[1].formula).toBe(formula);
	});

	it('omits formulas key when no formulas exist', () => {
		const so = add_so('box');
		const data = so.serialize();
		for (const axis of [data.x, data.y, data.z]) {
			for (const attr of axis.attributes) {
				expect(attr.formula).toBeUndefined();
			}
		}
	});

	it('deserializes and recompiles formulas', () => {
		const data = {
			id: 'test1',
			name: 'door',
			x: { attributes: [{ value: -152.4 }, { value: 152.4 }, { value: 304.8 }, { value: 0 }] as [any, any, any, any] },
			y: { attributes: [{ value: 0 }, { value: 2286, formula: 'wall.y_max - 6"' }, { value: 2286 }, { value: 0 }] as [any, any, any, any] },
			z: { attributes: [{ value: -457.2 }, { value: 457.2 }, { value: 914.4 }, { value: 0 }] as [any, any, any, any] },
		};

		const so = Smart_Object.deserialize(data);
		const attr = so.attributes_dict_byName['y_max'];

		expect(attr.formula).toBe('wall.y_max - 6"');
		expect(attr.compiled).not.toBeNull();
		expect(attr.compiled!.type).toBe('binary');
	});

	it('round-trips: serialize → deserialize preserves formulas', () => {
		const wall = add_so('wall', { y_max: 2438.4 });
		const door = add_so('door');

		const formula = `${ref(wall, 'y_max')} - 6"`;
		constraints.set_formula(door, 'y_max', formula);
		const data = door.serialize();

		const restored = Smart_Object.deserialize(data);
		const attr = restored.attributes_dict_byName['y_max'];

		expect(attr.formula).toBe(formula);
		expect(attr.compiled).not.toBeNull();
		expect(attr.value).toBeCloseTo(2286);
	});
});

// ═══════════════════════════════════════════════════════════════════
// ORIENTATION COPY
// ═══════════════════════════════════════════════════════════════════

describe('orientation', () => {

	it('child can copy parent orientation via axis angles', () => {
		const parent = add_so('parent');
		const child = add_so('child');

		// Rotate parent around Y
		parent.set_rotation('y', Math.PI / 4);

		// Copy axis angles to child
		for (let i = 0; i < 3; i++) {
			child.axes[i].angle.value = parent.axes[i].angle.value;
		}

		expect(child.orientation[0]).toBeCloseTo(parent.orientation[0]);
		expect(child.orientation[1]).toBeCloseTo(parent.orientation[1]);
		expect(child.orientation[2]).toBeCloseTo(parent.orientation[2]);
		expect(child.orientation[3]).toBeCloseTo(parent.orientation[3]);
	});

	it('orientation survives serialize/deserialize', () => {
		const so = add_so('box');
		so.set_rotation('x', Math.PI / 3);

		const data = so.serialize();
		const restored = Smart_Object.deserialize(data);

		for (let i = 0; i < 4; i++) {
			expect(restored.orientation[i]).toBeCloseTo(so.orientation[i]);
		}
	});
});

// ═══════════════════════════════════════════════════════════════════
// ADD CHILD — SHARED ORIGIN + DEFAULT UNIT FORMULAS
// ═══════════════════════════════════════════════════════════════════

describe('add child with formulas', () => {

	it('child min bounds track parent min bounds via formula', () => {
		const parent = add_so('parent', { x_min: -100, x_max: 100, y_min: -200, y_max: 200, z_min: -300, z_max: 300 });
		const child = add_so('child');

		// Simulate what add_child_so does
		constraints.set_formula(child, 'x_min', ref(parent, 'x_min'));
		constraints.set_formula(child, 'y_min', ref(parent, 'y_min'));
		constraints.set_formula(child, 'z_min', ref(parent, 'z_min'));

		expect(child.x_min).toBeCloseTo(-100);
		expect(child.y_min).toBeCloseTo(-200);
		expect(child.z_min).toBeCloseTo(-300);
	});

	it('child min bounds update when parent moves', () => {
		const parent = add_so('parent', { x_min: -100, x_max: 100 });
		const child = add_so('child');

		constraints.set_formula(child, 'x_min', ref(parent, 'x_min'));

		parent.set_bound('x_min', -500);
		constraints.propagate(parent);

		expect(child.x_min).toBeCloseTo(-500);
	});

	it('child max bounds set to parent origin + half smallest dimension', () => {
		const parent = add_so('parent', { x_min: -100, x_max: 100, y_min: -200, y_max: 200, z_min: -300, z_max: 300 });
		const child = add_so('child');

		// Smallest parent dimension: width = 200. Half = 100.
		const half = Math.min(parent.width, parent.height, parent.depth) / 2;
		child.set_bound('x_max', parent.x_min + half);

		expect(child.x_max).toBeCloseTo(-100 + 100);
	});

	it('child dimensions are half the smallest parent length', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 1000, y_min: 0, y_max: 600, z_min: 0, z_max: 800 });
		const child = add_so('child');

		// Simulate add_child_so: smallest parent length = 600 (height), half = 300
		constraints.set_formula(child, 'x_min', ref(parent, 'x_min'));
		constraints.set_formula(child, 'y_min', ref(parent, 'y_min'));
		constraints.set_formula(child, 'z_min', ref(parent, 'z_min'));
		const half = Math.min(parent.width, parent.height, parent.depth) / 2;
		child.set_bound('x_max', parent.x_min + half);
		child.set_bound('y_max', parent.y_min + half);
		child.set_bound('z_max', parent.z_min + half);

		expect(child.width).toBeCloseTo(300);
		expect(child.height).toBeCloseTo(300);
		expect(child.depth).toBeCloseTo(300);
	});
});

// ═══════════════════════════════════════════════════════════════════
// ALIAS RESOLUTION
// ═══════════════════════════════════════════════════════════════════

describe('alias resolution', () => {

	it('resolve: x → x_min', () => {
		const wall = add_so('wall', { x_min: 100, x_max: 500 });
		expect(constraints.resolve(wall.id, 'x')).toBeCloseTo(100);
	});

	it('resolve: X → x_max', () => {
		const wall = add_so('wall', { x_min: 100, x_max: 500 });
		expect(constraints.resolve(wall.id, 'X')).toBeCloseTo(500);
	});

	it('resolve: w → width (x_max - x_min)', () => {
		const wall = add_so('wall', { x_min: 100, x_max: 500 });
		expect(constraints.resolve(wall.id, 'w')).toBeCloseTo(400);
	});

	it('resolve: h → height (y_max - y_min)', () => {
		const wall = add_so('wall', { y_min: 0, y_max: 2438.4 });
		expect(constraints.resolve(wall.id, 'h')).toBeCloseTo(2438.4);
	});

	it('resolve: d → depth (z_max - z_min)', () => {
		const box = add_so('box', { z_min: -300, z_max: 300 });
		expect(constraints.resolve(box.id, 'd')).toBeCloseTo(600);
	});

	it('resolve: falls through to internal bound name', () => {
		const wall = add_so('wall', { x_min: 42 });
		expect(constraints.resolve(wall.id, 'x_min')).toBeCloseTo(42);
	});

	it('write: x sets x_min', () => {
		const wall = add_so('wall', { x_min: 0 });
		constraints.write(wall.id, 'x', 200);
		expect(wall.x_min).toBeCloseTo(200);
	});

	it('write: w sets x_max = x_min + value', () => {
		const wall = add_so('wall', { x_min: 100, x_max: 500 });
		constraints.write(wall.id, 'w', 300);
		expect(wall.x_max).toBeCloseTo(400); // 100 + 300
	});

	it('write: falls through to internal bound name', () => {
		const wall = add_so('wall', { x_min: 0 });
		constraints.write(wall.id, 'x_min', 99);
		expect(wall.x_min).toBeCloseTo(99);
	});
});

// ═══════════════════════════════════════════════════════════════════
// BARE ATTRIBUTE → PARENT REFERENCE
// ═══════════════════════════════════════════════════════════════════

describe('bare attribute with parent binding', () => {

	it('x * 2 with parent_id resolves to parent.x_min * 2', () => {
		const parent = add_so('parent', { x_min: 100, x_max: 500 });
		const child = add_so('child');

		const error = constraints.set_formula(child, 'x_min', 'x * 2', parent.id);
		expect(error).toBeNull();
		// parent.x_min = 100, so child.x_min = 200
		expect(child.x_min).toBeCloseTo(200);
	});

	it('A.x * 2 with explicit SO (no parent needed)', () => {
		const a = add_so('A', { x_min: 150 });
		const child = add_so('child');

		const error = constraints.set_formula(child, 'x_min', `${a.id}.x * 2`);
		expect(error).toBeNull();
		expect(child.x_min).toBeCloseTo(300);
	});

	it('mixed: x + A.X resolves bare to parent, dotted to named SO', () => {
		const parent = add_so('parent', { x_min: 100, x_max: 500 });
		const a = add_so('A', { x_max: 800 });
		const child = add_so('child');

		const error = constraints.set_formula(child, 'x_min', `x + ${a.id}.X`, parent.id);
		expect(error).toBeNull();
		// parent.x_min(100) + A.x_max(800) = 900
		expect(child.x_min).toBeCloseTo(900);
	});

	it('w alias through formula: w * 2 with parent', () => {
		const parent = add_so('parent', { x_min: 100, x_max: 500 });
		const child = add_so('child');

		const error = constraints.set_formula(child, 'x_min', 'w * 2', parent.id);
		expect(error).toBeNull();
		// parent width = 400, so child.x_min = 800
		expect(child.x_min).toBeCloseTo(800);
	});

	it('bare attribute without parent_id compiles but object stays empty', () => {
		const child = add_so('child');
		// No parent_id → bare ref object is '' → resolve('', 'x') → find_so('') → null → 0
		const error = constraints.set_formula(child, 'x_min', 'x * 2');
		expect(error).toBeNull();
		expect(child.x_min).toBeCloseTo(0); // can't resolve '' SO
	});

	it('propagates through bare-attribute formula', () => {
		const parent = add_so('parent', { x_min: 100, x_max: 500 });
		const child = add_so('child');

		constraints.set_formula(child, 'x_min', 'x * 2', parent.id);
		expect(child.x_min).toBeCloseTo(200);

		parent.set_bound('x_min', 250);
		constraints.propagate(parent);
		expect(child.x_min).toBeCloseTo(500);
	});
});

// ═══════════════════════════════════════════════════════════════════
// INVARIANT FORMULAS
// ═══════════════════════════════════════════════════════════════════

describe('invariant formulas', () => {

	it('invariant_formula_for returns correct formula for x', () => {
		expect(constraints.invariant_formula_for('x')).toBe('X - w');
	});

	it('invariant_formula_for returns correct formula for w', () => {
		expect(constraints.invariant_formula_for('w')).toBe('X - x');
	});

	it('invariant_formula_for returns correct formula for X', () => {
		expect(constraints.invariant_formula_for('X')).toBe('x + w');
	});

	it('invariant_formula_for returns null for unknown alias', () => {
		expect(constraints.invariant_formula_for('foo')).toBeNull();
	});

	it('invariant formula for x (X - w) evaluates correctly with parent binding', () => {
		const so = add_so('box', { x_min: 100, x_max: 500 });

		// Set invariant formula: x = X - w → should resolve to x_max - width
		// X = 500, w = 400, so x = 500 - 400 = 100
		const formula = constraints.invariant_formula_for('x')!;
		const error = constraints.set_formula(so, 'x_min', formula, so.id);
		expect(error).toBeNull();
		expect(so.x_min).toBeCloseTo(100);
	});

	it('invariant formula recomputes when siblings change', () => {
		const so = add_so('box', { x_min: 100, x_max: 500 });

		// x is invariant: x = X - w (self-referencing)
		const formula = constraints.invariant_formula_for('x')!;
		constraints.set_formula(so, 'x_min', formula, so.id);

		// Change x_max → x_min should recompute
		so.set_bound('x_max', 700);
		constraints.propagate(so);
		// X = 700, w = 700 - 100 = 600... but wait, x_min has a formula
		// Actually: after propagate, x_min = X - w = 700 - (700 - x_min)
		// This is self-referential through the derived alias w.
		// w depends on x_min, and x_min depends on w → conceptual cycle.
		// But since w is derived (not a stored formula), it resolves live:
		// evaluate: resolve(so.id, 'X') - resolve(so.id, 'w')
		// = so.x_max - (so.x_max - so.x_min) = so.x_min
		// So x_min stays at 100 — the identity holds.
		expect(so.x_min).toBeCloseTo(100);
	});
});
