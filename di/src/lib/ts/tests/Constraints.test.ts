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
	// Sync length attributes (width/depth/height) from geometry
	for (const axis of so.axes) {
		axis.length.value = axis.end.value - axis.start.value;
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

	it('stores formula tokens on attribute', () => {
		const wall = add_so('wall', { y_max: 2438.4 });
		const door = add_so('door');

		const formula = `${ref(wall, 'y_max')} - 6"`;
		constraints.set_formula(door, 'y_max', formula);

		const attr = door.attributes_dict_byName['y_max'];
		expect(attr.formula_display).toBe(`${ref(wall, 'y_max')}-6"`);
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

	it('serializes formula strings (untokenized)', () => {
		const wall = add_so('wall', { y_max: 2438.4 });
		const door = add_so('door');

		const formula = `${ref(wall, 'y_max')} - 6"`;
		const untokenized = `${ref(wall, 'y_max')}-6"`;
		constraints.set_formula(door, 'y_max', formula);

		const data = door.serialize();
		const extent = data.y.attributes.extent;
		expect(typeof extent === 'object' && extent.formula).toBe(untokenized);
	});

	it('simple attributes serialize as plain numbers', () => {
		const so = add_so('box');
		const data = so.serialize();
		for (const axis of [data.x, data.y, data.z]) {
			const { origin, extent, length, angle } = axis.attributes;
			for (const attr of [origin, extent, length, angle]) {
				expect(typeof attr).toBe('number');
			}
		}
	});

	it('deserializes and recompiles formulas', () => {
		const data = {
			id: 'test1',
			name: 'door',
			x: { attributes: { origin: -152.4, extent: 152.4, length: 304.8, angle: 0 } },
			y: { attributes: { origin: 0, extent: { value: 2286, formula: 'wall.y_max - 6"' }, length: 2286, angle: 0 } },
			z: { attributes: { origin: -457.2, extent: 457.2, length: 914.4, angle: 0 } },
		};

		const so = Smart_Object.deserialize(data);
		const attr = so.attributes_dict_byName['y_max'];

		expect(attr.formula_display).toBe('wall.y_max-6"');
		expect(attr.compiled).not.toBeNull();
		expect(attr.compiled!.type).toBe('binary');
	});

	it('round-trips: serialize → deserialize preserves formulas', () => {
		const wall = add_so('wall', { y_max: 2438.4 });
		const door = add_so('door');

		const formula = `${ref(wall, 'y_max')} - 6"`;
		const untokenized = `${ref(wall, 'y_max')}-6"`;
		constraints.set_formula(door, 'y_max', formula);
		const data = door.serialize();

		// Formula pre-empts value: only formula is serialized (untokenized string)
		const extent = data.y.attributes.extent;
		expect(typeof extent === 'object' && extent.formula).toBe(untokenized);
		expect(typeof extent === 'object' && extent.value).toBeUndefined();

		const restored = Smart_Object.deserialize(data);
		scene.create({ so: restored, edges: cube_edges });
		constraints.propagate_all();
		const attr = restored.attributes_dict_byName['y_max'];

		expect(attr.formula_display).toBe(untokenized);
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

	it('resolve: d → depth (y_max - y_min)', () => {
		const wall = add_so('wall', { y_min: 0, y_max: 2438.4 });
		expect(constraints.resolve(wall.id, 'd')).toBeCloseTo(2438.4);
	});

	it('resolve: h → height (z_max - z_min)', () => {
		const box = add_so('box', { z_min: -300, z_max: 300 });
		expect(constraints.resolve(box.id, 'h')).toBeCloseTo(600);
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
// DOT-PREFIX → PARENT REFERENCE (.x = parent)
// ═══════════════════════════════════════════════════════════════════

describe('dot-prefix attribute with parent binding', () => {

	it('.x * 2 with parent_id resolves to parent.x_min * 2', () => {
		const parent = add_so('parent', { x_min: 100, x_max: 500 });
		const child = add_so('child');

		const error = constraints.set_formula(child, 'x_min', '.x * 2', parent.id);
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

	it('mixed: .x + A.X resolves dot-prefix to parent, dotted to named SO', () => {
		const parent = add_so('parent', { x_min: 100, x_max: 500 });
		const a = add_so('A', { x_max: 800 });
		const child = add_so('child');

		const error = constraints.set_formula(child, 'x_min', `.x + ${a.id}.X`, parent.id);
		expect(error).toBeNull();
		// parent.x_min(100) + A.x_max(800) = 900
		expect(child.x_min).toBeCloseTo(900);
	});

	it('.w alias through formula: .w * 2 with parent', () => {
		const parent = add_so('parent', { x_min: 100, x_max: 500 });
		const child = add_so('child');

		const error = constraints.set_formula(child, 'x_min', '.w * 2', parent.id);
		expect(error).toBeNull();
		// parent width = 400, so child.x_min = 800
		expect(child.x_min).toBeCloseTo(800);
	});

	it('dot-prefix attribute without parent_id compiles but object stays empty', () => {
		const child = add_so('child');
		// No parent_id → dot-prefix ref object is '' → resolve('', 'x') → find_so('') → null → 0
		const error = constraints.set_formula(child, 'x_min', '.x * 2');
		expect(error).toBeNull();
		expect(child.x_min).toBeCloseTo(0); // can't resolve '' SO
	});

	it('propagates through dot-prefix formula', () => {
		const parent = add_so('parent', { x_min: 100, x_max: 500 });
		const child = add_so('child');

		constraints.set_formula(child, 'x_min', '.x * 2', parent.id);
		expect(child.x_min).toBeCloseTo(200);

		parent.set_bound('x_min', 250);
		constraints.propagate(parent);
		expect(child.x_min).toBeCloseTo(500);
	});

	it('.w on X row gives parent width, not self width', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 1000, y_min: 0, y_max: 600 });
		const child = add_so('child', { x_min: 0, x_max: 200, y_min: 0, y_max: 100 });

		// child.x_max = .w → parent's width (1000), not child's width (200)
		const error = constraints.set_formula(child, 'x_max', '.w', parent.id);
		expect(error).toBeNull();
		expect(child.x_max).toBeCloseTo(1000); // parent's width
	});

	it('.w on X row after add_child_so flow gives parent width', () => {
		// Simulate full add_child_so: parent 2' wide, child 3/4" wide
		const parent = add_so('parent', { x_min: 0, x_max: 609.6 });  // 2 feet
		const child = add_so('child', { x_min: 0, x_max: 19.05 });     // 3/4 inch

		// Wire child min bound formula (like add_child_so does)
		constraints.set_formula(child, 'x_min', `${parent.id}.x_min`);

		// Now user types .w in the X formula cell → commit_formula flow
		const parent_id = parent.id;  // simulates selected_so.scene?.parent?.so.id
		const error = constraints.set_formula(child, 'x_max', '.w', parent_id);
		expect(error).toBeNull();

		// Should be parent width (609.6 = 2'), NOT child width (19.05 = 3/4")
		expect(child.x_max).toBeCloseTo(609.6);

		// After propagation, value should persist
		constraints.propagate(child);
		expect(child.x_max).toBeCloseTo(609.6);
	});

	it('use case 2: X = .w → self X should equal parent width exactly', () => {
		// Parent is 2' wide (x_min=0, x_max=609.6)
		// Child starts at parent origin with some small size
		const parent = add_so('parent', { x_min: 0, x_max: 609.6 });
		const child = add_so('child', { x_min: 0, x_max: 57.15 }); // 2 1/4"

		// Wire child x_min to parent (like add_child_so)
		constraints.set_formula(child, 'x_min', `${parent.id}.x_min`);

		// User types .w in the X row → commit_formula('x_max', '.w')
		const error = constraints.set_formula(child, 'x_max', '.w', parent.id);
		expect(error).toBeNull();

		// x_max should be EXACTLY parent width = 609.6 (2'), NOT 609.6 + 57.15
		expect(child.x_max).toBeCloseTo(609.6);

		// After propagation (as commit_formula does), still 609.6
		constraints.propagate(child);
		expect(child.x_max).toBeCloseTo(609.6);
	});
});

// ═══════════════════════════════════════════════════════════════════
// BARE ATTRIBUTE → SELF REFERENCE (x = self)
// ═══════════════════════════════════════════════════════════════════

describe('bare attribute (self reference)', () => {

	it('x * 2 resolves to self.x_min * 2', () => {
		const so = add_so('box', { x_min: 150 });
		const error = constraints.set_formula(so, 'x_max', 'x * 2');
		expect(error).toBeNull();
		expect(so.x_max).toBeCloseTo(300);
	});

	it('w resolves to self width', () => {
		add_so('box', { x_min: 100, x_max: 500 });
		const child = add_so('child', { x_min: 0, x_max: 200 });
		// bare w in child's formula → self.width (child's width)
		const error = constraints.set_formula(child, 'y_max', 'w');
		expect(error).toBeNull();
		expect(child.y_max).toBeCloseTo(200); // child's width
	});

	it('mixed: .x + x resolves dot-prefix to parent, bare to self', () => {
		const parent = add_so('parent', { x_min: 100, x_max: 500 });
		const child = add_so('child', { x_min: 50, x_max: 200 });

		// .x → parent.x_min (100), x → self.x_min (50)
		const error = constraints.set_formula(child, 'y_max', '.x + x', parent.id);
		expect(error).toBeNull();
		expect(child.y_max).toBeCloseTo(150); // 100 + 50
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

	it('invariant formula for x (X - w) evaluates correctly with self binding', () => {
		const so = add_so('box', { x_min: 100, x_max: 500 });

		// Set invariant formula: x = X - w → should resolve to self.x_max - self.width
		// X = 500, w = 400, so x = 500 - 400 = 100
		const formula = constraints.invariant_formula_for('x')!;
		const error = constraints.set_formula(so, 'x_min', formula, so.id);
		expect(error).toBeNull();
		expect(so.x_min).toBeCloseTo(100);
	});

	it('invariant formula recomputes when siblings change', () => {
		const so = add_so('box', { x_min: 100, x_max: 500 });

		// x is invariant: x = X - w (self-referencing via bare aliases)
		const formula = constraints.invariant_formula_for('x')!;
		constraints.set_formula(so, 'x_min', formula, so.id);

		// Change x_max → x_min should recompute
		so.set_bound('x_max', 700);
		constraints.propagate(so);
		// X = 700, w = 700 - 100 = 600
		// evaluate: resolve(so.id, 'X') - resolve(so.id, 'w')
		// = so.x_max - (so.x_max - so.x_min) = so.x_min
		// So x_min stays at 100 — the identity holds.
		expect(so.x_min).toBeCloseTo(100);
	});
});

// ═══════════════════════════════════════════════════════════════════
// INVARIANT ENFORCEMENT (enforce_invariants)
// ═══════════════════════════════════════════════════════════════════

describe('enforce_invariants', () => {

	it('invariant=0 (start): start = end - length', () => {
		const so = add_so('box', { x_min: 0, x_max: 500 });
		// Set width attribute to 200
		so.axes[0].length.value = 200;
		// Mark start as invariant
		so.axes[0].invariant = 0;
		constraints.enforce_invariants(so);
		// start = end(500) - length(200) = 300
		expect(so.x_min).toBeCloseTo(300);
	});

	it('invariant=1 (end): end = start + length', () => {
		const so = add_so('box', { x_min: 100, x_max: 500 });
		so.axes[0].length.value = 300;
		so.axes[0].invariant = 1;
		constraints.enforce_invariants(so);
		// end = start(100) + length(300) = 400
		expect(so.x_max).toBeCloseTo(400);
	});

	it('invariant=2 (length): length = end - start', () => {
		const so = add_so('box', { x_min: 100, x_max: 500 });
		so.axes[0].length.value = 999; // stale
		so.axes[0].invariant = 2;
		constraints.enforce_invariants(so);
		// length = end(500) - start(100) = 400
		expect(so.axes[0].length.value).toBeCloseTo(400);
	});

	it('does not override attribute with explicit user formula', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 1000 });
		const child = add_so('child', { x_min: 0, x_max: 200 });
		// User sets explicit formula on x_min
		constraints.set_formula(child, 'x_min', `${parent.id}.x`, parent.id);
		// Mark start as invariant — should NOT override the formula
		child.axes[0].invariant = 0;
		constraints.enforce_invariants(child);
		// x_min should still be from formula: parent.x_min = 0
		expect(child.x_min).toBeCloseTo(0);
	});

	it('set_formula triggers enforce_invariants: x invariant recomputes after X formula set', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 609.6 });  // 2 feet
		const child = add_so('child', { x_min: 0, x_max: 19.05 });     // 3/4 inch
		// width attr = 19.05
		child.axes[0].length.value = 19.05;
		// Mark x (start) as invariant
		child.axes[0].invariant = 0;

		// User sets X = .w (parent width)
		const error = constraints.set_formula(child, 'x_max', '.w', parent.id);
		expect(error).toBeNull();
		// X should be parent width = 609.6
		expect(child.x_max).toBeCloseTo(609.6);
		// x = X - w = 609.6 - 19.05 = 590.55 (invariant enforcement)
		expect(child.x_min).toBeCloseTo(590.55);
	});

	it('propagate enforces invariants on changed SO', () => {
		const so = add_so('box', { x_min: 0, x_max: 200 });
		so.axes[0].invariant = 0; // start is invariant
		// Directly change x_max (simulates drag) — set_bound syncs length
		so.set_bound('x_max', 500);
		// Manually set length to 200 AFTER set_bound to test enforcement
		so.axes[0].length.value = 200;
		constraints.propagate(so);
		// start = end(500) - length(200) = 300
		expect(so.x_min).toBeCloseTo(300);
	});

	it('enforces invariants on all three axes independently', () => {
		const so = add_so('box', {
			x_min: 0, x_max: 100,
			y_min: 0, y_max: 200,
			z_min: 0, z_max: 300,
		});
		// x: invariant=0, y: invariant=1, z: invariant=2
		so.axes[0].invariant = 0;
		so.axes[1].invariant = 1;
		so.axes[2].invariant = 2;
		// Change endpoints (set_bound syncs length automatically)
		so.set_bound('x_max', 500);
		so.set_bound('y_min', 50);
		so.set_bound('z_min', 10);
		so.set_bound('z_max', 400);
		// Set length values AFTER set_bound to test enforcement
		so.axes[0].length.value = 100;
		so.axes[1].length.value = 200;
		// z: invariant=2, length will be computed by enforce_invariants
		constraints.enforce_invariants(so);
		// x: start = end(500) - length(100) = 400
		expect(so.x_min).toBeCloseTo(400);
		// y: end = start(50) + length(200) = 250
		expect(so.y_max).toBeCloseTo(250);
		// z: length = end(400) - start(10) = 390
		expect(so.axes[2].length.value).toBeCloseTo(390);
	});
});

// ═══════════════════════════════════════════════════════════════════
// CONTEXTUAL ALIASES (s, e, l)
// ═══════════════════════════════════════════════════════════════════

describe('contextual aliases (s, e, l)', () => {

	it('s on x-axis attribute resolves to x_min (self start)', () => {
		const so = add_so('box', { x_min: 100, x_max: 500 });
		// Formula on x_max: s → self.x (x_min) → 100
		const error = constraints.set_formula(so, 'x_max', 's * 3');
		expect(error).toBeNull();
		expect(so.x_max).toBeCloseTo(300);
	});

	it('e on y-axis attribute resolves to y_max (self end)', () => {
		const so = add_so('box', { x_min: 0, x_max: 200, y_min: 0, y_max: 600 });
		// Formula on y_min: e → self.Y (y_max) → 600
		const error = constraints.set_formula(so, 'y_min', 'e - 100');
		expect(error).toBeNull();
		expect(so.y_min).toBeCloseTo(500);
	});

	it('l on z-axis attribute resolves to height (self length)', () => {
		const so = add_so('box', { z_min: 0, z_max: 400 });
		// Formula on z_min: l → self.h (height) → 400
		const error = constraints.set_formula(so, 'z_min', 'l / 2');
		expect(error).toBeNull();
		expect(so.z_min).toBeCloseTo(200);
	});

	it('.l on x-axis attribute resolves to parent width', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 1000 });
		const child = add_so('child', { x_min: 0, x_max: 100 });
		// Formula on x_max: .l → parent.w (width) → 1000
		const error = constraints.set_formula(child, 'x_max', '.l', parent.id);
		expect(error).toBeNull();
		expect(child.x_max).toBeCloseTo(1000);
	});

	it('.s on y-axis attribute resolves to parent y_min', () => {
		const parent = add_so('parent', { y_min: 50, y_max: 800 });
		const child = add_so('child');
		// Formula on y_max: .s → parent.y (y_min) → 50
		const error = constraints.set_formula(child, 'y_max', '.s + 200', parent.id);
		expect(error).toBeNull();
		expect(child.y_max).toBeCloseTo(250);
	});

	it('.e on z-axis attribute resolves to parent z_max', () => {
		const parent = add_so('parent', { z_min: 0, z_max: 900 });
		const child = add_so('child');
		// Formula on z_max: .e → parent.Z (z_max) → 900
		const error = constraints.set_formula(child, 'z_max', '.e', parent.id);
		expect(error).toBeNull();
		expect(child.z_max).toBeCloseTo(900);
	});

	it('l on width attribute resolves to self width (same axis)', () => {
		const so = add_so('box', { x_min: 0, x_max: 300 });
		// Formula on width: l → self.w (width) → 300
		const error = constraints.set_formula(so, 'width', 'l + 50');
		expect(error).toBeNull();
		expect(so.axes[0].length.value).toBeCloseTo(350);
	});

	it('.l - 2 is axis-agnostic: same formula works on x, y, z', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 500, y_min: 0, y_max: 300, z_min: 0, z_max: 800 });
		const child = add_so('child');

		// Same formula ".l - 50" applied to different axes → each gets parent's length for that axis
		constraints.set_formula(child, 'width',  '.l - 50', parent.id);
		constraints.set_formula(child, 'depth',  '.l - 50', parent.id);
		constraints.set_formula(child, 'height', '.l - 50', parent.id);

		expect(child.axes[0].length.value).toBeCloseTo(450);  // parent width 500 - 50
		expect(child.axes[1].length.value).toBeCloseTo(250);  // parent depth 300 - 50
		expect(child.axes[2].length.value).toBeCloseTo(750);  // parent height 800 - 50
	});

	it('existing aliases still work alongside contextual aliases', () => {
		const so = add_so('box', { x_min: 100, x_max: 500 });
		// Mix old alias (w) with contextual alias (s) on same x-axis attribute
		const error = constraints.set_formula(so, 'x_max', 's + w');
		expect(error).toBeNull();
		// s → x (100), w → width (400), so x_max = 500
		expect(so.x_max).toBeCloseTo(500);
	});

	it('propagation works through contextual aliases', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 600 });
		const child = add_so('child');

		constraints.set_formula(child, 'x_max', '.l', parent.id);
		expect(child.x_max).toBeCloseTo(600);

		// Change parent width
		parent.set_bound('x_max', 1000);
		constraints.propagate(parent);
		expect(child.x_max).toBeCloseTo(1000);
	});
});

