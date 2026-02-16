/**
 * Angular annotations: arc visualizations for rotation angles between
 * parent and child scene objects.
 *
 * Extracted from Render.ts — all geometry logic preserved verbatim.
 */

import type { Projected, Angle_Rect } from '../types/Interfaces';
import type Smart_Object from '../runtime/Smart_Object';
import type { Axis_Name } from '../types/Types';
import type { O_Scene } from '../types/Interfaces';
import { hits_3d } from '../managers/Hits_3D';
import { mat4, quat, vec3, vec4 } from 'gl-matrix';
import { scene } from './Scene';

/** Subset of Render that Angulars needs. Avoids circular import. */
export interface AngularHost {
	ctx: CanvasRenderingContext2D;
	project_vertex(v: vec3, world_matrix: mat4): Projected;
	get_world_matrix(obj: O_Scene): mat4;
	face_winding(face: number[], projected: Projected[]): number;
	draw_arrow(x: number, y: number, dx: number, dy: number): void;
	angular_rects: Angle_Rect[];
}

/** Target screen-space arc radius in pixels (constant for all angulars). */
const ANGULAR_ARC_PX = 37;

/** Face indices grouped by their fixed axis.
 *  [0],[1] bottom/top (normal along z); [2],[3] left/right (along x); [4],[5] front/back (along y). */
const AXIS_FACE_INDICES: Record<string, [number, number]> = {
	x: [2, 3],
	y: [4, 5],
	z: [0, 1],
};

