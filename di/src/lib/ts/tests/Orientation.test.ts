import { describe, it, expect, beforeEach } from 'vitest';
import Smart_Object from '../runtime/Smart_Object';
import type { Bound } from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { constraints } from '../algebra/Constraints';
import { orientation_from_bounds, recompute_orientation, recompute_max_bounds_from_rotation } from '../algebra/Orientation';
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
// ORIENTATION FROM BOUNDS
// ═══════════════════════════════════════════════════════════════════

describe('orientation_from_bounds', () => {

	it('flat box with zero height returns identity (no angle to compute)', () => {
		const so = add_so('box', { x_min: 0, x_max: 100, y_min: 0, y_max: 0, z_min: 0, z_max: 10 });
		const q = orientation_from_bounds(so);
		// One axis in the plane is zero → identity
		expect(q[3]).toBeCloseTo(1);
	});

	it('non-square box computes angle from non-thin axes', () => {
		// 100×50 with thin z → atan2(50, 100) ≈ 26.57°
		const so = add_so('box', { x_min: 0, x_max: 100, y_min: 0, y_max: 50, z_min: 0, z_max: 10 });
		const q = orientation_from_bounds(so);
		const angle = 2 * Math.acos(Math.abs(q[3]));
		expect(angle).toBeCloseTo(Math.atan2(50, 100));
	});

	it('equal XY with thin Z gives 45° around Z', () => {
		const so = add_so('diag', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 10 });
		const q = orientation_from_bounds(so);
		const angle = 2 * Math.acos(Math.abs(q[3]));
		expect(angle).toBeCloseTo(Math.PI / 4); // 45°
		// Rotation axis should be Z
		const axis = [0, 0, 0];
		quat.getAxisAngle(axis, q);
		expect(Math.abs(axis[2])).toBeCloseTo(1, 1);
	});

	it('equal XZ with thin Y gives 45° around Y', () => {
		const so = add_so('diag', { x_min: 0, x_max: 100, y_min: 0, y_max: 10, z_min: 0, z_max: 100 });
		const q = orientation_from_bounds(so);
		const angle = 2 * Math.acos(Math.abs(q[3]));
		expect(angle).toBeCloseTo(Math.PI / 4); // 45°
		const axis = [0, 0, 0];
		quat.getAxisAngle(axis, q);
		expect(Math.abs(axis[1])).toBeCloseTo(1, 1);
	});

	it('equal YZ with thin X gives 45° around X', () => {
		const so = add_so('diag', { x_min: 0, x_max: 10, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const q = orientation_from_bounds(so);
		const angle = 2 * Math.acos(Math.abs(q[3]));
		expect(angle).toBeCloseTo(Math.PI / 4); // 45°
		const axis = [0, 0, 0];
		quat.getAxisAngle(axis, q);
		expect(Math.abs(axis[0])).toBeCloseTo(1, 1);
	});

	it('30° staircase in XY (thin Z)', () => {
		// tan(30°) = y/x ≈ 0.577, so y ≈ 57.7 when x = 100
		const so = add_so('stair', { x_min: 0, x_max: 100, y_min: 0, y_max: 57.735, z_min: 0, z_max: 10 });
		const q = orientation_from_bounds(so);
		const angle = 2 * Math.acos(Math.abs(q[3]));
		expect(angle).toBeCloseTo(Math.PI / 6, 2); // 30°
	});
});

// ═══════════════════════════════════════════════════════════════════
// USE CASE S — VARIABLE (STAIRCASE)
// ═══════════════════════════════════════════════════════════════════

describe('use case S — variable staircase', () => {

	it('staircase orientation updates when parent stretches', () => {
		const room = add_so('R', { x_min: 0, x_max: 1000, y_min: 0, y_max: 1000, z_min: 0, z_max: 200 });
		const stair = add_so('S', { z_min: 0, z_max: 10 });
		stair.fixed = false; // variable

		// Pin all 4 XY corners to room
		constraints.set_formula(stair, 'x_min', 'R.x_min');
		constraints.set_formula(stair, 'x_max', 'R.x_max');
		constraints.set_formula(stair, 'y_min', 'R.y_min');
		constraints.set_formula(stair, 'y_max', 'R.y_max');
		constraints.set_formula(stair, 'z_min', 'R.z_min');

		// Compute initial orientation from bounds (set_formula doesn't call recompute)
		recompute_orientation(stair);

		// Initially square → 45°
		const angle_before = 2 * Math.acos(Math.abs(stair.orientation[3]));
		expect(angle_before).toBeCloseTo(Math.PI / 4);

		// Stretch room wider → shallower angle
		room.set_bound('x_max', 2000);
		constraints.propagate(room);

		// Now x=2000, y=1000 → atan2(1000, 2000) ≈ 26.57°
		const angle_after = 2 * Math.acos(Math.abs(stair.orientation[3]));
		expect(angle_after).toBeCloseTo(Math.atan2(1000, 2000));
		expect(angle_after).toBeLessThan(angle_before);
	});

	it('staircase orientation updates when parent gets taller', () => {
		const room = add_so('R', { x_min: 0, x_max: 1000, y_min: 0, y_max: 1000, z_min: 0, z_max: 200 });
		const stair = add_so('S', { z_min: 0, z_max: 10 });
		stair.fixed = false;

		constraints.set_formula(stair, 'x_min', 'R.x_min');
		constraints.set_formula(stair, 'x_max', 'R.x_max');
		constraints.set_formula(stair, 'y_min', 'R.y_min');
		constraints.set_formula(stair, 'y_max', 'R.y_max');
		constraints.set_formula(stair, 'z_min', 'R.z_min');
		recompute_orientation(stair);

		// Stretch room taller → steeper angle
		room.set_bound('y_max', 2000);
		constraints.propagate(room);

		// Now x=1000, y=2000 → atan2(2000, 1000) ≈ 63.43°
		const angle = 2 * Math.acos(Math.abs(stair.orientation[3]));
		expect(angle).toBeCloseTo(Math.atan2(2000, 1000));
		expect(angle).toBeGreaterThan(Math.PI / 4); // steeper than 45°
	});

	it('fixed child does NOT get orientation recomputed on propagation', () => {
		const room = add_so('R', { x_min: 0, x_max: 1000, y_min: 0, y_max: 1000, z_min: 0, z_max: 200 });
		const wall = add_so('W');
		wall.fixed = true; // default

		// Set a known orientation
		const rot = quat.create();
		quat.setAxisAngle(rot, [0, 0, 1], Math.PI / 6); // 30°
		quat.copy(wall.orientation, rot);

		constraints.set_formula(wall, 'x_min', 'R.x_min');

		// Stretch room
		room.set_bound('x_max', 2000);
		constraints.propagate(room);

		// Orientation should be unchanged — still 30°
		const angle = 2 * Math.acos(Math.abs(wall.orientation[3]));
		expect(angle).toBeCloseTo(Math.PI / 6);
	});
});

// ═══════════════════════════════════════════════════════════════════
// USE CASE W — FIXED (WALL)
// ═══════════════════════════════════════════════════════════════════

describe('use case W — fixed wall', () => {

	it('wall keeps angle and length when parent stretches', () => {
		const room = add_so('R', { x_min: 0, x_max: 1000, y_min: 0, y_max: 1000, z_min: 0, z_max: 200 });
		const wall = add_so('W', { x_min: 0, x_max: 200, y_min: 0, y_max: 200, z_min: 0, z_max: 200 });
		wall.fixed = true;

		// Pin one corner to room origin
		constraints.set_formula(wall, 'x_min', 'R.x_min');
		constraints.set_formula(wall, 'y_min', 'R.y_min');
		constraints.set_formula(wall, 'z_min', 'R.z_min');
		// Max bounds are literals — don't reference room
		constraints.set_formula(wall, 'x_max', 'R.x_min + 200');
		constraints.set_formula(wall, 'y_max', 'R.y_min + 200');
		constraints.set_formula(wall, 'z_max', 'R.z_min + 200');

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
		wall.fixed = true;

		constraints.set_formula(wall, 'x_min', 'R.x_min');
		constraints.set_formula(wall, 'y_min', 'R.y_min');
		constraints.set_formula(wall, 'x_max', 'R.x_min + 200');
		constraints.set_formula(wall, 'y_max', 'R.y_min + 200');

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
		quat.setAxisAngle(so.orientation, [0, 0, 1], Math.PI / 4);
		recompute_max_bounds_from_rotation(so);

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
		quat.setAxisAngle(so.orientation, [0, 0, 1], Math.PI / 6);
		recompute_max_bounds_from_rotation(so);

		expect(so.x_max).toBeCloseTo(200 * Math.cos(Math.PI / 6), 1);
		expect(so.y_max).toBeCloseTo(200 * Math.sin(Math.PI / 6), 1);
	});

	it('preserves diagonal length', () => {
		const so = add_so('wall', { x_min: 0, x_max: 300, y_min: 0, y_max: 100, z_min: 0, z_max: 10 });
		const length_before = Math.sqrt(300 * 300 + 100 * 100);

		quat.setAxisAngle(so.orientation, [0, 0, 1], Math.PI / 3);
		recompute_max_bounds_from_rotation(so);

		const length_after = Math.sqrt(
			(so.x_max - so.x_min) ** 2 + (so.y_max - so.y_min) ** 2
		);
		expect(length_after).toBeCloseTo(length_before, 1);
	});
});

// ═══════════════════════════════════════════════════════════════════
// SERIALIZE / DESERIALIZE — FIXED FLAG
// ═══════════════════════════════════════════════════════════════════

describe('fixed flag serialization', () => {

	it('fixed=true (default) omits fixed from serialization', () => {
		const so = add_so('box');
		const data = so.serialize();
		expect(data.fixed).toBeUndefined();
	});

	it('fixed=false serializes as fixed: false', () => {
		const so = add_so('stair');
		so.fixed = false;
		const data = so.serialize();
		expect(data.fixed).toBe(false);
	});

	it('deserialize restores fixed=false', () => {
		const data = {
			name: 'stair',
			bounds: { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 10 },
			fixed: false as const,
		};
		const { so } = Smart_Object.deserialize(data);
		expect(so.fixed).toBe(false);
	});

	it('deserialize defaults to fixed=true when omitted', () => {
		const data = {
			name: 'wall',
			bounds: { x_min: 0, x_max: 200, y_min: 0, y_max: 200, z_min: 0, z_max: 10 },
		};
		const { so } = Smart_Object.deserialize(data);
		expect(so.fixed).toBe(true);
	});
});
