import { type Camera_View_Extent, stable_spacing } from './R_Grid';
import type { Projected } from '../types/Interfaces';
import type { O_Scene } from '../types/Interfaces';
import type { Axis_Name } from '../types/Types';
import { scenes } from '../managers/Scenes';
import { stores } from '../managers/Stores';
import { mat4 } from 'gl-matrix';
import { vec3 } from 'gl-matrix';

/**
 * Axis decoration arrows on the front-grid planes.
 * Each arrow is a 7-sided polygon (rectangle stem + triangle head)
 * lying in the plane of a front-facing grid face, offset from the outer edge.
 * Stroke only — no fill.
 */

/** Subset of Render that Axes needs. */
export interface AxesHost {
	ctx: CanvasRenderingContext2D;
	project_vertex(v: vec3, world_matrix: mat4): Projected;
	get_world_matrix(obj: O_Scene): mat4;
	camera_view_extent: Camera_View_Extent;
}

const AXIS_COLORS: Record<Axis_Name, string> = {
	x: 'rgba(180, 60, 60, 0.7)',
	y: 'rgba(60, 140, 60, 0.7)',
	z: 'rgba(60, 60, 180, 0.7)',
};

// Arrow dimensions in pixels (converted to 3D per-edge)
const OFFSET_PX = -10;      // arrow inset 10px from grid edge
const STEM_LEN_PX = 20;
const STEM_W_PX = 3;        // half-width of stem
const HEAD_LEN_PX = 12;
const HEAD_W_PX = 8;        // half-width of head

// Axis unit vectors
const AXIS_VECTORS: Record<Axis_Name, vec3> = {
	x: vec3.fromValues(1, 0, 0),
	y: vec3.fromValues(0, 1, 0),
	z: vec3.fromValues(0, 0, 1),
};

// Face definitions: [face_index, fixed_axis, axis_a, axis_b]
// face_fixed_value returns the position on fixed_axis from camera_view_extent
const FACE_AXES: [number, Axis_Name, Axis_Name, Axis_Name][] = [
	[0, 'z', 'x', 'y'], // bottom (z_min)
	[1, 'z', 'x', 'y'], // top (z_max)
	[2, 'x', 'y', 'z'], // left (x_min)
	[3, 'x', 'y', 'z'], // right (x_max)
	[4, 'y', 'x', 'z'], // front (y_max)
	[5, 'y', 'x', 'z'], // back (y_min)
];

export function render_axes(host: AxesHost): void {
	const root_so = scenes.root_so;
	if (!root_so?.scene) return;

	const world = host.get_world_matrix(root_so.scene);
	const orientation = stores.current_orientation();
	const ve = host.camera_view_extent;
	const rotated = vec3.create();
	const { spacing } = stable_spacing(host, root_so);

	const all_axes: Axis_Name[] = ['x', 'y', 'z'];

	// For each axis, pick the face whose normal is most aligned with the camera direction
	// (largest absolute forward-pointing component). Back-facing faces are eligible when
	// their alignment is stronger than any front-facing face's — this avoids landing the
	// arrow on a nearly-edge-on front face when an opposite back face is much more face-on.
	for (const axis of all_axes) {
		let best_face = -1;
		let best_visibility = -Infinity;

		for (const [fi, _fixed, a, b] of FACE_AXES) {
			// Only faces that contain this axis
			if (a !== axis && b !== axis) continue;

			vec3.transformQuat(rotated, root_so.face_normal(fi), orientation);

			const visibility = Math.abs(rotated[2]);
			if (visibility > best_visibility) {
				best_visibility = visibility;
				best_face = fi;
			}
		}

		if (best_face < 0) continue;

		const face_def = FACE_AXES[best_face];
		const [, fixed_axis, face_a, face_b] = face_def;
		const perp_axis = (face_a === axis) ? face_b : face_a;

		// Fixed value from camera_view_extent
		const fixed_val = ve_fixed_value(ve, best_face);

		// Bounds along the arrow axis and perpendicular axis
		const [a_min, a_max] = ve_bounds(ve, axis);
		const [p_min, p_max] = ve_bounds(ve, perp_axis);

		// Build edge endpoints for both possible perp positions
		const make_point = (a_val: number, p_val: number): vec3 => {
			const pt = vec3.create();
			set_axis(pt, axis, a_val);
			set_axis(pt, perp_axis, p_val);
			set_axis(pt, fixed_axis, fixed_val);
			return pt;
		};

		// Find this face's own corner closest to the camera. Walk the 4 corners
		// of the picked face, rotate each by the tumble orientation, and keep
		// the one with the largest forward-pointing component.
		let best_perp = p_min;
		let best_a = a_min;
		{
			const scratch = vec3.create();
			let best_corner_z = -Infinity;
			for (const p_val of [p_min, p_max]) {
				for (const a_val of [a_min, a_max]) {
					vec3.transformQuat(scratch, make_point(a_val, p_val), orientation);
					if (scratch[2] > best_corner_z) {
						best_corner_z = scratch[2];
						best_perp = p_val;
						best_a = a_val;
					}
				}
			}
		}

		// Inset by one grid unit from the outer edge
		if (spacing > 0) {
			const center_perp = (p_min + p_max) / 2;
			best_perp += (best_perp < center_perp) ? spacing : -spacing;
		}

		// Check edge screen length — skip if too foreshortened
		const e1 = host.project_vertex(make_point(a_min, best_perp), world);
		const e2 = host.project_vertex(make_point(a_max, best_perp), world);
		if (e1.w < 0 || e2.w < 0) continue;
		const edge_len = Math.sqrt((e2.x - e1.x) ** 2 + (e2.y - e1.y) ** 2);
		if (edge_len < 20) continue;

		// Arrow direction and perpendicular
		const along = AXIS_VECTORS[axis];
		let perp = AXIS_VECTORS[perp_axis];

		// Orient perp outward (away from center of face)
		const center_perp = (p_min + p_max) / 2;
		if (best_perp < center_perp) {
			perp = vec3.negate(vec3.create(), perp);
		}

		// Position inset from the front-most corner of this face
		const inset = spacing > 0 ? spacing * 7 : (a_max - a_min) * 0.2;
		const a_pos = best_a === a_min ? a_min + inset : a_max - inset;
		const em = make_point(a_pos, best_perp);

		draw_arrow(host, em, along, perp, axis, world);
	}
}