/** Render all angular measurements. */
export function render_angulars(host: AngularHost): void {
	const objects = scene.get_all();
	const identity = mat4.create();
	const claimed_hinges: vec3[] = [];

	for (const obj of objects) {
		if (!obj.parent) continue;
		const child_so = obj.so;
		if (child_so.axes.every(a => Math.abs(a.angle.value) < 1e-10)) continue;

		const parent_obj = obj.parent;
		const parent_so = parent_obj.so;
		const parent_projected = hits_3d.get_projected(parent_obj.id);
		if (!parent_projected || !parent_obj.faces) continue;

		const parent_world = host.get_world_matrix(parent_obj);
		const parent_verts = parent_so.vertices;

		// Child's world-space center (for orienting hinge toward child)
		const child_world = host.get_world_matrix(obj);
		const child_center_local: vec3 = [
			(child_so.x_min + child_so.x_max) / 2,
			(child_so.y_min + child_so.y_max) / 2,
			(child_so.z_min + child_so.z_max) / 2,
		];
		const child_center_w = vec3.create();
		const cc4 = vec4.fromValues(child_center_local[0], child_center_local[1], child_center_local[2], 1);
		vec4.transformMat4(cc4, cc4, child_world);
		vec3.set(child_center_w, cc4[0], cc4[1], cc4[2]);

		for (const axis of child_so.axes) {
			const angle = axis.angle.value;
			const degrees = Math.abs(angle) * 180 / Math.PI;
			if (degrees < 0.5 || degrees > 89.5) continue;

			// Pick the most visible parent face perpendicular to this rotation axis
			const face_pair = AXIS_FACE_INDICES[axis.name];
			let best_fi = -1;
			let best_winding = 0;
			for (const fi of face_pair) {
				const winding = host.face_winding(parent_obj.faces![fi], parent_projected);
				if (winding >= 0) continue;
				if (Math.abs(winding) < 8000) continue;
				if (best_fi < 0 || winding < best_winding) {
					best_fi = fi;
					best_winding = winding;
				}
			}
			if (best_fi < 0) continue;

			// Compute parent face corners in world space
			const face_vertex_indices = parent_obj.faces![best_fi];
			const fc: vec3[] = [];
			for (const vi of face_vertex_indices) {
				const lv = parent_verts[vi];
				const wv = vec4.create();
				vec4.transformMat4(wv, [lv[0], lv[1], lv[2], 1], parent_world);
				fc.push(vec3.fromValues(wv[0], wv[1], wv[2]));
			}

			// Build face edges
			const face_edges: { w1: vec3; w2: vec3 }[] = [];
			for (let ei = 0; ei < fc.length; ei++) {
				face_edges.push({ w1: fc[ei], w2: fc[(ei + 1) % fc.length] });
			}

			// Pick the face edge closest to the child's center
			let best_edge_idx = 0;
			let best_dist = Infinity;
			let best_t = 0.5;
			for (let ei = 0; ei < face_edges.length; ei++) {
				const fe = face_edges[ei];
				const ab = vec3.sub(vec3.create(), fe.w2, fe.w1);
				const ap = vec3.sub(vec3.create(), child_center_w, fe.w1);
				const t = Math.max(0.05, Math.min(0.95, vec3.dot(ap, ab) / vec3.dot(ab, ab)));
				const cp = vec3.scaleAndAdd(vec3.create(), fe.w1, ab, t);
				const dist = vec3.distance(cp, child_center_w);
				if (dist < best_dist) { best_dist = dist; best_edge_idx = ei; best_t = t; }
			}
			const chosen_edge = face_edges[best_edge_idx];
			const hinge_w = vec3.create();
			vec3.lerp(hinge_w, chosen_edge.w1, chosen_edge.w2, best_t);

			const hinge_scr = host.project_vertex(hinge_w, identity);
			if (hinge_scr.w < 0) continue;

			// Witness B (unrotated reference): along the parent face edge, toward face center
			const edge_dir_w = vec3.sub(vec3.create(), chosen_edge.w2, chosen_edge.w1);
			vec3.normalize(edge_dir_w, edge_dir_w);
			const face_center = vec3.create();
			for (const c of fc) vec3.add(face_center, face_center, c);
			vec3.scale(face_center, face_center, 0.25);
			const to_center = vec3.sub(vec3.create(), face_center, hinge_w);
			if (vec3.dot(edge_dir_w, to_center) < 0) vec3.negate(edge_dir_w, edge_dir_w);

			// Witness A (rotated): rotate edge_dir_w by the angle around the face normal
			const e1 = vec3.sub(vec3.create(), fc[1], fc[0]);
			const e2 = vec3.sub(vec3.create(), fc[3], fc[0]);
			const face_normal = vec3.cross(vec3.create(), e1, e2);
			vec3.normalize(face_normal, face_normal);

			const rot_q = quat.create();
			quat.setAxisAngle(rot_q, face_normal as [number, number, number], angle);
			const rotated_dir = vec3.create();
			vec3.transformQuat(rotated_dir, edge_dir_w, rot_q);

			// Radius: constant screen size
			const probe = vec3.scaleAndAdd(vec3.create(), hinge_w, edge_dir_w, 1.0);
			const probe_screen = host.project_vertex(probe, identity);
			if (probe_screen.w < 0) continue;
			const px_per_unit = Math.sqrt(
				(probe_screen.x - hinge_scr.x) ** 2 +
				(probe_screen.y - hinge_scr.y) ** 2
			);
			if (px_per_unit < 0.001) continue;
			const radius_w = ANGULAR_ARC_PX / px_per_unit;

			// Skip if another angular already claimed essentially the same hinge point
			const hinge_radius_px = 6;
			const collides = claimed_hinges.some(ch => {
				const ch_scr = host.project_vertex(ch, identity);
				if (ch_scr.w < 0) return false;
				const dx = hinge_scr.x - ch_scr.x, dy = hinge_scr.y - ch_scr.y;
				return (dx * dx + dy * dy) < hinge_radius_px * hinge_radius_px;
			});
			if (collides) continue;

			claimed_hinges.push(vec3.clone(hinge_w));

			render_angular(
				host, child_so, hinge_w, rotated_dir, edge_dir_w,
				Math.abs(angle), radius_w, axis.name, identity,
			);
		}
	}
}

