import { T_Endpoint, endpoint_key, type EndpointID } from './Facets';
import { vec3, vec4, mat4 } from 'gl-matrix';
import type { O_Scene } from '../types/Interfaces';
import { k } from '../common/Constants';

// Re-export types from Topology.ts so the test can import from either file
export type { TopologyInput, TopologyOutput, ComputedEndpoint, ComputedEdgeSeg, ComputedIntersectionSeg, ComputedOccludingSeg, OccludingFace } from './Topology';
export type { Pt } from './Topology';

import type { TopologyInput, TopologyOutput, ComputedEndpoint, ComputedEdgeSeg, ComputedIntersectionSeg, ComputedOccludingSeg, Pt, OccludingFace } from './Topology';

/**
 * Topology_Simple.ts — Three-pass architecture for the faceted 3D renderer.
 *
 * Pass 1: Visibility — clip edges and intersection lines, collect visible pieces
 * Pass 2: Arrangement — find crossings, split everything (Session 2)
 * Pass 3: Label — assign endpoint identities (Session 3)
 */

// ─── Internal types ──────────────────────────────────────────────────────────

type OccFaceRef = OccludingFace | null;

interface ClipInterval {
	start: Pt; end: Pt;
	start_cause: OccFaceRef;
	end_cause: OccFaceRef;
	start_poly_edge?: number;
	end_poly_edge?: number;
}

/** A visible clip tagged with where it came from — no identity yet */
interface VisibleClip {
	type: 'edge' | 'intersection';
	so: string;
	edge_key?: string;         // for edges
	face_pair?: { so_a: string; face_a: number; so_b: string; face_b: number; color: string }; // for intersections
	start_on_edge?: { so: string; edge_key: string; t: number };
	end_on_edge?: { so: string; edge_key: string; t: number };
	screen: [Pt, Pt];
	world: [vec3, vec3];
	start_cause: OccFaceRef;
	end_cause: OccFaceRef;
	start_poly_edge: number;
	end_poly_edge: number;
	// For edges: which vertex indices
	vertex_i?: number;
	vertex_j?: number;
}

// ─── Topology_Simple ─────────────────────────────────────────────────────────

export class Topology_Simple {

	// ─── Public API ──────────────────────────────────────────────────────────

	compute(input: TopologyInput): TopologyOutput {
		const endpoints = new Map<string, ComputedEndpoint>();
		const edge_segments = new Map<string, ComputedEdgeSeg[]>();
		const intersection_segments: ComputedIntersectionSeg[] = [];
		const occluding_segments: ComputedOccludingSeg[] = [];

		// ── Pass 1: Visibility ──
		const clips: VisibleClip[] = [];
		// Lookup: which fi endpoints sit on which edges (built by 1a, used by 1b)
		const fi_on_edge = new Map<string, { key: string; face_a: string; face_b: string }[]>();

		// 1a: Intersection lines (before edges — builds fi_on_edge lookup)
		if (input.objects.length > 1) {
			this.compute_intersection_visibility(input, clips, endpoints, intersection_segments, fi_on_edge);
		}

		// 1b: Edge visibility (uses fi_on_edge to reuse fi keys at pierce points)
		this.compute_edge_visibility(input, clips, endpoints, edge_segments, fi_on_edge);

		// ── Pass 1d: Harvest face-boundary crossings from clip data ──
		if (input.objects.length > 1) {
			this.harvest_face_crossings(input, clips, endpoints, edge_segments, occluding_segments);
		}

		// ── Pass 2: Arrangement ──
		if (input.objects.length > 1) {
			this.compute_arrangement(input, clips, endpoints, edge_segments, intersection_segments, occluding_segments);
		}

		return { endpoints, edge_segments, intersection_segments, occluding_segments };
	}

	// ─── Pass 1b: Edge visibility ────────────────────────────────────────────

