import { T_Endpoint, endpoint_key, type EndpointID } from './Facets';
import type { Projected, O_Scene } from '../types/Interfaces';
import { vec3, vec4, mat4 } from 'gl-matrix';
import { k } from '../common/Constants';
import type Flatbush from 'flatbush';

// ─── Shared types (formerly in Topology.ts) ─────────────────────────────────

export type Pt = { x: number; y: number };

export interface OccludingFace {
	n: vec3; d: number;
	corners: vec3[];
	poly: Pt[];
	obj_id: string;
	face_index?: number;
	face_verts?: number[];
	silhouette_edges?: boolean[];
}

export interface TopologyInput {
	objects: O_Scene[];
	projected_map: Map<string, Projected[]>;
	occluding_faces: OccludingFace[];
	occluding_index: Flatbush | null;
	face_winding: (face: number[], projected: Projected[]) => number;
	get_world_matrix: (obj: O_Scene) => mat4;
	project_vertex: (v: vec3, world: mat4) => Projected;
	front_face_edges: (obj: O_Scene, projected: Projected[]) => Set<string>;
}

export interface ComputedEndpoint {
	key: string;
	id: EndpointID;
	screen: Pt;
	world: vec3;
}

export interface ComputedEdgeSeg {
	edge_key: string;
	so: string;
	visible: [Pt, Pt][];
	endpoint_keys: [string, string][];
}

export interface ComputedIntersectionSeg {
	visible: [Pt, Pt][];
	endpoint_keys: [string, string][];
	color: string;
	so_a: string; face_a: number;
	so_b: string; face_b: number;
	start_on_edge?: { so: string; edge_key: string; t: number };
	end_on_edge?: { so: string; edge_key: string; t: number };
}

export interface ComputedOccludingSeg {
	so: string;
	face: number;
	screen: [Pt, Pt];
	endpoint_keys: [string, string];
}

export interface TopologyOutput {
	endpoints: Map<string, ComputedEndpoint>;
	edge_segments: Map<string, ComputedEdgeSeg[]>;
	intersection_segments: ComputedIntersectionSeg[];
	occluding_segments: ComputedOccludingSeg[];
}

/**
 * Topology.ts — Three-pass architecture for the faceted 3D renderer.
 *
 * Pass 1: Visibility — find visible parts of edges and intersection lines
 * Pass 2: Arrangement — find crossings, split everything (Session 2)
 * Pass 3: Label — assign endpoint identities (Session 3)
 */

// ─── Internal types ──────────────────────────────────────────────────────────

type OccFaceRef = OccludingFace | null;

interface PartInterval {
	start: Pt; end: Pt;
	start_cause: OccFaceRef;
	end_cause: OccFaceRef;
	start_poly_edge?: number;
	end_poly_edge?: number;
}

/** A visible part tagged with where it came from — no identity yet */
interface VisiblePart {
	type: 'edge' | 'intersection';
	so: string;
	edge_key?: string;         // for edges
	face_pair?: { so_a: string; face_a: number; so_b: string; face_b: number; color: string }; // for intersections
	start_on_edge?: { so: string; edge_key: string; t: number };
	end_on_edge?: { so: string; edge_key: string; t: number };
	start_other_edge?: string;  // edge from the OTHER face at the start point (for pierce-pierce merge)
	end_other_edge?: string;    // edge from the OTHER face at the end point
	screen: [Pt, Pt];
	world: [vec3, vec3];
	start_cause: OccFaceRef;
	end_cause: OccFaceRef;
	start_poly_edge: number;
	end_poly_edge: number;
	// For edges: which vertex indices
	vertex_i?: number;
	vertex_j?: number;
	// For intersections: vertex hit from quad clipper (mesh vertex index, or -1)
	start_at_vertex?: { so: string; vertex: number };
	end_at_vertex?: { so: string; vertex: number };
}

/** Anonymous face-boundary crossing from Pass 1d (no identity assigned) */
interface FaceBoundaryCrossing {
	edge_so: string;          // the edge's object
	edge_key: string;         // the edge (e.g., "0-1")
	face_so: string;          // the face's object
	face_index: number;       // face index within face_so
	face_verts?: number[];    // vertex indices of the face
	screen_enter: Pt;
	screen_leave: Pt;
	world_enter: vec3;
	world_leave: vec3;
	enter_boundary_edge: number;  // polygon edge index at entry, or -1
	leave_boundary_edge: number;  // polygon edge index at exit, or -1
	t_enter: number;          // parametric t along the edge part (0 = starts inside face)
	t_leave: number;          // parametric t along the edge part (1 = ends inside face)
	edge_part_start_key: string;  // the edge part's own start endpoint key
	edge_part_end_key: string;    // the edge part's own end endpoint key
}

/** Crossing found by the arrangement pass */
interface ArrangementCrossing {
	part_a: number; part_b: number;
	ta: number; tb: number;
	screen: Pt;
	world_a: vec3; world_b: vec3;
}

/** Split point on a part from the arrangement */
interface SplitPoint {
	t: number; screen: Pt; world: vec3; crossing_idx: number;
}

/** Convert a face's vertex indices to letters: [7,6,2,3] → "HGCD" */
function face_name(obj: O_Scene, face_index: number): string {
	const verts = obj.faces?.[face_index];
	if (!verts) return String(face_index);
	return verts.map((v: number) => String.fromCharCode(65 + v)).join('');
}

/** Build a face key using vertex letters: "obj_1:HGCD" instead of "obj_1:4" */
function face_key(obj: O_Scene, face_index: number): string {
	return `${obj.id}:${face_name(obj, face_index)}`;
}

/** Build a face key by looking up the object by id */
function face_key_by_id(so_id: string, face_index: number, input: TopologyInput): string {
	const obj = input.objects.find(o => o.id === so_id);
	if (!obj) return `${so_id}:${face_index}`;
	return face_key(obj, face_index);
}

/** Convert a polygon edge index to an edge string: "obj_id:min_vertex-max_vertex" */
function boundary_edge_str(obj_id: string, face_verts: number[], poly_edge_idx: number): string | undefined {
	if (poly_edge_idx < 0) return undefined; // not caused by occlusion — corner or pierce
	if (!face_verts || poly_edge_idx >= face_verts.length) {
		console.warn(`boundary_edge_str: face vertex data missing for ${obj_id} at edge index ${poly_edge_idx}`);
		return undefined;
	}
	const vi = face_verts[poly_edge_idx];
	const vj = face_verts[(poly_edge_idx + 1) % face_verts.length];
	return `${obj_id}:${Math.min(vi, vj)}-${Math.max(vi, vj)}`;
}

/** Make a key string readable: obj_1→ALPHA, obj_2→BETA, vertex numbers→letters */
function pretty_key(key: string): string {
	return key
		.replace(/obj_1/g, 'ALPHA').replace(/obj_2/g, 'BETA').replace(/obj_3/g, 'GAMMA')
		.replace(/:(\d+)-(\d+)/g, (_, a, b) => ':' + String.fromCharCode(65+Number(a)) + String.fromCharCode(65+Number(b)));
}

// ─── Topology ─────────────────────────────────────────────────────────

export class Topology {
	// Arrangement data stored for Pass 3
	private _crossings: ArrangementCrossing[] = [];
	private _splits_by_part = new Map<number, SplitPoint[]>();
	private _face_boundary_crossings: FaceBoundaryCrossing[] = [];

	// ─── Public API ──────────────────────────────────────────────────────────