/** Render one angular. All geometry in world space, projected through identity. */
function render_angular(
	host: AngularHost,
	so: Smart_Object,
	hinge_w: vec3,
	dir_a_w: vec3,
	dir_b_w: vec3,
	angle: number,
	radius_w: number,
	rotation_axis: Axis_Name,
	identity: mat4,
): void {
	const degrees = angle * 180 / Math.PI;

	const origin = host.project_vertex(hinge_w, identity);
	if (origin.w < 0) return;

	// Orthonormal basis in the arc plane: u = dir_b_w, v = perp toward dir_a_w
	const v_perp = perp_component(dir_a_w, dir_b_w);
	const vp_len = Math.sqrt(v_perp[0] ** 2 + v_perp[1] ** 2 + v_perp[2] ** 2);
	if (vp_len < 1e-6) return;

	// Sample the arc in world space
	const segments = 24;
	const arc_points: Projected[] = [];
	for (let i = 0; i <= segments; i++) {
		const t = (i / segments) * angle;
		const cos_t = Math.cos(t), sin_t = Math.sin(t);
		const point: vec3 = [
			hinge_w[0] + radius_w * (cos_t * dir_b_w[0] + sin_t * v_perp[0]),
			hinge_w[1] + radius_w * (cos_t * dir_b_w[1] + sin_t * v_perp[1]),
			hinge_w[2] + radius_w * (cos_t * dir_b_w[2] + sin_t * v_perp[2]),
		];
		const projected = host.project_vertex(point, identity);
		if (projected.w < 0) return;
		arc_points.push(projected);
	}

	// Short witness lines
	const witness_length = radius_w * 1.3;
	const witness_a_end = host.project_vertex(
		vec3.scaleAndAdd(vec3.create(), hinge_w, dir_a_w, witness_length), identity);
	const witness_b_end = host.project_vertex(
		vec3.scaleAndAdd(vec3.create(), hinge_w, dir_b_w, witness_length), identity);

	if (witness_a_end.w < 0 || witness_b_end.w < 0) return;

	// Text at arc midpoint
	const mid_index = Math.floor(segments / 2);
	const text_position = arc_points[mid_index];
	const ctx = host.ctx;
	ctx.font = '12px sans-serif';
	const text = degrees.toFixed(1) + '°';
	const text_width = ctx.measureText(text).width;
	const text_height = 12;

	// Compute gap in arc indices for text
	const segment_dx = arc_points[mid_index + 1].x - arc_points[mid_index].x;
	const segment_dy = arc_points[mid_index + 1].y - arc_points[mid_index].y;
	const segment_length = Math.sqrt(segment_dx * segment_dx + segment_dy * segment_dy);
	const gap_segments = segment_length > 0.5 ? Math.ceil((text_width / 2 + 6) / segment_length) : segments;
	const gap_start = Math.max(0, mid_index - gap_segments);
	const gap_end = Math.min(segments, mid_index + gap_segments);

	// Total projected arc length
	let total_arc_length = 0;
	for (let i = 0; i < segments; i++) {
		const pdx = arc_points[i + 1].x - arc_points[i].x;
		const pdy = arc_points[i + 1].y - arc_points[i].y;
		total_arc_length += Math.sqrt(pdx * pdx + pdy * pdy);
	}
	if (total_arc_length < 2) return;

	// Crunch: decide normal vs inverted layout
	const arrow_space = 20;
	const inverted = total_arc_length < (text_width + 16 + arrow_space);

	// Draw
	ctx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
	ctx.lineWidth = 1;

	// Witness lines from hinge
	ctx.beginPath();
	ctx.moveTo(origin.x, origin.y);
	ctx.lineTo(witness_a_end.x, witness_a_end.y);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(origin.x, origin.y);
	ctx.lineTo(witness_b_end.x, witness_b_end.y);
	ctx.stroke();

	if (!inverted) {
		// Normal: arc between witness lines with gap for text
		const min_stub = 3;
		const draw_start = Math.max(gap_start, min_stub);
		const draw_end = Math.min(gap_end, segments - min_stub);
		ctx.beginPath();
		ctx.moveTo(arc_points[0].x, arc_points[0].y);
		for (let i = 1; i <= Math.min(draw_start, segments); i++) ctx.lineTo(arc_points[i].x, arc_points[i].y);
		ctx.stroke();
		if (draw_end < segments) {
			ctx.beginPath();
			ctx.moveTo(arc_points[Math.max(draw_end, 0)].x, arc_points[Math.max(draw_end, 0)].y);
			for (let i = Math.max(draw_end, 0) + 1; i <= segments; i++) ctx.lineTo(arc_points[i].x, arc_points[i].y);
			ctx.stroke();
		}

		ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
		const a0 = arc_points[0], a1 = arc_points[Math.min(3, segments)];
		host.draw_arrow(a0.x, a0.y, a1.x - a0.x, a1.y - a0.y);
		const arc_end = arc_points[segments], arc_prev = arc_points[Math.max(0, segments - 3)];
		host.draw_arrow(arc_end.x, arc_end.y, arc_prev.x - arc_end.x, arc_prev.y - arc_end.y);
	} else {
		// Inverted: extension arcs outside
		const ext_target_px = 20;
		const fine_step = Math.PI / 180;
		const max_steps = 90;

		// Extension arc before witness B (t < 0)
		const ext_b_pts: Projected[] = [];
		ext_b_pts.push(arc_points[0]);
		for (let i = 1; i <= max_steps; i++) {
			const t = -(i * fine_step);
			const cos_t = Math.cos(t), sin_t = Math.sin(t);
			const pt: vec3 = [
				hinge_w[0] + radius_w * (cos_t * dir_b_w[0] + sin_t * v_perp[0]),
				hinge_w[1] + radius_w * (cos_t * dir_b_w[1] + sin_t * v_perp[1]),
				hinge_w[2] + radius_w * (cos_t * dir_b_w[2] + sin_t * v_perp[2]),
			];
			const p = host.project_vertex(pt, identity);
			ext_b_pts.push(p);
			const dx = p.x - ext_b_pts[0].x, dy = p.y - ext_b_pts[0].y;
			if (Math.sqrt(dx * dx + dy * dy) >= ext_target_px) break;
		}
		ctx.beginPath();
		ctx.moveTo(ext_b_pts[ext_b_pts.length - 1].x, ext_b_pts[ext_b_pts.length - 1].y);
		for (let i = ext_b_pts.length - 2; i >= 0; i--) ctx.lineTo(ext_b_pts[i].x, ext_b_pts[i].y);
		ctx.stroke();

		// Extension arc after witness A (t > angle)
		const ext_a_pts: Projected[] = [];
		ext_a_pts.push(arc_points[segments]);
		for (let i = 1; i <= max_steps; i++) {
			const t = angle + i * fine_step;
			const cos_t = Math.cos(t), sin_t = Math.sin(t);
			const pt: vec3 = [
				hinge_w[0] + radius_w * (cos_t * dir_b_w[0] + sin_t * v_perp[0]),
				hinge_w[1] + radius_w * (cos_t * dir_b_w[1] + sin_t * v_perp[1]),
				hinge_w[2] + radius_w * (cos_t * dir_b_w[2] + sin_t * v_perp[2]),
			];
			const p = host.project_vertex(pt, identity);
			ext_a_pts.push(p);
			const dx = p.x - ext_a_pts[0].x, dy = p.y - ext_a_pts[0].y;
			if (Math.sqrt(dx * dx + dy * dy) >= ext_target_px) break;
		}
		ctx.beginPath();
		ctx.moveTo(ext_a_pts[0].x, ext_a_pts[0].y);
		for (let i = 1; i < ext_a_pts.length; i++) ctx.lineTo(ext_a_pts[i].x, ext_a_pts[i].y);
		ctx.stroke();

		ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
		const eb = ext_b_pts[Math.min(3, ext_b_pts.length - 1)];
		host.draw_arrow(ext_b_pts[0].x, ext_b_pts[0].y, eb.x - ext_b_pts[0].x, eb.y - ext_b_pts[0].y);
		const ea = ext_a_pts[Math.min(3, ext_a_pts.length - 1)];
		host.draw_arrow(ext_a_pts[0].x, ext_a_pts[0].y, ea.x - ext_a_pts[0].x, ea.y - ext_a_pts[0].y);
	}

	// For very crunched angulars, push text outward
	let tx = text_position.x, ty = text_position.y;
	if (inverted && total_arc_length < arrow_space) {
		const dx = text_position.x - origin.x;
		const dy = text_position.y - origin.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist > 0.5) {
			const push = text_height / 2 + 10;
			tx = text_position.x + (dx / dist) * push;
			ty = text_position.y + (dy / dist) * push;
		}
	}

	// Text
	ctx.fillStyle = 'white';
	ctx.fillRect(tx - text_width / 2 - 2, ty - text_height / 2 - 1, text_width + 4, text_height + 2);
	ctx.fillStyle = '#333';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, tx, ty);

	// Record for hit testing / click-to-edit
	host.angular_rects.push({
		rotation_axis, angle_degrees: degrees, so,
		x: tx, y: ty, w: text_width, h: text_height,
		z: origin.z, face_index: -1,
	});
}

/** Get the unit vector perpendicular to u in the plane of u and v (toward v). */
function perp_component(v: vec3, u: vec3): vec3 {
	const dot = vec3.dot(v, u);
	const perp: vec3 = [v[0] - dot * u[0], v[1] - dot * u[1], v[2] - dot * u[2]];
	const len = Math.sqrt(perp[0] ** 2 + perp[1] ** 2 + perp[2] ** 2);
	if (len < 1e-8) return [0, 0, 0];
	return [perp[0] / len, perp[1] / len, perp[2] / len];
}
