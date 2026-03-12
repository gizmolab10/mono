import type { Projected } from '../types/Interfaces';
import type { O_Scene } from '../types/Interfaces';
import type { Axis_Name } from '../types/Types';
import { type Camera_View_Extent, stable_spacing } from './R_Grid';
import { scenes } from '../managers/Scenes';
import { stores } from '../managers/Stores';
import { mat4 } from 'gl-matrix';
import { vec3 } from 'gl-matrix';

/**
 * Axis decoration arrows on the back-grid planes.
 * Each arrow is a 7-sided polygon (rectangle stem + triangle head)
 * lying in the plane of a back-facing grid face, offset from the outer edge.
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

	// Find the back-most corner: where all 3 back-facing grid planes meet
	const back_corner = vec3.create();
	for (const [fi, fixed, ,] of FACE_AXES) {
		vec3.transformQuat(rotated, root_so.face_normal(fi), orientation);
		if (rotated[2] < 0) {
			// This face is back-facing — its fixed value contributes to the back corner
			set_axis(back_corner, fixed, ve_fixed_value(ve, fi));
		}
	}
	const p_back = host.project_vertex(back_corner, world);

	// For each axis, find the best back-facing grid face to draw on
	for (const axis of all_axes) {
		let best_face = -1;
		let best_visibility = -Infinity;

		for (const [fi, _fixed, a, b] of FACE_AXES) {
			// Only faces that contain this axis
			if (a !== axis && b !== axis) continue;

			// Must be back-facing
			vec3.transformQuat(rotated, root_so.face_normal(fi), orientation);
			if (rotated[2] >= 0) continue;

			const visibility = -rotated[2];
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

		// Pick the outer edge: furthest from the projected center of the face
		const face_center = make_point((a_min + a_max) / 2, (p_min + p_max) / 2);
		const p_center = host.project_vertex(face_center, world);
		let best_perp = p_min;
		let best_dist = -Infinity;
		for (const p_val of [p_min, p_max]) {
			const e1 = host.project_vertex(make_point(a_min, p_val), world);
			const e2 = host.project_vertex(make_point(a_max, p_val), world);
			if (e1.w < 0 || e2.w < 0 || p_center.w < 0) continue;
			const mid_x = (e1.x + e2.x) / 2;
			const mid_y = (e1.y + e2.y) / 2;
			const dist = Math.sqrt((mid_x - p_center.x) ** 2 + (mid_y - p_center.y) ** 2);
			if (dist > best_dist) {
				best_dist = dist;
				best_perp = p_val;
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

		// Position near the corner furthest from the back-most corner
		let a_pos = (a_min + a_max) / 2; // fallback: midpoint
		if (p_back.w >= 0) {
			const pa1 = host.project_vertex(make_point(a_min, best_perp), world);
			const pa2 = host.project_vertex(make_point(a_max, best_perp), world);
			if (pa1.w >= 0 && pa2.w >= 0) {
				const d1 = (pa1.x - p_back.x) ** 2 + (pa1.y - p_back.y) ** 2;
				const d2 = (pa2.x - p_back.x) ** 2 + (pa2.y - p_back.y) ** 2;
				// Pick the end furthest from back corner, inset enough to avoid overlap
				const far_val = d1 > d2 ? a_min : a_max;
				const inset = spacing > 0 ? spacing * 7 : (a_max - a_min) * 0.2;
				a_pos = far_val === a_min ? a_min + inset : a_max - inset;
			}
		}
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
	ctx.lineWidth = 1;
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
