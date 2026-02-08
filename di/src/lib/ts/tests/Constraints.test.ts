import { describe, it, expect, beforeEach } from 'vitest';
import Smart_Object from '../runtime/Smart_Object';
import type { Bound } from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { constraints } from '../algebra/Constraints';
import { units } from '../types/Units';
import { T_Unit, T_Units } from '../types/Enumerations';
import { quat } from 'gl-matrix';

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

		const error = constraints.set_formula(door, 'y_max', 'wall.y_max - 6"');
		expect(error).toBeNull();

		// door.y_max should now be wall.y_max - 152.4 = 2438.4 - 152.4 = 2286
		expect(door.y_max).toBeCloseTo(2286);
	});

	it('stores formula text on attribute', () => {
		const wall = add_so('wall', { y_max: 2438.4 });
		const door = add_so('door');

		constraints.set_formula(door, 'y_max', 'wall.y_max - 6"');

		const attr = door.attributes_dict_byName['y_max'];
		expect(attr.formula).toBe('wall.y_max - 6"');
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

		constraints.set_formula(a, 'x_min', 'b.x_min + 1');
		const error = constraints.set_formula(b, 'x_min', 'a.x_min + 1');
		expect(error).toMatch(/Cycle detected/);
	});

	it('clear_formula removes formula, keeps value', () => {
		const wall = add_so('wall', { y_max: 2438.4 });
		const door = add_so('door');

		constraints.set_formula(door, 'y_max', 'wall.y_max - 6"');
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

		constraints.set_formula(door, 'y_max', 'wall.y_max - 6"');
		expect(door.y_max).toBeCloseTo(2286); // initial eval

		// Change wall height
		wall.set_bound('y_max', 3000);
		constraints.propagate(wall);

		// door.y_max should now be 3000 - 152.4 = 2847.6
		expect(door.y_max).toBeCloseTo(2847.6);
	});

	it('propagation cascades through chain', () => {
		const a = add_so('a', { x_min: 0, x_max: 100 });
		const b = add_so('b');
		const c = add_so('c');

		constraints.set_formula(b, 'x_max', 'a.x_max * 2');    // b.x_max = 200
		constraints.set_formula(c, 'x_max', 'b.x_max + 10');   // c.x_max = 210

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

		constraints.set_formula(door, 'y_max', 'wall.y_max - 6"');

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

		constraints.set_formula(door, 'y_max', 'wall.y_max - 6"');

		const data = door.serialize();
		expect(data.formulas).toBeDefined();
		expect(data.formulas!['y_max']).toBe('wall.y_max - 6"');
	});

	it('omits formulas key when no formulas exist', () => {
		const so = add_so('box');
		const data = so.serialize();
		expect(data.formulas).toBeUndefined();
	});

	it('deserializes and recompiles formulas', () => {
		const data = {
			name: 'door',
			bounds: { x_min: -152.4, x_max: 152.4, y_min: 0, y_max: 2286, z_min: -457.2, z_max: 457.2 },
			formulas: { 'y_max': 'wall.y_max - 6"' },
		};

		const { so } = Smart_Object.deserialize(data);
		const attr = so.attributes_dict_byName['y_max'];

		expect(attr.formula).toBe('wall.y_max - 6"');
		expect(attr.compiled).not.toBeNull();
		expect(attr.compiled!.type).toBe('binary');
	});

	it('round-trips: serialize → deserialize preserves formulas', () => {
		const wall = add_so('wall', { y_max: 2438.4 });
		const door = add_so('door');

		constraints.set_formula(door, 'y_max', 'wall.y_max - 6"');
		const data = door.serialize();

		const { so: restored } = Smart_Object.deserialize(data);
		const attr = restored.attributes_dict_byName['y_max'];

		expect(attr.formula).toBe('wall.y_max - 6"');
		expect(attr.compiled).not.toBeNull();
		expect(attr.value).toBeCloseTo(2286);
	});
});

// ═══════════════════════════════════════════════════════════════════
// ORIENTATION COPY
// ═══════════════════════════════════════════════════════════════════

describe('orientation', () => {

	it('child can copy parent orientation via quat.copy', () => {
		const parent = add_so('parent');
		const child = add_so('child');

		// Rotate parent
		const rot = quat.create();
		quat.setAxisAngle(rot, [0, 1, 0], Math.PI / 4);
		quat.copy(parent.orientation, rot);

		// Copy to child (as add_child_so does)
		quat.copy(child.orientation, parent.orientation);

		expect(child.orientation[0]).toBeCloseTo(parent.orientation[0]);
		expect(child.orientation[1]).toBeCloseTo(parent.orientation[1]);
		expect(child.orientation[2]).toBeCloseTo(parent.orientation[2]);
		expect(child.orientation[3]).toBeCloseTo(parent.orientation[3]);
	});

	it('orientation survives serialize/deserialize', () => {
		const so = add_so('box');
		const rot = quat.create();
		quat.setAxisAngle(rot, [1, 0, 0], Math.PI / 3);
		quat.copy(so.orientation, rot);

		const data = so.serialize();
		const { so: restored } = Smart_Object.deserialize(data);

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
		constraints.set_formula(child, 'x_min', 'parent.x_min');
		constraints.set_formula(child, 'y_min', 'parent.y_min');
		constraints.set_formula(child, 'z_min', 'parent.z_min');

		expect(child.x_min).toBeCloseTo(-100);
		expect(child.y_min).toBeCloseTo(-200);
		expect(child.z_min).toBeCloseTo(-300);
	});

	it('child min bounds update when parent moves', () => {
		const parent = add_so('parent', { x_min: -100, x_max: 100 });
		const child = add_so('child');

		constraints.set_formula(child, 'x_min', 'parent.x_min');

		parent.set_bound('x_min', -500);
		constraints.propagate(parent);

		expect(child.x_min).toBeCloseTo(-500);
	});

	it('child max bounds set to parent origin + 1 default unit', () => {
		const parent = add_so('parent', { x_min: -100, x_max: 100 });
		const child = add_so('child');

		// In imperial: 1 inch = 25.4 mm
		const one_inch = units.to_mm(1, T_Unit.inch);
		child.set_bound('x_max', parent.x_min + one_inch);

		expect(child.x_max).toBeCloseTo(-100 + 25.4);
	});

	it('child dimensions are 1 default unit wide', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 1000, y_min: 0, y_max: 1000, z_min: 0, z_max: 1000 });
		const child = add_so('child');

		// Simulate add_child_so with metric (1mm default)
		constraints.set_formula(child, 'x_min', 'parent.x_min');
		constraints.set_formula(child, 'y_min', 'parent.y_min');
		constraints.set_formula(child, 'z_min', 'parent.z_min');
		const one_mm = units.to_mm(1, T_Unit.millimeter);
		child.set_bound('x_max', parent.x_min + one_mm);
		child.set_bound('y_max', parent.y_min + one_mm);
		child.set_bound('z_max', parent.z_min + one_mm);

		expect(child.width).toBeCloseTo(1);
		expect(child.height).toBeCloseTo(1);
		expect(child.depth).toBeCloseTo(1);
	});
});
