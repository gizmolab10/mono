import { describe, it, expect, beforeEach } from 'vitest';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { constraints } from '../algebra';
import { givens } from '../algebra/Givens';

const cube_edges: [number, number][] = [
	[0, 1], [1, 2], [2, 3], [3, 0],
	[4, 5], [5, 6], [6, 7], [7, 4],
	[0, 4], [1, 5], [2, 6], [3, 7],
];

function make_so(name: string, bounds?: Partial<Record<Bound, number>>): Smart_Object {
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
	givens.clear();
});

// ═══════════════════════════════════════════════════════════════════
// Rule 35 — named values referenced from formulas
// ═══════════════════════════════════════════════════════════════════

describe('named values referenced from formulas', () => {
	it('a formula that names a defined value evaluates to that value', () => {
		givens.add('WALL_HEIGHT', 2400);

		const so = make_so('panel', { y_min: 0, y_max: 100 });
		const error = constraints.set_formula(so, 'y_max', `WALL_HEIGHT`);

		expect(error).toBeNull();
		expect(so.attributes_dict_byName['y_max'].value).toBeCloseTo(2400);
	});

	it('changing the named value and recomputing updates the formula result', () => {
		givens.add('WIDTH', 600);

		const so = make_so('panel', { x_min: 0, x_max: 100 });
		const error = constraints.set_formula(so, 'x_max', `WIDTH`);
		expect(error).toBeNull();
		expect(so.attributes_dict_byName['x_max'].value).toBeCloseTo(600);

		givens.set('WIDTH', 900);
		constraints.propagate_all();

		expect(so.attributes_dict_byName['x_max'].value).toBeCloseTo(900);
	});

	it('an arithmetic formula combining two named values evaluates to the right total', () => {
		givens.add('ALPHA', 100);
		givens.add('BETA', 250);

		const so = make_so('panel', { z_min: 0, z_max: 1 });
		const error = constraints.set_formula(so, 'z_max', `ALPHA + BETA`);

		expect(error).toBeNull();
		expect(so.attributes_dict_byName['z_max'].value).toBeCloseTo(350);
	});

	it('the named values come back from the get-all snapshot the way they were defined', () => {
		givens.add('X', 10);
		givens.add('Y', 20);
		givens.set_locked('X', false);

		const all = givens.get_all();
		const x = all.find(g => g.name === 'X')!;
		const y = all.find(g => g.name === 'Y')!;

		expect(x.value_mm).toBe(10);
		expect(x.locked).toBe(false);
		expect(y.value_mm).toBe(20);
		expect(y.locked).toBe(true);
	});

	// ═══════════════════════════════════════════════════════════════════
	// Rule 46 — a locked named value is protected from reverse propagation
	// ═══════════════════════════════════════════════════════════════════

	it('a locked named value refuses reverse-propagation writes', () => {
		givens.add('CONST', 100);
		givens.set_locked('CONST', true);

		const so = make_so('panel', { x_min: 0, x_max: 50 });
		const error = constraints.set_formula(so, 'x_max', 'CONST');
		expect(error).toBeNull();
		expect(so.attributes_dict_byName['x_max'].value).toBeCloseTo(100);

		// Try to drag x_max to a different value. With the named value unlocked, that drag
		// would normally write the new value back to CONST. With the lock on, the write is refused.
		constraints.try_solve_given(so, 'x_max', 999);

		// CONST is still 100 — the lock kept the named value safe.
		expect(givens.get('CONST')).toBe(100);
	});

	it('an unlocked named value accepts reverse-propagation writes (proves the lock is what stops the write)', () => {
		givens.add('FLEX', 100);
		givens.set_locked('FLEX', false);

		const so = make_so('panel', { x_min: 0, x_max: 50 });
		const error = constraints.set_formula(so, 'x_max', 'FLEX');
		expect(error).toBeNull();

		constraints.try_solve_given(so, 'x_max', 250);

		// FLEX moved to 250 because it was not locked.
		expect(givens.get('FLEX')).toBeCloseTo(250);
	});
});
