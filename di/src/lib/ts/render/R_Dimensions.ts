import type { Projected, Dimension_Rect } from '../types/Interfaces';
import type Smart_Object from '../runtime/Smart_Object';
import type { O_Scene } from '../types/Interfaces';
import type { Axis_Name } from '../types/Types';
import { units, Units } from '../types/Units';
import { hits_3d } from '../events/Hits_3D';
import { stores } from '../managers/Stores';
import { scene } from './Scene';
import { vec3 } from 'gl-matrix';
import { mat4 } from 'gl-matrix';

/**
 * Dimension annotations: silhouette edge detection, witness lines, and
 * dimension labels for each axis of every scene object.
 *
 * Extracted from Render.ts — all geometry logic preserved verbatim.
 */

/** Subset of Render that Dimensions needs. Avoids circular import. */
export interface DimensionHost {
	ctx: CanvasRenderingContext2D;
	project_vertex(v: vec3, world_matrix: mat4): Projected;
	get_world_matrix(obj: O_Scene): mat4;
	face_winding(face: number[], projected: Projected[]): number;
	point_in_polygon_2d(px: number, py: number, poly: { x: number; y: number }[]): boolean;
	draw_arrow(x: number, y: number, dx: number, dy: number): void;
	dimension_rects: Dimension_Rect[];
}

/** Render dimensions for all scene objects. */
export function render_dimensions(host: DimensionHost): void {
	for (const obj of scene.get_all()) {
		if (!obj.parent) {
			// root: skip unless it has projected geometry
			const root_projected = hits_3d.get_projected(obj.id);
			if (!root_projected) continue;
			const root_so = obj.so;
			const root_world = host.get_world_matrix(obj);
			const is_2d = stores.current_view_mode() === '2d';
			const root_front = is_2d ? hits_3d.front_most_face(root_so) : -1;
			const root_axes: Axis_Name[] = (is_2d && root_front >= 0) ? root_so.face_axes(root_front) : ['x', 'y', 'z'];
			for (const axis of root_axes) {
				render_axis_dimension(host, root_so, axis, root_projected, root_world);
			}
			continue;
		}

		// repeater: template gets all axes; first fireblock gets repeat-axis only;
		// last fireblock also gets repeat-axis if its length differs from the first
		if (obj.parent.so.repeater) {
			const siblings = scene.get_all().filter(o => o.parent === obj.parent);
			if (siblings[0] !== obj) {
				const repeater = obj.parent.so.repeater;
				if (!repeater.firewall) continue;

				const repeat_ai = repeater.run_axis ?? 0;
				const template_len = siblings[0].so.axes[repeat_ai].length.value;
				const this_len = obj.so.axes[repeat_ai].length.value;
				if (Math.abs(this_len - template_len) < 0.1) continue;

				const fireblocks = siblings.filter(s =>
					Math.abs(s.so.axes[repeat_ai].length.value - template_len) > 0.1
				);
				const is_first = fireblocks[0] === obj;
				const is_last = fireblocks.length > 1 && fireblocks[fireblocks.length - 1] === obj;
				const last_shortened = is_last &&
					Math.abs(obj.so.axes[repeat_ai].length.value -
						fireblocks[0].so.axes[repeat_ai].length.value) > 0.1;
				if (!is_first && !last_shortened) continue;

				const fb_proj = hits_3d.get_projected(obj.id);
				if (!fb_proj) continue;
				const axis_name: Axis_Name = (['x', 'y', 'z'] as const)[repeat_ai];
				render_axis_dimension(host, obj.so, axis_name, fb_proj, host.get_world_matrix(obj));
				continue;
			}
		}

		const projected = hits_3d.get_projected(obj.id);
		if (!projected) continue;

		const so = obj.so;
		const world_matrix = host.get_world_matrix(obj);

		const is_2d_mode = stores.current_view_mode() === '2d';
		const front_face = is_2d_mode ? hits_3d.front_most_face(so) : -1;
		const all_axes: Axis_Name[] = (is_2d_mode && front_face >= 0) ? so.face_axes(front_face) : ['x', 'y', 'z'];
		for (const axis of all_axes) {
			render_axis_dimension(host, so, axis, projected, world_matrix);
		}
	}
}