	private compute_edge_visibility(
		input: TopologyInput,
		clips: VisibleClip[],
		endpoints: Map<string, ComputedEndpoint>,
		edge_segments: Map<string, ComputedEdgeSeg[]>,
		fi_on_edge: Map<string, { key: string; face_a: string; face_b: string }[]>,
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
					const merged: ClipInterval[] = [intervals[0]];
					for (let ci = 1; ci < intervals.length; ci++) {
						const prev_t = Topology_Simple.screen_t(a, b, merged[merged.length - 1].end);
						const cur_t = Topology_Simple.screen_t(a, b, intervals[ci].start);
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
						const t_s = Topology_Simple.screen_t(a, b, ci.start);
						const t_e = Topology_Simple.screen_t(a, b, ci.end);
						const w_s = vec3.lerp(vec3.create(), w1, w2, Math.max(0, Math.min(1, t_s)));
						const w_e = vec3.lerp(vec3.create(), w1, w2, Math.max(0, Math.min(1, t_e)));

						// Tag endpoints — check fi_on_edge before creating oc
						const find_fi = (cause: OccFaceRef): string | undefined => {
							if (!cause) return undefined;
							const occ_face_key = `${cause.obj_id}:${cause.face_index ?? -1}`;
							// Check if an fi endpoint on THIS edge involves the occluding face
							const edge_full = `${obj.id}:${ek}`;
							const fi_list = fi_on_edge.get(edge_full);
							if (!fi_list) return undefined;
							for (const fi of fi_list) {
								// The fi involves two faces. The occluding face should be one of them.
								if (fi.face_a === occ_face_key || fi.face_b === occ_face_key) {
									return fi.key;
								}
							}
							return undefined;
						};

						let sk: string;
						if (!ci.start_cause && t_s < CORNER_T) {
							sk = this.register_corner(endpoints, obj.id, i, ci.start, w_s);
						} else if (!ci.start_cause && t_s > 1 - CORNER_T) {
							sk = this.register_corner(endpoints, obj.id, j_idx, ci.start, w_s);
						} else {
							const fi_key = find_fi(ci.start_cause);
							if (fi_key) {
								sk = fi_key;
							} else {
								const edge_id = `${obj.id}:${ek}`;
								const occ_face = ci.start_cause ? `${ci.start_cause.obj_id}:${ci.start_cause.face_index ?? -1}` : '';
								const id: EndpointID = { type: T_Endpoint.occlusion_clip, edge: edge_id, occluder_face: occ_face, end: 'exit' };
								sk = this.register_endpoint(endpoints, id, ci.start, w_s);
							}
						}

						let ek2: string;
						if (!ci.end_cause && t_e > 1 - CORNER_T) {
							ek2 = this.register_corner(endpoints, obj.id, j_idx, ci.end, w_e);
						} else if (!ci.end_cause && t_e < CORNER_T) {
							ek2 = this.register_corner(endpoints, obj.id, i, ci.end, w_e);
						} else {
							const fi_key = find_fi(ci.end_cause);
							if (fi_key) {
								ek2 = fi_key;
							} else {
								const edge_id = `${obj.id}:${ek}`;
								const occ_face = ci.end_cause ? `${ci.end_cause.obj_id}:${ci.end_cause.face_index ?? -1}` : '';
								const id: EndpointID = { type: T_Endpoint.occlusion_clip, edge: edge_id, occluder_face: occ_face, end: 'enter' };
								ek2 = this.register_endpoint(endpoints, id, ci.end, w_e);
							}
						}

						vis.push([ci.start, ci.end]);
						ep_keys.push([sk, ek2]);

						// Collect for Pass 2
						clips.push({
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
		clips: VisibleClip[],
		endpoints: Map<string, ComputedEndpoint>,
		intersection_segments: ComputedIntersectionSeg[],
		fi_on_edge: Map<string, { key: string; face_a: string; face_b: string }[]>,
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

						// Skip-self: clip against all occluding faces EXCEPT both SOs
						const intervals = this.clip_segment_for_occlusion_rich(
							p1, p2, geom.start, geom.end, [fA.obj.id, fB.obj.id], [fA, fB], input,
						);
						if (intervals.length === 0) continue;

						const visible: [Pt, Pt][] = intervals.map(ci => [ci.start, ci.end]);
						const face_key_a = `${fA.obj.id}:${fA.fi}`;
						const face_key_b = `${fB.obj.id}:${fB.fi}`;

						// Compute edge info for both endpoints
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
						const se = edge_info(geom.start_edge, geom.start);
						const ee = edge_info(geom.end_edge, geom.end);

						// Tag endpoints — fi for unoccluded ends, oc for occluded ends
						const ep_keys: [string, string][] = [];
						for (const ci of intervals) {
							const t_s = Topology_Simple.screen_t(p1, p2, ci.start);
							const w_s = vec3.lerp(vec3.create(), geom.start, geom.end, Math.max(0, Math.min(1, t_s)));
							let s_id: EndpointID;
							if (!ci.start_cause) {
								s_id = { type: T_Endpoint.face_intersection, faceA: face_key_a, faceB: face_key_b, end: 'start' };
							} else {
								const occ_id = `${ci.start_cause.obj_id}:${ci.start_cause.face_index ?? -1}`;
								s_id = { type: T_Endpoint.occlusion_clip, edge: `ix:${face_key_a}:${face_key_b}`, occluder_face: occ_id, end: 'exit' };
							}
							const s_key = this.register_endpoint(endpoints, s_id, ci.start, w_s);

							const t_e = Topology_Simple.screen_t(p1, p2, ci.end);
							const w_e = vec3.lerp(vec3.create(), geom.start, geom.end, Math.max(0, Math.min(1, t_e)));
							let e_id: EndpointID;
							if (!ci.end_cause) {
								e_id = { type: T_Endpoint.face_intersection, faceA: face_key_a, faceB: face_key_b, end: 'end' };
							} else {
								const occ_id = `${ci.end_cause.obj_id}:${ci.end_cause.face_index ?? -1}`;
								e_id = { type: T_Endpoint.occlusion_clip, edge: `ix:${face_key_a}:${face_key_b}`, occluder_face: occ_id, end: 'enter' };
							}
							const e_key = this.register_endpoint(endpoints, e_id, ci.end, w_e);

							ep_keys.push([s_key, e_key]);

							// Register fi endpoints on their edges for Pass 1b lookup
							if (!ci.start_cause) {
								const edge_full = `${se.so}:${se.edge_key}`;
								let list = fi_on_edge.get(edge_full);
								if (!list) { list = []; fi_on_edge.set(edge_full, list); }
								if (!list.some(e => e.key === s_key)) {
									list.push({ key: s_key, face_a: face_key_a, face_b: face_key_b });
								}
							}
							if (!ci.end_cause) {
								const edge_full = `${ee.so}:${ee.edge_key}`;
								let list = fi_on_edge.get(edge_full);
								if (!list) { list = []; fi_on_edge.set(edge_full, list); }
								if (!list.some(e => e.key === e_key)) {
									list.push({ key: e_key, face_a: face_key_a, face_b: face_key_b });
								}
							}

							// Collect for Pass 2
							clips.push({
								type: 'intersection', so: fA.obj.id,
								face_pair: { so_a: fA.obj.id, face_a: fA.fi, so_b: fB.obj.id, face_b: fB.fi, color: objects[j].color },
								start_on_edge: se, end_on_edge: ee,
								screen: [ci.start, ci.end], world: [w_s, w_e],
								start_cause: ci.start_cause, end_cause: ci.end_cause,
								start_poly_edge: ci.start_poly_edge ?? -1, end_poly_edge: ci.end_poly_edge ?? -1,
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
		_clips: VisibleClip[],
		endpoints: Map<string, ComputedEndpoint>,
		edge_segments: Map<string, ComputedEdgeSeg[]>,
		occluding_segments: ComputedOccludingSeg[],
	): void {
		// For each visible edge, clip against each other-SO face polygon.
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

						const clip = this.clip_segment_to_polygon_2d(s, e, face.poly);
						if (!clip) continue;
						const [t_enter, t_leave] = clip;

						// Depth check: edge must be in front of face (not behind)
						const w_mid = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, (t_enter + t_leave) / 2);
						const dist = vec3.dot(face.n, w_mid) - face.d;
						if (dist < -0.001) continue;

						const cs: Pt = { x: s.x + (e.x - s.x) * t_enter, y: s.y + (e.y - s.y) * t_enter };
						const ce: Pt = { x: s.x + (e.x - s.x) * t_leave, y: s.y + (e.y - s.y) * t_leave };
						const w_cs = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, t_enter);
						const w_ce = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, t_leave);

						// Try to match existing oc/fi endpoints at entry/exit points.
						// These are computed from different clipping paths, so screen positions
						// may differ by several pixels. Search with a generous threshold.
						// Priority: fi > oc > corner > ex (fi is most specific)
						let cs_key: string | undefined;
						let ce_key: string | undefined;
						let cs_dist = Infinity;
						let ce_dist = Infinity;
						const MATCH_RADIUS = 5.0;

						const priority = (key: string) => {
							if (key.startsWith('fi:')) return 3;
							if (key.startsWith('oc:')) return 2;
							if (key.startsWith('c:')) return 1;
							return 0;
						};

						for (const [key, ep] of endpoints) {
							const ds = Math.sqrt((ep.screen.x - cs.x) ** 2 + (ep.screen.y - cs.y) ** 2);
							if (ds < MATCH_RADIUS) {
								const p = priority(key);
								const cp = cs_key ? priority(cs_key) : -1;
								if (p > cp || (p === cp && ds < cs_dist)) {
									cs_key = key;
									cs_dist = ds;
								}
							}
							const de = Math.sqrt((ep.screen.x - ce.x) ** 2 + (ep.screen.y - ce.y) ** 2);
							if (de < MATCH_RADIUS) {
								const p = priority(key);
								const ep_p = ce_key ? priority(ce_key) : -1;
								if (p > ep_p || (p === ep_p && de < ce_dist)) {
									ce_key = key;
									ce_dist = de;
								}
							}
						}

						// Fall back: create ex endpoints
						const edge_a = `${so_a_id}:${seg.edge_key}`;
						if (!cs_key) {
							const cs_id: EndpointID = { type: T_Endpoint.edge_crossing, edgeA: edge_a, edgeB: `${face.obj_id}:face:${fi}` };
							cs_key = this.register_endpoint(endpoints, cs_id, cs, w_cs);
						}
						if (!ce_key) {
							const ce_id: EndpointID = { type: T_Endpoint.edge_crossing, edgeA: edge_a, edgeB: `${face.obj_id}:face:${fi}:e` };
							ce_key = this.register_endpoint(endpoints, ce_id, ce, w_ce);
						}

						// Skip degenerate occluding segments
						if (cs_key === ce_key) continue;
						const len = Math.sqrt((ce.x - cs.x) ** 2 + (ce.y - cs.y) ** 2);
						if (len < 0.01) continue;

						occluding_segments.push({
							so: face.obj_id,
							face: face.face_index ?? -1,
							screen: [cs, ce],
							endpoint_keys: [cs_key, ce_key],
						});
					}
				}
			}
		}
	}

	// ─── Pass 2: Arrangement ─────────────────────────────────────────────────

	private compute_arrangement(
		input: TopologyInput,
		clips: VisibleClip[],
		endpoints: Map<string, ComputedEndpoint>,
		edge_segments: Map<string, ComputedEdgeSeg[]>,
		intersection_segments: ComputedIntersectionSeg[],
		occluding_segments: ComputedOccludingSeg[],
	): void {
		// 2a: Find all crossings between clips from different SOs
		interface Crossing {
			clip_a: number; clip_b: number;
			ta: number; tb: number;
			screen: Pt;
			world_a: vec3; world_b: vec3;
		}
		const crossings: Crossing[] = [];

		for (let i = 0; i < clips.length; i++) {
			const a = clips[i];
			for (let j = i + 1; j < clips.length; j++) {
				const b = clips[j];
				if (a.so === b.so) continue;

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

				const ix = Topology_Simple.intersect_2d(a.screen[0], a.screen[1], b.screen[0], b.screen[1]);
				if (!ix) continue;
				if (ix.ta < -0.01 || ix.ta > 1.01 || ix.tb < -0.01 || ix.tb > 1.01) continue;

				const screen: Pt = {
					x: a.screen[0].x + (a.screen[1].x - a.screen[0].x) * ix.ta,
					y: a.screen[0].y + (a.screen[1].y - a.screen[0].y) * ix.ta,
				};
				const world_a = vec3.lerp(vec3.create(), a.world[0], a.world[1], ix.ta);
				const world_b = vec3.lerp(vec3.create(), b.world[0], b.world[1], ix.tb);

				crossings.push({ clip_a: i, clip_b: j, ta: ix.ta, tb: ix.tb, screen, world_a, world_b });
			}
		}

		if (crossings.length === 0) return;

		// 2b: Group crossings by clip and split
		// For each clip, collect all crossing t values
		const splits_by_clip = new Map<number, { t: number; screen: Pt; world: vec3; crossing_idx: number }[]>();
		for (let ci = 0; ci < crossings.length; ci++) {
			const c = crossings[ci];
			let list_a = splits_by_clip.get(c.clip_a);
			if (!list_a) { list_a = []; splits_by_clip.set(c.clip_a, list_a); }
			list_a.push({ t: c.ta, screen: c.screen, world: c.world_a, crossing_idx: ci });

			let list_b = splits_by_clip.get(c.clip_b);
			if (!list_b) { list_b = []; splits_by_clip.set(c.clip_b, list_b); }
			list_b.push({ t: c.tb, screen: c.screen, world: c.world_b, crossing_idx: ci });
		}

		// Create crossing endpoint keys (one per crossing)
		const crossing_keys: string[] = [];
		for (const c of crossings) {
			const a = clips[c.clip_a];
			const b = clips[c.clip_b];
			const edge_a = a.type === 'edge' ? `${a.so}:${a.edge_key}` : `ix:${a.so}`;
			const edge_b = b.type === 'edge' ? `${b.so}:${b.edge_key}` : `ix:${b.so}`;
			const [eA, eB] = edge_a < edge_b ? [edge_a, edge_b] : [edge_b, edge_a];
			const id: EndpointID = { type: T_Endpoint.edge_crossing, edgeA: eA, edgeB: eB };
			const world_mid = vec3.lerp(vec3.create(), c.world_a, c.world_b, 0.5);
			const key = this.register_endpoint(endpoints, id, c.screen, world_mid);
			crossing_keys.push(key);
		}

		// Now split edge segments at crossing points
		for (const [so_id, segs] of edge_segments) {
			for (const seg of segs) {
				// Find clips that belong to this edge segment
				const matching_clip_indices: number[] = [];
				for (let ci = 0; ci < clips.length; ci++) {
					const clip = clips[ci];
					if (clip.type === 'edge' && clip.so === so_id && clip.edge_key === seg.edge_key) {
						matching_clip_indices.push(ci);
					}
				}

				// Collect all split points for this edge's visible clips
				const new_visible: [Pt, Pt][] = [];
				const new_ep_keys: [string, string][] = [];

				for (let vi = 0; vi < seg.visible.length; vi++) {
					const [s, e] = seg.visible[vi];
					const [sk, ek] = seg.endpoint_keys[vi];

					// Find the clip index for this visible interval
					const clip_idx = matching_clip_indices[vi];
					const split_list = clip_idx !== undefined ? splits_by_clip.get(clip_idx) : undefined;

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
			// Find clips that match this intersection segment
			const matching_clip_indices: number[] = [];
			for (let ci = 0; ci < clips.length; ci++) {
				const clip = clips[ci];
				if (clip.type === 'intersection' && clip.face_pair &&
					clip.face_pair.so_a === iseg.so_a && clip.face_pair.face_a === iseg.face_a &&
					clip.face_pair.so_b === iseg.so_b && clip.face_pair.face_b === iseg.face_b) {
					matching_clip_indices.push(ci);
				}
			}

			const new_visible: [Pt, Pt][] = [];
			const new_ep_keys: [string, string][] = [];

			for (let vi = 0; vi < iseg.visible.length; vi++) {
				const [s, e] = iseg.visible[vi];
				const [sk, ek] = iseg.endpoint_keys[vi];
				const clip_idx = matching_clip_indices[vi];
				const split_list = clip_idx !== undefined ? splits_by_clip.get(clip_idx) : undefined;

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
		// For each crossing, determine which clip is in front
		for (let ci = 0; ci < crossings.length; ci++) {
			const c = crossings[ci];
			const clip_a = clips[c.clip_a];
			const clip_b = clips[c.clip_b];

			// Depth check: which is closer to camera? (lower z = closer in our projection)
			// Use the world-space z at the crossing point
			const z_a = c.world_a[2];
			const z_b = c.world_b[2];

			const front_clip = z_a > z_b ? clip_a : clip_b;
			const behind_clip = z_a > z_b ? clip_b : clip_a;

			// The front clip's edge passes over the behind clip's face
			// Find the behind clip's SO and face to create the occluding segment
			if (behind_clip.type !== 'edge') continue;

			// Find which face of the behind SO this edge belongs to
			const behind_so = behind_clip.so;
			const behind_obj = input.objects.find(o => o.id === behind_so);
			if (!behind_obj?.faces) continue;

			// Find a face containing this edge
			const [evi, evj] = behind_clip.edge_key!.split('-').map(Number);
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
				const clip_a2 = clips[c2.clip_a];
				const clip_b2 = clips[c2.clip_b];

				// Check if same front edge
				const front_clip2 = (c2.world_a[2] > c2.world_b[2]) ? clip_a2 : clip_b2;
				const behind_clip2 = (c2.world_a[2] > c2.world_b[2]) ? clip_b2 : clip_a2;

				if (front_clip2.so !== front_clip.so || front_clip2.edge_key !== front_clip.edge_key) continue;
				if (behind_clip2.so !== behind_clip.so) continue;

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
	): { start: vec3; end: vec3; start_edge: { face: 'A' | 'B'; edge_idx: number }; end_edge: { face: 'A' | 'B'; edge_idx: number } } | null {
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

		const start_edge = (rb[0] > ra[0])
			? { face: 'B' as const, edge_idx: rb[2] }
			: { face: 'A' as const, edge_idx: ra[2] };
		const end_edge = (rb[1] < ra[1])
			? { face: 'B' as const, edge_idx: rb[3] }
			: { face: 'A' as const, edge_idx: ra[3] };

		const start = vec3.scaleAndAdd(vec3.create(), p0, dir, tA);
		const end = vec3.scaleAndAdd(vec3.create(), p0, dir, tB);
		return { start, end, start_edge, end_edge };
	}

	private clip_segment_for_occlusion_rich(
		p1: Pt, p2: Pt, w1: vec3, w2: vec3,
		skip_ids: string | string[],
		skip_planes: { n: vec3; d: number }[] | undefined,
		input: TopologyInput,
	): ClipInterval[] {
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
			const clip = this.clip_segment_to_polygon_2d(bs, be, face.poly);
			if (!clip) continue;

			const s_range = s_behind_end - s_behind_start;
			const s_enter = s_behind_start + clip[0] * s_range;
			const s_leave = s_behind_start + clip[1] * s_range;

			const new_intervals: RichInterval[] = [];
			for (const iv of intervals) {
				if (s_leave <= iv.a || s_enter >= iv.b) {
					new_intervals.push(iv);
					continue;
				}
				if (s_enter > iv.a) new_intervals.push({ a: iv.a, b: s_enter, a_cause: iv.a_cause, b_cause: face, a_poly_edge: iv.a_poly_edge, b_poly_edge: clip[2] });
				if (s_leave < iv.b) new_intervals.push({ a: s_leave, b: iv.b, a_cause: face, b_cause: iv.b_cause, a_poly_edge: clip[3], b_poly_edge: iv.b_poly_edge });
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
	): [number, number, number, number] | null {
		const n_edges = corners.length;
		let enter_edge = -1, leave_edge = -1;
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
				continue;
			}
			const t = -numer / alignment;
			if (alignment > 0) {
				if (t > t_min) { t_min = t; enter_edge = i; }
			} else {
				if (t < t_max) { t_max = t; leave_edge = i; }
			}
			if (t_min > t_max) return null;
		}
		return [t_min, t_max, enter_edge, leave_edge];
	}
}