function draw_arrow(
	host: AxesHost,
	em: vec3,
	along: vec3,
	perp: vec3,
	axis: Axis_Name,
	world: mat4,
): void {
	// Compute pixel-to-3D scale
	const em_plus_perp = vec3.add(vec3.create(), em, perp);
	const p_em = host.project_vertex(em, world);
	const p_em_perp = host.project_vertex(em_plus_perp, world);
	if (p_em.w < 0 || p_em_perp.w < 0) return;

	const wlen = Math.sqrt((p_em_perp.x - p_em.x) ** 2 + (p_em_perp.y - p_em.y) ** 2);
	if (wlen < 0.001) return;

	// Convert pixel dimensions to 3D at this depth
	const off_3d = OFFSET_PX / wlen;
	const stem_len = STEM_LEN_PX / wlen;
	const stem_w = STEM_W_PX / wlen;
	const head_len = HEAD_LEN_PX / wlen;
	const head_w = HEAD_W_PX / wlen;

	// Base center: edge midpoint offset outward
	const base = vec3.scaleAndAdd(vec3.create(), em, perp, off_3d);

	// 7 arrow vertices in 3D
	const total = stem_len + head_len;
	const pts: vec3[] = [
		offset(base, along, -total / 2, perp, -stem_w),
		offset(base, along, -total / 2, perp, +stem_w),
		offset(base, along, -total / 2 + stem_len, perp, +stem_w),
		offset(base, along, -total / 2 + stem_len, perp, +head_w),
		offset(base, along, +total / 2, perp, 0),
		offset(base, along, -total / 2 + stem_len, perp, -head_w),
		offset(base, along, -total / 2 + stem_len, perp, -stem_w),
	];

	// Project all 7 points
	const screen = pts.map(p => host.project_vertex(p, world));
	if (screen.some(p => p.w < 0)) return;

	// Stroke only — no fill
	const ctx = host.ctx;
	ctx.save();
	ctx.strokeStyle = AXIS_COLORS[axis];
	ctx.lineWidth = stores.heavy_thickness;
	ctx.beginPath();
	ctx.moveTo(screen[0].x, screen[0].y);
	for (let i = 1; i < 7; i++) {
		ctx.lineTo(screen[i].x, screen[i].y);
	}
	ctx.closePath();
	ctx.fillStyle = 'white';
	ctx.fill();
	ctx.stroke();

	// Label past the tip
	const tip = screen[4];
	const stem_mid_x = (screen[0].x + screen[1].x) / 2;
	const stem_mid_y = (screen[0].y + screen[1].y) / 2;
	const dx = tip.x - stem_mid_x, dy = tip.y - stem_mid_y;
	const dist = Math.sqrt(dx * dx + dy * dy);
	if (dist > 0.001) {
		const lx = tip.x + (dx / dist) * 10;
		const ly = tip.y + (dy / dist) * 10;
		ctx.font = '11px sans-serif';
		ctx.fillStyle = AXIS_COLORS[axis];
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(axis, lx, ly);
	}
	ctx.restore();
}

function offset(base: vec3, u: vec3, u_scale: number, v: vec3, v_scale: number): vec3 {
	const result = vec3.clone(base);
	vec3.scaleAndAdd(result, result, u, u_scale);
	vec3.scaleAndAdd(result, result, v, v_scale);
	return result;
}

function set_axis(pt: vec3, axis: Axis_Name, val: number): void {
	if (axis === 'x') pt[0] = val;
	else if (axis === 'y') pt[1] = val;
	else pt[2] = val;
}

function ve_bounds(ve: Camera_View_Extent, axis: Axis_Name): [number, number] {
	switch (axis) {
		case 'x': return [ve.x_min, ve.x_max];
		case 'y': return [ve.y_min, ve.y_max];
		case 'z': return [ve.z_min, ve.z_max];
	}
}

function ve_fixed_value(ve: Camera_View_Extent, face_index: number): number {
	switch (face_index) {
		case 0: return ve.z_min;
		case 1: return ve.z_max;
		case 2: return ve.x_min;
		case 3: return ve.x_max;
		case 4: return ve.y_max;
		case 5: return ve.y_min;
		default: return 0;
	}
}
