import type Smart_Object from '../runtime/Smart_Object';
import type { Projected } from '../types/Interfaces';
import type { O_Scene } from '../types/Interfaces';
import type { Axis_Name } from '../types/Types';
import { hits_3d } from '../managers/Hits_3D';
import { scenes } from '../managers/Scenes';
import { stores } from '../managers/Stores';
import { mat4 } from 'gl-matrix';
import { camera } from './Camera';
import { vec3 } from 'gl-matrix';
import { scene } from './Scene';

/**
 * Axis decoration arrows on the root SO's bottom silhouette edges.
 * Each arrow is a 7-sided polygon (rectangle stem + triangle head)
 * lying in the plane of the face it references, 1" outward from the edge.
 * Stroke only — no fill.
 */

/** Subset of Render that Axes needs. */
export interface AxesHost {
	ctx: CanvasRenderingContext2D;
	project_vertex(v: vec3, world_matrix: mat4): Projected;
	get_world_matrix(obj: O_Scene): mat4;
	face_winding(face: number[], projected: Projected[]): number;
}

const AXIS_COLORS: Record<Axis_Name, string> = {
	x: 'rgba(180, 60, 60, 0.7)',
	y: 'rgba(60, 140, 60, 0.7)',
	z: 'rgba(60, 60, 180, 0.7)',
};

// Arrow dimensions in pixels (converted to 3D per-edge)
const OFFSET_PX = 40;       // visual distance from edge
const STEM_LEN_PX = 20;
const STEM_W_PX = 3;        // half-width of stem
const HEAD_LEN_PX = 12;
const HEAD_W_PX = 8;        // half-width of head

export function render_axes(host: AxesHost): void {
	const root_so = scenes.root_so;
	if (!root_so?.scene) return;

	const root_obj = scene.get_all().find(o => !o.parent);
	if (!root_obj) return;

	const projected = hits_3d.get_projected(root_obj.id);
	if (!projected) return;

	const world = host.get_world_matrix(root_obj);
	const faces = root_obj.so.scene?.faces;
	const edges = root_obj.so.scene?.edges;
	if (!faces || !edges) return;
	const verts = root_obj.so.vertices;

	const axes: Axis_Name[] = ['x', 'y', 'z'];

	for (const axis of axes) {
		// Find silhouette edges along this axis, scored by arrow readability
		const candidates: { v1: number; v2: number; face: number; mid_y: number; perp_wlen: number }[] = [];

		for (const [v1, v2] of edges) {
			if (edge_axis(verts[v1], verts[v2]) !== axis) continue;

			const adj = edge_faces(v1, v2, faces);
			if (adj.length !== 2) continue;

			const w0 = host.face_winding(faces[adj[0]], projected);
			const w1 = host.face_winding(faces[adj[1]], projected);

			// Must be a silhouette edge (one front, one back)
			if (!((w0 < 0 && w1 >= 0) || (w1 < 0 && w0 >= 0))) continue;

			const p1 = projected[v1], p2 = projected[v2];
			if (p1.w < 0 || p2.w < 0) continue;

			const em = vec3.fromValues(
				(verts[v1][0] + verts[v2][0]) / 2,
				(verts[v1][1] + verts[v2][1]) / 2,
				(verts[v1][2] + verts[v2][2]) / 2,
			);

			// Try both adjacent faces — pick the one with better perp visibility
			for (const fi of adj) {
				const face_ax = root_obj.so.face_axes(fi);
				const perp_axis = face_ax.find(a => a !== axis);
				if (!perp_axis) continue;
				const perp = root_obj.so.axis_vector(perp_axis);

				const em_plus_perp = vec3.add(vec3.create(), em, perp);
				const p_em = host.project_vertex(em, world);
				const p_ep = host.project_vertex(em_plus_perp, world);
				if (p_em.w < 0 || p_ep.w < 0) continue;

				const perp_wlen = Math.sqrt((p_ep.x - p_em.x) ** 2 + (p_ep.y - p_em.y) ** 2);
				if (perp_wlen < 0.001) continue;

				const mid_y = (p1.y + p2.y) / 2;
				candidates.push({ v1, v2, face: fi, mid_y, perp_wlen });
			}
		}

		if (candidates.length === 0) continue;

		// Pick the candidate with the most readable arrow (largest perp screen extent)
		candidates.sort((a, b) => b.perp_wlen - a.perp_wlen || b.mid_y - a.mid_y);
		const best = candidates[0];

		draw_axis_arrow(host, root_obj.so, best.v1, best.v2, best.face, axis, projected, world);
	}
}

function draw_axis_arrow(
	host: AxesHost,
	so: Smart_Object,
	v1: number, v2: number,
	front_face: number,
	axis: Axis_Name,
	_projected: Projected[],
	world: mat4,
): void {
	const verts = so.vertices;
	const faces = so.scene?.faces;
	if (!faces) return;

	// Arrow direction: positive axis
	const along = so.axis_vector(axis);

	// Perpendicular direction within the face plane
	const face_ax = so.face_axes(front_face);
	const perp_axis = face_ax.find(a => a !== axis)!;
	let perp = so.axis_vector(perp_axis);

	// Orient perp outward (away from face center, toward outside of SO)
	const face_vi = faces[front_face];
	const fc = vec3.create();
	for (const vi of face_vi) vec3.add(fc, fc, verts[vi]);
	vec3.scale(fc, fc, 1 / face_vi.length);

	const em = vec3.fromValues(
		(verts[v1][0] + verts[v2][0]) / 2,
		(verts[v1][1] + verts[v2][1]) / 2,
		(verts[v1][2] + verts[v2][2]) / 2,
	);

	const to_edge = vec3.sub(vec3.create(), em, fc);
	if (vec3.dot(to_edge, perp) < 0) {
		perp = vec3.negate(vec3.create(), perp);
	}

	// Compute pixel-to-3D scale at this edge's depth
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

	// 7 arrow vertices in 3D, lying on the face plane
	// along = arrow direction (positive axis), perp = width direction (outward)
	const total = stem_len + head_len;
	const pts: vec3[] = [
		offset(base, along, -total / 2, perp, -stem_w),               // 0: stem bottom-left
		offset(base, along, -total / 2, perp, +stem_w),               // 1: stem bottom-right
		offset(base, along, -total / 2 + stem_len, perp, +stem_w),    // 2: stem top-right (right shoulder inner)
		offset(base, along, -total / 2 + stem_len, perp, +head_w),    // 3: head right base (right shoulder outer)
		offset(base, along, +total / 2, perp, 0),                      // 4: tip
		offset(base, along, -total / 2 + stem_len, perp, -head_w),    // 5: head left base (left shoulder outer)
		offset(base, along, -total / 2 + stem_len, perp, -stem_w),    // 6: stem top-left (left shoulder inner)
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

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

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

function edge_faces(v1: number, v2: number, faces: number[][]): number[] {
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
}
