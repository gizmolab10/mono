/**
 * 2D grid overlay: projects a spacing-aware grid onto the front face
 * of the root Smart_Object.
 *
 * Extracted from Render.ts — all geometry logic preserved verbatim.
 */

import type { Projected } from '../types/Interfaces';
import type { O_Scene } from '../types/Interfaces';
import type { Axis_Name } from '../types/Types';
import { units, Units } from '../types/Units';
import { hits_3d } from '../managers/Hits_3D';
import { stores } from '../managers/Stores';
import { colors } from '../draw/Colors';
import { vec3 } from 'gl-matrix';
import { mat4 } from 'gl-matrix';
import { get } from 'svelte/store';

/** Subset of Render that Grid needs. Avoids circular import. */
export interface GridHost {
	ctx: CanvasRenderingContext2D;
	project_vertex(v: vec3, world_matrix: mat4): Projected;
	get_world_matrix(obj: O_Scene): mat4;
}

/** Render 2D grid for all scene objects. */
export function render_grid(host: GridHost, objects: O_Scene[]): void {
	const root_so = get(stores.w_root_so);
	if (!root_so) return;

	const front_face = hits_3d.front_most_face(root_so);
	if (front_face < 0) return;

	const [axis_a, axis_b] = root_so.face_axes(front_face);
	const fixed_axis = root_so.face_fixed_axis(front_face);

	// Find root SO's scene for world matrix
	const root_scene = objects.find(o => o.so === root_so);
	if (!root_scene) return;
	const world = host.get_world_matrix(root_scene);

	// Grid spacing in mm — start from precision, double until lines are ≥ min_px apart
	const system = Units.current_unit_system();
	const precision = stores.current_precision();
	const max_dim = Math.max(root_so.width, root_so.height, root_so.depth);
	const base_spacing = units.grid_spacing_mm(system, precision, max_dim);
	if (base_spacing <= 0) return;

	// Measure screen-space gap: project two adjacent points along axis_a
	const a_ref = axis_a === 'x' ? root_so.x_min : axis_a === 'y' ? root_so.y_min : root_so.z_min;
	const ref_point = (offset: number): vec3 => {
		const p = vec3.create();
		const set = (ax: Axis_Name, v: number) => { if (ax === 'x') p[0] = v; else if (ax === 'y') p[1] = v; else p[2] = v; };
		set(axis_a, a_ref + offset);
		set(axis_b, axis_b === 'x' ? root_so.x_min : axis_b === 'y' ? root_so.y_min : root_so.z_min);
		set(fixed_axis, fixed_axis === 'x' ? (root_so.x_min + root_so.x_max) / 2
			: fixed_axis === 'y' ? (root_so.y_min + root_so.y_max) / 2
			: (root_so.z_min + root_so.z_max) / 2);
		return p;
	};
	const p0 = host.project_vertex(ref_point(0), world);
	const p1 = host.project_vertex(ref_point(base_spacing), world);
	const px_per_cell = Math.hypot(p1.x - p0.x, p1.y - p0.y);

	const min_px = 8; // minimum pixels between grid lines
	let spacing = base_spacing;
	if (px_per_cell > 0) {
		while (spacing * (px_per_cell / base_spacing) < min_px) spacing *= 2;
	}

	// Axis bounds — extend enough to fill the canvas
	const canvas_diag_mm = px_per_cell > 0
		? Math.hypot(host.ctx.canvas.width, host.ctx.canvas.height) / (px_per_cell / base_spacing)
		: max_dim * 50;
	const bounds = (axis: Axis_Name): [number, number] => {
		const min = axis === 'x' ? root_so.x_min : axis === 'y' ? root_so.y_min : root_so.z_min;
		const max = axis === 'x' ? root_so.x_max : axis === 'y' ? root_so.y_max : root_so.z_max;
		const mid = (min + max) / 2;
		return [mid - canvas_diag_mm, mid + canvas_diag_mm];
	};

	// Fixed axis value (the plane of the front face)
	const fixed_val = fixed_axis === 'x'
		? (root_so.x_min + root_so.x_max) / 2
		: fixed_axis === 'y'
			? (root_so.y_min + root_so.y_max) / 2
			: (root_so.z_min + root_so.z_max) / 2;

	const [a_min, a_max] = bounds(axis_a);
	const [b_min, b_max] = bounds(axis_b);

	// Snap grid origin to SO edge alignment
	const a_origin = axis_a === 'x' ? root_so.x_min : axis_a === 'y' ? root_so.y_min : root_so.z_min;
	const b_origin = axis_b === 'x' ? root_so.x_min : axis_b === 'y' ? root_so.y_min : root_so.z_min;

	const ctx = host.ctx;
	ctx.save();
	ctx.strokeStyle = get(colors.w_accent_color);
	ctx.lineWidth = stores.line_thickness();
	ctx.lineCap = 'round';
	ctx.setLineDash([1, 4]);

	const make_point = (a_val: number, b_val: number): vec3 => {
		const p = vec3.create();
		const set = (axis: Axis_Name, val: number) => {
			if (axis === 'x') p[0] = val;
			else if (axis === 'y') p[1] = val;
			else p[2] = val;
		};
		set(axis_a, a_val);
		set(axis_b, b_val);
		set(fixed_axis, fixed_val);
		return p;
	};

	// Lines along axis_a (sweep axis_b)
	const a_start = a_origin - Math.ceil((a_origin - a_min) / spacing) * spacing;
	for (let a = a_start; a <= a_max; a += spacing) {
		const p1 = host.project_vertex(make_point(a, b_min), world);
		const p2 = host.project_vertex(make_point(a, b_max), world);
		if (p1.w < 0 || p2.w < 0) continue;
		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();
	}

	// Lines along axis_b (sweep axis_a)
	const b_start = b_origin - Math.ceil((b_origin - b_min) / spacing) * spacing;
	for (let b = b_start; b <= b_max; b += spacing) {
		const p1 = host.project_vertex(make_point(a_min, b), world);
		const p2 = host.project_vertex(make_point(a_max, b), world);
		if (p1.w < 0 || p2.w < 0) continue;
		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();
	}

	ctx.setLineDash([]);
	ctx.restore();
}