// ═══════════════════════════════════════════════════════════════════
// AXIS-QUALIFIED REFERENCES (y.l, .z.s)
// ═══════════════════════════════════════════════════════════════════

describe('axis-qualified references', () => {

	it('y.l on x-axis attribute resolves to self depth (cross-axis)', () => {
		const so = add_so('box', { x_min: 0, x_max: 200, y_min: 0, y_max: 600 });
		// Formula on x_max: y.l → self.d (depth) → 600
		const error = constraints.set_formula(so, 'x_max', 'y.l');
		expect(error).toBeNull();
		expect(so.x_max).toBeCloseTo(600);
	});

	it('z.s on x-axis attribute resolves to self z_min (cross-axis)', () => {
		const so = add_so('box', { x_min: 0, x_max: 200, z_min: 50, z_max: 400 });
		// Formula on x_max: z.s → self.z (z_min) → 50
		const error = constraints.set_formula(so, 'x_max', 'z.s + 100');
		expect(error).toBeNull();
		expect(so.x_max).toBeCloseTo(150);
	});

	it('x.e on z-axis attribute resolves to self x_max (cross-axis)', () => {
		const so = add_so('box', { x_min: 0, x_max: 800, z_min: 0, z_max: 100 });
		// Formula on z_max: x.e → self.X (x_max) → 800
		const error = constraints.set_formula(so, 'z_max', 'x.e / 2');
		expect(error).toBeNull();
		expect(so.z_max).toBeCloseTo(400);
	});

	it('.y.l on x-axis attribute resolves to parent depth (cross-axis parent)', () => {
		const parent = add_so('parent', { x_min: 0, x_max: 500, y_min: 0, y_max: 300 });
		const child = add_so('child');
		// Formula on x_max: .y.l → parent.d (depth) → 300
		const error = constraints.set_formula(child, 'x_max', '.y.l', parent.id);
		expect(error).toBeNull();
		expect(child.x_max).toBeCloseTo(300);
	});

	it('.z.e on y-axis attribute resolves to parent z_max (cross-axis parent)', () => {
		const parent = add_so('parent', { z_min: 0, z_max: 900 });
		const child = add_so('child');
		// Formula on y_max: .z.e → parent.Z (z_max) → 900
		const error = constraints.set_formula(child, 'y_max', '.z.e', parent.id);
		expect(error).toBeNull();
		expect(child.y_max).toBeCloseTo(900);
	});

	it('.x.s on z-axis attribute resolves to parent x_min (cross-axis parent)', () => {
		const parent = add_so('parent', { x_min: 100, x_max: 500 });
		const child = add_so('child');
		// Formula on z_min: .x.s → parent.x (x_min) → 100
		const error = constraints.set_formula(child, 'z_min', '.x.s + 50', parent.id);
		expect(error).toBeNull();
		expect(child.z_min).toBeCloseTo(150);
	});

	it('tokenizer round-trips .y.l correctly', () => {
		const parent = add_so('parent', { y_min: 0, y_max: 400 });
		const child = add_so('child');
		constraints.set_formula(child, 'x_max', '.y.l - 50', parent.id);
		const attr = child.attributes_dict_byName['x_max'];
		expect(attr.formula_display).toBe('.y.l-50');
	});

	it('tokenizer round-trips y.l correctly', () => {
		const so = add_so('box', { y_min: 0, y_max: 600 });
		constraints.set_formula(so, 'x_max', 'y.l * 2');
		const attr = so.attributes_dict_byName['x_max'];
		expect(attr.formula_display).toBe('y.l*2');
	});

	it('propagation works through axis-qualified parent reference', () => {
		const parent = add_so('parent', { y_min: 0, y_max: 400 });
		const child = add_so('child');
		constraints.set_formula(child, 'x_max', '.y.l', parent.id);
		expect(child.x_max).toBeCloseTo(400);

		parent.set_bound('y_max', 700);
		constraints.propagate(parent);
		expect(child.x_max).toBeCloseTo(700);
	});
});