function render_axis_dimension(
	host: DimensionHost,
	so: Smart_Object,
	axis: Axis_Name,
	projected: Projected[],
	world_matrix: mat4
): void {
	const candidates = find_best_edge_for_axis(host, so, axis, projected);
	if (!candidates || candidates.length === 0) return;

	const value = axis === 'x' ? so.width : axis === 'y' ? so.depth : so.height;

	for (const { v1_idx, v2_idx } of candidates) {
		let witness_dir = edge_witness_direction(host, so, v1_idx, v2_idx, axis, projected, world_matrix);

		const verts = so.vertices;
		const v1 = verts[v1_idx], v2 = verts[v2_idx];
		const edge_mid = vec3.fromValues((v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2, (v1[2] + v2[2]) / 2);
		const cx = (so.x_min + so.x_max) / 2;
		const cy = (so.y_min + so.y_max) / 2;
		const cz = (so.z_min + so.z_max) / 2;
		const outward = vec3.fromValues(edge_mid[0] - cx, edge_mid[1] - cy, edge_mid[2] - cz);
		const dot = vec3.dot(witness_dir, outward);
		if (dot < 0) {
			witness_dir = vec3.negate(vec3.create(), witness_dir);
		}

		const p1 = projected[v1_idx], p2 = projected[v2_idx];
		if (p1.w < 0 || p2.w < 0) continue;

		// Compute pixel-to-3D scale from per-vertex witness projections
		const v1_plus_w = vec3.add(vec3.create(), v1, witness_dir);
		const v2_plus_w = vec3.add(vec3.create(), v2, witness_dir);
		const p_v1w = host.project_vertex(v1_plus_w, world_matrix);
		const p_v2w = host.project_vertex(v2_plus_w, world_matrix);
		if (p_v1w.w < 0 || p_v2w.w < 0) continue;

		const wlen1 = Math.sqrt((p_v1w.x - p1.x) ** 2 + (p_v1w.y - p1.y) ** 2);
		const wlen2 = Math.sqrt((p_v2w.x - p2.x) ** 2 + (p_v2w.y - p2.y) ** 2);
		if (wlen1 < 0.001 || wlen2 < 0.001) continue;

		// All offsets in 3D — witness lines diverge in perspective,
		// dimension line stays parallel to edge (same 3D translation)
		const gap_px = 4;
		const dist_px = 20;
		const ext_px = 8;
		const avg_wlen = (wlen1 + wlen2) / 2;
		const gap_3d = gap_px / avg_wlen;
		const dist_3d = dist_px / avg_wlen;
		const ext_3d = ext_px / avg_wlen;

		const pw1_start = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v1, witness_dir, gap_3d), world_matrix);
		const pw2_start = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v2, witness_dir, gap_3d), world_matrix);
		const pw1_end = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v1, witness_dir, dist_3d + ext_3d), world_matrix);
		const pw2_end = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v2, witness_dir, dist_3d + ext_3d), world_matrix);
		const pd1 = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v1, witness_dir, dist_3d), world_matrix);
		const pd2 = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v2, witness_dir, dist_3d), world_matrix);

		const drawn = draw_dimension_3d(host, pw1_start, pw1_end, pw2_start, pw2_end, pd1, pd2, value, axis, so);
		if (drawn) break;
	}
}

