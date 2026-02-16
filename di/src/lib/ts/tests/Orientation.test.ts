import { describe, it, expect, beforeEach } from 'vitest';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { constraints, orientation } from '../algebra';
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

/** Build a formula reference using SO's internal id */
function ref(so: Smart_Object, attr: string): string { return `${so.id}.${attr}`; }

beforeEach(() => {
	scene.clear();
});

// ═══════════════════════════════════════════════════════════════════
// ORIENTATION FROM BOUNDS
// ═══════════════════════════════════════════════════════════════════

describe('orientation_from_bounds', () => {

	it('flat box with zero height returns identity (no angle to compute)', () => {
		const so = add_so('box', { x_min: 0, x_max: 100, y_min: 0, y_max: 0, z_min: 0, z_max: 10 });
		const q = orientation.from_bounds(so);
		// One axis in the plane is zero → identity
		expect(q[3]).toBeCloseTo(1);
	});

	it('non-square box computes angle from non-thin axes', () => {
		// 100×50 with thin z → atan2(50, 100) ≈ 26.57°
		const so = add_so('box', { x_min: 0, x_max: 100, y_min: 0, y_max: 50, z_min: 0, z_max: 10 });
		const q = orientation.from_bounds(so);
		const angle = 2 * Math.acos(Math.abs(q[3]));
		expect(angle).toBeCloseTo(Math.atan2(50, 100));
	});

	it('equal XY with thin Z gives 45° around Z', () => {
		const so = add_so('diag', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 10 });
		const q = orientation.from_bounds(so);
		const angle = 2 * Math.acos(Math.abs(q[3]));
		expect(angle).toBeCloseTo(Math.PI / 4); // 45°
		// Rotation axis should be Z
		const axis = [0, 0, 0];
		quat.getAxisAngle(axis, q);
		expect(Math.abs(axis[2])).toBeCloseTo(1, 1);
	});

	it('equal XZ with thin Y gives 45° around Y', () => {
		const so = add_so('diag', { x_min: 0, x_max: 100, y_min: 0, y_max: 10, z_min: 0, z_max: 100 });
		const q = orientation.from_bounds(so);
		const angle = 2 * Math.acos(Math.abs(q[3]));
		expect(angle).toBeCloseTo(Math.PI / 4); // 45°
		const axis = [0, 0, 0];
		quat.getAxisAngle(axis, q);
		expect(Math.abs(axis[1])).toBeCloseTo(1, 1);
	});

	it('equal YZ with thin X gives 45° around X', () => {
		const so = add_so('diag', { x_min: 0, x_max: 10, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const q = orientation.from_bounds(so);
		const angle = 2 * Math.acos(Math.abs(q[3]));
		expect(angle).toBeCloseTo(Math.PI / 4); // 45°
		const axis = [0, 0, 0];
		quat.getAxisAngle(axis, q);
		expect(Math.abs(axis[0])).toBeCloseTo(1, 1);
	});

	it('30° staircase in XY (thin Z)', () => {
		// tan(30°) = y/x ≈ 0.577, so y ≈ 57.7 when x = 100
		const so = add_so('stair', { x_min: 0, x_max: 100, y_min: 0, y_max: 57.735, z_min: 0, z_max: 10 });
		const q = orientation.from_bounds(so);
		const angle = 2 * Math.acos(Math.abs(q[3]));
		expect(angle).toBeCloseTo(Math.PI / 6, 2); // 30°
	});
});

// ═══════════════════════════════════════════════════════════════════
// USE CASE S — VARIABLE (STAIRCASE)
// ═══════════════════════════════════════════════════════════════════

describe('use case S — staircase', () => {

	it('staircase orientation does NOT change when parent stretches', () => {
		const room = add_so('R', { x_min: 0, x_max: 1000, y_min: 0, y_max: 1000, z_min: 0, z_max: 200 });
		const stair = add_so('S', { z_min: 0, z_max: 10 });

		constraints.set_formula(stair, 'x_min', ref(room, 'x_min'));
		constraints.set_formula(stair, 'x_max', ref(room, 'x_max'));
		constraints.set_formula(stair, 'y_min', ref(room, 'y_min'));
		constraints.set_formula(stair, 'y_max', ref(room, 'y_max'));
		constraints.set_formula(stair, 'z_min', ref(room, 'z_min'));

		// Record angles before stretch
		const angles_before = stair.axes.map(a => a.angle.value);

		// Stretch room wider
		room.set_bound('x_max', 2000);
		constraints.propagate(room);

		// Angles must NOT change — propagation does not recompute orientation
		for (let i = 0; i < 3; i++) {
			expect(stair.axes[i].angle.value).toBe(angles_before[i]);
		}
	});

});

// ═══════════════════════════════════════════════════════════════════
// USE CASE W — FIXED (WALL)
// ═══════════════════════════════════════════════════════════════════

describe('use case W — wall', () => {

	it('wall keeps angle and length when parent stretches', () => {
		const room = add_so('R', { x_min: 0, x_max: 1000, y_min: 0, y_max: 1000, z_min: 0, z_max: 200 });
		const wall = add_so('W', { x_min: 0, x_max: 200, y_min: 0, y_max: 200, z_min: 0, z_max: 200 });

		// Pin one corner to room origin
		constraints.set_formula(wall, 'x_min', ref(room, 'x_min'));
		constraints.set_formula(wall, 'y_min', ref(room, 'y_min'));
		constraints.set_formula(wall, 'z_min', ref(room, 'z_min'));
		// Max bounds are literals — don't reference room
		constraints.set_formula(wall, 'x_max', `${ref(room, 'x_min')} + 200`);
		constraints.set_formula(wall, 'y_max', `${ref(room, 'y_min')} + 200`);
		constraints.set_formula(wall, 'z_max', `${ref(room, 'z_min')} + 200`);

		// Stretch room
		room.set_bound('x_max', 2000);
		constraints.propagate(room);

		// Wall dimensions unchanged — still 200×200×200
		expect(wall.width).toBeCloseTo(200);
		expect(wall.height).toBeCloseTo(200);
		expect(wall.depth).toBeCloseTo(200);

		// Wall origin moved with room (room.x_min is still 0)
		expect(wall.x_min).toBeCloseTo(0);
	});

	it('wall slides when parent origin moves', () => {
		const room = add_so('R', { x_min: 0, x_max: 1000, y_min: 0, y_max: 1000, z_min: 0, z_max: 200 });
		const wall = add_so('W', { x_min: 0, x_max: 200, y_min: 0, y_max: 200, z_min: 0, z_max: 200 });

		constraints.set_formula(wall, 'x_min', ref(room, 'x_min'));
		constraints.set_formula(wall, 'y_min', ref(room, 'y_min'));
		constraints.set_formula(wall, 'x_max', `${ref(room, 'x_min')} + 200`);
		constraints.set_formula(wall, 'y_max', `${ref(room, 'y_min')} + 200`);

		// Move room origin
		room.set_bound('x_min', 500);
		constraints.propagate(room);

		// Wall should have slid
		expect(wall.x_min).toBeCloseTo(500);
		expect(wall.x_max).toBeCloseTo(700);
		expect(wall.width).toBeCloseTo(200);
	});
});

// ═══════════════════════════════════════════════════════════════════
// RECOMPUTE MAX BOUNDS FROM ROTATION
// ═══════════════════════════════════════════════════════════════════

describe('recompute_max_bounds_from_rotation', () => {

	it('45° around Z redistributes XY while preserving diagonal length', () => {
		const so = add_so('wall', { x_min: 0, x_max: 100, y_min: 0, y_max: 0, z_min: 0, z_max: 10 });
		// Set 45° around Z
		so.set_rotation('z', Math.PI / 4);
		orientation.recompute_max_bounds(so);

		// Original length was 100 along x. After 45° rotation:
		// x_max = cos(45°) * 100 ≈ 70.71
		// y_max = sin(45°) * 100 ≈ 70.71
		expect(so.x_max).toBeCloseTo(70.71, 1);
		expect(so.y_max).toBeCloseTo(70.71, 1);
		// Origin preserved
		expect(so.x_min).toBeCloseTo(0);
		expect(so.y_min).toBeCloseTo(0);
		// Z unchanged
		expect(so.z_max).toBeCloseTo(10);
	});

	it('30° around Z', () => {
		const so = add_so('wall', { x_min: 0, x_max: 200, y_min: 0, y_max: 0, z_min: 0, z_max: 10 });
		so.set_rotation('z', Math.PI / 6);
		orientation.recompute_max_bounds(so);

		expect(so.x_max).toBeCloseTo(200 * Math.cos(Math.PI / 6), 1);
		expect(so.y_max).toBeCloseTo(200 * Math.sin(Math.PI / 6), 1);
	});

	it('preserves diagonal length', () => {
		const so = add_so('wall', { x_min: 0, x_max: 300, y_min: 0, y_max: 100, z_min: 0, z_max: 10 });
		const length_before = Math.sqrt(300 * 300 + 100 * 100);

		so.set_rotation('z', Math.PI / 3);
		orientation.recompute_max_bounds(so);

		const length_after = Math.sqrt(
			(so.x_max - so.x_min) ** 2 + (so.y_max - so.y_min) ** 2
		);
		expect(length_after).toBeCloseTo(length_before, 1);
	});
});

