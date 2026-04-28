import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { vec3 } from 'gl-matrix';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';

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

const original_snap = Smart_Object.snap;

beforeEach(() => {
	scene.clear();
});

afterEach(() => {
	Smart_Object.snap = original_snap;
});

// ═══════════════════════════════════════════════════════════════════
// Rule 39 — drag results are rounded to the precision grid before storage
// ═══════════════════════════════════════════════════════════════════

describe('drag results round to the precision grid', () => {
	it('an edge drag stores a value rounded by the snap function', () => {
		// Set the snap function to round to the nearest five.
		Smart_Object.snap = (mm: number) => Math.round(mm / 5) * 5;

		const so = make_so('thing', { x_min: 0, x_max: 10, y_min: 0, y_max: 10, z_min: 0, z_max: 10 });

		// Edge index 1 connects two corners that share the same far end across.
		// Face index 0 is the bottom face, whose free directions are across and depth.
		// On that face, dragging the edge moves the far end across.
		// Push the drag 7.4 along across — the snap function should round the result to 15.
		const local_delta = vec3.fromValues(7.4, 0, 0);
		so.apply_edge_drag(1, 0, local_delta);

		expect(so.x_max).toBe(15);
	});

	it('a corner drag stores both moved values rounded by the snap function', () => {
		Smart_Object.snap = (mm: number) => Math.round(mm / 5) * 5;

		const so = make_so('thing', { x_min: 0, x_max: 10, y_min: 0, y_max: 10, z_min: 0, z_max: 10 });

		// Drag the far-far-far corner on the right (+x) face. The free directions on that face are depth and up.
		// Push 1.0 along depth (rounds 11 down to 10) and 7.4 along up (rounds 17.4 down to 15).
		const local_delta = vec3.fromValues(0, 1.0, 7.4);
		so.apply_corner_drag(6, 3, local_delta);

		expect(so.y_max).toBe(10);
		expect(so.z_max).toBe(15);
	});

	it('with the default snap (no rounding), the drag result is the unrounded value', () => {
		// The default snap is the identity function — pass-through, no rounding.
		const so = make_so('thing', { x_min: 0, x_max: 10, y_min: 0, y_max: 10, z_min: 0, z_max: 10 });
		// Edge index 1 + face index 0 → drag changes the across far end. Push 0.5 along across.
		const local_delta = vec3.fromValues(0.5, 0, 0);
		so.apply_edge_drag(1, 0, local_delta);
		expect(so.x_max).toBeCloseTo(10.5);
	});
});
