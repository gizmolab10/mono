import { describe, it, expect, beforeEach } from 'vitest';
import { vec3, quat } from 'gl-matrix';
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
// Rule 33 — rotation is the composition of three per-axis angles, in order
// ═══════════════════════════════════════════════════════════════════

describe('rotation', () => {
	it('a fresh SO has zero rotation on every direction', () => {
		const so = make_so('thing');
		for (const axis of so.axes) {
			expect(axis.angle.value).toBe(0);
		}
	});

	it('with all angles zero, the orientation leaves a pointer unchanged', () => {
		const so = make_so('thing');
		const pointer = vec3.fromValues(1, 0, 0);
		const result = vec3.create();
		vec3.transformQuat(result, pointer, so.orientation);
		expect(result[0]).toBeCloseTo(1, 5);
		expect(result[1]).toBeCloseTo(0, 5);
		expect(result[2]).toBeCloseTo(0, 5);
	});

	it('a quarter turn around the up direction takes a pointer along across to a pointer along depth', () => {
		// In this scene the second axis is named depth (y) and the third is up (z).
		// A quarter turn around up takes a pointer pointing along across (x) to one pointing along the negative third axis or depth — exact direction depends on handedness.
		// Whichever direction it lands in, the across component should be near zero.
		const so = make_so('thing');
		so.axes[2].angle.value = Math.PI / 2;  // quarter turn around the third axis
		const pointer = vec3.fromValues(1, 0, 0);
		const result = vec3.create();
		vec3.transformQuat(result, pointer, so.orientation);
		expect(Math.abs(result[0])).toBeLessThan(0.001);
	});

	it('two quarter turns around different axes give different results when the order is swapped', () => {
		const so = make_so('thing');
		so.axes[0].angle.value = Math.PI / 2;  // quarter turn around the first axis
		so.axes[1].angle.value = Math.PI / 2;  // quarter turn around the second axis

		so.rotation_order = [0, 1, 2];  // first then second
		const q_first_then_second = quat.clone(so.orientation);
		const r_first_then_second = vec3.create();
		vec3.transformQuat(r_first_then_second, vec3.fromValues(1, 0, 0), q_first_then_second);

		so.rotation_order = [1, 0, 2];  // second then first
		const q_second_then_first = quat.clone(so.orientation);
		const r_second_then_first = vec3.create();
		vec3.transformQuat(r_second_then_first, vec3.fromValues(1, 0, 0), q_second_then_first);

		// The two orderings put the rotated pointer in noticeably different places.
		const distance = vec3.distance(r_first_then_second, r_second_then_first);
		expect(distance).toBeGreaterThan(0.5);
	});

	it('a near-zero angle on a direction is treated as no rotation on that direction', () => {
		const so = make_so('thing');
		so.axes[0].angle.value = 1e-12;  // smaller than the orientation getter's threshold
		const pointer = vec3.fromValues(0, 1, 0);
		const result = vec3.create();
		vec3.transformQuat(result, pointer, so.orientation);
		expect(result[0]).toBeCloseTo(0, 5);
		expect(result[1]).toBeCloseTo(1, 5);
		expect(result[2]).toBeCloseTo(0, 5);
	});
});