function edge_witness_direction(
	host: DimensionHost,
	so: Smart_Object,
	v1_idx: number, v2_idx: number,
	edge_axis: Axis_Name,
	projected: Projected[],
	world_matrix: mat4
): vec3 {
	const ep1 = projected[v1_idx], ep2 = projected[v2_idx];
	const edge_dx = ep2.x - ep1.x, edge_dy = ep2.y - ep1.y;
	const edge_len = Math.sqrt(edge_dx * edge_dx + edge_dy * edge_dy);
	if (edge_len < 0.001) return so.axis_vector('x');
	const edge_ux = edge_dx / edge_len, edge_uy = edge_dy / edge_len;

	const all_axes: Axis_Name[] = ['x', 'y', 'z'];
	const candidates = all_axes.filter(a => a !== edge_axis);

	const origin = vec3.create();
	const p0 = host.project_vertex(origin, world_matrix);

	let best_axis = candidates[0];
	let best_perp = -Infinity;

	for (const axis of candidates) {
		const unit_vec = so.axis_vector(axis);
		const p1 = host.project_vertex(unit_vec, world_matrix);
		const wx = p1.x - p0.x, wy = p1.y - p0.y;
		const cross = Math.abs(edge_ux * wy - edge_uy * wx);
		if (cross > best_perp) {
			best_perp = cross;
			best_axis = axis;
		}
	}

	return so.axis_vector(best_axis);
}

function find_best_edge_for_axis(
	host: DimensionHost,
	so: Smart_Object,
	axis: Axis_Name,
	projected: Projected[]
): { v1_idx: number; v2_idx: number }[] | null {
	if (!so.scene?.faces) return null;
	const verts = so.vertices;
	const faces = so.scene.faces;
	const edges = so.scene.edges;

	const edge_faces = (v1: number, v2: number): number[] => {
		const result: number[] = [];
		for (let fi = 0; fi < faces.length; fi++) {
			const face = faces[fi];
			for (let i = 0; i < face.length; i++) {
				const a = face[i], b = face[(i + 1) % face.length];
				if ((a === v1 && b === v2) || (a === v2 && b === v1)) {
					result.push(fi);
					break;
				}
			}
		}
		return result;
	};

	type SilhouetteCandidate = {
		v1: number; v2: number;
		front_face: number;
	};
	const silhouettes: SilhouetteCandidate[] = [];

	for (const [v1, v2] of edges) {
		if (edge_axis(verts[v1], verts[v2]) !== axis) continue;

		const adj = edge_faces(v1, v2);
		if (adj.length !== 2) continue;

		const w0 = host.face_winding(faces[adj[0]], projected);
		const w1 = host.face_winding(faces[adj[1]], projected);

		if (w0 < 0 && w1 >= 0) {
			silhouettes.push({ v1, v2, front_face: adj[0] });
		} else if (w1 < 0 && w0 >= 0) {
			silhouettes.push({ v1, v2, front_face: adj[1] });
		}
	}

	if (silhouettes.length === 0) return null;

	silhouettes.sort((a, b) => {
		const wa = host.face_winding(faces[a.front_face], projected);
		const wb = host.face_winding(faces[b.front_face], projected);
		return wa - wb;
	});

	return silhouettes.map(s => ({ v1_idx: s.v1, v2_idx: s.v2 }));
}

function edge_axis(v1: vec3, v2: vec3): Axis_Name | null {
	const dx = Math.abs(v2[0] - v1[0]);
	const dy = Math.abs(v2[1] - v1[1]);
	const dz = Math.abs(v2[2] - v1[2]);
	const eps = 0.01;
	if (dx > eps && dy < eps && dz < eps) return 'x';
	if (dy > eps && dx < eps && dz < eps) return 'y';
	if (dz > eps && dx < eps && dy < eps) return 'z';
	return null;
}

function dimension_occluded(
	host: DimensionHost,
	cx: number, cy: number, w: number, h: number,
	dim_z: number, owner_id: string,
): boolean {
	const hw = w / 2 + 4, hh = h / 2 + 4;
	const rect_corners = [
		{ x: cx - hw, y: cy - hh },
		{ x: cx + hw, y: cy - hh },
		{ x: cx + hw, y: cy + hh },
		{ x: cx - hw, y: cy + hh },
	];
	const center = { x: cx, y: cy };

	for (const obj of scene.get_all()) {
		if (obj.so.id === owner_id) continue;
		if (!obj.faces) continue;
		const projected = hits_3d.get_projected(obj.id);
		if (!projected) continue;
		const world = host.get_world_matrix(obj);

		for (const face of obj.faces) {
			if (host.face_winding(face, projected) >= 0) continue;
			if (face.some(vi => projected[vi].w < 0)) continue;

			const poly = face.map(vi => ({ x: projected[vi].x, y: projected[vi].y }));
			if (!rect_corners.every(c => host.point_in_polygon_2d(c.x, c.y, poly))) continue;

			const face_z = hits_3d.face_depth_at(center, face, obj.so, world);
			if (face_z === null) continue;

			if (face_z < dim_z) return true;
		}
	}
	return false;
}