	compute(input: TopologyInput): TopologyOutput {
		const endpoints = new Map<string, ComputedEndpoint>();
		const edge_segments = new Map<string, ComputedEdgeSeg[]>();
		const intersection_segments: ComputedIntersectionSeg[] = [];
		const occluding_segments: ComputedOccludingSeg[] = [];

		// Clear per-frame state
		this._crossings = [];
		this._splits_by_part = new Map();
		this._face_boundary_crossings = [];

		// ── Pass 1: Visibility ──
		const parts: VisiblePart[] = [];
		// Lookup: which pierce endpoints sit on which edges (built by 1a, used by 1b)
		const pierce_on_edge = new Map<string, { key: string; face_a: string; face_b: string }[]>();
		// 1a: Intersection lines (before edges — builds pierce_on_edge lookup)
		if (input.objects.length > 1) {
			this.compute_intersection_visibility(input, parts, endpoints, intersection_segments, pierce_on_edge);
		}

		// 1b: Edge visibility (uses pierce_on_edge to reuse pierce keys at pierce points)
		this.compute_edge_visibility(input, parts, endpoints, edge_segments, pierce_on_edge, intersection_segments);

		// (Pass 1c deleted — pierce-corner collapse now handled by Pass 3's vertex-hit merge)

		// ── Pass 1e: Split edge parts at intersection line endpoints ──
		// Each intersection line endpoint sits on a face boundary edge (on_edge data).
		// Split the visible edge part that contains that point, so the intersection
		// endpoint is wired into the edge graph.
		if (input.objects.length > 1) {
			for (const part of parts) {
				if (part.type !== 'intersection') continue;
				if (part.start_cause || part.end_cause) continue; // only unoccluded endpoints
				for (const end of ['start', 'end'] as const) {
					const on_edge = end === 'start' ? part.start_on_edge : part.end_on_edge;
					if (!on_edge) continue;
					const screen_pt = end === 'start' ? part.screen[0] : part.screen[1];
					const world_pt = end === 'start' ? part.world[0] : part.world[1];
					const fp = part.face_pair!;
					const piercing_edge = `${on_edge.so}:${on_edge.edge_key}`;
					const pierced_face = on_edge.so === fp.so_a
						? face_key_by_id(fp.so_b, fp.face_b, input)
						: face_key_by_id(fp.so_a, fp.face_a, input);
					const pierce_id: EndpointID = { type: T_Endpoint.pierce, edge: piercing_edge, face: pierced_face };
					const pierce_key = endpoint_key(pierce_id);

					// Find the edge segment that contains this point
					const segs = edge_segments.get(on_edge.so);
					if (!segs) continue;
					for (const seg of segs) {
						if (seg.edge_key !== on_edge.edge_key) continue;
						for (let vi = 0; vi < seg.visible.length; vi++) {
							const [s, e] = seg.visible[vi];
							const [sk, ek] = seg.endpoint_keys[vi];
							// Check if the intersection point is between s and e on screen
							const t = Topology.screen_t(s, e, screen_pt);
							if (t < 0.01 || t > 0.99) continue;
							// Split this visible interval at the intersection point
							const mid: Pt = { x: s.x + (e.x - s.x) * t, y: s.y + (e.y - s.y) * t };
							// Ensure the pierce endpoint exists
							if (!endpoints.has(pierce_key)) {
								this.register_endpoint(endpoints, pierce_id, screen_pt, world_pt);
							}
							// Replace the single interval with two
							seg.visible.splice(vi, 1, [s, mid], [mid, e]);
							seg.endpoint_keys.splice(vi, 1, [sk, pierce_key], [pierce_key, ek]);
							// Also split the corresponding part in the parts array
							const part_idx = parts.findIndex(c =>
								c.type === 'edge' && c.so === on_edge.so && c.edge_key === on_edge.edge_key &&
								Math.abs(Topology.screen_t(c.screen[0], c.screen[1], screen_pt)) < 1 &&
								Math.abs(Topology.screen_t(c.screen[0], c.screen[1], screen_pt)) > 0.01
							);
							if (part_idx >= 0) {
								const oc = parts[part_idx];
								const ct = Topology.screen_t(oc.screen[0], oc.screen[1], screen_pt);
								const w_mid = vec3.lerp(vec3.create(), oc.world[0], oc.world[1], ct);
								const new_part: VisiblePart = {
									...oc,
									screen: [mid, oc.screen[1]],
									world: [w_mid, oc.world[1]],
									start_cause: null,
								};
								oc.screen[1] = mid;
								oc.world[1] = w_mid;
								oc.end_cause = null;
								parts.push(new_part);
							}
							break;
						}
					}
				}
			}
		}

		// ── Pass 1d: Harvest face-boundary crossings from part data ──
		if (input.objects.length > 1) {
			this.harvest_face_crossings(input, parts, endpoints, edge_segments);
		}

		// ── Pass 2: Arrangement ──
		if (input.objects.length > 1) {
			this.compute_arrangement(input, parts, endpoints, edge_segments, intersection_segments, occluding_segments);
		}

		// ── Pass 3: Assign identity from source tags ──
		if (input.objects.length > 1) {
			const v2 = this.compute_identity_v2(input, parts, endpoints, occluding_segments, intersection_segments, edge_segments);
			for (const [key, ep] of v2.endpoints) {
				endpoints.set(key, ep);
			}
			for (const key of [...endpoints.keys()]) {
				if (key.startsWith('cross:') && !v2.endpoints.has(key)) {
					endpoints.delete(key);
				}
			}
			occluding_segments.length = 0;
			occluding_segments.push(...v2.occluding_segments);
		}

		return { endpoints, edge_segments, intersection_segments, occluding_segments };
	}

	// ─── Pass 1b: Edge visibility ────────────────────────────────────────────

	private compute_edge_visibility(
		input: TopologyInput,
		parts: VisiblePart[],
		endpoints: Map<string, ComputedEndpoint>,
		edge_segments: Map<string, ComputedEdgeSeg[]>,
		pierce_on_edge: Map<string, { key: string; face_a: string; face_b: string }[]>,
		_intersection_segments: ComputedIntersectionSeg[],
	): void {
		const CORNER_T = 0.01;

		for (const obj of input.objects) {
			const projected = input.projected_map.get(obj.id)!;
			const world = input.get_world_matrix(obj);
			const front_edges = input.front_face_edges(obj, projected);
			const segments: ComputedEdgeSeg[] = [];

			for (const [i, j_idx] of obj.edges) {
				const a = projected[i], b = projected[j_idx];
				if (a.w < 0 || b.w < 0) continue;
				const ek = `${Math.min(i, j_idx)}-${Math.max(i, j_idx)}`;
				if (!front_edges.has(ek)) continue;

				const vi = obj.so.vertices[i], vj = obj.so.vertices[j_idx];
				const wi = vec4.create(), wj = vec4.create();
				vec4.transformMat4(wi, [vi[0], vi[1], vi[2], 1], world);
				vec4.transformMat4(wj, [vj[0], vj[1], vj[2], 1], world);
				const w1 = vec3.fromValues(wi[0], wi[1], wi[2]);
				const w2 = vec3.fromValues(wj[0], wj[1], wj[2]);

				let intervals = this.clip_segment_for_occlusion_rich(
					{ x: a.x, y: a.y }, { x: b.x, y: b.y }, w1, w2, obj.id, undefined, input,
				);

				// Merge nearly-touching intervals
				if (intervals.length > 1) {
					const GAP_T = 0.02;
					const merged: PartInterval[] = [intervals[0]];
					for (let ci = 1; ci < intervals.length; ci++) {
						const prev_t = Topology.screen_t(a, b, merged[merged.length - 1].end);
						const cur_t = Topology.screen_t(a, b, intervals[ci].start);
						if (Math.abs(cur_t - prev_t) < GAP_T) {
							merged[merged.length - 1] = {
								start: merged[merged.length - 1].start,
								end: intervals[ci].end,
								start_cause: merged[merged.length - 1].start_cause,
								end_cause: intervals[ci].end_cause,
							};
						} else {
							merged.push(intervals[ci]);
						}
					}
					intervals = merged;
				}

				if (intervals.length > 0) {
					const vis: [Pt, Pt][] = [];
					const ep_keys: [string, string][] = [];

					for (const ci of intervals) {
						const t_s = Topology.screen_t(a, b, ci.start);
						const t_e = Topology.screen_t(a, b, ci.end);
						const w_s = vec3.lerp(vec3.create(), w1, w2, Math.max(0, Math.min(1, t_s)));
						const w_e = vec3.lerp(vec3.create(), w1, w2, Math.max(0, Math.min(1, t_e)));

						// Tag endpoints — check pierce_on_edge before creating oc
						const find_pierce = (cause: OccFaceRef): string | undefined => {
							if (!cause) return undefined;
							const hiding_face = face_key_by_id(cause.obj_id, cause.face_index ?? -1, input);
							const this_edge = `${obj.id}:${ek}`;
							const pierce_list = pierce_on_edge.get(this_edge);
							if (!pierce_list) {
								return undefined;
							}
							for (const p of pierce_list) {
								if (p.face_a !== hiding_face && p.face_b !== hiding_face) {
									continue;
								}
								return p.key;
							}
							return undefined;
						};

						let sk: string;
						if (!ci.start_cause && t_s < CORNER_T) {
							sk = this.register_corner(endpoints, obj.id, i, { x: projected[i].x, y: projected[i].y }, w_s);
						} else if (!ci.start_cause && t_s > 1 - CORNER_T) {
							sk = this.register_corner(endpoints, obj.id, j_idx, { x: projected[j_idx].x, y: projected[j_idx].y }, w_s);
						} else {
							const pierce_key = find_pierce(ci.start_cause);
							if (pierce_key) {
								sk = pierce_key;
							} else {
								const edge_id = `${obj.id}:${ek}`;
								const hiding_edge = ci.start_cause && ci.start_poly_edge != null
									? boundary_edge_str(ci.start_cause.obj_id, ci.start_cause.face_verts!, ci.start_poly_edge)
									: undefined;
								if (hiding_edge) {
									const [eA, eB] = edge_id < hiding_edge ? [edge_id, hiding_edge] : [hiding_edge, edge_id];
									const id: EndpointID = { type: T_Endpoint.cross, edgeA: eA, edgeB: eB };
									sk = this.register_endpoint(endpoints, id, ci.start, w_s);
								} else {
									// No boundary edge — use interval position (not vertex position)
									sk = this.register_endpoint(endpoints, { type: T_Endpoint.cross, edgeA: edge_id, edgeB: 'unknown' }, ci.start, w_s);
								}
							}
						}

						let ek2: string;
						if (!ci.end_cause && t_e > 1 - CORNER_T) {
							ek2 = this.register_corner(endpoints, obj.id, j_idx, { x: projected[j_idx].x, y: projected[j_idx].y }, w_e);
						} else if (!ci.end_cause && t_e < CORNER_T) {
							ek2 = this.register_corner(endpoints, obj.id, i, { x: projected[i].x, y: projected[i].y }, w_e);
						} else {
							const pierce_key = find_pierce(ci.end_cause);
							if (pierce_key) {
								ek2 = pierce_key;
							} else {
								const edge_id = `${obj.id}:${ek}`;
								const hiding_edge = ci.end_cause && ci.end_poly_edge != null
									? boundary_edge_str(ci.end_cause.obj_id, ci.end_cause.face_verts!, ci.end_poly_edge)
									: undefined;
								if (hiding_edge) {
									// Cross key: this edge meets the hiding face's boundary edge
									const [eA, eB] = edge_id < hiding_edge ? [edge_id, hiding_edge] : [hiding_edge, edge_id];
									const id: EndpointID = { type: T_Endpoint.cross, edgeA: eA, edgeB: eB };
									ek2 = this.register_endpoint(endpoints, id, ci.end, w_e);
								} else {
									// No boundary edge — use interval position (not vertex position)
									ek2 = this.register_endpoint(endpoints, { type: T_Endpoint.cross, edgeA: edge_id, edgeB: 'unknown:end' }, ci.end, w_e);
								}
							}
						}

						vis.push([ci.start, ci.end]);
						ep_keys.push([sk, ek2]);

						// Collect for Pass 2
						parts.push({
							type: 'edge', so: obj.id, edge_key: ek,
							screen: [ci.start, ci.end], world: [w_s, w_e],
							start_cause: ci.start_cause, end_cause: ci.end_cause,
							start_poly_edge: ci.start_poly_edge ?? -1, end_poly_edge: ci.end_poly_edge ?? -1,
							vertex_i: i, vertex_j: j_idx,
						});
					}

					segments.push({ edge_key: ek, so: obj.id, visible: vis, endpoint_keys: ep_keys });
				}
			}
			edge_segments.set(obj.id, segments);
		}
	}

