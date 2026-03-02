/**
 * Grid overlays for the root Smart_Object:
 *   render_grid      — 2D front-face grid (dashed, accent color)
 *   render_back_grid — faint grid on back-facing root faces (spatial reference)
 */

import type { Projected } from '../types/Interfaces';
import type { O_Scene } from '../types/Interfaces';
import type { Axis_Name } from '../types/Types';
import type Smart_Object from '../runtime/Smart_Object';
import { units, Units } from '../types/Units';
import { hits_3d } from '../managers/Hits_3D';
import { stores } from '../managers/Stores';
import { scenes } from '../managers/Scenes';
import { colors } from '../draw/Colors';
import { parseToRgba } from 'color2k';
import { vec3 } from 'gl-matrix';
import { mat4 } from 'gl-matrix';
import { get } from 'svelte/store';

/** Camera-view AABB — rotation-aware extent computed each frame. */
export type Camera_View_Extent = { x_min: number; x_max: number; y_min: number; y_max: number; z_min: number; z_max: number };

/** Subset of Render that Grid needs. Avoids circular import. */
export interface GridHost {
	ctx: CanvasRenderingContext2D;
	project_vertex(v: vec3, world_matrix: mat4): Projected;
	get_world_matrix(obj: O_Scene): mat4;
	camera_view_extent: Camera_View_Extent;
}