function draw_dimension_3d(
	host: DimensionHost,
	w1_start: Projected, w1_end: Projected,
	w2_start: Projected, w2_end: Projected,
	d1: Projected, d2: Projected,
	value: number,
	axis: Axis_Name,
	so: Smart_Object
): boolean {
	if (w1_start.w < 0 || w1_end.w < 0 || w2_start.w < 0 || w2_end.w < 0 || d1.w < 0 || d2.w < 0) return false;

	const ctx = host.ctx;

	ctx.font = '12px sans-serif';
	const text = units.format_for_system(value, Units.current_unit_system(), stores.current_precision());
	const textWidth = ctx.measureText(text).width;
	const textHeight = 12;

	const midX = (d1.x + d2.x) / 2, midY = (d1.y + d2.y) / 2;
	const dim_z = (d1.z + d2.z) / 2;

	if (dimension_occluded(host, midX, midY, textWidth, textHeight, dim_z, so.id)) return false;

	const dx = d2.x - d1.x, dy = d2.y - d1.y;
	const lineLen = Math.sqrt(dx * dx + dy * dy);
	if (lineLen < 1) return false;
	const ux = dx / lineLen, uy = dy / lineLen;

	const padding = 8;
	const gap = textWidth * Math.abs(ux) + textHeight * Math.abs(uy) + padding;
	const arrowSize = 20;

	if (lineLen < gap) {
		return false;
	}

	// Witness lines
	ctx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
	ctx.lineWidth = 0.5;
	ctx.beginPath();
	ctx.moveTo(w1_start.x, w1_start.y);
	ctx.lineTo(w1_end.x, w1_end.y);
	ctx.moveTo(w2_start.x, w2_start.y);
	ctx.lineTo(w2_end.x, w2_end.y);
	ctx.stroke();

	const halfGap = gap / 2;

	if (lineLen >= gap + arrowSize) {
		// Case 1: normal layout
		ctx.beginPath();
		ctx.moveTo(d1.x, d1.y);
		ctx.lineTo(midX - ux * halfGap, midY - uy * halfGap);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(midX + ux * halfGap, midY + uy * halfGap);
		ctx.lineTo(d2.x, d2.y);
		ctx.stroke();

		ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
		host.draw_arrow(d1.x, d1.y, dx, dy);
		host.draw_arrow(d2.x, d2.y, -dx, -dy);
	} else {
		// Case 2: inverted layout
		const extLen = 30;

		ctx.beginPath();
		ctx.moveTo(d1.x, d1.y);
		ctx.lineTo(d1.x - ux * extLen, d1.y - uy * extLen);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(d2.x, d2.y);
		ctx.lineTo(d2.x + ux * extLen, d2.y + uy * extLen);
		ctx.stroke();

		ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
		host.draw_arrow(d1.x, d1.y, -dx, -dy);
		host.draw_arrow(d2.x, d2.y, dx, dy);
	}

	// Text centered between d1 and d2
	ctx.fillStyle = 'white';
	ctx.fillRect(midX - textWidth / 2 - 2, midY - textHeight / 2 - 1, textWidth + 4, textHeight + 2);
	ctx.fillStyle = '#333';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, midX, midY);

	host.dimension_rects.push({
		axis, so,
		x: midX, y: midY,
		w: textWidth, h: textHeight,
		z: (d1.z + d2.z) / 2,
		face_index: -1,
	});
	return true;
}