	// ─── Pass 1a: Intersection lines ─────────────────────────────────────────

	private compute_intersection_visibility(
		input: TopologyInput,
		parts: VisiblePart[],
		endpoints: Map<string, ComputedEndpoint>,
		intersection_segments: ComputedIntersectionSeg[],
		pierce_on_edge: Map<string, { key: string; face_a: string; face_b: string }[]>,
	): void {
		const { objects, occluding_faces } = input;

		// Build world-space face data for each object
		type WFace = { n: vec3; d: number; corners: vec3[]; fi: number; obj: O_Scene };
		const obj_faces: WFace[][] = [];

		for (const obj of objects) {
			const world = input.get_world_matrix(obj);
			const faces: WFace[] = [];
			const verts = obj.so.vertices;
			const face_indices = obj.faces;
			if (!face_indices) { obj_faces.push([]); continue; }

			for (let fi = 0; fi < face_indices.length; fi++) {
				if (!occluding_faces.some(f => f.obj_id === obj.id && f.face_index === fi)) continue;
				const face_vi = face_indices[fi];
				const corners: vec3[] = [];
				for (const vi of face_vi) {
					const lv = verts[vi];
					const wv = vec4.create();
					vec4.transformMat4(wv, [lv[0], lv[1], lv[2], 1], world);
					corners.push(vec3.fromValues(wv[0], wv[1], wv[2]));
				}
				const e1 = vec3.sub(vec3.create(), corners[1], corners[0]);
				const e2 = vec3.sub(vec3.create(), corners[3], corners[0]);
				const n = vec3.cross(vec3.create(), e1, e2);
				vec3.normalize(n, n);
				const d = vec3.dot(n, corners[0]);
				faces.push({ n, d, corners, fi, obj });
			}
			obj_faces.push(faces);
		}

		// AABB per object for broad-phase skip
		const mins: vec3[] = [];
		const maxs: vec3[] = [];
		for (let i = 0; i < obj_faces.length; i++) {
			const lo = vec3.fromValues(Infinity, Infinity, Infinity);
			const hi = vec3.fromValues(-Infinity, -Infinity, -Infinity);
			for (const face of obj_faces[i]) {
				for (const c of face.corners) {
					vec3.min(lo, lo, c);
					vec3.max(hi, hi, c);
				}
			}
			mins.push(lo);
			maxs.push(hi);
		}

		for (let i = 0; i < objects.length; i++) {
			for (let j = i + 1; j < objects.length; j++) {
				// AABB overlap test
				if (mins[i][0] > maxs[j][0] || mins[j][0] > maxs[i][0] ||
						mins[i][1] > maxs[j][1] || mins[j][1] > maxs[i][1] ||
						mins[i][2] > maxs[j][2] || mins[j][2] > maxs[i][2]) continue;

				for (let fi_a = 0; fi_a < obj_faces[i].length; fi_a++) {
					for (let fi_b = 0; fi_b < obj_faces[j].length; fi_b++) {
						const fA = obj_faces[i][fi_a];
						const fB = obj_faces[j][fi_b];
						const geom = this.intersect_face_pair(fA, fB);
						if (!geom) continue;

						const identity = mat4.create();
						const s1 = input.project_vertex(geom.start, identity);
						const s2 = input.project_vertex(geom.end, identity);
						if (s1.w < 0 || s2.w < 0) continue;

						const p1: Pt = { x: s1.x, y: s1.y };
						const p2: Pt = { x: s2.x, y: s2.y };

						// Skip both objects' faces — the intersection line lies on both objects' surfaces.
						// The pierce-pierce skip in Pass 3 handles hidden intersection line sections.
						const intervals = this.clip_segment_for_occlusion_rich(
							p1, p2, geom.start, geom.end, [fA.obj.id, fB.obj.id], [fA, fB], input,
						);

						if (intervals.length === 0) continue;

						const visible: [Pt, Pt][] = intervals.map(ci => [ci.start, ci.end]);
						const face_key_a = face_key(fA.obj, fA.fi);
						const face_key_b = face_key(fB.obj, fB.fi);

						// Compute edge info for both endpoints — from the constraining face
						const edge_info = (e: { face: 'A' | 'B'; edge_idx: number }, world_pt: vec3) => {
							const f = e.face === 'A' ? fA : fB;
							const face_verts = f.obj.faces![f.fi];
							const vi = face_verts[e.edge_idx];
							const vj = face_verts[(e.edge_idx + 1) % face_verts.length];
							const ek_str = `${Math.min(vi, vj)}-${Math.max(vi, vj)}`;
							const c0 = f.corners[e.edge_idx];
							const c1 = f.corners[(e.edge_idx + 1) % f.corners.length];
							const edge_vec = vec3.sub(vec3.create(), c1, c0);
							const len_sq = vec3.dot(edge_vec, edge_vec);
							const pt_vec = vec3.sub(vec3.create(), world_pt, c0);
							const t = len_sq > 1e-10 ? vec3.dot(pt_vec, edge_vec) / len_sq : 0;
							return { so: f.obj.id, edge_key: ek_str, t };
						};
						// Also compute edge info from the OTHER face (for pierce-pierce merge)
						const other_edge_info = (e: { face: 'A' | 'B'; edge_idx: number }, world_pt: vec3) => {
							const f = e.face === 'A' ? fB : fA; // opposite face
							const face_verts = f.obj.faces![f.fi];
							// Find which edge of this face the point lies on
							const EDGE_T_TOL = 0.02;
							for (let ei = 0; ei < f.corners.length; ei++) {
								const c0 = f.corners[ei];
								const c1 = f.corners[(ei + 1) % f.corners.length];
								const edge_vec = vec3.sub(vec3.create(), c1, c0);
								const len_sq = vec3.dot(edge_vec, edge_vec);
								if (len_sq < 1e-10) continue;
								const pt_vec = vec3.sub(vec3.create(), world_pt, c0);
								const t = vec3.dot(pt_vec, edge_vec) / len_sq;
								if (t < -EDGE_T_TOL || t > 1 + EDGE_T_TOL) continue;
								// Check distance from point to edge line
								const proj = vec3.scaleAndAdd(vec3.create(), c0, edge_vec, t);
								const dist = vec3.distance(proj, world_pt);
								if (dist < 1.0) {
									const vi = face_verts[ei];
									const vj = face_verts[(ei + 1) % face_verts.length];
									return `${f.obj.id}:${Math.min(vi, vj)}-${Math.max(vi, vj)}`;
								}
							}
							return '';
						};
						const se = edge_info(geom.start_edge, geom.start);
						const ee = edge_info(geom.end_edge, geom.end);
						const se_other = other_edge_info(geom.start_edge, geom.start);
						const ee_other = other_edge_info(geom.end_edge, geom.end);

						// Tag endpoints — pierce for unoccluded ends, oc for occluded ends
						const ep_keys: [string, string][] = [];
						for (const ci of intervals) {
							const t_s = Topology.screen_t(p1, p2, ci.start);
							const w_s = vec3.lerp(vec3.create(), geom.start, geom.end, Math.max(0, Math.min(1, t_s)));
							let s_id: EndpointID;
							if (!ci.start_cause) {
								const piercing_edge = `${se.so}:${se.edge_key}`;
								const pierced_face = geom.start_edge.face === 'A' ? face_key_b : face_key_a;
								s_id = { type: T_Endpoint.pierce, edge: piercing_edge, face: pierced_face };
							} else {
								const ix_edge = `ix:${face_key_a}:${face_key_b}`;
								const hiding_edge = ci.start_poly_edge != null
									? boundary_edge_str(ci.start_cause.obj_id, ci.start_cause.face_verts!, ci.start_poly_edge)
									: undefined;
								if (hiding_edge) {
									const [eA, eB] = ix_edge < hiding_edge ? [ix_edge, hiding_edge] : [hiding_edge, ix_edge];
									s_id = { type: T_Endpoint.cross, edgeA: eA, edgeB: eB };
								} else {
									// No boundary edge — for intersection line ${ix_edge} hidden by ${ci.start_cause.obj_id}`);
									s_id = { type: T_Endpoint.pierce, edge: `${se.so}:${se.edge_key}`, face: face_key_b };
								}
							}
							const s_key = this.register_endpoint(endpoints, s_id, ci.start, w_s);

							const t_e = Topology.screen_t(p1, p2, ci.end);
							const w_e = vec3.lerp(vec3.create(), geom.start, geom.end, Math.max(0, Math.min(1, t_e)));
							let e_id: EndpointID;
							if (!ci.end_cause) {
								const piercing_edge = `${ee.so}:${ee.edge_key}`;
								const pierced_face = geom.end_edge.face === 'A' ? face_key_b : face_key_a;
								e_id = { type: T_Endpoint.pierce, edge: piercing_edge, face: pierced_face };
							} else {
								const ix_edge = `ix:${face_key_a}:${face_key_b}`;
								const hiding_edge = ci.end_poly_edge != null
									? boundary_edge_str(ci.end_cause.obj_id, ci.end_cause.face_verts!, ci.end_poly_edge)
									: undefined;
								if (hiding_edge) {
									const [eA, eB] = ix_edge < hiding_edge ? [ix_edge, hiding_edge] : [hiding_edge, ix_edge];
									e_id = { type: T_Endpoint.cross, edgeA: eA, edgeB: eB };
								} else {
									// No boundary edge — for intersection line ${ix_edge} hidden by ${ci.end_cause.obj_id}`);
									e_id = { type: T_Endpoint.pierce, edge: `${ee.so}:${ee.edge_key}`, face: face_key_a };
								}
							}
							const e_key = this.register_endpoint(endpoints, e_id, ci.end, w_e);

							ep_keys.push([s_key, e_key]);

							// Register pierce endpoints on their edges for Pass 1b lookup
							if (!ci.start_cause && se.so && se.edge_key) {
								const edge_full = `${se.so}:${se.edge_key}`;
									let list = pierce_on_edge.get(edge_full);
								if (!list) { list = []; pierce_on_edge.set(edge_full, list); }
								if (!list.some(e => e.key === s_key)) {
									list.push({ key: s_key, face_a: face_key_a, face_b: face_key_b });
								}
							}
							if (!ci.end_cause && ee.so && ee.edge_key) {
								const edge_full = `${ee.so}:${ee.edge_key}`;
								let list = pierce_on_edge.get(edge_full);
								if (!list) { list = []; pierce_on_edge.set(edge_full, list); }
								if (!list.some(e => e.key === e_key)) {
									list.push({ key: e_key, face_a: face_key_a, face_b: face_key_b });
								}
							}

							// Resolve vertex hits to mesh vertex indices
							const resolve_vertex = (vtx_corner: number, edge: { face: 'A' | 'B'; edge_idx: number }) => {
								if (vtx_corner < 0) return undefined;
								const f = edge.face === 'A' ? fA : fB;
								const face_verts = f.obj.faces![f.fi];
								return { so: f.obj.id, vertex: face_verts[vtx_corner] };
							};

							// Collect for Pass 2
							parts.push({
								type: 'intersection', so: fA.obj.id,
								face_pair: { so_a: fA.obj.id, face_a: fA.fi, so_b: fB.obj.id, face_b: fB.fi, color: objects[j].color },
								start_on_edge: se, end_on_edge: ee,
								start_other_edge: se_other, end_other_edge: ee_other,
								screen: [ci.start, ci.end], world: [w_s, w_e],
								start_cause: ci.start_cause, end_cause: ci.end_cause,
								start_poly_edge: ci.start_poly_edge ?? -1, end_poly_edge: ci.end_poly_edge ?? -1,
								start_at_vertex: resolve_vertex(geom.start_vertex, geom.start_edge),
								end_at_vertex: resolve_vertex(geom.end_vertex, geom.end_edge),
							});
						}

						intersection_segments.push({
							visible, endpoint_keys: ep_keys, color: objects[j].color,
							so_a: fA.obj.id, face_a: fA.fi, so_b: fB.obj.id, face_b: fB.fi,
							start_on_edge: se, end_on_edge: ee,
						});
					}
				}
			}
		}
	}