/** Render 2D front-face grid (dashed, accent color). */
export function render_grid(host: GridHost): void {
	const root_so = scenes.root_so;
	if (!root_so?.scene) return;

	const front_face = hits_3d.front_most_face(root_so);
	if (front_face < 0) return;

	const [axis_a, axis_b] = root_so.face_axes(front_face);
	const fixed_axis = root_so.face_fixed_axis(front_face);

	const world = host.get_world_matrix(root_so.scene);

	// Grid spacing — tumble-independent
	const { spacing, px_per_mm } = stable_spacing(host, root_so);
	if (spacing <= 0) return;

	// Axis bounds — extend enough to fill the canvas
	const max_dim = Math.max(root_so.width, root_so.height, root_so.depth);
	const canvas_diag_mm = px_per_mm > 0
		? Math.hypot(host.ctx.canvas.width, host.ctx.canvas.height) / px_per_mm
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
	ctx.globalAlpha = stores.grid_opacity();
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

// ── helpers ──

/** Axis min/max from the camera-view extent. */
function ve_axis_bounds(ve: Camera_View_Extent, axis: Axis_Name): [number, number] {
	switch (axis) {
		case 'x': return [ve.x_min, ve.x_max];
		case 'y': return [ve.y_min, ve.y_max];
		case 'z': return [ve.z_min, ve.z_max];
	}
}

/** The fixed-axis value for a given face index from camera-view extent. */
function ve_face_fixed_value(ve: Camera_View_Extent, face_index: number): number {
	// 0: z_min, 1: z_max, 2: x_min, 3: x_max, 4: y_max, 5: y_min
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

/** Tumble-independent grid spacing. Projects through scale-only (no rotation) for stable px/mm. */
function stable_spacing(host: GridHost, so: Smart_Object): { spacing: number; px_per_mm: number } {
	const system = Units.current_unit_system();
	const precision = stores.current_precision();
	const max_dim = Math.max(so.width, so.height, so.depth);
	const base = units.grid_spacing_mm(system, precision, max_dim);
	if (base <= 0) return { spacing: 0, px_per_mm: 0 };

	const s = stores.current_scale();
	const scale_mat = mat4.create();
	mat4.fromScaling(scale_mat, [s, s, s]);
	const p0 = host.project_vertex(vec3.fromValues(0, 0, 0), scale_mat);
	const p1 = host.project_vertex(vec3.fromValues(base, 0, 0), scale_mat);
	const px = Math.hypot(p1.x - p0.x, p1.y - p0.y);
	const px_per_mm = px > 0 ? px / base : 0;

	let spacing = base;
	if (px_per_mm > 0) {
		while (spacing * px_per_mm < 8) spacing *= 2;
	}
	return { spacing, px_per_mm };
}

/** Graham scan convex hull for 2D points. Returns vertices in winding order. */
function convex_hull_2d(pts: { x: number; y: number }[]): { x: number; y: number }[] {
	if (pts.length <= 2) return pts.slice();
	const sorted = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
	const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
		(a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
	const lower: { x: number; y: number }[] = [];
	for (const p of sorted) {
		while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
		lower.push(p);
	}
	const upper: { x: number; y: number }[] = [];
	for (let i = sorted.length - 1; i >= 0; i--) {
		const p = sorted[i];
		while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
		upper.push(p);
	}
	lower.pop();
	upper.pop();
	return lower.concat(upper);
}

// ── camera view extent wireframe ──

/** Camera_view_extent outline.
 *  3D: faint 12-edge wireframe box.
 *  2D: front-face rectangle at camera_view_extent dimensions (expanded root boundary). */
export function render_root_bottom(host: GridHost, is_2d = false): void {
	const root_so = scenes.root_so;
	if (!root_so?.scene) return;

	const world = host.get_world_matrix(root_so.scene);
	const ve = host.camera_view_extent;

	// 8 corners of the camera_view_extent box
	const verts = [
		vec3.fromValues(ve.x_min, ve.y_min, ve.z_min), // 0
		vec3.fromValues(ve.x_max, ve.y_min, ve.z_min), // 1
		vec3.fromValues(ve.x_max, ve.y_max, ve.z_min), // 2
		vec3.fromValues(ve.x_min, ve.y_max, ve.z_min), // 3
		vec3.fromValues(ve.x_min, ve.y_min, ve.z_max), // 4
		vec3.fromValues(ve.x_max, ve.y_min, ve.z_max), // 5
		vec3.fromValues(ve.x_max, ve.y_max, ve.z_max), // 6
		vec3.fromValues(ve.x_min, ve.y_max, ve.z_max), // 7
	];
	const pts = verts.map(v => host.project_vertex(v, world));

	const [r, g, b] = parseToRgba(get(colors.w_accent_color));
	const ctx = host.ctx;

	if (is_2d) {
		// 2D: draw only the front face edges of camera_view_extent
		const front_face = hits_3d.front_most_face(root_so);
		if (front_face < 0) return;
		// Vertex indices per face: 0=z_min, 1=z_max, 2=x_min, 3=x_max, 4=y_max, 5=y_min
		const face_vertex_indices: number[][] = [
			[0, 1, 2, 3], // 0: z_min (bottom)
			[4, 5, 6, 7], // 1: z_max (top)
			[0, 4, 7, 3], // 2: x_min (left)
			[1, 5, 6, 2], // 3: x_max (right)
			[3, 7, 6, 2], // 4: y_max (front)
			[0, 4, 5, 1], // 5: y_min (back)
		];
		const face = face_vertex_indices[front_face];
		if (!face) return;
		ctx.save();
		ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
		ctx.lineWidth = 1;
		ctx.setLineDash([4, 4]);
		for (let i = 0; i < face.length; i++) {
			const a = pts[face[i]], bp = pts[face[(i + 1) % face.length]];
			if (a.w < 0 || bp.w < 0) continue;
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(bp.x, bp.y);
			ctx.stroke();
		}
		ctx.restore();
	} else {
		// 3D: full 12-edge wireframe
		const edges: [number, number][] = [
			[0,1],[1,2],[2,3],[3,0],
			[4,5],[5,6],[6,7],[7,4],
			[0,4],[1,5],[2,6],[3,7],
		];
		ctx.save();
		ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.35)`;
		ctx.lineWidth = 0.5;
		for (const [i, j] of edges) {
			const a = pts[i], bp = pts[j];
			if (a.w < 0 || bp.w < 0) continue;
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(bp.x, bp.y);
			ctx.stroke();
		}
		ctx.restore();
	}
}

// ── back grid ──

/** Render faint grids on back-facing root faces (spatial reference). */
export function render_back_grid(host: GridHost): void {
	const root_so = scenes.root_so;
	if (!root_so?.scene) return;

	const world = host.get_world_matrix(root_so.scene);
	const orientation = stores.current_orientation();
	const rotated = vec3.create();

	// Grid spacing — tumble-independent
	const { spacing } = stable_spacing(host, root_so);
	if (spacing <= 0) return;

	// Shadow setup: selected non-root SO's vertices in root-local space
	const sel_so = hits_3d.selection?.so ?? null;
	const has_shadow = sel_so && sel_so !== root_so && sel_so.scene;
	let root_local: vec3[] | null = null;
	let shadow_r = 0, shadow_g = 0, shadow_b = 0;
	if (has_shadow) {
		const child_world = host.get_world_matrix(sel_so.scene!);
		const inv_root = mat4.create();
		mat4.invert(inv_root, world);
		const child_to_root = mat4.create();
		mat4.multiply(child_to_root, inv_root, child_world);
		root_local = sel_so.vertices.map(v => {
			const out = vec3.create();
			vec3.transformMat4(out, v, child_to_root);
			return out;
		});
		const [r, g, b] = parseToRgba(get(colors.w_accent_color));
		shadow_r = r; shadow_g = g; shadow_b = b;
	}

	const ctx = host.ctx;
	ctx.save();
	ctx.globalAlpha = stores.grid_opacity();
	ctx.strokeStyle = 'rgba(128, 128, 128, 0.12)';
	ctx.lineWidth = 1;
	ctx.lineCap = 'round';

	for (let fi = 0; fi < 6; fi++) {
		// Check if this face is back-facing: transform normal by orientation, z < 0 = away from camera
		vec3.transformQuat(rotated, root_so.face_normal(fi), orientation);
		if (rotated[2] >= 0) continue; // front-facing, skip

		const [axis_a, axis_b] = root_so.face_axes(fi);
		const fixed_axis = root_so.face_fixed_axis(fi);
		const ve = host.camera_view_extent;
		const fixed_val = ve_face_fixed_value(ve, fi);
		const [a_min, a_max] = ve_axis_bounds(ve, axis_a);
		const [b_min, b_max] = ve_axis_bounds(ve, axis_b);
		const a_origin = a_min;
		const b_origin = b_min;

		const make_point = (a_val: number, b_val: number): vec3 => {
			const pt = vec3.create();
			const set = (ax: Axis_Name, v: number) => { if (ax === 'x') pt[0] = v; else if (ax === 'y') pt[1] = v; else pt[2] = v; };
			set(axis_a, a_val);
			set(axis_b, b_val);
			set(fixed_axis, fixed_val);
			return pt;
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

		// Shadow: selected SO silhouette flattened onto this face
		if (root_local) {
			const axis_idx = fixed_axis === 'x' ? 0 : fixed_axis === 'y' ? 1 : 2;
			const screen_pts: { x: number; y: number }[] = [];
			for (const v of root_local) {
				const flat = vec3.clone(v);
				flat[axis_idx] = fixed_val;
				const p = host.project_vertex(flat, world);
				if (p.w > 0) screen_pts.push({ x: p.x, y: p.y });
			}
			if (screen_pts.length >= 3) {
				const hull = convex_hull_2d(screen_pts);
				if (hull.length >= 3) {
					ctx.beginPath();
					ctx.moveTo(hull[0].x, hull[0].y);
					for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].y);
					ctx.closePath();
					ctx.globalAlpha = stores.grid_opacity();
					ctx.fillStyle = `rgba(${shadow_r}, ${shadow_g}, ${shadow_b}, 0.3)`;
					ctx.fill();
					ctx.strokeStyle = `rgba(${shadow_r}, ${shadow_g}, ${shadow_b}, 0.8)`;
					ctx.lineWidth = 1;
					ctx.stroke();
					// Restore grid style for next face
					ctx.globalAlpha = stores.grid_opacity();
					ctx.strokeStyle = 'rgba(128, 128, 128, 0.12)';
				}
			}
		}
	}

	ctx.restore();
}