// ═══════════════════════════════════════════════════════════════════
// TRANSLATE FORMULAS
// ═══════════════════════════════════════════════════════════════════

describe('translate_formulas', () => {

	// ── same-axis bare ──

	it('x-axis: X - x → e - s round-trips', () => {
		const so = add_so('box', { x_min: 100, x_max: 500 });
		constraints.set_formula(so, 'width', 'X - x');
		constraints.translate_formulas(so, 'agnostic');
		expect(so.attributes_dict_byName['width'].formula_display).toBe('e-s');
		constraints.translate_formulas(so, 'explicit');
		expect(so.attributes_dict_byName['width'].formula_display).toBe('X-x');
	});

	it('y-axis: Y - y → e - s round-trips', () => {
		const so = add_so('box', { y_min: 50, y_max: 400 });
		constraints.set_formula(so, 'depth', 'Y - y');
		constraints.translate_formulas(so, 'agnostic');
		expect(so.attributes_dict_byName['depth'].formula_display).toBe('e-s');
		constraints.translate_formulas(so, 'explicit');
		expect(so.attributes_dict_byName['depth'].formula_display).toBe('Y-y');
	});

	it('z-axis: z + h → s + l round-trips', () => {
		const so = add_so('box', { z_min: 0, z_max: 300 });
		constraints.set_formula(so, 'z_max', 'z + h');
		constraints.translate_formulas(so, 'agnostic');
		expect(so.attributes_dict_byName['z_max'].formula_display).toBe('s+l');
		constraints.translate_formulas(so, 'explicit');
		expect(so.attributes_dict_byName['z_max'].formula_display).toBe('z+h');
	});

	// ── cross-axis ──

	it('cross-axis: d on x-axis → y.l round-trips', () => {
		const so = add_so('box', { x_min: 0, x_max: 200, y_min: 0, y_max: 600 });
		constraints.set_formula(so, 'x_max', 'd');
		constraints.translate_formulas(so, 'agnostic');
		expect(so.attributes_dict_byName['x_max'].formula_display).toBe('y.l');
		constraints.translate_formulas(so, 'explicit');
		expect(so.attributes_dict_byName['x_max'].formula_display).toBe('d');
	});

	it('cross-axis: Z on y-axis → z.e round-trips', () => {
		const so = add_so('box', { y_min: 0, y_max: 200, z_min: 0, z_max: 800 });
		constraints.set_formula(so, 'y_max', 'Z');
		constraints.translate_formulas(so, 'agnostic');
		expect(so.attributes_dict_byName['y_max'].formula_display).toBe('z.e');
		constraints.translate_formulas(so, 'explicit');
		expect(so.attributes_dict_byName['y_max'].formula_display).toBe('Z');
	});

	// ── dot-prefix ──

	it('parent same-axis: .x on x-axis → .s round-trips', () => {
		const parent = add_so('parent', { x_min: 100, x_max: 500 });
		const child = add_so('child');
		constraints.set_formula(child, 'x_min', '.x', parent.id);
		constraints.translate_formulas(child, 'agnostic');
		expect(child.attributes_dict_byName['x_min'].formula_display).toBe('.s');
		constraints.translate_formulas(child, 'explicit');
		expect(child.attributes_dict_byName['x_min'].formula_display).toBe('.x');
	});

	it('parent cross-axis: .d on x-axis → .y.l round-trips', () => {
		const parent = add_so('parent', { y_min: 0, y_max: 300 });
		const child = add_so('child');
		constraints.set_formula(child, 'x_max', '.d', parent.id);
		constraints.translate_formulas(child, 'agnostic');
		expect(child.attributes_dict_byName['x_max'].formula_display).toBe('.y.l');
		constraints.translate_formulas(child, 'explicit');
		expect(child.attributes_dict_byName['x_max'].formula_display).toBe('.d');
	});

	// ── explicit SO refs ──

	it('explicit SO ref same-axis: SOID.x on x-axis → SOID.s round-trips', () => {
		const other = add_so('other', { x_min: 200, x_max: 800 });
		const so = add_so('box');
		constraints.set_formula(so, 'x_min', other.id + '.x');
		constraints.translate_formulas(so, 'agnostic');
		expect(so.attributes_dict_byName['x_min'].formula_display).toBe(other.id + '.s');
		constraints.translate_formulas(so, 'explicit');
		expect(so.attributes_dict_byName['x_min'].formula_display).toBe(other.id + '.x');
	});

	it('explicit SO ref cross-axis: SOID.d on x-axis stays (no 3-part form)', () => {
		const other = add_so('other', { y_min: 0, y_max: 600 });
		const so = add_so('box');
		constraints.set_formula(so, 'x_max', other.id + '.d');
		constraints.translate_formulas(so, 'agnostic');
		// can't represent SOID.y.l — stays as SOID.d
		expect(so.attributes_dict_byName['x_max'].formula_display).toBe(other.id + '.d');
	});

	// ── invariant agnostic ──

	it('invariant_formula_for returns agnostic forms', () => {
		expect(constraints.invariant_formula_for('x', 'agnostic')).toBe('e - l');
		expect(constraints.invariant_formula_for('y', 'agnostic')).toBe('e - l');
		expect(constraints.invariant_formula_for('z', 'agnostic')).toBe('e - l');
		expect(constraints.invariant_formula_for('X', 'agnostic')).toBe('s + l');
		expect(constraints.invariant_formula_for('Y', 'agnostic')).toBe('s + l');
		expect(constraints.invariant_formula_for('Z', 'agnostic')).toBe('s + l');
		expect(constraints.invariant_formula_for('w', 'agnostic')).toBe('e - s');
		expect(constraints.invariant_formula_for('d', 'agnostic')).toBe('e - s');
		expect(constraints.invariant_formula_for('h', 'agnostic')).toBe('e - s');
	});

	it('invariant_formula_for explicit mode unchanged', () => {
		expect(constraints.invariant_formula_for('x')).toBe('X - w');
		expect(constraints.invariant_formula_for('w')).toBe('X - x');
		expect(constraints.invariant_formula_for('X')).toBe('x + w');
	});

	// ── mixed mode normalization ──

	it('mixed explicit+agnostic normalizes to agnostic', () => {
		const so = add_so('box', { x_min: 0, x_max: 400, y_min: 0, y_max: 200 });
		// Set one formula explicit, one agnostic
		constraints.set_formula(so, 'width', 'X - x');  // explicit
		constraints.set_formula(so, 'depth', 'e - s');   // already agnostic
		constraints.translate_formulas(so, 'agnostic');
		expect(so.attributes_dict_byName['width'].formula_display).toBe('e-s');
		expect(so.attributes_dict_byName['depth'].formula_display).toBe('e-s'); // untouched
	});

	// ── values unchanged ──

	it('values unchanged after translate', () => {
		const so = add_so('box', { x_min: 100, x_max: 500 });
		constraints.set_formula(so, 'width', 'X - x');
		const before = so.width;
		constraints.translate_formulas(so, 'agnostic');
		expect(so.width).toBe(before);
	});
});