	// ─── Pass 1d: Face-polygon clipping for occluding segments ──────────────

	private harvest_face_crossings(
		input: TopologyInput,
		_parts: VisiblePart[],
		endpoints: Map<string, ComputedEndpoint>,
		edge_segments: Map<string, ComputedEdgeSeg[]>,
	): void {
		// For each visible edge, test against each other-SO face polygon.
		// If the edge is IN FRONT of the face (depth check), create an occluding
		// segment connecting the entry and exit points on the face boundary.

		for (const [so_a_id, segs] of edge_segments) {
			for (const seg of segs) {
				for (let ci = 0; ci < seg.visible.length; ci++) {
					const [s, e] = seg.visible[ci];
					const [sk, ek] = seg.endpoint_keys[ci];
					const ep_s = endpoints.get(sk);
					const ep_e = endpoints.get(ek);
					if (!ep_s || !ep_e) continue;

					for (let fi = 0; fi < input.occluding_faces.length; fi++) {
						const face = input.occluding_faces[fi];
						if (face.obj_id === so_a_id) continue;

						const clipped = this.clip_segment_to_polygon_2d(s, e, face.poly);
						if (!clipped) continue;
						const [t_enter, t_leave] = clipped;

						// Depth check: edge must be in front of face (not behind)
						const w_mid = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, (t_enter + t_leave) / 2);
						const dist = vec3.dot(face.n, w_mid) - face.d;

						if (dist < -0.001) continue;

						const cs: Pt = { x: s.x + (e.x - s.x) * t_enter, y: s.y + (e.y - s.y) * t_enter };
						const ce: Pt = { x: s.x + (e.x - s.x) * t_leave, y: s.y + (e.y - s.y) * t_leave };
						const w_cs = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, t_enter);
						const w_ce = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, t_leave);

						// Store anonymous crossing data for Pass 3
						this._face_boundary_crossings.push({
							edge_so: so_a_id,
							edge_key: seg.edge_key,
							face_so: face.obj_id,
							face_index: face.face_index ?? -1,
							face_verts: face.face_verts,
							screen_enter: cs,
							screen_leave: ce,
							world_enter: w_cs,
							world_leave: w_ce,
							enter_boundary_edge: clipped[2],
							leave_boundary_edge: clipped[3],
							t_enter,
							t_leave,
							edge_part_start_key: sk,
							edge_part_end_key: ek,
						});

						// (Old identity code removed — Pass 3 handles endpoint assignment for face-boundary crossings)
					}
				}
			}
		}
	}

	// ─── Pass 2: Arrangement ─────────────────────────────────────────────────

	private compute_arrangement(
		input: TopologyInput,
		parts: VisiblePart[],
		endpoints: Map<string, ComputedEndpoint>,
		edge_segments: Map<string, ComputedEdgeSeg[]>,
		intersection_segments: ComputedIntersectionSeg[],
		occluding_segments: ComputedOccludingSeg[],
	): void {
		// 2a: Find all crossings between parts.
		// Skip same-object pairs UNLESS one is an intersection line and the other is an edge.
		// Intersection lines cross edges at the same points where face planes meet edges —
		// these are the connections the facet graph needs.
		const crossings: ArrangementCrossing[] = [];

		for (let i = 0; i < parts.length; i++) {
			const a = parts[i];
			for (let j = i + 1; j < parts.length; j++) {
				const b = parts[j];
				if (a.so === b.so && a.type === b.type) continue;

				// Quick bounding box reject
				const a_min_x = Math.min(a.screen[0].x, a.screen[1].x);
				const a_max_x = Math.max(a.screen[0].x, a.screen[1].x);
				const a_min_y = Math.min(a.screen[0].y, a.screen[1].y);
				const a_max_y = Math.max(a.screen[0].y, a.screen[1].y);
				const b_min_x = Math.min(b.screen[0].x, b.screen[1].x);
				const b_max_x = Math.max(b.screen[0].x, b.screen[1].x);
				const b_min_y = Math.min(b.screen[0].y, b.screen[1].y);
				const b_max_y = Math.max(b.screen[0].y, b.screen[1].y);
				if (a_max_x < b_min_x || b_max_x < a_min_x || a_max_y < b_min_y || b_max_y < a_min_y) continue;

				const ix = Topology.intersect_2d(a.screen[0], a.screen[1], b.screen[0], b.screen[1]);



				if (!ix) continue;
				if (ix.ta < -0.01 || ix.ta > 1.01 || ix.tb < -0.01 || ix.tb > 1.01) continue;

				const screen: Pt = {
					x: a.screen[0].x + (a.screen[1].x - a.screen[0].x) * ix.ta,
					y: a.screen[0].y + (a.screen[1].y - a.screen[0].y) * ix.ta,
				};
				const world_a = vec3.lerp(vec3.create(), a.world[0], a.world[1], ix.ta);
				const world_b = vec3.lerp(vec3.create(), b.world[0], b.world[1], ix.tb);

				crossings.push({ part_a: i, part_b: j, ta: ix.ta, tb: ix.tb, screen, world_a, world_b });

			}
		}

		if (crossings.length === 0) return;

		// 2b: Group crossings by part and split
		// For each part, collect all crossing t values
		const splits_by_part = new Map<number, { t: number; screen: Pt; world: vec3; crossing_idx: number }[]>();
		for (let ci = 0; ci < crossings.length; ci++) {
			const c = crossings[ci];
			let list_a = splits_by_part.get(c.part_a);
			if (!list_a) { list_a = []; splits_by_part.set(c.part_a, list_a); }
			list_a.push({ t: c.ta, screen: c.screen, world: c.world_a, crossing_idx: ci });

			let list_b = splits_by_part.get(c.part_b);
			if (!list_b) { list_b = []; splits_by_part.set(c.part_b, list_b); }
			list_b.push({ t: c.tb, screen: c.screen, world: c.world_b, crossing_idx: ci });
		}

		// Create crossing endpoint keys (one per crossing)
		const crossing_keys: string[] = [];
		for (const c of crossings) {
			const a = parts[c.part_a];
			const b = parts[c.part_b];
			const edge_a = a.type === 'edge' ? `${a.so}:${a.edge_key}` : `ix:${a.so}`;
			const edge_b = b.type === 'edge' ? `${b.so}:${b.edge_key}` : `ix:${b.so}`;
			const [eA, eB] = edge_a < edge_b ? [edge_a, edge_b] : [edge_b, edge_a];
			const id: EndpointID = { type: T_Endpoint.cross, edgeA: eA, edgeB: eB };
			const world_mid = vec3.lerp(vec3.create(), c.world_a, c.world_b, 0.5);
			const key = this.register_endpoint(endpoints, id, c.screen, world_mid);
			crossing_keys.push(key);
		}

		// Now split edge segments at crossing points
		for (const [so_id, segs] of edge_segments) {
			for (const seg of segs) {
				// Find parts that belong to this edge segment
				const matching_part_indices: number[] = [];
				for (let ci = 0; ci < parts.length; ci++) {
					const part = parts[ci];
					if (part.type === 'edge' && part.so === so_id && part.edge_key === seg.edge_key) {
						matching_part_indices.push(ci);
					}
				}

				// Collect all split points for this edge's visible parts
				const new_visible: [Pt, Pt][] = [];
				const new_ep_keys: [string, string][] = [];

				for (let vi = 0; vi < seg.visible.length; vi++) {
					const [s, e] = seg.visible[vi];
					const [sk, ek] = seg.endpoint_keys[vi];

					// Find the part index for this visible interval
					const part_idx = matching_part_indices[vi];
					const split_list = part_idx !== undefined ? splits_by_part.get(part_idx) : undefined;

					if (!split_list || split_list.length === 0) {
						new_visible.push([s, e]);
						new_ep_keys.push([sk, ek]);
						continue;
					}

					// Sort splits by t and filter to interior only
					const sorted = split_list
						.filter(sp => sp.t > 0.01 && sp.t < 0.99)
						.sort((a, b) => a.t - b.t);

					if (sorted.length === 0) {
						new_visible.push([s, e]);
						new_ep_keys.push([sk, ek]);
						continue;
					}

					// Split the interval
					let prev_pt = s;
					let prev_key = sk;
					for (const sp of sorted) {
						const split_screen: Pt = {
							x: s.x + (e.x - s.x) * sp.t,
							y: s.y + (e.y - s.y) * sp.t,
						};
						const cx_key = crossing_keys[sp.crossing_idx];
						new_visible.push([prev_pt, split_screen]);
						new_ep_keys.push([prev_key, cx_key]);
						prev_pt = split_screen;
						prev_key = cx_key;
					}
					new_visible.push([prev_pt, e]);
					new_ep_keys.push([prev_key, ek]);
				}

				seg.visible = new_visible;
				seg.endpoint_keys = new_ep_keys;
			}
		}

		// Also split intersection segments at crossing points
		for (const iseg of intersection_segments) {
			// Find parts that match this intersection segment
			const matching_part_indices: number[] = [];
			for (let ci = 0; ci < parts.length; ci++) {
				const part = parts[ci];
				if (part.type === 'intersection' && part.face_pair &&
					part.face_pair.so_a === iseg.so_a && part.face_pair.face_a === iseg.face_a &&
					part.face_pair.so_b === iseg.so_b && part.face_pair.face_b === iseg.face_b) {
					matching_part_indices.push(ci);
				}
			}

			const new_visible: [Pt, Pt][] = [];
			const new_ep_keys: [string, string][] = [];

			for (let vi = 0; vi < iseg.visible.length; vi++) {
				const [s, e] = iseg.visible[vi];
				const [sk, ek] = iseg.endpoint_keys[vi];
				const part_idx = matching_part_indices[vi];
				const split_list = part_idx !== undefined ? splits_by_part.get(part_idx) : undefined;

				if (!split_list || split_list.length === 0) {
					new_visible.push([s, e]);
					new_ep_keys.push([sk, ek]);
					continue;
				}

				const sorted = split_list
					.filter(sp => sp.t > 0.01 && sp.t < 0.99)
					.sort((a, b) => a.t - b.t);

				if (sorted.length === 0) {
					new_visible.push([s, e]);
					new_ep_keys.push([sk, ek]);
					continue;
				}

				let prev_pt = s;
				let prev_key = sk;
				for (const sp of sorted) {
					const split_screen: Pt = {
						x: s.x + (e.x - s.x) * sp.t,
						y: s.y + (e.y - s.y) * sp.t,
					};
					const cx_key = crossing_keys[sp.crossing_idx];
					new_visible.push([prev_pt, split_screen]);
					new_ep_keys.push([prev_key, cx_key]);
					prev_pt = split_screen;
					prev_key = cx_key;
				}
				new_visible.push([prev_pt, e]);
				new_ep_keys.push([prev_key, ek]);
			}

			iseg.visible = new_visible;
			iseg.endpoint_keys = new_ep_keys;
		}

		// 2c: Depth classification — create occluding segments
		// For each crossing, determine which part is in front
		for (let ci = 0; ci < crossings.length; ci++) {
			const c = crossings[ci];
			const part_a = parts[c.part_a];
			const part_b = parts[c.part_b];

			// Depth check: which is closer to camera? (lower z = closer in our projection)
			// Use the world-space z at the crossing point
			const z_a = c.world_a[2];
			const z_b = c.world_b[2];

			const front_part = z_a > z_b ? part_a : part_b;
			const behind_part = z_a > z_b ? part_b : part_a;

			// The front part's edge passes over the behind part's face
			// Find the behind part's SO and face to create the occluding segment
			if (behind_part.type !== 'edge') continue;

			// Find which face of the behind SO this edge belongs to
			const behind_so = behind_part.so;
			const behind_obj = input.objects.find(o => o.id === behind_so);
			if (!behind_obj?.faces) continue;

			// Find a face containing this edge
			const [evi, evj] = behind_part.edge_key!.split('-').map(Number);
			let face_idx = -1;
			for (let fi = 0; fi < behind_obj.faces.length; fi++) {
				const fv = behind_obj.faces[fi];
				if (fv.includes(evi) && fv.includes(evj)) {
					// Check if front-facing
					const projected = input.projected_map.get(behind_so);
					if (projected && input.face_winding(fv, projected) < 0) {
						face_idx = fi;
						break;
					}
				}
			}

			// Create occluding segment from this crossing to any adjacent crossing
			// on the same (front edge, behind face) pair
			// For now, create point occluding segments at each crossing
			// Full enter/exit pairing would need grouping by (front_edge, behind_face)
			const cx_key = crossing_keys[ci];

			// Look for another crossing on the same front edge that also crosses the behind face's region
			for (let cj = ci + 1; cj < crossings.length; cj++) {
				const c2 = crossings[cj];
				const part_a2 = parts[c2.part_a];
				const part_b2 = parts[c2.part_b];

				// Check if same front edge
				const front_part2 = (c2.world_a[2] > c2.world_b[2]) ? part_a2 : part_b2;
				const behind_part2 = (c2.world_a[2] > c2.world_b[2]) ? part_b2 : part_a2;

				if (front_part2.so !== front_part.so || front_part2.edge_key !== front_part.edge_key) continue;
				if (behind_part2.so !== behind_part.so) continue;

				const cx_key2 = crossing_keys[cj];
				const cs: Pt = c.screen;
				const ce: Pt = c2.screen;

				// Skip zero-length occluding segments
				const len = Math.sqrt((ce.x - cs.x) ** 2 + (ce.y - cs.y) ** 2);
				if (len < 0.01) continue;

				occluding_segments.push({
					so: behind_so,
					face: face_idx,
					screen: [cs, ce],
					endpoint_keys: [cx_key, cx_key2],
				});
			}
		}

		// Store arrangement data for Pass 3
		this._crossings = crossings;
		this._splits_by_part = splits_by_part;
		// crossing_keys used by Pass 2c's own occluding segment creation above
	}

	// ─── Pass 3: Identity (new, tag-based) ──────────────────────────────────

	private compute_identity_v2(
		input: TopologyInput,
		parts: VisiblePart[],
		_old_endpoints: Map<string, ComputedEndpoint>,
		_old_occluding_segments: ComputedOccludingSeg[],
		intersection_segments: ComputedIntersectionSeg[],
		edge_segments: Map<string, ComputedEdgeSeg[]>,
	): { endpoints: Map<string, ComputedEndpoint>; occluding_segments: ComputedOccludingSeg[] } {
		const CORNER_T = 0.01;
		const endpoints = new Map<string, ComputedEndpoint>();

		// For each part, walk its sub-parts (original + splits) and identify endpoints.
		// A part at index ci with splits at t1, t2 produces sub-parts:
		//   [part.start .. split1], [split1 .. split2], [split2 .. part.end]
		// First sub-part's start = original part's start identity
		// Last sub-part's end = original part's end identity
		// Intermediate endpoints = crossing identity

		// Track which endpoints come from intersection lines on which edges (for merge step)
		const pierce_edge_map: { key: string; edge_full: string; other_edge: string; t: number; face_a: string; face_b: string }[] = [];

		for (let ci = 0; ci < parts.length; ci++) {
			const part = parts[ci];
			const splits = this._splits_by_part.get(ci);
			const sorted_splits = splits
				? [...splits].filter(sp => sp.t > 0.01 && sp.t < 0.99).sort((a, b) => a.t - b.t)
				: [];

			// Identify the original part's start and end endpoints
			this.identify_part_endpoint(part, 'start', input, endpoints, CORNER_T, pierce_edge_map);
			this.identify_part_endpoint(part, 'end', input, endpoints, CORNER_T, pierce_edge_map);

			// Crossing endpoints (splits)
			for (const sp of sorted_splits) {
				const cx = this._crossings[sp.crossing_idx];
				const part_a = parts[cx.part_a];
				const part_b = parts[cx.part_b];
				const edge_a = part_a.type === 'edge' ? `${part_a.so}:${part_a.edge_key}` : `ix:${part_a.so}`;
				const edge_b = part_b.type === 'edge' ? `${part_b.so}:${part_b.edge_key}` : `ix:${part_b.so}`;
				const [eA, eB] = edge_a < edge_b ? [edge_a, edge_b] : [edge_b, edge_a];
				const id: EndpointID = { type: T_Endpoint.cross, edgeA: eA, edgeB: eB };
				const world_mid = vec3.lerp(vec3.create(), cx.world_a, cx.world_b, 0.5);
				this.register_endpoint(endpoints, id, sp.screen, world_mid);
			}

		}

		const key_rewrites = new Map<string, string>(); // old key → new key

		// ── Topological merge: pierce at vertex = corner ──
		// (pierce-pierce and pierce-oc merges removed — cross unification makes them unnecessary)
		for (let ci = 0; ci < parts.length; ci++) {
			const part = parts[ci];
			if (part.type !== 'intersection') continue;
			for (const end of ['start', 'end'] as const) {
				const vtx_info = end === 'start' ? part.start_at_vertex : part.end_at_vertex;
				const cause = end === 'start' ? part.start_cause : part.end_cause;
				if (!vtx_info || cause) continue;
				const corner_key = endpoint_key({ type: T_Endpoint.corner, so: vtx_info.so, vertex: vtx_info.vertex });
				const on_edge = end === 'start' ? part.start_on_edge : part.end_on_edge;
				if (!on_edge) continue;
				const fp = part.face_pair!;
				const piercing_edge = `${on_edge.so}:${on_edge.edge_key}`;
				const pierced_face = on_edge.so === fp.so_a
					? face_key_by_id(fp.so_b, fp.face_b, input)
					: face_key_by_id(fp.so_a, fp.face_a, input);
				const pierce_id: EndpointID = { type: T_Endpoint.pierce, edge: piercing_edge, face: pierced_face };
				const pierce_key = endpoint_key(pierce_id);
				if (endpoints.has(pierce_key) && endpoints.has(corner_key)) {
						if (!k.debug.merge_logged) console.log(`pierce at vertex → corner merge`);
					endpoints.delete(pierce_key);
					key_rewrites.set(pierce_key, corner_key);
				}
			}
		}

		if (key_rewrites.size > 0 && !k.debug.merge_logged) {
			console.log(`Merges produced ${key_rewrites.size} rewrite(s):`);
			for (const [from, to] of key_rewrites) console.log(`  ${pretty_key(from)} → ${pretty_key(to)}`);
		}
		k.debug.merge_logged = true;

		// ── Propagate key rewrites into all segment data and lookups ──
		const rewrite = (k: string) => key_rewrites.get(k) ?? k;
		if (key_rewrites.size > 0) {
			for (const [, segs] of edge_segments) {
				for (const seg of segs) {
					for (const pair of seg.endpoint_keys) {
						pair[0] = rewrite(pair[0]);
						pair[1] = rewrite(pair[1]);
					}
				}
			}
			for (const iseg of intersection_segments) {
				for (const pair of iseg.endpoint_keys) {
					pair[0] = rewrite(pair[0]);
					pair[1] = rewrite(pair[1]);
				}
			}
			// Also rewrite pierce_edge_map so occluding segment matching finds the right keys
			for (const p of pierce_edge_map) {
				p.key = rewrite(p.key);
			}
		}

		// ── V2 occluding segments from face-boundary crossings (Pass 1d data) ──
		// Use the anonymous crossing data from Pass 1d, assign identity here.
		// Build a set of endpoint pairs already connected by any segment (edge, intersection, or crossing),
		// so we can skip occluding segments that would create parallel edges.
		const existing_pairs = new Set<string>();
		for (const iseg of intersection_segments) {
			for (const [sk, ek] of iseg.endpoint_keys) {
				existing_pairs.add(sk < ek ? `${sk}|${ek}` : `${ek}|${sk}`);
			}
		}
		for (const [, segs] of edge_segments) {
			for (const seg of segs) {
				for (const [sk, ek] of seg.endpoint_keys) {
					existing_pairs.add(sk < ek ? `${sk}|${ek}` : `${ek}|${sk}`);
				}
			}
		}

		const v2_occluding: ComputedOccludingSeg[] = [];
		for (const fbc of this._face_boundary_crossings) {
			// Skip degenerate crossings
			const len = Math.sqrt((fbc.screen_leave.x - fbc.screen_enter.x) ** 2 + (fbc.screen_leave.y - fbc.screen_enter.y) ** 2);
			if (len < 0.01) continue;

			// Try to identify the enter and leave endpoints
			let enter_key: string | undefined;
			let leave_key: string | undefined;

			// Helper: find an intersection endpoint on a specific boundary edge of this face
			const find_pierce_on_boundary = (poly_edge_idx: number): string | undefined => {
				if (poly_edge_idx < 0 || !fbc.face_verts) return undefined;
				const vi = fbc.face_verts[poly_edge_idx];
				const vj = fbc.face_verts[(poly_edge_idx + 1) % fbc.face_verts.length];
				const boundary_ek = `${Math.min(vi, vj)}-${Math.max(vi, vj)}`;
				const boundary_full = `${fbc.face_so}:${boundary_ek}`;
				// Search pierce_edge_map for an intersection endpoint on this boundary edge
				for (const p of pierce_edge_map) {
					if (p.edge_full !== boundary_full) continue;
					// Check that the intersection involves the face being crossed
					const fk = face_key_by_id(fbc.face_so, fbc.face_index, input);
					if (p.face_a === fk || p.face_b === fk) {
						return p.key;
					}
				}
				return undefined;
			};

			// Helper: search all boundary edges of this face for any matching intersection endpoint
			const find_pierce_any_boundary = (): string | undefined => {
				if (!fbc.face_verts) return undefined;
				const fk = face_key_by_id(fbc.face_so, fbc.face_index, input);
				const candidates: string[] = [];
				for (let ei = 0; ei < fbc.face_verts.length; ei++) {
					const vi = fbc.face_verts[ei];
					const vj = fbc.face_verts[(ei + 1) % fbc.face_verts.length];
					const boundary_ek = `${Math.min(vi, vj)}-${Math.max(vi, vj)}`;
					const boundary_full = `${fbc.face_so}:${boundary_ek}`;
					for (const p of pierce_edge_map) {
						if (p.edge_full !== boundary_full) continue;
						if (p.face_a === fk || p.face_b === fk) {
							candidates.push(p.key);
						}
					}
				}
				return candidates.length === 1 ? candidates[0] : undefined;
			};

			// For entry: try boundary-edge match first, then use edge part's own endpoint
			if (fbc.enter_boundary_edge >= 0) {
				enter_key = find_pierce_on_boundary(fbc.enter_boundary_edge);
				if (!enter_key) enter_key = find_pierce_any_boundary();
			}
			if (!enter_key && fbc.t_enter < 0.01) {
				// Edge starts inside face — use the edge part's own start endpoint
				enter_key = rewrite(fbc.edge_part_start_key);
			}

			// For exit: try boundary-edge match first, then use edge part's own endpoint
			if (fbc.leave_boundary_edge >= 0) {
				leave_key = find_pierce_on_boundary(fbc.leave_boundary_edge);
				if (!leave_key) leave_key = find_pierce_any_boundary();
			}
			if (!leave_key && fbc.t_leave > 0.99) {
				// Edge ends inside face — use the edge part's own end endpoint
				leave_key = rewrite(fbc.edge_part_end_key);
			}

			// Track how the matching went
			if (enter_key && leave_key && enter_key !== leave_key) {
				// matched by tags
			} else {
				// Last resort: create crossing endpoints for any still-unmatched ends
				const edge_a = `${fbc.edge_so}:${fbc.edge_key}`;
				if (!enter_key) {
					const hiding_edge = fbc.face_verts
						? boundary_edge_str(fbc.face_so, fbc.face_verts, fbc.enter_boundary_edge)
						: undefined;
					if (hiding_edge) {
						const [eA, eB] = edge_a < hiding_edge ? [edge_a, hiding_edge] : [hiding_edge, edge_a];
						const id: EndpointID = { type: T_Endpoint.cross, edgeA: eA, edgeB: eB };
						enter_key = this.register_endpoint(endpoints, id, fbc.screen_enter, fbc.world_enter);
					} else {
						const id: EndpointID = { type: T_Endpoint.cross, edgeA: edge_a, edgeB: `${fbc.face_so}:face:${fbc.face_index}` };
						enter_key = this.register_endpoint(endpoints, id, fbc.screen_enter, fbc.world_enter);
					}
				}
				if (!leave_key || leave_key === enter_key) {
					const hiding_edge = fbc.face_verts
						? boundary_edge_str(fbc.face_so, fbc.face_verts, fbc.leave_boundary_edge)
						: undefined;
					if (hiding_edge) {
						const [eA, eB] = edge_a < hiding_edge ? [edge_a, hiding_edge] : [hiding_edge, edge_a];
						const id: EndpointID = { type: T_Endpoint.cross, edgeA: eA, edgeB: eB };
						leave_key = this.register_endpoint(endpoints, id, fbc.screen_leave, fbc.world_leave);
					} else {
						const id: EndpointID = { type: T_Endpoint.cross, edgeA: edge_a, edgeB: `${fbc.face_so}:face:${fbc.face_index}:e` };
						leave_key = this.register_endpoint(endpoints, id, fbc.screen_leave, fbc.world_leave);
					}
				}
			}

			// Skip if an existing segment already connects these endpoints
			const pair_key = enter_key < leave_key ? `${enter_key}|${leave_key}` : `${leave_key}|${enter_key}`;
			if (existing_pairs.has(pair_key)) {
				continue;
			}

			// Skip if both endpoints are intersection endpoints — this traces a hidden
			// intersection line that the visibility clipper correctly removed.
			if (enter_key.startsWith('pierce:') && leave_key.startsWith('pierce:')) {
				continue;
			}

			// Skip if either endpoint is a corner of the other object.
			// These trace the other object's edges past the intersection boundary.
			const is_other_corner = (key: string) => {
				if (!key.startsWith('c:')) return false;
				// Corner key format: "c:obj_id:vertex"
				const parts = key.split(':');
				return parts[1] !== fbc.face_so;
			};
			if (is_other_corner(enter_key) || is_other_corner(leave_key)) {
				continue;
			}

			v2_occluding.push({
				so: fbc.face_so,
				face: fbc.face_index,
				screen: [fbc.screen_enter, fbc.screen_leave],
				endpoint_keys: [enter_key, leave_key],
			});
		}

		// (Arrangement-based occluding segments removed — arrangement crossings don't pair up
		// because edges enter/exit faces through the invisible silhouette, not through other visible segments.)

		return { endpoints, occluding_segments: v2_occluding };
	}

	/** Identify a part's start or end endpoint from its source tags. */
	private identify_part_endpoint(
		part: VisiblePart,
		end: 'start' | 'end',
		input: TopologyInput,
		endpoints: Map<string, ComputedEndpoint>,
		CORNER_T: number,
		pierce_edge_map: { key: string; edge_full: string; other_edge: string; t: number; face_a: string; face_b: string }[],
	): string {
		const screen = end === 'start' ? part.screen[0] : part.screen[1];
		const world = end === 'start' ? part.world[0] : part.world[1];
		const cause = end === 'start' ? part.start_cause : part.end_cause;

		if (part.type === 'edge') {
			const i = part.vertex_i!;
			const j = part.vertex_j!;
			const a = input.projected_map.get(part.so)![i];
			const b = input.projected_map.get(part.so)![j];
			const t = Topology.screen_t({ x: a.x, y: a.y }, { x: b.x, y: b.y }, screen);

			if (!cause && t < CORNER_T) {
				return this.register_corner(endpoints, part.so, i, screen, world);
			}
			if (!cause && t > 1 - CORNER_T) {
				return this.register_corner(endpoints, part.so, j, screen, world);
			}
			// Occlusion endpoint — try cross key first
			const edge_id = `${part.so}:${part.edge_key}`;
			const poly_edge = end === 'start' ? part.start_poly_edge : part.end_poly_edge;
			const hiding_edge = cause && poly_edge != null
				? boundary_edge_str(cause.obj_id, cause.face_verts!, poly_edge)
				: undefined;
			if (hiding_edge) {
				const [eA, eB] = edge_id < hiding_edge ? [edge_id, hiding_edge] : [hiding_edge, edge_id];
				const id: EndpointID = { type: T_Endpoint.cross, edgeA: eA, edgeB: eB };
				return this.register_endpoint(endpoints, id, screen, world);
			}
			// No boundary edge — use interval position, not vertex position
			const _eid = `${part.so}:${part.edge_key}`;
			return this.register_endpoint(endpoints, { type: T_Endpoint.cross, edgeA: _eid, edgeB: 'unknown:id' }, screen, world);
		}

		// Intersection endpoint
		const fp = part.face_pair!;
		const face_key_a = face_key_by_id(fp.so_a, fp.face_a, input);
		const face_key_b = face_key_by_id(fp.so_b, fp.face_b, input);

		if (!cause) {
			// Check for vertex hit first
			const vtx_info = end === 'start' ? part.start_at_vertex : part.end_at_vertex;
			if (vtx_info) {
				return this.register_corner(endpoints, vtx_info.so, vtx_info.vertex, screen, world);
			}
			// Face intersection endpoint
			const on_edge = end === 'start' ? part.start_on_edge : part.end_on_edge;
			if (!on_edge) {
				// No edge info — three-face pierce case (not yet implemented), or data issue
				if (!k.debug.merge_logged) console.warn(`pierce endpoint missing edge info: ${face_key_a} × ${face_key_b} ${end}`);
				const id: EndpointID = { type: T_Endpoint.pierce, edge: `?:${face_key_a}`, face: face_key_b };
				return this.register_endpoint(endpoints, id, screen, world);
			}
			const piercing_edge = `${on_edge.so}:${on_edge.edge_key}`;
			const pierced_face = on_edge.so === fp.so_a ? face_key_b : face_key_a;
			const id: EndpointID = { type: T_Endpoint.pierce, edge: piercing_edge, face: pierced_face };
			const key = this.register_endpoint(endpoints, id, screen, world);
			const other_edge = end === 'start' ? (part.start_other_edge ?? '') : (part.end_other_edge ?? '');
			pierce_edge_map.push({ key, edge_full: piercing_edge, other_edge, t: on_edge.t, face_a: face_key_a, face_b: face_key_b });
			return key;
		}
		// Occluded intersection endpoint — try cross key first
		const ix_edge = `ix:${face_key_a}:${face_key_b}`;
		const poly_edge = end === 'start' ? part.start_poly_edge : part.end_poly_edge;
		const hiding_edge = poly_edge != null
			? boundary_edge_str(cause.obj_id, cause.face_verts!, poly_edge)
			: undefined;
		if (hiding_edge) {
			const [eA, eB] = ix_edge < hiding_edge ? [ix_edge, hiding_edge] : [hiding_edge, ix_edge];
			const id: EndpointID = { type: T_Endpoint.cross, edgeA: eA, edgeB: eB };
			return this.register_endpoint(endpoints, id, screen, world);
		}
		// No boundary edge — for intersection line ${ix_edge} hidden by ${cause.obj_id}`);
		const id: EndpointID = { type: T_Endpoint.pierce, edge: `?:${face_key_a}`, face: face_key_b };
		return this.register_endpoint(endpoints, id, screen, world);
	}

	// ─── Endpoint helpers ────────────────────────────────────────────────────

	private register_endpoint(endpoints: Map<string, ComputedEndpoint>, id: EndpointID, screen: Pt, world: vec3): string {
		const key = endpoint_key(id);
		if (!endpoints.has(key)) {
			endpoints.set(key, { key, id, screen, world });
		}
		return key;
	}

	private register_corner(endpoints: Map<string, ComputedEndpoint>, so: string, vertex: number, screen: Pt, world: vec3): string {
		const id: EndpointID = { type: T_Endpoint.corner, so, vertex };
		return this.register_endpoint(endpoints, id, screen, world);
	}

	// ─── Pure geometry ───────────────────────────────────────────────────────

	private static intersect_2d(a1: Pt, a2: Pt, b1: Pt, b2: Pt): { ta: number; tb: number } | null {
		const dax = a2.x - a1.x, day = a2.y - a1.y;
		const dbx = b2.x - b1.x, dby = b2.y - b1.y;
		const denom = dax * dby - day * dbx;
		if (Math.abs(denom) < 1e-10) return null;
		const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / denom;
		const u = ((b1.x - a1.x) * day - (b1.y - a1.y) * dax) / denom;
		return { ta: t, tb: u };
	}

	private static screen_t(a: { x: number; y: number }, b: { x: number; y: number }, p: Pt): number {
		const dx = b.x - a.x, dy = b.y - a.y;
		const len_sq = dx * dx + dy * dy;
		if (len_sq < 1e-10) return 0;
		return ((p.x - a.x) * dx + (p.y - a.y) * dy) / len_sq;
	}

	private intersect_face_pair(
		fA: { n: vec3; d: number; corners: vec3[] },
		fB: { n: vec3; d: number; corners: vec3[] },
	): {
		start: vec3; end: vec3;
		start_edge: { face: 'A' | 'B'; edge_idx: number };
		end_edge: { face: 'A' | 'B'; edge_idx: number };
		start_vertex: number;  // corner index within the constraining face, or -1
		end_vertex: number;
	} | null {
		const eps = 1e-8;
		const dir = vec3.create();
		vec3.cross(dir, fA.n, fB.n);
		const dir_len = vec3.length(dir);
		if (dir_len < k.coplanar_epsilon) return null;
		vec3.scale(dir, dir, 1 / dir_len);

		const nA = fA.n, nB = fB.n, dA = fA.d, dB = fB.d;
		const abs_dir = [Math.abs(dir[0]), Math.abs(dir[1]), Math.abs(dir[2])];
		const max_axis = abs_dir[0] >= abs_dir[1] && abs_dir[0] >= abs_dir[2] ? 0
									 : abs_dir[1] >= abs_dir[2] ? 1 : 2;
		const a1 = (max_axis + 1) % 3, a2 = (max_axis + 2) % 3;

		const det = nA[a1] * nB[a2] - nA[a2] * nB[a1];
		if (Math.abs(det) < eps) return null;

		const p0 = vec3.create();
		p0[a1] = (dA * nB[a2] - dB * nA[a2]) / det;
		p0[a2] = (nA[a1] * dB - nB[a1] * dA) / det;
		p0[max_axis] = 0;

		const ra = this.clip_to_quad_with_edges(p0, dir, fA.corners, fA.n, -1e6, 1e6);
		if (!ra) return null;
		const rb = this.clip_to_quad_with_edges(p0, dir, fB.corners, fB.n, ra[0], ra[1]);
		if (!rb) return null;

		const [tA, tB] = [rb[0], rb[1]];
		if (tA >= tB - eps) return null;

		// Which face constrained the start? The one with the larger t_min.
		const start_from_B = rb[0] > ra[0];
		const start_edge = start_from_B
			? { face: 'B' as const, edge_idx: rb[2] }
			: { face: 'A' as const, edge_idx: ra[2] };
		const end_from_B = rb[1] < ra[1];
		const end_edge = end_from_B
			? { face: 'B' as const, edge_idx: rb[3] }
			: { face: 'A' as const, edge_idx: ra[3] };

		// Vertex hits: reported by the clipper as corner indices within the face
		const start_vertex = start_from_B ? rb[4] : ra[4];
		const end_vertex = end_from_B ? rb[5] : ra[5];

		const start = vec3.scaleAndAdd(vec3.create(), p0, dir, tA);
		const end = vec3.scaleAndAdd(vec3.create(), p0, dir, tB);
		return { start, end, start_edge, end_edge, start_vertex, end_vertex };
	}

	private clip_segment_for_occlusion_rich(
		p1: Pt, p2: Pt, w1: vec3, w2: vec3,
		skip_ids: string | string[],
		skip_planes: { n: vec3; d: number }[] | undefined,
		input: TopologyInput,
	): PartInterval[] {
		type RichInterval = { a: number; b: number; a_cause: OccFaceRef; b_cause: OccFaceRef; a_poly_edge: number; b_poly_edge: number };
		let intervals: RichInterval[] = [{ a: 0, b: 1, a_cause: null, b_cause: null, a_poly_edge: -1, b_poly_edge: -1 }];
		const skip = Array.isArray(skip_ids) ? skip_ids : [skip_ids];
		const dx = p2.x - p1.x, dy = p2.y - p1.y;
		const identity = mat4.create();

		const edge_min_x = Math.min(p1.x, p2.x), edge_min_y = Math.min(p1.y, p2.y);
		const edge_max_x = Math.max(p1.x, p2.x), edge_max_y = Math.max(p1.y, p2.y);
		const candidates = input.occluding_index
			? input.occluding_index.search(edge_min_x, edge_min_y, edge_max_x, edge_max_y)
			: input.occluding_faces.map((_, i) => i);

		for (const fi of candidates) {
			const face = input.occluding_faces[fi];
			if (!face) continue;
			if (skip.includes(face.obj_id)) continue;
			if (skip_planes && skip_planes.some(sp => {
				const dot = vec3.dot(sp.n, face.n);
				return (Math.abs(dot - 1) < 1e-6 && Math.abs(sp.d - face.d) < 1e-6) ||
							 (Math.abs(dot + 1) < 1e-6 && Math.abs(sp.d + face.d) < 1e-6);
			})) continue;

			const d1 = vec3.dot(face.n, w1) - face.d;
			const d2 = vec3.dot(face.n, w2) - face.d;
			if (d1 > -k.coplanar_epsilon && d2 > -k.coplanar_epsilon) continue;

			let s_behind_start = 0, s_behind_end = 1;
			if (d1 > 0 && d2 <= 0) {
				const t_cross = d1 / (d1 - d2);
				const wc = vec3.lerp(vec3.create(), w1, w2, t_cross);
				const pc = input.project_vertex(wc, identity);
				const cdx = pc.x - p1.x, cdy = pc.y - p1.y;
				s_behind_start = Math.abs(dx) > Math.abs(dy) ? cdx / dx : cdy / dy;
				s_behind_end = 1;
			} else if (d1 <= 0 && d2 > 0) {
				const t_cross = d1 / (d1 - d2);
				const wc = vec3.lerp(vec3.create(), w1, w2, t_cross);
				const pc = input.project_vertex(wc, identity);
				const cdx = pc.x - p1.x, cdy = pc.y - p1.y;
				s_behind_start = 0;
				s_behind_end = Math.abs(dx) > Math.abs(dy) ? cdx / dx : cdy / dy;
			}

			const bs: Pt = { x: p1.x + dx * s_behind_start, y: p1.y + dy * s_behind_start };
			const be: Pt = { x: p1.x + dx * s_behind_end, y: p1.y + dy * s_behind_end };
			const clipped = this.clip_segment_to_polygon_2d(bs, be, face.poly);
			if (!clipped) continue;

			const s_range = s_behind_end - s_behind_start;
			const s_enter = s_behind_start + clipped[0] * s_range;
			const s_leave = s_behind_start + clipped[1] * s_range;

			const new_intervals: RichInterval[] = [];
			for (const iv of intervals) {
				if (s_leave <= iv.a || s_enter >= iv.b) {
					new_intervals.push(iv);
					continue;
				}
				if (s_enter > iv.a) new_intervals.push({ a: iv.a, b: s_enter, a_cause: iv.a_cause, b_cause: face, a_poly_edge: iv.a_poly_edge, b_poly_edge: clipped[2] });
				if (s_leave < iv.b) new_intervals.push({ a: s_leave, b: iv.b, a_cause: face, b_cause: iv.b_cause, a_poly_edge: clipped[3], b_poly_edge: iv.b_poly_edge });
			}
			intervals = new_intervals;
			if (intervals.length === 0) break;
		}

		// Remove fake visible intervals (sliver filter)
		if (intervals.length >= 1) {
			intervals = intervals.filter(iv => {
				if (!iv.a_cause || !iv.b_cause) return true;
				if (iv.a_cause.obj_id !== iv.b_cause.obj_id) return true;
				const a_sil = iv.a_cause.silhouette_edges?.[iv.a_poly_edge] ?? true;
				const b_sil = iv.b_cause.silhouette_edges?.[iv.b_poly_edge] ?? true;
				return a_sil || b_sil;
			});
		}

		return intervals.map(iv => ({
			start: { x: p1.x + dx * iv.a, y: p1.y + dy * iv.a },
			end:   { x: p1.x + dx * iv.b, y: p1.y + dy * iv.b },
			start_cause: iv.a_cause,
			end_cause:   iv.b_cause,
			start_poly_edge: iv.a_poly_edge,
			end_poly_edge: iv.b_poly_edge,
		}));
	}

	private clip_segment_to_polygon_2d(
		p1: Pt, p2: Pt, poly: Pt[],
	): [number, number, number, number] | null {
		let t_enter = 0, t_leave = 1;
		let enter_edge = -1, leave_edge = -1;
		const dx = p2.x - p1.x, dy = p2.y - p1.y;

		for (let i = 0; i < poly.length; i++) {
			const c0 = poly[i];
			const c1 = poly[(i + 1) % poly.length];
			const ex = c1.x - c0.x, ey = c1.y - c0.y;
			const nx = ey, ny = -ex;
			const denom = nx * dx + ny * dy;
			const num = nx * (p1.x - c0.x) + ny * (p1.y - c0.y);

			if (Math.abs(denom) < 1e-10) {
				if (num < 0) return null;
				continue;
			}

			const t = -num / denom;
			if (denom > 0) {
				if (t > t_enter) { t_enter = t; enter_edge = i; }
			} else {
				if (t < t_leave) { t_leave = t; leave_edge = i; }
			}
			if (t_enter > t_leave) return null;
		}

		if (t_enter >= t_leave) return null;
		return [t_enter, t_leave, enter_edge, leave_edge];
	}

	private clip_to_quad_with_edges(
		p0: vec3, dir: vec3,
		corners: vec3[], face_normal: vec3,
		t_min: number, t_max: number
	): [number, number, number, number, number, number] | null {
		const n_edges = corners.length;
		let enter_edge = -1, leave_edge = -1;
		// Store each edge's t value so we can detect vertex hits afterward
		const edge_t: number[] = [];
		const edge_entering: boolean[] = [];
		for (let i = 0; i < n_edges; i++) {
			const c0 = corners[i];
			const c1 = corners[(i + 1) % n_edges];
			const edge = vec3.sub(vec3.create(), c1, c0);
			const inward = vec3.cross(vec3.create(), face_normal, edge);
			const diff = vec3.sub(vec3.create(), p0, c0);
			const numer = vec3.dot(inward, diff);
			const alignment = vec3.dot(inward, dir);
			if (Math.abs(alignment) < 1e-12) {
				if (numer < 0) return null;
				edge_t.push(NaN);
				edge_entering.push(false);
				continue;
			}
			const t = -numer / alignment;
			edge_t.push(t);
			edge_entering.push(alignment > 0);
			if (alignment > 0) {
				if (t > t_min) { t_min = t; enter_edge = i; }
			} else {
				if (t < t_max) { t_max = t; leave_edge = i; }
			}
			if (t_min > t_max) return null;
		}

		// Detect vertex hits: if another entering edge gives the same t as t_min,
		// the point is at the vertex shared by both edges. Same for t_max/leaving.
		// Vertex shared by edges i and j: if j = (i-1+n)%n, it's corner i.
		// If j = (i+1)%n, it's corner (i+1)%n.
		let enter_vertex = -1, leave_vertex = -1;
		const VERTEX_EPS = 1e-6;
		for (let i = 0; i < n_edges; i++) {
			if (isNaN(edge_t[i])) continue;
			if (edge_entering[i] && i !== enter_edge && enter_edge >= 0 && Math.abs(edge_t[i] - t_min) < VERTEX_EPS) {
				// Two entering edges agree on t_min — find the shared vertex
				const shared = this.shared_vertex(enter_edge, i, n_edges);
				if (shared >= 0) enter_vertex = shared;
			}
			if (!edge_entering[i] && i !== leave_edge && leave_edge >= 0 && Math.abs(edge_t[i] - t_max) < VERTEX_EPS) {
				const shared = this.shared_vertex(leave_edge, i, n_edges);
				if (shared >= 0) leave_vertex = shared;
			}
		}

		return [t_min, t_max, enter_edge, leave_edge, enter_vertex, leave_vertex];
	}

	/** Given two edge indices of a polygon, return the corner index they share, or -1. */
	private shared_vertex(edge_a: number, edge_b: number, n: number): number {
		// Edge i spans corner[i] to corner[(i+1)%n]
		// Edges i and (i-1+n)%n share corner i
		// Edges i and (i+1)%n share corner (i+1)%n
		if (edge_b === (edge_a - 1 + n) % n) return edge_a;
		if (edge_b === (edge_a + 1) % n) return (edge_a + 1) % n;
		if (edge_a === (edge_b - 1 + n) % n) return edge_b;
		if (edge_a === (edge_b + 1) % n) return (edge_b + 1) % n;
		return -1;
	}
}
