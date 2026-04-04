import { T_Endpoint, endpoint_key, vtx, type EndpointID } from './Facets';
import type { Projected, O_Scene } from '../types/Interfaces';
import { vec3, vec4, mat4 } from 'gl-matrix';
import { k } from '../common/Constants';
import type Flatbush from 'flatbush';

/**
 * Topology.ts — Identity-based endpoint matching for the faceted 3D renderer.
 *
 * Replaces the three proximity-based maps (intersection_clip_map, oc_at_occluder_edge, pierce_on_edge)
 * with a single deterministic registry: edge_points. Every endpoint gets ONE identity from birth.
 * Later phases look up by world-space distance on the same edge, not screen-space t.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

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

type OccFaceRef = OccludingFace | null;

interface ClipInterval {
	start: Pt; end: Pt;
	start_cause: OccFaceRef;
	end_cause: OccFaceRef;
	start_poly_edge?: number;
	end_poly_edge?: number;
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

export interface SplitInfo {
	so: string;
	edge_key: string;
	screen: Pt;
	world: vec3;
	ep_key: string;
}

export interface TopologyOutput {
	endpoints: Map<string, ComputedEndpoint>;
	edge_segments: Map<string, ComputedEdgeSeg[]>;
	intersection_segments: ComputedIntersectionSeg[];
	occluding_segments: ComputedOccludingSeg[];
}

// ─── Edge point registry entry ───────────────────────────────────────────────

interface EdgePoint {
	key: string;
	world: vec3;
	screen: Pt;
	t: number;  // parametric t along the edge (world-space)
}

// ─── Topology ────────────────────────────────────────────────────────────────

export class Topology {
	// Per-frame state (reset in compute)
	private endpoints = new Map<string, ComputedEndpoint>();
	private edge_segments = new Map<string, ComputedEdgeSeg[]>();
	private intersection_segments: ComputedIntersectionSeg[] = [];
	private occluding_segments: ComputedOccludingSeg[] = [];

	// Identity registry: known endpoints on each edge (for edge splitting + coincident pierce)
	// Key: "so_id:edge_key" → list of known endpoints on that edge
	private edge_points = new Map<string, EdgePoint[]>();

	// Clip identity: pierce endpoints indexed for the edge clipper
	// Key: "clipped_so:clipped_edge:occluder_so:occluder_face" → pierce endpoint list
	// Same key format as old code's intersection_clip_map.
	private clip_identity = new Map<string, EdgePoint[]>();

	// Reverse map: occluder edge → oc/pierce endpoints registered on it by OTHER edges' clipping.
	// Used by Phase 4 Part 2 to match crossing boundaries (equivalent to old oc_at_occluder_edge).
	private oc_at_occluder_edge = new Map<string, { key: string; screen: Pt; world: vec3 }[]>();

	// Split tracking
	private intersection_edge_splits: SplitInfo[] = [];
	private crossing_splits: (SplitInfo & { poly_edge_idx: number })[] = [];

	// Debug: name map for readable logging (obj_id → SO name)
	private _names = new Map<string, string>();
	private _logged = false;

	/** Replace obj_X with SO names, vertex indices with letters */
	private pretty(s: string): string {
		for (const [id, name] of this._names) s = s.split(id).join(name);
		return s;
	}

	/** Is this one of the target edges (CG=2-6 or FG=5-6)? */
	private static isTarget(ek: string): boolean { return ek === '2-6' || ek === '5-6'; }

	/** Pretty edge label: "2-6" → "CG", with SO name prefix */
	private prettyEdge(so: string, ek: string): string {
		const [a, b] = ek.split('-').map(Number);
		const name = this._names.get(so) ?? so;
		return `${name}:${vtx(a)}${vtx(b)}`;
	}

	// ─── Public API ──────────────────────────────────────────────────────────

	compute(input: TopologyInput): TopologyOutput {
		// Fresh state each frame
		this.endpoints = new Map();
		this.edge_segments = new Map();
		this.intersection_segments = [];
		this.occluding_segments = [];
		this.edge_points = new Map();
		this.clip_identity = new Map();
		this.oc_at_occluder_edge = new Map();
		this.intersection_edge_splits = [];
		this.crossing_splits = [];

		// Build name map for readable logging
		this._names.clear();
		for (const obj of input.objects) this._names.set(obj.id, obj.so.name);

		if (input.objects.length > 1) {
			this.compute_intersections(input);
		}
		this.compute_edges(input);
		if (input.objects.length > 1) {
			this.filter_occluded_endpoints(input);
			this.compute_crossings(input);
			this.apply_splits();
		}
		this._logged = true;
		return {
			endpoints: this.endpoints,
			edge_segments: this.edge_segments,
			intersection_segments: this.intersection_segments,
			occluding_segments: this.occluding_segments,
		};
	}

	// ─── Endpoint registry ───────────────────────────────────────────────────

	/** Register an endpoint, return its key. Idempotent by key. */
	private register_endpoint(id: EndpointID, screen: Pt, world: vec3): string {
		const key = endpoint_key(id);
		if (!this.endpoints.has(key)) {
			this.endpoints.set(key, { key, id, screen, world });
		}
		return key;
	}

	/** Add a known point on an edge to the identity registry. */
	private add_edge_point(so: string, edge_key: string, ep_key: string, world: vec3, screen: Pt, t: number): void {
		const full = `${so}:${edge_key}`;
		let list = this.edge_points.get(full);
		if (!list) { list = []; this.edge_points.set(full, list); }
		if (!list.some(p => p.key === ep_key)) {
			list.push({ key: ep_key, world: vec3.clone(world), screen: { x: screen.x, y: screen.y }, t });
		}
	}

	/** Find a known edge point by world-space proximity. */
	private find_edge_point(so: string, edge_key: string, world: vec3, epsilon = 1e-4): EdgePoint | null {
		const points = this.edge_points.get(`${so}:${edge_key}`);
		if (!points) return null;
		let best: EdgePoint | null = null;
		let best_dist = epsilon;
		for (const p of points) {
			const d = vec3.distance(p.world, world);
			if (d < best_dist) { best_dist = d; best = p; }
		}
		return best;
	}


	/** Register an pierce endpoint for the edge clipper to find.
	 *  Key format matches old code's intersection_clip_map: "pierce_so:pierce_edge:other_so:other_face"
	 *  pierce_so:pierce_edge = edge the pierce sits on. other_so:other_face = the other face in the pair. */
	private add_clip_identity(pierce_so: string, pierce_edge: string, other_so: string, other_face: number, ep_key: string, world: vec3, screen: Pt): void {
		const key = `${pierce_so}:${pierce_edge}:${other_so}:${other_face}`;
		let list = this.clip_identity.get(key);
		if (!list) { list = []; this.clip_identity.set(key, list); }
		if (!list.some(p => p.key === ep_key)) {
			list.push({ key: ep_key, world: vec3.clone(world), screen: { x: screen.x, y: screen.y }, t: 0 });
		}
	}

	/** Find an pierce endpoint registered for this clip context.
	 *  Called by the edge clipper: clipped_so:clipped_edge is the edge being clipped,
	 *  occluder_so:occluder_face is the face doing the clipping. */
	private find_clip_identity(clipped_so: string, clipped_edge: string, occluder_so: string, occluder_face: number, world: vec3): EdgePoint | null {
		const list = this.clip_identity.get(`${clipped_so}:${clipped_edge}:${occluder_so}:${occluder_face}`);
		if (!list) return null;
		if (list.length === 1) return list[0];
		let best: EdgePoint | null = null;
		let best_dist = Infinity;
		for (const p of list) {
			const d = vec3.distance(p.world, world);
			if (d < best_dist) { best_dist = d; best = p; }
		}
		return best;
	}

	// ─── Helpers ─────────────────────────────────────────────────────────────

	/** Compute t along screen segment a→b for point p. */
	private static screen_t(a: Pt, b: Pt, p: Pt): number {
		const dx = b.x - a.x, dy = b.y - a.y;
		const len_sq = dx * dx + dy * dy;
		if (len_sq < 1e-10) return 0;
		return ((p.x - a.x) * dx + (p.y - a.y) * dy) / len_sq;
	}

	/** Compute the occluder edge string from a poly_edge index and face_verts. */
	private static occ_edge_str(obj_id: string, face_verts: number[], poly_edge_idx: number): string {
		const vi = face_verts[poly_edge_idx];
		const vj = face_verts[(poly_edge_idx + 1) % face_verts.length];
		return `${obj_id}:${Math.min(vi, vj)}-${Math.max(vi, vj)}`;
	}

	// ─── Phase 1: Intersections ──────────────────────────────────────────────

	private compute_intersections(input: TopologyInput): void {
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

		// AABB per object
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
						const clips = this.clip_segment_for_occlusion_rich(
							p1, p2, geom.start, geom.end, [fA.obj.id, fB.obj.id], [fA, fB],
							input,
						);
						if (clips.length === 0) continue;
						const visible: [Pt, Pt][] = clips.map(ci => [ci.start, ci.end]);

						const face_key_a = `${fA.obj.id}:${fA.fi}`;
						const face_key_b = `${fB.obj.id}:${fB.fi}`;
						const ix_edge_id = `ix:${face_key_a}:${face_key_b}`;

						// Corner detection
						const CORNER_EDGE_T = 0.005;
						const corner_for_geom = (edge: { face: 'A' | 'B'; edge_idx: number }, world_pt: vec3): EndpointID | null => {
							const f = edge.face === 'A' ? fA : fB;
							const face_verts = f.obj.faces![f.fi];
							const c0 = f.corners[edge.edge_idx];
							const c1 = f.corners[(edge.edge_idx + 1) % f.corners.length];
							const vi = face_verts[edge.edge_idx];
							const vj = face_verts[(edge.edge_idx + 1) % face_verts.length];
							const edge_len = vec3.distance(c0, c1);
							if (edge_len < 1e-10) return null;
							if (vec3.distance(world_pt, c0) / edge_len < CORNER_EDGE_T) return { type: T_Endpoint.corner, so: f.obj.id, vertex: vi };
							if (vec3.distance(world_pt, c1) / edge_len < CORNER_EDGE_T) return { type: T_Endpoint.corner, so: f.obj.id, vertex: vj };
							return null;
						};
						const start_corner = corner_for_geom(geom.start_edge, geom.start);
						const end_corner = corner_for_geom(geom.end_edge, geom.end);

						// Compute edge info for both endpoints
						const edge_info = (e: { face: 'A' | 'B'; edge_idx: number }, world_pt: vec3) => {
							const f = e.face === 'A' ? fA : fB;
							const face_verts = f.obj.faces![f.fi];
							const vi = face_verts[e.edge_idx];
							const vj = face_verts[(e.edge_idx + 1) % face_verts.length];
							const ek = `${Math.min(vi, vj)}-${Math.max(vi, vj)}`;
							const c0 = f.corners[e.edge_idx];
							const c1 = f.corners[(e.edge_idx + 1) % f.corners.length];
							const edge_vec = vec3.sub(vec3.create(), c1, c0);
							const len_sq = vec3.dot(edge_vec, edge_vec);
							const pt_vec = vec3.sub(vec3.create(), world_pt, c0);
							const t = len_sq > 1e-10 ? vec3.dot(pt_vec, edge_vec) / len_sq : 0;
							return { so: f.obj.id, edge_key: ek, t };
						};
						const se = edge_info(geom.start_edge, geom.start);
						const ee = edge_info(geom.end_edge, geom.end);

						// Build graph segments from visible clip intervals
						const ep_keys: [string, string][] = [];
						for (const ci of clips) {
							// ── Tag start ──
							let s_id: EndpointID;
							if (!ci.start_cause && start_corner) {
								s_id = start_corner;
							} else if (!ci.start_cause) {
								// Check registry for coincident pierce on the same edge
								const existing = this.find_edge_point(se.so, se.edge_key, geom.start);
								if (existing) {
									s_id = this.endpoints.get(existing.key)!.id;
								} else {
									s_id = { type: T_Endpoint.pierce, faceA: face_key_a, faceB: face_key_b, end: 'start' };
								}
							} else {
								const occ_id = `${ci.start_cause.obj_id}:${ci.start_cause.face_index ?? -1}`;
								const occ_edge_s = (ci.start_poly_edge != null && ci.start_poly_edge >= 0 && ci.start_cause.face_verts)
									? Topology.occ_edge_str(ci.start_cause.obj_id, ci.start_cause.face_verts, ci.start_poly_edge)
									: undefined;
								s_id = { type: T_Endpoint.occlusion_clip, edge: ix_edge_id, occluder_face: occ_id, end: 'exit', occluder_edge: occ_edge_s };
							}
							const t_s = Topology.screen_t(p1, p2, ci.start);
							const w_s = vec3.lerp(vec3.create(), geom.start, geom.end, Math.max(0, Math.min(1, t_s)));
							const s_key = this.register_endpoint(s_id, ci.start, w_s);

							// Register pierce on edge in identity registry
							if (s_id.type === T_Endpoint.pierce) {
								this.add_edge_point(se.so, se.edge_key, s_key, w_s, ci.start, se.t);
							}
							// Register oc endpoints on their occluder edge + record edge split
							if (s_id.type === T_Endpoint.occlusion_clip && s_id.occluder_edge) {
								const colon = s_id.occluder_edge.indexOf(':');
								const occ_so = s_id.occluder_edge.slice(0, colon);
								const occ_ek = s_id.occluder_edge.slice(colon + 1);
								this.add_edge_point(occ_so, occ_ek, s_key, w_s, ci.start, 0);
								this.intersection_edge_splits.push({ so: occ_so, edge_key: occ_ek, screen: ci.start, world: w_s, ep_key: s_key });
							}

							// ── Tag end ──
							let e_id: EndpointID;
							if (!ci.end_cause && end_corner) {
								e_id = end_corner;
							} else if (!ci.end_cause) {
								const existing_e = this.find_edge_point(ee.so, ee.edge_key, geom.end);
								if (existing_e) {
									e_id = this.endpoints.get(existing_e.key)!.id;
								} else {
									e_id = { type: T_Endpoint.pierce, faceA: face_key_a, faceB: face_key_b, end: 'end' };
								}
							} else {
								const occ_id = `${ci.end_cause.obj_id}:${ci.end_cause.face_index ?? -1}`;
								const occ_edge_e = (ci.end_poly_edge != null && ci.end_poly_edge >= 0 && ci.end_cause.face_verts)
									? Topology.occ_edge_str(ci.end_cause.obj_id, ci.end_cause.face_verts, ci.end_poly_edge)
									: undefined;
								e_id = { type: T_Endpoint.occlusion_clip, edge: ix_edge_id, occluder_face: occ_id, end: 'enter', occluder_edge: occ_edge_e };
							}
							const t_e = Topology.screen_t(p1, p2, ci.end);
							const w_e = vec3.lerp(vec3.create(), geom.start, geom.end, Math.max(0, Math.min(1, t_e)));
							const e_key = this.register_endpoint(e_id, ci.end, w_e);

							// Register pierce on edge in identity registry
							if (e_id.type === T_Endpoint.pierce) {
								this.add_edge_point(ee.so, ee.edge_key, e_key, w_e, ci.end, ee.t);
							}
							// Register oc endpoints on their occluder edge + record edge split
							if (e_id.type === T_Endpoint.occlusion_clip && e_id.occluder_edge) {
								const colon = e_id.occluder_edge.indexOf(':');
								const occ_so = e_id.occluder_edge.slice(0, colon);
								const occ_ek = e_id.occluder_edge.slice(colon + 1);
								this.add_edge_point(occ_so, occ_ek, e_key, w_e, ci.end, 0);
								this.intersection_edge_splits.push({ so: occ_so, edge_key: occ_ek, screen: ci.end, world: w_e, ep_key: e_key });
							}

							ep_keys.push([s_key, e_key]);
						}

						// Register pierce/corner endpoints on their source edges for identity lookup
						{
							const first_s_key = ep_keys.length > 0 ? ep_keys[0][0] : null;
							const last_e_key = ep_keys.length > 0 ? ep_keys[ep_keys.length - 1][1] : null;
							const first_s_id = first_s_key ? this.endpoints.get(first_s_key)?.id : null;
							const last_e_id = last_e_key ? this.endpoints.get(last_e_key)?.id : null;

							const is_edge_exit = (id: EndpointID | null) =>
								id?.type === T_Endpoint.pierce || id?.type === T_Endpoint.corner;

							if (first_s_key && first_s_id && is_edge_exit(first_s_id)) {
								const se_ep = this.endpoints.get(first_s_key)!;
								// Register on the edge it sits on
								this.add_edge_point(se.so, se.edge_key, first_s_key, se_ep.world, se_ep.screen, se.t);
								// Cross-register: the other SO's edge clipper needs to find this pierce
								// Key: (other_so, occluding_face) — any edge of other_so clipped by this face
								const other_s = geom.start_edge.face === 'A' ? fB : fA;
								this.add_clip_identity(se.so, se.edge_key, other_s.obj.id, other_s.fi, first_s_key, se_ep.world, se_ep.screen);
								if (first_s_id.type === T_Endpoint.pierce) {
									this.intersection_edge_splits.push({ so: se.so, edge_key: se.edge_key, screen: se_ep.screen, world: se_ep.world, ep_key: first_s_key });
								}
							}
							if (last_e_key && last_e_id && is_edge_exit(last_e_id)) {
								const ee_ep = this.endpoints.get(last_e_key)!;
								this.add_edge_point(ee.so, ee.edge_key, last_e_key, ee_ep.world, ee_ep.screen, ee.t);
								const other_e = geom.end_edge.face === 'A' ? fB : fA;
								this.add_clip_identity(ee.so, ee.edge_key, other_e.obj.id, other_e.fi, last_e_key, ee_ep.world, ee_ep.screen);
								if (last_e_id.type === T_Endpoint.pierce) {
									this.intersection_edge_splits.push({ so: ee.so, edge_key: ee.edge_key, screen: ee_ep.screen, world: ee_ep.world, ep_key: last_e_key });
								}
							}

							this.intersection_segments.push({
								visible, endpoint_keys: ep_keys, color: objects[j].color,
								so_a: fA.obj.id, face_a: fA.fi, so_b: fB.obj.id, face_b: fB.fi,
								start_on_edge: se, end_on_edge: ee,
							});
						}
					}
				}
			}
		}
	}

	// ─── Phase 2: Edges ──────────────────────────────────────────────────────

	private compute_edges(input: TopologyInput): void {
		const { objects, projected_map } = input;
		this.edge_segments.clear();
		const CORNER_T = 0.01;

		for (const obj of objects) {
			const projected = projected_map.get(obj.id)!;
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

				let clips = this.clip_segment_for_occlusion_rich(
					{ x: a.x, y: a.y }, { x: b.x, y: b.y }, w1, w2, obj.id, undefined, input,
				);

				// Merge nearly-touching intervals
				if (clips.length > 1) {
					const GAP_T = 0.02;
					const merged: ClipInterval[] = [clips[0]];
					for (let ci = 1; ci < clips.length; ci++) {
						const prev_t = Topology.screen_t(a, b, merged[merged.length - 1].end);
						const cur_t = Topology.screen_t(a, b, clips[ci].start);
						if (Math.abs(cur_t - prev_t) < GAP_T) {
							merged[merged.length - 1] = {
								start: merged[merged.length - 1].start,
								end: clips[ci].end,
								start_cause: merged[merged.length - 1].start_cause,
								end_cause: clips[ci].end_cause,
							};
						} else {
							merged.push(clips[ci]);
						}
					}
					clips = merged;
				}

				if (clips.length > 0) {
					const vis: [Pt, Pt][] = [];
					const ep_keys: [string, string][] = [];
					const edge_id = `${obj.id}:${ek}`;

					const used_pierce_keys = new Set<string>();

					// Helper: tag an endpoint from t value and clip cause
					const tag_endpoint = (t: number, screen: Pt, cause: OccFaceRef, is_start_of_visible: boolean, poly_edge_idx?: number): string => {
						const w = vec3.lerp(vec3.create(), w1, w2, Math.max(0, Math.min(1, t)));
						let id: EndpointID;

						if (!cause && t < CORNER_T) {
							id = { type: T_Endpoint.corner, so: obj.id, vertex: i };
						} else if (!cause && t > 1 - CORNER_T) {
							id = { type: T_Endpoint.corner, so: obj.id, vertex: j_idx };
						} else if (cause) {
							// IDENTITY-BASED: look up clip_identity for a known pierce at this clip context
							const occ_edge = (poly_edge_idx != null && poly_edge_idx >= 0 && cause.face_verts)
								? Topology.occ_edge_str(cause.obj_id, cause.face_verts, poly_edge_idx)
								: undefined;

							let pierce_id: EndpointID | undefined;
							{
								// Try topological lookup first (same-SO pierce on this edge)
								let known = this.find_clip_identity(obj.id, ek, cause.obj_id, cause.face_index ?? -1, w);
								// Fallback: pierce may sit on the occluder's edge (cross-SO case)
								// Only accept pierce endpoints — oc endpoints from other edges are
								// different topological events and reusing them prevents this edge
								// from getting its own oc endpoint.
								if (!known && cause.face_verts) {
									for (let ei = 0; ei < cause.face_verts.length && !known; ei++) {
										const vi = cause.face_verts[ei], vj = cause.face_verts[(ei + 1) % cause.face_verts.length];
										const candidate = this.find_edge_point(cause.obj_id, `${Math.min(vi, vj)}-${Math.max(vi, vj)}`, w);
										if (candidate?.key.startsWith('pierce:')) known = candidate;
									}
								}
								if (known) {
									const known_ep = this.endpoints.get(known.key);
									const blocked = used_pierce_keys.has(known.key) && known.key !== prev_clip_end_key;
									if (known_ep && !blocked) {
										pierce_id = known_ep.id;
									}
								}
							}

							if (pierce_id) {
								const pierce_key_check = endpoint_key(pierce_id);
								if (used_pierce_keys.has(pierce_key_check) && pierce_key_check !== prev_clip_end_key) pierce_id = undefined;
								else used_pierce_keys.add(pierce_key_check);
							}
							id = pierce_id ?? { type: T_Endpoint.occlusion_clip, edge: edge_id, occluder_face: `${cause.obj_id}:${cause.face_index ?? -1}`, end: is_start_of_visible ? 'exit' : 'enter', occluder_edge: occ_edge };
							const ep_key = this.register_endpoint(id, screen, w);

							// Focused CG/F'G' logging
							if (!this._logged && Topology.isTarget(ek)) {
								const path = pierce_id ? 'pierce-reuse' : (occ_edge ? 'oc+edge' : 'oc');
								console.log(`[CG×F'G'] Phase2 ${this.prettyEdge(obj.id, ek)} t=${t.toFixed(3)} → ${this.pretty(ep_key)} (${path})${occ_edge ? ` occ_edge=${this.pretty(occ_edge)}` : ''}`);
							}

							// Register on this edge (the clipped edge)
							this.add_edge_point(obj.id, ek, ep_key, w, screen, t);
							// Also register on the occluder's polygon edge (for crossing detection)
							if (occ_edge) {
								const colon = occ_edge.indexOf(':');
								const occ_so = occ_edge.slice(0, colon);
								const occ_ek = occ_edge.slice(colon + 1);
								this.add_edge_point(occ_so, occ_ek, ep_key, w, screen, 0);
								// Register in oc_at_occluder_edge for Phase 4 Part 2
								let list = this.oc_at_occluder_edge.get(occ_edge);
								if (!list) { list = []; this.oc_at_occluder_edge.set(occ_edge, list); }
								if (!list.some(e => e.key === ep_key)) {
									list.push({ key: ep_key, screen, world: w });
								}
							}
							return ep_key;
						} else {
							id = { type: T_Endpoint.occlusion_clip, edge: edge_id, occluder_face: '', end: is_start_of_visible ? 'exit' : 'enter' };
						}
						const ep_key = this.register_endpoint(id, screen, w);
						// Register corners in identity registry too
						if (id.type === T_Endpoint.corner) {
							this.add_edge_point(obj.id, ek, ep_key, w, screen, t);
						}
						return ep_key;
					};

					let prev_clip_end_key = '';
					let prev_clip_end_t = -Infinity;
					for (const ci of clips) {
						const t_s = Topology.screen_t(a, b, ci.start);
						const t_e = Topology.screen_t(a, b, ci.end);
						// Only allow prev_clip_end_key reuse for zero-length gaps
						const gap = t_s - prev_clip_end_t;
						if (gap > 0.02) prev_clip_end_key = '';
						const sk = tag_endpoint(t_s, ci.start, ci.start_cause, true, ci.start_poly_edge);
						const ek2 = tag_endpoint(t_e, ci.end, ci.end_cause, false, ci.end_poly_edge);
						vis.push([ci.start, ci.end]);
						ep_keys.push([sk, ek2]);
						prev_clip_end_key = ek2;
						prev_clip_end_t = t_e;
					}

					segments.push({ edge_key: ek, so: obj.id, visible: vis, endpoint_keys: ep_keys });
				}
			}
			this.edge_segments.set(obj.id, segments);
		}
	}

	// ─── Phase 2b: Connect oc enter/exit pairs ────────────────────────────────

	// connect_oc_pairs removed — gap segments created in Facets.ingest_precomputed

	// ─── Phase 3: Filter phantom endpoints ───────────────────────────────────

	private filter_occluded_endpoints(input: TopologyInput): void {
		const { objects, projected_map } = input;

		const is_occluded_on_face = (so_id: string, face_idx: number, screen: Pt): boolean => {
			const obj = objects.find(o => o.id === so_id);
			if (!obj?.faces) return false;
			const face_verts = obj.faces[face_idx];
			const projected = projected_map.get(so_id);
			if (!projected) return false;
			const edge_segs = this.edge_segments.get(so_id);
			if (!edge_segs) return false;

			for (let i = 0; i < face_verts.length; i++) {
				const vi = face_verts[i], vj = face_verts[(i + 1) % face_verts.length];
				const ek = `${Math.min(vi, vj)}-${Math.max(vi, vj)}`;
				const seg = edge_segs.find(s => s.edge_key === ek);
				if (!seg) continue;

				const a = projected[vi], b = projected[vj];
				const ex = b.x - a.x, ey = b.y - a.y;
				const edge_len = Math.sqrt(ex * ex + ey * ey);
				if (edge_len < 1e-6) continue;
				const perp = Math.abs((screen.x - a.x) * ey - (screen.y - a.y) * ex) / edge_len;
				if (perp > 5) continue;

				const pt_t = Topology.screen_t(a, b, screen);
				let in_visible = false;
				for (const [vs, ve] of seg.visible) {
					const t_s = Topology.screen_t(a, b, vs);
					const t_e = Topology.screen_t(a, b, ve);
					const t_min = Math.min(t_s, t_e);
					const t_max = Math.max(t_s, t_e);
					if (pt_t >= t_min - 0.01 && pt_t <= t_max + 0.01) { in_visible = true; break; }
				}
				if (!in_visible) return true;
			}
			return false;
		};

		// Build set of keys referenced by edge segments
		const edge_referenced = new Set<string>();
		for (const [, segs] of this.edge_segments) {
			for (const seg of segs) {
				for (const [sk, ek] of seg.endpoint_keys) {
					edge_referenced.add(sk);
					edge_referenced.add(ek);
				}
			}
		}

		// Check intersection endpoints
		for (const iseg of this.intersection_segments) {
			if (iseg.endpoint_keys.length === 0) continue;
			const checks: [string, string, number][] = [
				[iseg.endpoint_keys[0][0], iseg.so_b, iseg.face_b],
				[iseg.endpoint_keys[0][0], iseg.so_a, iseg.face_a],
				[iseg.endpoint_keys[iseg.endpoint_keys.length - 1][1], iseg.so_b, iseg.face_b],
				[iseg.endpoint_keys[iseg.endpoint_keys.length - 1][1], iseg.so_a, iseg.face_a],
			];
			for (const [ep_key, so_id, face_idx] of checks) {
				if (edge_referenced.has(ep_key)) continue;
				const ep = this.endpoints.get(ep_key);
				if (!ep) continue;
				if (is_occluded_on_face(so_id, face_idx, ep.screen)) {
					if (!this._logged && (ep_key.includes('2-6') || ep_key.includes('5-6') || ep_key.includes('C-G') || ep_key.includes('F-G')))
						console.log(`[CG×F'G'] Phase3 DELETE intersection ep ${this.pretty(ep_key)} (occluded on ${this._names.get(so_id) ?? so_id}:face${face_idx})`);
					this.endpoints.delete(ep_key);
					break;
				}
			}
		}

		// Check occlusion_clip endpoints on edges belonging to their SO's faces
		for (const [key, ep] of this.endpoints) {
			if (ep.id.type !== T_Endpoint.occlusion_clip) continue;
			if (edge_referenced.has(key)) continue;
			const oc = ep.id as { type: T_Endpoint.occlusion_clip; edge: string; occluder_face: string; end: 'enter' | 'exit' };
			const colon = oc.edge.indexOf(':');
			if (colon < 0) continue;
			const so_id = oc.edge.slice(0, colon);
			const edge_key = oc.edge.slice(colon + 1);
			const [evi, evj] = edge_key.split('-').map(Number);

			const obj = objects.find(o => o.id === so_id);
			if (!obj?.faces) continue;

			for (let fi = 0; fi < obj.faces.length; fi++) {
				const fv = obj.faces[fi];
				if (!fv.includes(evi) || !fv.includes(evj)) continue;
				if (is_occluded_on_face(so_id, fi, ep.screen)) {
					if (!this._logged && Topology.isTarget(edge_key))
						console.log(`[CG×F'G'] Phase3 DELETE oc ep ${this.pretty(key)} on ${this.prettyEdge(so_id, edge_key)} (occluded on face${fi})`);
					this.endpoints.delete(key);
					break;
				}
			}
		}
	}

	// ─── Phase 4: Crossings (edge-vs-edge) ──────────────────────────────────

	/** 2D line intersection. Returns t along segment a1→a2 where it crosses b1→b2, or null. */
	private static intersect_2d(a1: Pt, a2: Pt, b1: Pt, b2: Pt): { ta: number; tb: number } | null {
		const dax = a2.x - a1.x, day = a2.y - a1.y;
		const dbx = b2.x - b1.x, dby = b2.y - b1.y;
		const denom = dax * dby - day * dbx;
		if (Math.abs(denom) < 1e-10) return null; // parallel
		const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / denom;
		const u = ((b1.x - a1.x) * day - (b1.y - a1.y) * dax) / denom;
		return { ta: t, tb: u };
	}

	private compute_crossings(input: TopologyInput): void {
		this.occluding_segments = [];
		this.crossing_splits = [];

		// ── Part 1: Edge-edge crossings for split points ──
		// Collect all visible edge clips across all SOs
		const all_clips: {
			so: string; edge_key: string; ci: number;
			s: Pt; e: Pt; sk: string; ek: string;
		}[] = [];
		for (const [so_id, segs] of this.edge_segments) {
			for (const seg of segs) {
				for (let ci = 0; ci < seg.visible.length; ci++) {
					const [s, e] = seg.visible[ci];
					const [sk, ek] = seg.endpoint_keys[ci];
					all_clips.push({ so: so_id, edge_key: seg.edge_key, ci, s, e, sk, ek });
				}
			}
		}

		const processed = new Set<string>();

		for (let i = 0; i < all_clips.length; i++) {
			const a = all_clips[i];
			for (let j = i + 1; j < all_clips.length; j++) {
				const b = all_clips[j];
				if (a.so === b.so) continue;

				const pair_key = a.so < b.so
					? `${a.so}:${a.edge_key}:${a.ci}|${b.so}:${b.edge_key}:${b.ci}`
					: `${b.so}:${b.edge_key}:${b.ci}|${a.so}:${a.edge_key}:${a.ci}`;
				if (processed.has(pair_key)) continue;
				processed.add(pair_key);

				const ix = Topology.intersect_2d(a.s, a.e, b.s, b.e);
				if (!ix) continue;
				if (ix.ta < -0.01 || ix.ta > 1.01 || ix.tb < -0.01 || ix.tb > 1.01) continue;

				const screen: Pt = {
					x: a.s.x + (a.e.x - a.s.x) * ix.ta,
					y: a.s.y + (a.e.y - a.s.y) * ix.ta,
				};

				const ep_a_s = this.endpoints.get(a.sk);
				const ep_a_e = this.endpoints.get(a.ek);
				const ep_b_s = this.endpoints.get(b.sk);
				const ep_b_e = this.endpoints.get(b.ek);
				if (!ep_a_s || !ep_a_e || !ep_b_s || !ep_b_e) continue;

				const w_a = vec3.lerp(vec3.create(), ep_a_s.world, ep_a_e.world, ix.ta);
				const w_b = vec3.lerp(vec3.create(), ep_b_s.world, ep_b_e.world, ix.tb);
				const w_mid = vec3.lerp(vec3.create(), w_a, w_b, 0.5);

				// Reuse existing oc/pierce endpoint on either edge if present
				let ep_key: string | undefined;
				const existing_a = this.find_edge_point(a.so, a.edge_key, w_a);
				const existing_b = this.find_edge_point(b.so, b.edge_key, w_b);
				if (existing_a?.key.startsWith('pierce:')) ep_key = existing_a.key;
				else if (existing_b?.key.startsWith('pierce:')) ep_key = existing_b.key;
				else if (existing_a) ep_key = existing_a.key;
				else if (existing_b) ep_key = existing_b.key;

				if (!ep_key) {
					const edge_a_full = `${a.so}:${a.edge_key}`;
					const edge_b_full = `${b.so}:${b.edge_key}`;
					const [eA, eB] = edge_a_full < edge_b_full ? [edge_a_full, edge_b_full] : [edge_b_full, edge_a_full];
					const ex_id: EndpointID = { type: T_Endpoint.cross, edgeA: eA, edgeB: eB };
					ep_key = this.register_endpoint(ex_id, screen, w_mid);
				}

				this.add_edge_point(a.so, a.edge_key, ep_key, w_a, screen, ix.ta);
				this.add_edge_point(b.so, b.edge_key, ep_key, w_b, screen, ix.tb);

				if (!this._logged && (Topology.isTarget(a.edge_key) || Topology.isTarget(b.edge_key))) {
					const reused = existing_a?.key.startsWith('pierce:') ? `pierce-reuse(${this.pretty(existing_a.key)})` :
						existing_b?.key.startsWith('pierce:') ? `pierce-reuse(${this.pretty(existing_b.key)})` :
						existing_a ? `reuse-a(${this.pretty(existing_a.key)})` :
						existing_b ? `reuse-b(${this.pretty(existing_b.key)})` : 'new-ex';
					console.log(`[CG×F'G'] Phase4.1 crossing ${this.prettyEdge(a.so, a.edge_key)}×${this.prettyEdge(b.so, b.edge_key)} ta=${ix.ta.toFixed(3)} tb=${ix.tb.toFixed(3)} → ${this.pretty(ep_key)} (${reused})`);
				}

				// Split both crossing edges at the crossing point
				this.crossing_splits.push({ so: a.so, edge_key: a.edge_key, screen, world: w_a, ep_key, poly_edge_idx: -1 });
				this.crossing_splits.push({ so: b.so, edge_key: b.edge_key, screen, world: w_b, ep_key, poly_edge_idx: -1 });
			}
		}

		// ── Part 2: Face-polygon clipping for occluding segments ──
		// For each visible edge, clip against each behind face polygon.
		// Reuse oc/pierce endpoints from edge_points when they match the clip boundaries.
		// Create new ex endpoints and face-boundary splits when no match exists.
		for (const [so_a_id, segs] of this.edge_segments) {
			for (const seg of segs) {
				for (let ci = 0; ci < seg.visible.length; ci++) {
					const [s, e] = seg.visible[ci];
					const [sk, ek] = seg.endpoint_keys[ci];
					const ep_s = this.endpoints.get(sk);
					const ep_e = this.endpoints.get(ek);
					if (!ep_s || !ep_e) continue;

					for (let fi = 0; fi < input.occluding_faces.length; fi++) {
						const face = input.occluding_faces[fi];
						if (face.obj_id === so_a_id) continue;

						const clip = this.clip_segment_to_polygon_2d(s, e, face.poly);
						if (!clip) continue;
						const [t_enter, t_leave] = clip;

						// Depth check: edge must be in front of face
						const w_mid = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, (t_enter + t_leave) / 2);
						const dist = vec3.dot(face.n, w_mid) - face.d;
if (dist < -0.001) continue;

						const cs: Pt = { x: s.x + (e.x - s.x) * t_enter, y: s.y + (e.y - s.y) * t_enter };
						const ce: Pt = { x: s.x + (e.x - s.x) * t_leave, y: s.y + (e.y - s.y) * t_leave };
						const w_cs = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, t_enter);
						const w_ce = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, t_leave);

						// Tag endpoints — check oc_at_occluder_edge on the front edge
						// (oc/pierce endpoints registered by OTHER edges' Phase 2 clipping)
						const edge_a = `${so_a_id}:${seg.edge_key}`;
						const oc_list = this.oc_at_occluder_edge.get(edge_a);

						let cs_key: string | undefined;
						let ce_key: string | undefined;
						if (oc_list) {
							for (const sp of oc_list) {
								const t = Topology.screen_t(cs, ce, sp.screen);
								const is_pierce = sp.key.startsWith('pierce:');
								if (t > -0.01 && t < 0.01 && (!cs_key || is_pierce)) cs_key = sp.key;
								if (t > 0.99 && t < 1.01 && (!ce_key || is_pierce)) ce_key = sp.key;
							}
						}

						// Fall back: create ex endpoints and split the face boundary edges
						// Use occluding_faces array index (face index) to match old code's key format
						const face_verts = face.face_verts;
						if (!cs_key) {
							const cs_id: EndpointID = { type: T_Endpoint.cross, edgeA: edge_a, edgeB: `${face.obj_id}:face:${fi}` };
							cs_key = this.register_endpoint(cs_id, cs, w_cs);
							if (face_verts && clip[2] >= 0) {
								const vi = face_verts[clip[2]], vj = face_verts[(clip[2] + 1) % face_verts.length];
								this.crossing_splits.push({ so: face.obj_id, edge_key: `${Math.min(vi, vj)}-${Math.max(vi, vj)}`, screen: cs, world: w_cs, ep_key: cs_key, poly_edge_idx: clip[2] });
							}
						}
						if (!ce_key) {
							const ce_id: EndpointID = { type: T_Endpoint.cross, edgeA: edge_a, edgeB: `${face.obj_id}:face:${fi}:e` };
							ce_key = this.register_endpoint(ce_id, ce, w_ce);
							if (face_verts && clip[3] >= 0) {
								const vi = face_verts[clip[3]], vj = face_verts[(clip[3] + 1) % face_verts.length];
								this.crossing_splits.push({ so: face.obj_id, edge_key: `${Math.min(vi, vj)}-${Math.max(vi, vj)}`, screen: ce, world: w_ce, ep_key: ce_key, poly_edge_idx: clip[3] });
							}
						}


						if (!this._logged && Topology.isTarget(seg.edge_key)) {
								const cs_src = oc_list?.find(sp => { const t = Topology.screen_t(cs, ce, sp.screen); return t > -0.01 && t < 0.01; }) ? 'matched' : 'new-ex';
								const ce_src = oc_list?.find(sp => { const t = Topology.screen_t(cs, ce, sp.screen); return t > 0.99 && t < 1.01; }) ? 'matched' : 'new-ex';
								console.log(`[CG×F'G'] Phase4.2 ${this.prettyEdge(so_a_id, seg.edge_key)} vs ${this._names.get(face.obj_id) ?? face.obj_id}:face${face.face_index} enter=${cs_src}:${this.pretty(cs_key)} exit=${ce_src}:${this.pretty(ce_key)} face_idx=${face.face_index}`);
							}

							this.occluding_segments.push({
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

	// ─── Phase 5: Split edges at crossing/intersection exit points ───────────


	private apply_splits(): void {
		const all_splits: SplitInfo[] = [
			...this.crossing_splits,
			...this.intersection_edge_splits,
		];
		if (all_splits.length === 0) return;

		const by_edge = new Map<string, SplitInfo[]>();
		for (const sp of all_splits) {
			const key = `${sp.so}:${sp.edge_key}`;
			let list = by_edge.get(key);
			if (!list) { list = []; by_edge.set(key, list); }
			list.push(sp);
		}

		for (const [edge_full_key, splits] of by_edge) {
			const colon = edge_full_key.indexOf(':');
			const so_id = edge_full_key.slice(0, colon);
			const edge_key = edge_full_key.slice(colon + 1);
			const segs = this.edge_segments.get(so_id);
			if (!segs) continue;

			for (const seg of segs) {
				if (seg.edge_key !== edge_key) continue;

				const new_visible: [Pt, Pt][] = [];
				const new_ep_keys: [string, string][] = [];

				for (let ci = 0; ci < seg.visible.length; ci++) {
					const [s, e] = seg.visible[ci];
					const [sk, ek] = seg.endpoint_keys[ci];

					const interval_splits: { t: number; sp: SplitInfo }[] = [];
					const _isTarget = edge_key === '2-6' || edge_key === '5-6';
					for (const sp of splits) {
						const t = Topology.screen_t(s, e, sp.screen);
						if (_isTarget && !this._logged) {
							console.log(`[CG×F'G'] Phase5 ${this.prettyEdge(so_id, edge_key)}[${ci}] split t=${t.toFixed(4)} ep=${this.pretty(sp.ep_key)} ${t > 0.01 && t < 0.99 ? 'ACCEPTED' : 'REJECTED'} [${this.pretty(sk)}→${this.pretty(ek)}]`);
						}
						if (t > 0.01 && t < 0.99) {
							interval_splits.push({ t, sp });
						}
					}

					if (interval_splits.length === 0) {
						new_visible.push([s, e]);
						new_ep_keys.push([sk, ek]);
						continue;
					}

					interval_splits.sort((a, b) => a.t - b.t);

					let prev_pt = s;
					let prev_key = sk;
					for (const { t, sp } of interval_splits) {
						const split_screen: Pt = { x: s.x + (e.x - s.x) * t, y: s.y + (e.y - s.y) * t };
						new_visible.push([prev_pt, split_screen]);
						new_ep_keys.push([prev_key, sp.ep_key]);
						prev_pt = split_screen;
						prev_key = sp.ep_key;
					}
					new_visible.push([prev_pt, e]);
					new_ep_keys.push([prev_key, ek]);
				}

				seg.visible = new_visible;
				seg.endpoint_keys = new_ep_keys;
			}
		}
	}

	// ─── Pure geometry (unchanged from Render.ts) ────────────────────────────

	/** Given two face planes, compute their intersection line clipped to both quads. */
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

	/** Clip a segment against all occluding faces, returning rich clip intervals with cause info. */
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

		// Remove fake visible intervals
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

	/** 2D Cyrus-Beck: clip segment to convex polygon. Returns [t_enter, t_leave, enter_edge, leave_edge] or null. */
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

	/** Clip parameterized line to convex quad interior. Returns [t_min, t_max, enter_edge, leave_edge] or null. */
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
