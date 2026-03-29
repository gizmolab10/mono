import type { Projected, O_Scene, Dimension_Rect, Label_Rect, Angle_Rect } from '../types/Interfaces';
import { render_back_grid, render_root_bottom } from './R_Grid';
import { render_dimensions } from './R_Dimensions';
import { render_axes } from './R_Axes';
import { face_label } from '../editors/Face_Label';
import Smart_Object from '../runtime/Smart_Object';
import { T_Hit_3D } from '../types/Enumerations';
import { render_angulars } from './R_Angulars';
import { hits_3d } from '../events/Hits_3D';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { Size } from '../types/Coordinates';
import { stores } from '../managers/Stores';
import { scenes } from '../managers/Scenes';
import { debug } from '../common/Debug';
import { k } from '../common/Constants';
import { drag } from '../editors/Drag';
import { camera } from './Camera';
import { scene } from './Scene';
import { Facets, T_Endpoint, endpoint_key, /* vtx, */ type EndpointID } from './Facets';
import { Topology } from './Topology';
import Flatbush from 'flatbush';

type Pt = { x: number; y: number };
type OccFaceRef = typeof Render.prototype['occluding_faces'][number] | null;

interface ClipInterval {
	start: Pt; end: Pt;
	start_cause: OccFaceRef;  // null = original endpoint (corner)
	end_cause: OccFaceRef;    // null = original endpoint (corner)
	start_poly_edge?: number; // polygon edge index where visibility starts
	end_poly_edge?: number;   // polygon edge index where visibility ends
}

interface ComputedEdgeSeg {
	edge_key: string;
	so: string;
	visible: [Pt, Pt][];
	endpoint_keys: [string, string][];  // per visible clip: [start_key, end_key]
}

interface ComputedIntersectionSeg {
	visible: [Pt, Pt][];
	endpoint_keys: [string, string][];
	color: string;
	so_a: string;  face_a: number;  // first face
	so_b: string;  face_b: number;  // second face
	/** Which SO edge the unclipped intersection line starts/ends on. */
	start_on_edge?: { so: string; edge_key: string; t: number };
	end_on_edge?: { so: string; edge_key: string; t: number };
}

interface ComputedEndpoint {
	key: string;
	id: EndpointID;
	screen: Pt;
	world: vec3;
}

class Render {
	private static _facets_logged = false;
	private static _last_facet_log = '';
	private topology = new Topology();
	private topology_endpoints = new Map<string, { key: string; id: EndpointID; screen: { x: number; y: number }; world: vec3 }>();
	private topology_edge_segments = new Map<string, { edge_key: string; so: string; visible: [{ x: number; y: number }, { x: number; y: number }][]; endpoint_keys: [string, string][] }[]>();
	private topology_intersection_segments: { visible: [{ x: number; y: number }, { x: number; y: number }][]; endpoint_keys: [string, string][]; color: string; so_a: string; face_a: number; so_b: string; face_b: number }[] = [];
	private topology_occluding_segments: { so: string; face: number; screen: [{ x: number; y: number }, { x: number; y: number }]; endpoint_keys: [string, string] }[] = [];
	// static _clip_debug = false;
	private occluding_index: Flatbush | null = null;  /** Spatial index for screen-space face bounding boxes (rebuilt each frame). */
	/** Selection-dot occlusion: includes ALL non-root objects (visible + invisible). */
	private sel_occluding_faces: { n: vec3; d: number; corners: vec3[]; poly: { x: number; y: number }[]; obj_id: string }[] = [];
	private sel_occluding_index: Flatbush | null = null;
	ctx!: CanvasRenderingContext2D;
	private mvp_matrix = mat4.create();
	private cached_world: mat4 | null = null;  /** Last world matrix passed to project_vertex (by reference). */
	private cached_mvp = mat4.create();        /** MVP computed from cached_world — reused when world matrix hasn't changed. */
	private canvas!: HTMLCanvasElement;
	private snap: HTMLCanvasElement | null = null;
	private size: Size = Size.zero;
	private dpr = 1;

	/** Camera-view extent: rotation-aware AABB for grid/shadow rendering.
	 *  Recomputed each frame — never touches stored root bounds. */
	camera_view_extent = { x_min: 0, x_max: 0, y_min: 0, y_max: 0, z_min: 0, z_max: 0 };

	/** Per-frame dimension rects for click-to-edit. Cleared each render(). */
	dimension_rects: Dimension_Rect[] = [];

	/** Per-frame face name rects for click-to-edit. Cleared each render(). */
	face_name_rects: Label_Rect[] = [];
	angular_rects: Angle_Rect[] = [];

	/** Precomputed visible edge segments per SO (computed once, drawn by render_edges). */
	private computed_edge_segments = new Map<string, ComputedEdgeSeg[]>();

	/** Precomputed visible intersection segments (computed once, drawn by render_intersections). */
	private computed_intersection_segments: ComputedIntersectionSeg[] = [];

	/** Precomputed endpoint identities (computed once, consumed by facets). */
	private computed_endpoints = new Map<string, ComputedEndpoint>();

	/** Map from edge+occluder to face_intersection identity.
	 *  Key: "so:edge_key:occ_obj:occ_face" → array of EndpointIDs of type face_intersection.
	 *  Built during intersection compute, consumed during edge compute. */
	private intersection_clip_map = new Map<string, EndpointID[]>();

	/** Reverse map: occluder_edge → list of oc endpoint keys at that edge's crossings.
	 *  Built during edge compute (tag_endpoint), consumed by compute_occluding_edge_segments. */
	private oc_at_occluder_edge = new Map<string, { key: string; screen: Pt; world: vec3 }[]>();

	/** Fi endpoints by edge: for merging coincident fi endpoints on shared edges.
	 *  Key: "so:edge_key" → list of { key, world }. */
	private fi_on_edge = new Map<string, { key: string; world: vec3 }[]>();

	/** Split points: crossing segment endpoints that need to split a target SO's edge. */
	private crossing_splits: { so: string; edge_key: string; screen: Pt; world: vec3; ep_key: string; poly_edge_idx: number }[] = [];

	/** Split points: intersection exit endpoints that sit on a face's own edge. */
	private intersection_edge_splits: { so: string; edge_key: string; screen: Pt; world: vec3; ep_key: string }[] = [];

	/** Precomputed occluding edge segments — edges that pass in front of another SO's face. */
	private computed_occluding_segments: {
		so: string;         // SO whose face is being occluded
		face: number;       // face index being occluded
		screen: [Pt, Pt];   // clipped screen segment
		endpoint_keys: [string, string];
	}[] = [];

	/** Per-frame list of front-facing faces for occlusion: world-space normal, offset, and screen-space polygon. */
	private occluding_faces: {
		n: vec3; d: number;            // face plane in world space (n·p = d)
		corners: vec3[];               // world-space corners
		poly: { x: number; y: number }[]; // screen-space polygon
		obj_id: string;
		face_index?: number;
		face_verts?: number[];
		silhouette_edges?: boolean[]; // per polygon edge: true = silhouette (body ends), false = internal (body continues)
	}[] = [];
	/** Logical (CSS) size — for external consumers like camera init. */
	get logical_size(): Size { return this.size; }

	init(canvas: HTMLCanvasElement): void {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d')!;
		this.dpr = window.devicePixelRatio || 1;
		const w = canvas.width, h = canvas.height;
		this.size = new Size(w, h);
		this.apply_dpr(w, h);
	}

	resize(width: number, height: number): void {
		this.dpr = window.devicePixelRatio || 1;
		this.size = new Size(width, height);
		this.apply_dpr(width, height);
		camera.resize(this.size);
	}

	/** Set canvas buffer to physical pixels, CSS size to logical pixels.
	 *  Snapshots old content and paints it back offset so the buffer is never visibly blank. */
	private apply_dpr(w: number, h: number): void {
		const old_w = this.canvas.width;
		const old_h = this.canvas.height;
		const new_w = w * this.dpr;
		const new_h = h * this.dpr;

		// Snapshot current pixels before resize clears the buffer
		if (old_w > 0 && old_h > 0) {
			if (!this.snap) {
				this.snap = document.createElement('canvas');
			}
			this.snap.width = old_w;
			this.snap.height = old_h;
			this.snap.getContext('2d')!.drawImage(this.canvas, 0, 0);
		}

		// Resize buffer (clears it)
		this.canvas.width = new_w;
		this.canvas.height = new_h;
		this.canvas.style.width = w + 'px';
		this.canvas.style.height = h + 'px';

		// Paint snapshot back, centered at new size
		if (this.snap && old_w > 0 && old_h > 0) {
			const dx = (new_w - old_w) / 2;
			const dy = (new_h - old_h) / 2;
			this.ctx.drawImage(this.snap, dx, dy);
		}

		this.ctx.scale(this.dpr, this.dpr);
	}

	render(): void {
		this.ctx.clearRect(0, 0, this.size.width, this.size.height);
		this.dimension_rects = [];
		this.face_name_rects = [];
		this.angular_rects = [];
		this.cached_world = null;  // invalidate MVP cache (camera may have moved)

		const all_objects = scene.get_all();
		this.update_camera_view_extent(all_objects);
		const objects = all_objects.filter(o => o.so.visible);
		const is_2d = stores.current_view_mode() === '2d';
		const solid = stores.is_solid();

		// Projection: project ALL vertices (including hidden) for hit-test caches
		const projected_map = new Map<string, Projected[]>();
		for (const obj of all_objects) {
			const world_matrix = this.get_world_matrix(obj);
			const projected = obj.so.vertices.map((v) => this.project_vertex(v, world_matrix));
			projected_map.set(obj.id, projected);
			hits_3d.update_projected(obj.id, projected, world_matrix);
		}

		if (stores.grid_opacity() > 0) render_back_grid(this);
		if (!is_2d) render_root_bottom(this);

		// Solidify: fill front-facing faces (occlusion layer)
		// In solid mode, fill with white so rear edges are hidden.
		// Sort all front-facing faces back-to-front by average depth.
		if (solid) {
			const face_draws: { face: number[]; projected: Projected[]; z_avg: number; fi: number }[] = [];
			for (const obj of objects) {
				const projected = projected_map.get(obj.id)!;
				if (!obj.faces) continue;
				for (let fi = 0; fi < obj.faces.length; fi++) {
					const face = obj.faces[fi];
					if (this.face_winding(face, projected) >= 0) continue; // skip back-facing
					let z_sum = 0;
					for (const vi of face) z_sum += projected[vi].z;
					face_draws.push({ face, projected, z_avg: z_sum / face.length, fi });
				}
			}
			// Back-to-front: largest z (farthest) first
			face_draws.sort((a, b) => b.z_avg - a.z_avg);
			for (const { face, projected } of face_draws) {
				this.fill_face(face, projected, '#fff');
			}
		}

		// Solidify: debug face fills (non-solid mode)
		if (!solid) {
			for (const obj of objects) {
				const projected = projected_map.get(obj.id)!;
				if (!obj.faces) continue;
				// Back-facing first, then front-facing on top
				for (let fi = 0; fi < obj.faces.length; fi++) {
					if (this.face_winding(obj.faces[fi], projected) < 0) continue;
					this.draw_debug_face(obj.faces[fi], fi, projected);
				}
				for (let fi = 0; fi < obj.faces.length; fi++) {
					if (this.face_winding(obj.faces[fi], projected) >= 0) continue;
					this.draw_debug_face(obj.faces[fi], fi, projected);
				}
			}
		}

		// Build occluding face list for edge clipping (solid or 2D mode)
		this.occluding_faces = [];
		if (solid) {
			for (const obj of objects) {
				if (!obj.parent) continue;
				const projected = projected_map.get(obj.id)!;
				if (!obj.faces) continue;
				const world = this.get_world_matrix(obj);
				const verts = obj.so.vertices;
				// First pass: determine which faces are front-facing
				const front_facing = new Set<number>();
				for (let fi = 0; fi < obj.faces.length; fi++) {
					if (this.face_winding(obj.faces[fi], projected) < 0) front_facing.add(fi);
				}
				for (let fi = 0; fi < obj.faces.length; fi++) {
					if (!front_facing.has(fi)) continue;
					const face = obj.faces[fi];
					// Screen-space polygon
					const poly: { x: number; y: number }[] = [];
					let cam_behind = false;
					for (const vi of face) {
						if (projected[vi].w < 0) { cam_behind = true; break; }
						poly.push({ x: projected[vi].x, y: projected[vi].y });
					}
					if (cam_behind) continue;
					// Tag each polygon edge as silhouette or internal
					const silhouette_edges: boolean[] = [];
					for (let ei = 0; ei < face.length; ei++) {
						const vi = face[ei], vj = face[(ei + 1) % face.length];
						// Find the adjacent face sharing this edge
						let adj_front = false;
						for (let fi2 = 0; fi2 < obj.faces.length; fi2++) {
							if (fi2 === fi) continue;
							const f2 = obj.faces[fi2];
							if (f2.includes(vi) && f2.includes(vj)) {
								adj_front = front_facing.has(fi2);
								break;
							}
						}
						silhouette_edges.push(!adj_front); // silhouette if adjacent is NOT front-facing
					}
					// World-space corners and plane
					const corners: vec3[] = [];
					for (const vi of face) {
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
					this.occluding_faces.push({ n, d, corners, poly, obj_id: obj.id, face_index: fi, face_verts: face, silhouette_edges });
				}
			}
			// Build spatial index from screen-space face bounding boxes
			if (this.occluding_faces.length > 0) {
				const index = new Flatbush(this.occluding_faces.length);
				for (const face of this.occluding_faces) {
					let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
					for (const p of face.poly) {
						if (p.x < minX) minX = p.x;
						if (p.y < minY) minY = p.y;
						if (p.x > maxX) maxX = p.x;
						if (p.y > maxY) maxY = p.y;
					}
					index.add(minX, minY, maxX, maxY);
				}
				index.finish();
				this.occluding_index = index;
			} else {
				this.occluding_index = null;
			}
		}

		// Build selection-dot occlusion: ALL non-root objects (visible + invisible)
		this.sel_occluding_faces = [];
		if (solid) {
			for (const obj of all_objects) {
				if (!obj.parent) continue;
				const projected = projected_map.get(obj.id)!;
				if (!obj.faces) continue;
				const world = this.get_world_matrix(obj);
				const verts = obj.so.vertices;
				for (const face of obj.faces) {
					if (this.face_winding(face, projected) >= 0) continue;
					const poly: { x: number; y: number }[] = [];
					let cam_behind = false;
					for (const vi of face) {
						if (projected[vi].w < 0) { cam_behind = true; break; }
						poly.push({ x: projected[vi].x, y: projected[vi].y });
					}
					if (cam_behind) continue;
					const corners: vec3[] = [];
					for (const vi of face) {
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
					this.sel_occluding_faces.push({ n, d, corners, poly, obj_id: obj.id });
				}
			}
			if (this.sel_occluding_faces.length > 0) {
				const index = new Flatbush(this.sel_occluding_faces.length);
				for (const face of this.sel_occluding_faces) {
					let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
					for (const p of face.poly) {
						if (p.x < minX) minX = p.x;
						if (p.y < minY) minY = p.y;
						if (p.x > maxX) maxX = p.x;
						if (p.y > maxY) maxY = p.y;
					}
					index.add(minX, minY, maxX, maxY);
				}
				index.finish();
				this.sel_occluding_index = index;
			} else {
				this.sel_occluding_index = null;
			}
		}

		// Compute visible segments (single source of truth for edges, intersections + facets)
		if (solid) {
			this.computed_endpoints.clear();
			this.oc_at_occluder_edge.clear();
			this.intersection_edge_splits = [];
			this.fi_on_edge.clear();
			if (objects.length > 1) {
				this.compute_visible_intersection_segments(objects);
			} else {
				this.computed_intersection_segments = [];
			}
			if (!Render._facets_logged) {
				}
				this.compute_visible_edge_segments(objects, projected_map);
			if (objects.length > 1) {
				this.filter_occluded_intersection_endpoints(objects, projected_map);
				this.compute_occluding_edge_segments();
				this.apply_crossing_splits();
			} else {
				this.computed_occluding_segments = [];
			}

			// Run Topology alongside old code
			{
				const topo = this.topology.compute({
					objects, projected_map,
					occluding_faces: this.occluding_faces,
					occluding_index: this.occluding_index,
					face_winding: (f: number[], p: Projected[]) => this.face_winding(f, p),
					get_world_matrix: (o: O_Scene) => this.get_world_matrix(o),
					project_vertex: (v: vec3, w: mat4) => this.project_vertex(v, w),
					front_face_edges: (o: O_Scene, p: Projected[]) => this.front_face_edges(o, p),
				});
				// Store Topology output for Facets
				this.topology_endpoints = topo.endpoints;
				this.topology_edge_segments = topo.edge_segments;
				this.topology_intersection_segments = topo.intersection_segments;
				this.topology_occluding_segments = topo.occluding_segments;
				// Diff logging (once)
				if (!Render._facets_logged) {
					const old_keys = new Set(this.computed_endpoints.keys());
					const new_keys = new Set(topo.endpoints.keys());
					const only_old = [...old_keys].filter(k => !new_keys.has(k));
					const only_new = [...new_keys].filter(k => !old_keys.has(k));
					console.log(`PIPELINE DIFF: endpoints old=${old_keys.size} new=${new_keys.size} only_old=${only_old.length} only_new=${only_new.length}`);
					if (only_old.length > 0) console.log(`  only in old:`, only_old);
					if (only_new.length > 0) console.log(`  only in new:`, only_new);
					let old_edge_count = 0, new_edge_count = 0;
					for (const [, segs] of this.computed_edge_segments) for (const seg of segs) old_edge_count += seg.visible.length;
					for (const [, segs] of topo.edge_segments) for (const seg of segs) new_edge_count += seg.visible.length;
					console.log(`PIPELINE DIFF: edge clips old=${old_edge_count} new=${new_edge_count}`);
					console.log(`PIPELINE DIFF: intersections old=${this.computed_intersection_segments.reduce((n, s) => n + s.endpoint_keys.length, 0)} new=${topo.intersection_segments.reduce((n, s) => n + s.endpoint_keys.length, 0)}`);
					console.log(`PIPELINE DIFF: crossings old=${this.computed_occluding_segments.length} new=${topo.occluding_segments.length}`);
				}
			}
		}

		// Facets: build graph, trace polys, paint
		let _facets_ref: Facets | null = null;
		let _facets_so_id = '';
		let _facets_face_polys: Map<number, { x: number; y: number }[]> | null = null;
		let _facets_traced: import('./Facets').Facet[] = [];
		if (k.debug && solid) {
			// Reset stale log flags so fresh output appears after code changes
			if (!Render._facets_logged) {
				Facets._trace_logged = false;
				Facets._occlusion_logged = false;
			}
			const use_topology_facets = true;  // flip to false for old code facets
			const facets = new Facets();
			facets.ingest_precomputed(
				use_topology_facets ? this.topology_endpoints : this.computed_endpoints,
				use_topology_facets ? this.topology_edge_segments : this.computed_edge_segments,
				use_topology_facets ? this.topology_intersection_segments : this.computed_intersection_segments,
				use_topology_facets ? this.topology_occluding_segments : this.computed_occluding_segments,
				objects, projected_map,
				(face, proj) => this.face_winding(face, proj),
			);
			facets.compute_cyclic_ordering(
				objects, projected_map,
				(obj) => this.get_world_matrix(obj),
				(face, proj) => this.face_winding(face, proj),
			);
			const sel_so = hits_3d.selection?.so ?? null;
			const sel_scene = sel_so?.scene ?? null;
			const traced = facets.trace_facets(sel_scene?.id, undefined, objects);
			_facets_traced = traced;

			// Paint facets for selected SO
			if (sel_scene?.faces) {
				const sel_projected = projected_map.get(sel_scene.id)!;
				const face_screen_polys = new Map<number, { x: number; y: number }[]>();
				for (let fi = 0; fi < sel_scene.faces.length; fi++) {
					if (this.face_winding(sel_scene.faces[fi], sel_projected) >= 0) continue;
					face_screen_polys.set(fi, sel_scene.faces[fi].map(vi => ({ x: sel_projected[vi].x, y: sel_projected[vi].y })));
				}
				const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ccc';
				facets.paint_facets(traced, this.ctx, accent, sel_scene.id, face_screen_polys);
				_facets_ref = facets;
				_facets_so_id = sel_scene.id;
				_facets_face_polys = face_screen_polys;
			}
		}

		// Intersection lines: draw from precomputed data
		this.render_intersections();

		// Edges: draw edges (root: bottom face only)
		for (const obj of objects) {
			const projected = projected_map.get(obj.id)!;
			const world = (solid) ? this.get_world_matrix(obj) : undefined;
			const bottom_only = !obj.parent && !is_2d;
			this.render_edges(obj, projected, solid, world, bottom_only ? 0 : undefined);
			if (stores.show_names()) this.render_face_names(obj, projected, world);
		}

		// Facets debug labels — after all lines so backgrounds aren't covered
		if (_facets_ref && _facets_face_polys) {
			const sel_scene = _facets_so_id ? objects.find(o => o.id === _facets_so_id) : undefined;
			const sel_projected = _facets_so_id ? projected_map.get(_facets_so_id) : undefined;
			let visible_verts: Set<number> | undefined;
			if (sel_scene && sel_projected) {
				visible_verts = new Set<number>();
				const fe = this.front_face_edges(sel_scene, sel_projected);
				const world = this.get_world_matrix(sel_scene);
				const verts = sel_scene.so.vertices;
				for (const ek of fe) {
					const [a, b] = ek.split('-').map(Number);
					visible_verts.add(a);
					visible_verts.add(b);
				}
				// Remove occluded vertices
				for (const vi of [...visible_verts]) {
					const p = sel_projected[vi];
					const lv = verts[vi];
					const wv = vec4.create();
					vec4.transformMat4(wv, [lv[0], lv[1], lv[2], 1], world);
					const w_pt: vec3 = [wv[0], wv[1], wv[2]];
					const candidates = this.occluding_index
						? this.occluding_index.search(p.x, p.y, p.x, p.y)
						: this.occluding_faces.map((_, i) => i);
					for (const fi of candidates) {
						const occ = this.occluding_faces[fi];
						if (occ.obj_id === _facets_so_id) continue;
						const dist = vec3.dot(occ.n, w_pt) - occ.d;
						if (dist > -k.coplanar_epsilon) continue;
						if (this.point_in_polygon_2d(p.x, p.y, occ.poly)) {
							visible_verts.delete(vi);
							break;
						}
					}
				}
			}
			_facets_ref.paint_labels(this.ctx, _facets_so_id, sel_projected, visible_verts,
				this.occluding_faces, this.occluding_index,
				(px, py, poly) => this.point_in_polygon_2d(px, py, poly));

			// Log facet paths using display labels — only when they change
			const facets_ref = _facets_ref;
			const path_str = facets_ref
				? _facets_traced.map(f => {
					const labels = f.endpoints.map(k => facets_ref.endpoints.get(k)?.label ?? '?');
					labels.push(labels[0]);
					return labels.join('→');
				}).join(' | ')
				: '';
			if (path_str !== Render._last_facet_log || !Render._facets_logged) {
				Render._last_facet_log = path_str;
				console.log(`facets: ${path_str || '(none)'}`);
			}
			Render._facets_logged = true;
		}

		// 2D: camera_view_extent front-face outline (after edges so it renders on top of white fill)
		if (is_2d) render_root_bottom(this, true);

		// 3D wireframe for invisible SOs (occluded by visible children in solid/2D)
		for (const obj of all_objects) {
			if (obj.so.visible) continue;
			const projected = projected_map.get(obj.id)!;
			const world = (solid) ? this.get_world_matrix(obj) : undefined;
			const root_bottom = (!obj.parent && !is_2d) ? this.face_edge_keys(obj, 0) : null;
			this.ctx.save();
			this.ctx.setLineDash([1, 1]);
			this.ctx.strokeStyle = 'rgba(128, 128, 128, 1)';
			this.ctx.globalAlpha = stores.grid_opacity();
			this.ctx.lineWidth = 0.5;
			for (const [i, j] of obj.edges) {
				if (root_bottom && !root_bottom.has(`${Math.min(i, j)}-${Math.max(i, j)}`)) continue;
				const a = projected[i], b = projected[j];
				if (a.w < 0 || b.w < 0) continue;
				if (world) {
					const vi = obj.so.vertices[i], vj = obj.so.vertices[j];
					const wi = vec4.create(), wj = vec4.create();
					vec4.transformMat4(wi, [vi[0], vi[1], vi[2], 1], world);
					vec4.transformMat4(wj, [vj[0], vj[1], vj[2], 1], world);
					const segments = this.clip_segment_for_occlusion(
						{ x: a.x, y: a.y }, { x: b.x, y: b.y },
						vec3.fromValues(wi[0], wi[1], wi[2]), vec3.fromValues(wj[0], wj[1], wj[2]), obj.id
					);
					for (const [s, e] of segments) {
						this.ctx.beginPath();
						this.ctx.moveTo(s.x, s.y);
						this.ctx.lineTo(e.x, e.y);
						this.ctx.stroke();
					}
				} else {
					this.ctx.beginPath();
					this.ctx.moveTo(a.x, a.y);
					this.ctx.lineTo(b.x, b.y);
					this.ctx.stroke();
				}
			}
			this.ctx.restore();
		}

		if (stores.grid_opacity() > 0) {
			render_axes(this);
		}
		this.render_hover();
		this.render_selection();
		if (stores.show_dimensionals()) render_dimensions(this);
		if (stores.show_angulars()) render_angulars(this);
		if (debug.enabled) this.render_front_face_label();
	}

	/** Recompute camera-view extent from world coordinates + rotation projections.
	 *  Pure read — never touches stored bounds. */
	private update_camera_view_extent(all: O_Scene[]): void {
		const root_obj = all.find(o => !o.parent);
		if (!root_obj) return;
		const root = root_obj.so;

		let min_x = Math.min(root.x_min, root.x_max), max_x = Math.max(root.x_min, root.x_max);
		let min_y = Math.min(root.y_min, root.y_max), max_y = Math.max(root.y_min, root.y_max);
		let min_z = Math.min(root.z_min, root.z_max), max_z = Math.max(root.z_min, root.z_max);

		const children = all.filter(o => o.parent === root_obj);

		// Expand for all descendants (world-coordinate bounds).
		// Uses Math.min/max to handle potentially inverted bounds (matches Smart_Object.vertices).
		for (const obj of all) {
			if (!obj.parent) continue;
			const so = obj.so;
			const xLo = Math.min(so.x_min, so.x_max), xHi = Math.max(so.x_min, so.x_max);
			const yLo = Math.min(so.y_min, so.y_max), yHi = Math.max(so.y_min, so.y_max);
			const zLo = Math.min(so.z_min, so.z_max), zHi = Math.max(so.z_min, so.z_max);
			if (xLo < min_x) min_x = xLo; if (xHi > max_x) max_x = xHi;
			if (yLo < min_y) min_y = yLo; if (yHi > max_y) max_y = yHi;
			if (zLo < min_z) min_z = zLo; if (zHi > max_z) max_z = zHi;
		}

		// Expand for rotated direct children's projected AABB
		for (const child of children) {
			const so = child.so;
			const q = so.orientation;
			if (Math.abs(q[3]) >= 1 - 1e-6) continue;

			let sx0 = Math.min(so.x_min, so.x_max), sx1 = Math.max(so.x_min, so.x_max);
			let sy0 = Math.min(so.y_min, so.y_max), sy1 = Math.max(so.y_min, so.y_max);
			let sz0 = Math.min(so.z_min, so.z_max), sz1 = Math.max(so.z_min, so.z_max);
			const collect_sub = (parent: O_Scene) => {
				for (const obj of all) {
					if (obj.parent === parent) {
						const s = obj.so;
						const xl = Math.min(s.x_min, s.x_max), xh = Math.max(s.x_min, s.x_max);
						const yl = Math.min(s.y_min, s.y_max), yh = Math.max(s.y_min, s.y_max);
						const zl = Math.min(s.z_min, s.z_max), zh = Math.max(s.z_min, s.z_max);
						if (xl < sx0) sx0 = xl; if (xh > sx1) sx1 = xh;
						if (yl < sy0) sy0 = yl; if (yh > sy1) sy1 = yh;
						if (zl < sz0) sz0 = zl; if (zh > sz1) sz1 = zh;
						collect_sub(obj);
					}
				}
			};
			collect_sub(child);

			const cx = (so.x_min + so.x_max) / 2;
			const cy = (so.y_min + so.y_max) / 2;
			const cz = (so.z_min + so.z_max) / 2;

			for (let i = 0; i < 8; i++) {
				const vx = (i & 4) ? sx1 : sx0;
				const vy = (i & 2) ? sy1 : sy0;
				const vz = (i & 1) ? sz1 : sz0;
				const rv = vec3.fromValues(vx - cx, vy - cy, vz - cz);
				vec3.transformQuat(rv, rv, q);
				const px = cx + rv[0], py = cy + rv[1], pz = cz + rv[2];
				if (px < min_x) min_x = px; if (px > max_x) max_x = px;
				if (py < min_y) min_y = py; if (py > max_y) max_y = py;
				if (pz < min_z) min_z = pz; if (pz > max_z) max_z = pz;
			}
		}

		this.camera_view_extent = { x_min: min_x, x_max: max_x, y_min: min_y, y_max: max_y, z_min: min_z, z_max: max_z };

	}

	get_world_matrix(obj: O_Scene): mat4 {
		const so = obj.so;
		const center: vec3 = [
			(so.x_min + so.x_max) / 2,
			(so.y_min + so.y_max) / 2,
			(so.z_min + so.z_max) / 2,
		];
		// Root: tumble only (from store). Child: so.orientation (tumble inherited via parent).
		const orientation = obj.parent ? so.orientation : stores.current_orientation();

		// Move SO center to origin, rotate, then:
		//   Root: scale + position (center stays at origin for screen centering)
		//   Child: translate back (rotate around own center in parent space)
		const local = mat4.create();
		mat4.fromTranslation(local, [-center[0], -center[1], -center[2]]);
		const rot = mat4.create();
		mat4.fromQuat(rot, orientation);
		mat4.multiply(local, rot, local);

		if (obj.parent) {
			// Child: uncenter so rotation is around own center within parent space
			const from_center = mat4.create();
			mat4.fromTranslation(from_center, center);
			mat4.multiply(local, from_center, local);
		} else {
			// Root: keep center at origin → scale around origin → position (for pan)
			const s = stores.current_scale();
			const scale_mat = mat4.create();
			mat4.fromScaling(scale_mat, [s, s, s]);
			mat4.multiply(local, scale_mat, local);
		}

		const pos_mat = mat4.create();
		mat4.fromTranslation(pos_mat, obj.position);
		mat4.multiply(local, pos_mat, local);

		if (obj.parent) {
			const parent_world = this.get_world_matrix(obj.parent);
			mat4.multiply(local, parent_world, local);
		}

		return local;
	}

	project_vertex(v: vec3, world_matrix: mat4): Projected {
		const point = vec4.fromValues(v[0], v[1], v[2], 1);

		if (world_matrix !== this.cached_world) {
			mat4.multiply(this.mvp_matrix, camera.view, world_matrix);
			mat4.multiply(this.mvp_matrix, camera.projection, this.mvp_matrix);
			mat4.copy(this.cached_mvp, this.mvp_matrix);
			this.cached_world = world_matrix;
		}

		vec4.transformMat4(point, point, this.cached_mvp);
		const w = point[3];
		return {
			x: (point[0] / w + 1) * 0.5 * this.size.width,
			y: (1 - point[1] / w) * 0.5 * this.size.height,
			z: point[2] / w,
			w,
		};
	}

	// Debug face colors: primary + secondary at 50% saturation
	// Face indices: 0=bottom(z_min), 1=top(z_max), 2=left(x_min), 3=right(x_max), 4=front(y_max), 5=back(y_min)
	private readonly FACE_RGB = [
		[191, 64, 64],    // 0: bottom - red (50% sat)
		[64, 191, 64],    // 1: top - green
		[64, 64, 191],    // 2: left - blue
		[191, 191, 64],   // 3: right - yellow
		[64, 191, 191],   // 4: front - cyan
		[191, 64, 191],   // 5: back - magenta
	];

	private fill_face(face: number[], projected: Projected[], color: string): void {
		this.ctx.fillStyle = color;
		this.ctx.beginPath();
		this.ctx.moveTo(projected[face[0]].x, projected[face[0]].y);
		for (let i = 1; i < face.length; i++) {
			this.ctx.lineTo(projected[face[i]].x, projected[face[i]].y);
		}
		this.ctx.closePath();
		this.ctx.fill();
	}

	/** Register an endpoint in computed_endpoints, return its key. */
	private register_endpoint(id: EndpointID, screen: Pt, world: vec3): string {
		const key = endpoint_key(id);
		if (!this.computed_endpoints.has(key)) {
			this.computed_endpoints.set(key, { key, id, screen, world });
		}
		return key;
	}

	/** Compute t along screen segment a→b for point p. */
	private static screen_t(a: Pt, b: Pt, p: Pt): number {
		const dx = b.x - a.x, dy = b.y - a.y;
		const len_sq = dx * dx + dy * dy;
		if (len_sq < 1e-10) return 0;
		return ((p.x - a.x) * dx + (p.y - a.y) * dy) / len_sq;
	}

	/** Compute visible edge segments for all objects (clip for occlusion once, store results). */
	private compute_visible_edge_segments(objects: O_Scene[], projected_map: Map<string, Projected[]>): void {
		this.computed_edge_segments.clear();
		const CORNER_T = 0.01;  // t threshold for corner detection

		for (const obj of objects) {
			const projected = projected_map.get(obj.id)!;
			const world = this.get_world_matrix(obj);
			const front_edges = this.front_face_edges(obj, projected);
			const segments: ComputedEdgeSeg[] = [];

			for (const [i, j] of obj.edges) {
				const a = projected[i], b = projected[j];
				if (a.w < 0 || b.w < 0) continue;
				const ek = `${Math.min(i, j)}-${Math.max(i, j)}`;
				if (!front_edges.has(ek)) continue;

				const vi = obj.so.vertices[i], vj = obj.so.vertices[j];
				const wi = vec4.create(), wj = vec4.create();
				vec4.transformMat4(wi, [vi[0], vi[1], vi[2], 1], world);
				vec4.transformMat4(wj, [vj[0], vj[1], vj[2], 1], world);
				const w1 = vec3.fromValues(wi[0], wi[1], wi[2]);
				const w2 = vec3.fromValues(wj[0], wj[1], wj[2]);

				let clips = this.clip_segment_for_occlusion_rich(
					{ x: a.x, y: a.y }, { x: b.x, y: b.y }, w1, w2, obj.id
				);

				// Merge nearly-touching intervals (micro-gaps between two intersection exits)
				if (clips.length > 1) {
					const GAP_T = 0.02;
					const merged: ClipInterval[] = [clips[0]];
					for (let ci = 1; ci < clips.length; ci++) {
						const prev_t = Render.screen_t(a, b, merged[merged.length - 1].end);
						const cur_t = Render.screen_t(a, b, clips[ci].start);
						if (Math.abs(cur_t - prev_t) < GAP_T) {
							// Merge: extend previous interval to cover current
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


	
					// Helper: tag an endpoint from t value and clip cause
					// is_start_of_visible: determines clip direction for clip-map lookup
					const tag_endpoint = (t: number, screen: Pt, cause: OccFaceRef, is_start_of_visible: boolean, poly_edge_idx?: number): string => {
	
						const w = vec3.lerp(vec3.create(), w1, w2, Math.max(0, Math.min(1, t)));
						let id: EndpointID;
						if (!cause && t < CORNER_T) {
							id = { type: T_Endpoint.corner, so: obj.id, vertex: i };
						} else if (!cause && t > 1 - CORNER_T) {
							id = { type: T_Endpoint.corner, so: obj.id, vertex: j };
						} else if (cause) {
							const clip_key = `${obj.id}:${ek}:${cause.obj_id}:${cause.face_index ?? -1}`;
							const fi_list = this.intersection_clip_map.get(clip_key);
							let fi_id: EndpointID | undefined;
							if (fi_list && fi_list.length === 1) {
								fi_id = fi_list[0];
							} else if (fi_list && fi_list.length > 1) {
								// Multiple fi endpoints on same edge+face — pick closest by world position
								let best_dist = Infinity;
								for (const candidate of fi_list) {
									if (candidate.type !== T_Endpoint.face_intersection) continue;
									const ckey = endpoint_key(candidate);
									if (used_fi_keys.has(ckey)) continue;
									const cep = this.computed_endpoints.get(ckey);
									if (!cep) continue;
									const d = vec3.distance(w, cep.world);
									if (d < best_dist) {
										best_dist = d;
										fi_id = candidate;
									}
								}
							}
							const occ_edge = (poly_edge_idx != null && poly_edge_idx >= 0 && cause.face_verts)
							? (() => { const vi = cause.face_verts![poly_edge_idx]; const vj = cause.face_verts![(poly_edge_idx + 1) % cause.face_verts!.length]; return `${cause.obj_id}:${Math.min(vi, vj)}-${Math.max(vi, vj)}`; })()
							: undefined;
							// Don't reuse the same fi key twice on the same edge
							if (fi_id) {
								const fi_key_check = endpoint_key(fi_id);
								if (used_fi_keys.has(fi_key_check)) fi_id = undefined;
								else used_fi_keys.add(fi_key_check);
							}
							id = fi_id ?? { type: T_Endpoint.occlusion_clip, edge: edge_id, occluder_face: `${cause.obj_id}:${cause.face_index ?? -1}`, end: is_start_of_visible ? 'exit' : 'enter', occluder_edge: occ_edge };
							const ep_key = this.register_endpoint(id, screen, w);
							// Register reverse mapping: occluder_edge → this oc endpoint
							if (occ_edge) {
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
						return this.register_endpoint(id, screen, w);
					};

					const used_fi_keys = new Set<string>();
					for (const ci of clips) {

						const t_s = Render.screen_t(a, b, ci.start);
						const t_e = Render.screen_t(a, b, ci.end);

						const sk = tag_endpoint(t_s, ci.start, ci.start_cause, true, ci.start_poly_edge);
						const ek2 = tag_endpoint(t_e, ci.end, ci.end_cause, false, ci.end_poly_edge);
						vis.push([ci.start, ci.end]);
						ep_keys.push([sk, ek2]);
					}

					segments.push({ edge_key: ek, so: obj.id, visible: vis, endpoint_keys: ep_keys });
				}
			}
			// EDGE debug logging — commented out
			// if (!Render._facets_logged) { ... }
			this.computed_edge_segments.set(obj.id, segments);
		}

	}

	/** Compute visible intersection segments for all SO pairs (clip for occlusion once, store results). */
	private compute_visible_intersection_segments(objects: O_Scene[]): void {
		this.computed_intersection_segments = [];
		this.intersection_clip_map.clear();
		// Build world-space face data for each object
		type WFace = { n: vec3; d: number; corners: vec3[]; fi: number; obj: O_Scene };
		const obj_faces: WFace[][] = [];

		for (const obj of objects) {
			const world = this.get_world_matrix(obj);
			const faces: WFace[] = [];
			const verts = obj.so.vertices;
			const face_indices = obj.faces;
			if (!face_indices) { obj_faces.push([]); continue; }

			for (let fi = 0; fi < face_indices.length; fi++) {
				// Only use faces that are in the occluding_faces list (front-facing)
				if (!this.occluding_faces.some(f => f.obj_id === obj.id && f.face_index === fi)) continue;
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
						const geom = this.intersect_face_pair(null, fA, fB, '');
						if (!geom) continue;

						const identity = mat4.create();
						const s1 = this.project_vertex(geom.start, identity);
						const s2 = this.project_vertex(geom.end, identity);
						if (s1.w < 0 || s2.w < 0) continue;

						const p1: Pt = { x: s1.x, y: s1.y };
						const p2: Pt = { x: s2.x, y: s2.y };
						const clips = this.clip_segment_for_occlusion_rich(
							p1, p2, geom.start, geom.end, [fA.obj.id, fB.obj.id], [fA, fB]
						);
						if (clips.length === 0) continue;
						const visible: [Pt, Pt][] = clips.map(ci => [ci.start, ci.end]);

						const face_key_a = `${fA.obj.id}:${fA.fi}`;
						const face_key_b = `${fB.obj.id}:${fB.fi}`;
						const ix_edge_id = `ix:${face_key_a}:${face_key_b}`;

						// Check if geometric start/end are at corner vertices
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

						// Compute edge info early for fi coincidence checks
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

						// Find coincident fi on a shared edge — reuse existing key if another
						// intersection already registered an fi at the same world position
						const find_coincident_fi = (world_pt: vec3, ei: typeof se): string | null => {
							const edge_full = `${ei.so}:${ei.edge_key}`;
							const list = this.fi_on_edge.get(edge_full);
							if (!list) return null;
							for (const entry of list) {
								if (vec3.distance(entry.world, world_pt) < 1e-4) return entry.key;
							}
							return null;
						};
						const register_fi_on_edge = (key: string, world_pt: vec3, ei: typeof se) => {
							const edge_full = `${ei.so}:${ei.edge_key}`;
							let list = this.fi_on_edge.get(edge_full);
							if (!list) { list = []; this.fi_on_edge.set(edge_full, list); }
							if (!list.some(e => e.key === key)) {
								list.push({ key, world: world_pt });
							}
						};

						// Build graph segments from visible clip intervals only
						const ep_keys: [string, string][] = [];
						for (const ci of clips) {
							// Tag start: corner if at vertex, face_intersection if at geometric boundary, occlusion_clip if clipped
							let s_id: EndpointID;
							if (!ci.start_cause && start_corner) {
								s_id = start_corner;
							} else if (!ci.start_cause) {
								// Check if a coincident fi already exists on this edge
								const existing = find_coincident_fi(geom.start, se);
								if (existing) {
									s_id = this.computed_endpoints.get(existing)!.id;
								} else {
									s_id = { type: T_Endpoint.face_intersection, faceA: face_key_a, faceB: face_key_b, end: 'start' };
								}
							} else {
								const occ_id = `${ci.start_cause.obj_id}:${ci.start_cause.face_index ?? -1}`;
								const occ_edge_s = (ci.start_poly_edge != null && ci.start_poly_edge >= 0 && ci.start_cause.face_verts)
									? (() => { const pe = ci.start_poly_edge!; const vi = ci.start_cause.face_verts![pe]; const vj = ci.start_cause.face_verts![(pe + 1) % ci.start_cause.face_verts!.length]; return `${ci.start_cause.obj_id}:${Math.min(vi, vj)}-${Math.max(vi, vj)}`; })()
									: undefined;
								s_id = { type: T_Endpoint.occlusion_clip, edge: ix_edge_id, occluder_face: occ_id, end: 'exit', occluder_edge: occ_edge_s };
							}
							const t_s = Render.screen_t(p1, p2, ci.start);
							const w_s = vec3.lerp(vec3.create(), geom.start, geom.end, Math.max(0, Math.min(1, t_s)));
							const s_key = this.register_endpoint(s_id, ci.start, w_s);
							// Register fi on edge for coincidence merging
							if (s_id.type === T_Endpoint.face_intersection) register_fi_on_edge(s_key, w_s, se);
							// Register reverse mapping, edge split, and same-SO crossing data for intersection oc endpoints
							if (s_id.type === T_Endpoint.occlusion_clip && s_id.occluder_edge) {
								let list = this.oc_at_occluder_edge.get(s_id.occluder_edge);
								if (!list) { list = []; this.oc_at_occluder_edge.set(s_id.occluder_edge, list); }
								if (!list.some(e => e.key === s_key)) {
									list.push({ key: s_key, screen: ci.start, world: w_s });
								}
								// Split the occluder's face edge at this point
								const colon = s_id.occluder_edge.indexOf(':');
								this.intersection_edge_splits.push({ so: s_id.occluder_edge.slice(0, colon), edge_key: s_id.occluder_edge.slice(colon + 1), screen: ci.start, world: w_s, ep_key: s_key });
							}

							// Tag end: corner if at vertex, face_intersection if at geometric boundary, occlusion_clip if clipped
							let e_id: EndpointID;
							if (!ci.end_cause && end_corner) {
								e_id = end_corner;
							} else if (!ci.end_cause) {
								const existing_e = find_coincident_fi(geom.end, ee);
								if (existing_e) {
									e_id = this.computed_endpoints.get(existing_e)!.id;
								} else {
									e_id = { type: T_Endpoint.face_intersection, faceA: face_key_a, faceB: face_key_b, end: 'end' };
								}
							} else {
								const occ_id = `${ci.end_cause.obj_id}:${ci.end_cause.face_index ?? -1}`;
								const occ_edge_e = (ci.end_poly_edge != null && ci.end_poly_edge >= 0 && ci.end_cause.face_verts)
									? (() => { const pe = ci.end_poly_edge!; const vi = ci.end_cause.face_verts![pe]; const vj = ci.end_cause.face_verts![(pe + 1) % ci.end_cause.face_verts!.length]; return `${ci.end_cause.obj_id}:${Math.min(vi, vj)}-${Math.max(vi, vj)}`; })()
									: undefined;
								e_id = { type: T_Endpoint.occlusion_clip, edge: ix_edge_id, occluder_face: occ_id, end: 'enter', occluder_edge: occ_edge_e };
							}
							const t_e = Render.screen_t(p1, p2, ci.end);
							const w_e = vec3.lerp(vec3.create(), geom.start, geom.end, Math.max(0, Math.min(1, t_e)));
							const e_key = this.register_endpoint(e_id, ci.end, w_e);
							// Register fi on edge for coincidence merging
							if (e_id.type === T_Endpoint.face_intersection) register_fi_on_edge(e_key, w_e, ee);
							// Register reverse mapping, edge split, and same-SO crossing data for intersection oc endpoints
							if (e_id.type === T_Endpoint.occlusion_clip && e_id.occluder_edge) {
								let list = this.oc_at_occluder_edge.get(e_id.occluder_edge);
								if (!list) { list = []; this.oc_at_occluder_edge.set(e_id.occluder_edge, list); }
								if (!list.some(e => e.key === e_key)) {
									list.push({ key: e_key, screen: ci.end, world: w_e });
								}
								// Split the occluder's face edge at this point
								const colon = e_id.occluder_edge.indexOf(':');
								this.intersection_edge_splits.push({ so: e_id.occluder_edge.slice(0, colon), edge_key: e_id.occluder_edge.slice(colon + 1), screen: ci.end, world: w_e, ep_key: e_key });
							}

							ep_keys.push([s_key, e_key]);
						}

						{
						// Use actual registered keys for clip_map
						const first_s_key = ep_keys.length > 0 ? ep_keys[0][0] : null;
						const last_e_key = ep_keys.length > 0 ? ep_keys[ep_keys.length - 1][1] : null;
						const first_s_id = first_s_key ? this.computed_endpoints.get(first_s_key)?.id : null;
						const last_e_id = last_e_key ? this.computed_endpoints.get(last_e_key)?.id : null;

						// Register intersection exits — only for face_intersection or corner identities
						// Occlusion clips on intersection lines are NOT edge exit points
						const is_edge_exit = (id: EndpointID | null) =>
							id?.type === T_Endpoint.face_intersection || id?.type === T_Endpoint.corner;

						const add_clip = (key: string, id: EndpointID) => {
							let list = this.intersection_clip_map.get(key);
							if (!list) { list = []; this.intersection_clip_map.set(key, list); }
							list.push(id);
						};
						if (first_s_key && first_s_id && is_edge_exit(first_s_id)) {
							const other_face = geom.start_edge.face === 'A' ? fB : fA;
							add_clip(`${se.so}:${se.edge_key}:${other_face.obj.id}:${other_face.fi}`, first_s_id);
							// Register fi/corner endpoint in reverse map so crossing segments can reuse it
							const se_full = `${se.so}:${se.edge_key}`;
							let se_list = this.oc_at_occluder_edge.get(se_full);
							if (!se_list) { se_list = []; this.oc_at_occluder_edge.set(se_full, se_list); }
							const se_ep = this.computed_endpoints.get(first_s_key)!;
							if (!se_list.some(e => e.key === first_s_key)) {
								se_list.push({ key: first_s_key, screen: se_ep.screen, world: se_ep.world });
							}
							// Split the edge this fi endpoint sits on
							if (first_s_id.type === T_Endpoint.face_intersection) {
								this.intersection_edge_splits.push({ so: se.so, edge_key: se.edge_key, screen: se_ep.screen, world: se_ep.world, ep_key: first_s_key });
							}
						}
						if (last_e_key && last_e_id && is_edge_exit(last_e_id)) {
							const other_face = geom.end_edge.face === 'A' ? fB : fA;
							add_clip(`${ee.so}:${ee.edge_key}:${other_face.obj.id}:${other_face.fi}`, last_e_id);
							// Register fi/corner endpoint in reverse map so crossing segments can reuse it
							const ee_full = `${ee.so}:${ee.edge_key}`;
							let ee_list = this.oc_at_occluder_edge.get(ee_full);
							if (!ee_list) { ee_list = []; this.oc_at_occluder_edge.set(ee_full, ee_list); }
							const ee_ep = this.computed_endpoints.get(last_e_key)!;
							if (!ee_list.some(e => e.key === last_e_key)) {
								ee_list.push({ key: last_e_key, screen: ee_ep.screen, world: ee_ep.world });
							}
							// Split the edge this fi endpoint sits on
							if (last_e_id.type === T_Endpoint.face_intersection) {
								this.intersection_edge_splits.push({ so: ee.so, edge_key: ee.edge_key, screen: ee_ep.screen, world: ee_ep.world, ep_key: last_e_key });
							}
						}

						this.computed_intersection_segments.push({
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


	/** Remove intersection endpoints that fall on occluded portions of edges.
	 *  An intersection line exits a face at an edge. If that edge is occluded at that point,
	 *  the other SO is behind something there, and the intersection endpoint is phantom. */
	private filter_occluded_intersection_endpoints(objects: O_Scene[], projected_map: Map<string, Projected[]>): void {
		// For a given SO face, check if screen point falls on an occluded portion of any visible edge
		const is_occluded_on_face = (so_id: string, face_idx: number, screen: Pt): boolean => {
			const obj = objects.find(o => o.id === so_id);
			if (!obj?.faces) return false;
			const face_verts = obj.faces[face_idx];
			const projected = projected_map.get(so_id);
			if (!projected) return false;
			const edge_segs = this.computed_edge_segments.get(so_id);
			if (!edge_segs) return false;

			for (let i = 0; i < face_verts.length; i++) {
				const vi = face_verts[i], vj = face_verts[(i + 1) % face_verts.length];
				const ek = `${Math.min(vi, vj)}-${Math.max(vi, vj)}`;
				const seg = edge_segs.find(s => s.edge_key === ek);
				if (!seg) continue;

				const a = projected[vi], b = projected[vj];

				// Perpendicular distance from point to edge line
				const ex = b.x - a.x, ey = b.y - a.y;
				const edge_len = Math.sqrt(ex * ex + ey * ey);
				if (edge_len < 1e-6) continue;
				const perp = Math.abs((screen.x - a.x) * ey - (screen.y - a.y) * ex) / edge_len;
				if (perp > 5) continue;

				// Check if screen point falls in a visible interval
				const pt_t = Render.screen_t(a, b, screen);
				let in_visible = false;
				for (const [vs, ve] of seg.visible) {
					const t_s = Render.screen_t(a, b, vs);
					const t_e = Render.screen_t(a, b, ve);
					const t_min = Math.min(t_s, t_e);
					const t_max = Math.max(t_s, t_e);
					if (pt_t >= t_min - 0.01 && pt_t <= t_max + 0.01) { in_visible = true; break; }
				}
				if (!in_visible) return true; // on this edge, in an occluded gap
			}
			return false;
		};

		// Build set of keys referenced by edge segments — these are at pierce points
		const edge_referenced = new Set<string>();
		for (const [, segs] of this.computed_edge_segments) {
			for (const seg of segs) {
				for (const [sk, ek] of seg.endpoint_keys) {
					edge_referenced.add(sk);
					edge_referenced.add(ek);
				}
			}
		}

		// Check intersection endpoints — don't delete if referenced by an edge segment
		for (const iseg of this.computed_intersection_segments) {
			if (iseg.endpoint_keys.length === 0) continue;

			const checks: [string, string, number][] = [
				[iseg.endpoint_keys[0][0], iseg.so_b, iseg.face_b],
				[iseg.endpoint_keys[0][0], iseg.so_a, iseg.face_a],
				[iseg.endpoint_keys[iseg.endpoint_keys.length - 1][1], iseg.so_b, iseg.face_b],
				[iseg.endpoint_keys[iseg.endpoint_keys.length - 1][1], iseg.so_a, iseg.face_a],
			];

			for (const [ep_key, so_id, face_idx] of checks) {
				if (edge_referenced.has(ep_key)) continue; // at a pierce point — keep
				const ep = this.computed_endpoints.get(ep_key);
				if (!ep) continue;
				if (is_occluded_on_face(so_id, face_idx, ep.screen)) {
					this.computed_endpoints.delete(ep_key);
					break;
				}
			}
		}

		// Check occlusion_clip endpoints — edge belongs to faces of its SO
		for (const [key, ep] of this.computed_endpoints) {
			if (ep.id.type !== T_Endpoint.occlusion_clip) continue;
			const oc = ep.id as { type: T_Endpoint.occlusion_clip; edge: string; occluder_face: string; end: 'enter' | 'exit' };
			// edge format: "so_id:edge_key"
			const colon = oc.edge.indexOf(':');
			if (colon < 0) continue;
			const so_id = oc.edge.slice(0, colon);
			const edge_key = oc.edge.slice(colon + 1);
			const [evi, evj] = edge_key.split('-').map(Number);

			const obj = objects.find(o => o.id === so_id);
			if (!obj?.faces) continue;

			// Find all faces containing this edge
			for (let fi = 0; fi < obj.faces.length; fi++) {
				const fv = obj.faces[fi];
				const has_vi = fv.includes(evi), has_vj = fv.includes(evj);
				if (!has_vi || !has_vj) continue;
				if (is_occluded_on_face(so_id, fi, ep.screen)) {
					this.computed_endpoints.delete(key);
					break;
				}
			}
		}
	}

	/** Detect occluding edges: visible edge segments from SO_A that overlap SO_B's face on screen
	 *  and are in front of SO_B's face plane. These form occlusion boundaries on SO_B's face. */
	private compute_occluding_edge_segments(): void {
		this.computed_occluding_segments = [];
		this.crossing_splits = [];

		for (const [so_a_id, segs] of this.computed_edge_segments) {
			for (const seg of segs) {
				for (let ci = 0; ci < seg.visible.length; ci++) {
					const [s, e] = seg.visible[ci];

					// Test against each occluding face from OTHER SOs
					for (let fi = 0; fi < this.occluding_faces.length; fi++) {
						const face = this.occluding_faces[fi];
						if (face.obj_id === so_a_id) continue;  // skip own SO's faces

						// Clip segment to face screen polygon
						const clip = this.clip_segment_to_polygon_2d(s, e, face.poly);
						if (!clip) continue;
						const [t_enter, t_leave] = clip;

						// Interpolate world positions to check depth
						const [sk, ek] = seg.endpoint_keys[ci];
						const ep_s = this.computed_endpoints.get(sk);
						const ep_e = this.computed_endpoints.get(ek);
						if (!ep_s || !ep_e) continue;

						const w_mid = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, (t_enter + t_leave) / 2);
						const dist = vec3.dot(face.n, w_mid) - face.d;
						if (dist < -k.coplanar_epsilon) continue;  // behind the face, not in front

						// This edge is in front of the face — it's an occluding edge
						const cs: Pt = {
							x: s.x + (e.x - s.x) * t_enter,
							y: s.y + (e.y - s.y) * t_enter,
						};
						const ce: Pt = {
							x: s.x + (e.x - s.x) * t_leave,
							y: s.y + (e.y - s.y) * t_leave,
						};

						// Compute world positions for endpoints
						const w_cs = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, t_enter);
						const w_ce = vec3.lerp(vec3.create(), ep_s.world, ep_e.world, t_leave);

						// Tag endpoints — reuse oc endpoints from the reverse map built during edge clip
						const edge_a = `${so_a_id}:${seg.edge_key}`;
						const oc_list = this.oc_at_occluder_edge.get(edge_a);

						// Check if an oc endpoint matches at start or end (screen-space proximity along this segment)
						let cs_key: string | undefined;
						let ce_key: string | undefined;
						if (oc_list) {
							for (const sp of oc_list) {
								const t = Render.screen_t(cs, ce, sp.screen);
								const is_fi = sp.key.startsWith('fi:');
								if (t > -0.01 && t < 0.01 && (!cs_key || is_fi)) cs_key = sp.key;
								if (t > 0.99 && t < 1.01 && (!ce_key || is_fi)) ce_key = sp.key;
							}
						}
						// Fall back to edge_crossing for endpoints without oc match
						// Also record split points on the target face's edges
						const face_verts = face.face_verts;
						if (!cs_key) {
							const cs_id: EndpointID = { type: T_Endpoint.edge_crossing, edgeA: edge_a, edgeB: `${face.obj_id}:face:${fi}` };
							cs_key = this.register_endpoint(cs_id, cs, w_cs);
							if (face_verts && clip[2] >= 0) {
								const vi = face_verts[clip[2]], vj = face_verts[(clip[2] + 1) % face_verts.length];
								this.crossing_splits.push({ so: face.obj_id, edge_key: `${Math.min(vi, vj)}-${Math.max(vi, vj)}`, screen: cs, world: w_cs, ep_key: cs_key, poly_edge_idx: clip[2] });
							}
						}
						if (!ce_key) {
							const ce_id: EndpointID = { type: T_Endpoint.edge_crossing, edgeA: edge_a, edgeB: `${face.obj_id}:face:${fi}:e` };
							ce_key = this.register_endpoint(ce_id, ce, w_ce);
							if (face_verts && clip[3] >= 0) {
								const vi = face_verts[clip[3]], vj = face_verts[(clip[3] + 1) % face_verts.length];
								this.crossing_splits.push({ so: face.obj_id, edge_key: `${Math.min(vi, vj)}-${Math.max(vi, vj)}`, screen: ce, world: w_ce, ep_key: ce_key, poly_edge_idx: clip[3] });
							}
						}

						// if (!Render._facets_logged) {
						// 	const sk_ep = this.computed_endpoints.get(cs_key);
						// 	const ek_ep = this.computed_endpoints.get(ce_key);
						// 	console.log(`  crossing: ${so_a_id}:${seg.edge_key} clip[${ci}] → face ${face.obj_id}:${face.face_index} keys=[${cs_key}, ${ce_key}] types=[${sk_ep?.id.type}, ${ek_ep?.id.type}]`);
						// }
						this.computed_occluding_segments.push({
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

	/** Split edge segments at crossing and intersection exit points so they share endpoints with face edges. */
	private apply_crossing_splits(): void {
		// Merge both split sources
		const all_splits: { so: string; edge_key: string; screen: Pt; world: vec3; ep_key: string }[] = [
			...this.crossing_splits,
			...this.intersection_edge_splits,
		];
		if (all_splits.length === 0) return;

		// Group splits by (so, edge_key)
		const by_edge = new Map<string, typeof all_splits>();
		for (const sp of all_splits) {
			const k = `${sp.so}:${sp.edge_key}`;
			let list = by_edge.get(k);
			if (!list) { list = []; by_edge.set(k, list); }
			list.push(sp);
		}

		for (const [edge_full_key, splits] of by_edge) {
			const [so_id, edge_key] = [edge_full_key.slice(0, edge_full_key.indexOf(':')), edge_full_key.slice(edge_full_key.indexOf(':') + 1)];
			const segs = this.computed_edge_segments.get(so_id);
			if (!segs) continue;

			for (const seg of segs) {
				if (seg.edge_key !== edge_key) continue;

				// For each visible clip interval, check if any split falls inside it
				const new_visible: [Pt, Pt][] = [];
				const new_ep_keys: [string, string][] = [];

				for (let ci = 0; ci < seg.visible.length; ci++) {
					const [s, e] = seg.visible[ci];
					const [sk, ek] = seg.endpoint_keys[ci];

					// Compute t for each split along this clip interval
					const interval_splits: { t: number; sp: typeof splits[0] }[] = [];
					for (const sp of splits) {
						const t = Render.screen_t(s, e, sp.screen);
						if (t > 0.01 && t < 0.99) {
							interval_splits.push({ t, sp });
						}
					}

					if (interval_splits.length === 0) {
						new_visible.push([s, e]);
						new_ep_keys.push([sk, ek]);
						continue;
					}

					// Sort splits by t
					interval_splits.sort((a, b) => a.t - b.t);

					// Split the interval — interpolate screen position along the edge to avoid offset artifacts
					let prev_pt = s;
					let prev_key = sk;
					for (const { t, sp } of interval_splits) {
						const split_screen: Pt = { x: s.x + (e.x - s.x) * t, y: s.y + (e.y - s.y) * t };
						new_visible.push([prev_pt, split_screen]);
						new_ep_keys.push([prev_key, sp.ep_key]);
						prev_pt = split_screen;
						prev_key = sp.ep_key;
					}
					// Final piece
					new_visible.push([prev_pt, e]);
					new_ep_keys.push([prev_key, ek]);
				}

				seg.visible = new_visible;
				seg.endpoint_keys = new_ep_keys;
			}
		}
	}

	private render_edges(obj: O_Scene, projected: Projected[], solid: boolean, world?: mat4, restrict_face?: number): void {
		const ctx = this.ctx;
		const is_selected = hits_3d.selection?.so.scene === obj;
		ctx.lineWidth = is_selected ? stores.line_thickness() * 5 : stores.line_thickness();
		ctx.lineCap = 'square';

		// In 2D or solid mode, only draw edges belonging to front-facing faces
		const face_filter = (restrict_face !== undefined) ? this.face_edge_keys(obj, restrict_face) : null;
		const front_edges = (solid) ? this.front_face_edges(obj, projected) : null;

		// During face drag, highlight the guidance face's edges on the parent SO
		const guide = drag.guidance_face;
		const guidance_edges = (guide && guide.scene === obj) ? this.face_edge_keys(obj, guide.face_index) : null;

		// During rotation, highlight the face whose normal is the rotation axis
		const rot = drag.rotation_face;
		const rotation_edges = (rot && rot.scene === obj) ? this.face_edge_keys(obj, rot.face_index) : null;

		if ((solid) && world) {
			// Solid / 2D mode: draw from precomputed visible edge segments
			const normal_path = new Path2D();
			const guide_path = new Path2D();
			const rot_path = new Path2D();

			const stored = this.computed_edge_segments.get(obj.id) ?? [];
			for (const seg of stored) {
				if (face_filter && !face_filter.has(seg.edge_key)) continue;
				const path = rotation_edges?.has(seg.edge_key) ? rot_path : guidance_edges?.has(seg.edge_key) ? guide_path : normal_path;
				for (const [s, e] of seg.visible) {
					path.moveTo(Math.round(s.x) + 0.5, Math.round(s.y) + 0.5);
					path.lineTo(Math.round(e.x) + 0.5, Math.round(e.y) + 0.5);
				}
			}

			ctx.strokeStyle = `${obj.color}1)`;
			ctx.stroke(normal_path);
			if (guidance_edges) {
				ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
				ctx.lineWidth = stores.line_thickness() * 3;
				ctx.stroke(guide_path);
				ctx.lineWidth = stores.line_thickness();
			}
			if (rotation_edges) {
				ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
				ctx.lineWidth = stores.line_thickness() * 3;
				ctx.stroke(rot_path);
				ctx.lineWidth = stores.line_thickness();
			}
		} else {
			// Non-solid: batch edges by color into single beginPath/stroke calls
			const normal_path = new Path2D();
			const guide_path = new Path2D();
			const rot_path = new Path2D();

			for (const [i, j] of obj.edges) {
				const a = projected[i], b = projected[j];
				if (a.w < 0 || b.w < 0) continue;
				const ek = `${Math.min(i, j)}-${Math.max(i, j)}`;
				if (face_filter && !face_filter.has(ek)) continue;
				if (front_edges && !front_edges.has(ek)) continue;

				const ax = Math.round(a.x) + 0.5, ay = Math.round(a.y) + 0.5;
				const bx = Math.round(b.x) + 0.5, by = Math.round(b.y) + 0.5;

				const edge_key = `${Math.min(i, j)}-${Math.max(i, j)}`;
				const path = rotation_edges?.has(edge_key) ? rot_path : guidance_edges?.has(edge_key) ? guide_path : normal_path;
				path.moveTo(ax, ay);
				path.lineTo(bx, by);
			}

			ctx.strokeStyle = `${obj.color}1)`;
			ctx.stroke(normal_path);

			if (guidance_edges) {
				ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
				ctx.lineWidth = stores.line_thickness() * 3;
				ctx.stroke(guide_path);
				ctx.lineWidth = stores.line_thickness();
			}
			if (rotation_edges) {
				ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
				ctx.lineWidth = stores.line_thickness() * 3;
				ctx.stroke(rot_path);
				ctx.lineWidth = stores.line_thickness();
			}
		}
	}

	/** Draw intersection lines from precomputed data. */
	private render_intersections(): void {
		const ctx = this.ctx;
		ctx.lineWidth = stores.line_thickness();
		for (const seg of this.computed_intersection_segments) {
			ctx.strokeStyle = `${seg.color}1)`;
			for (const [a, b] of seg.visible) {
				ctx.beginPath();
				ctx.moveTo(Math.round(a.x) + 0.5, Math.round(a.y) + 0.5);
				ctx.lineTo(Math.round(b.x) + 0.5, Math.round(b.y) + 0.5);
				ctx.stroke();
			}
		}
	}

	/**
	 * Given two face planes in world space, compute their intersection line
	 * and clip it to both face quads. Draw the resulting segment if any.
	 */
	private intersect_face_pair(
		ctx: CanvasRenderingContext2D | null,
		fA: { n: vec3; d: number; corners: vec3[] },
		fB: { n: vec3; d: number; corners: vec3[] },
		color: string,
	): { start: vec3; end: vec3; start_edge: { face: 'A' | 'B'; edge_idx: number }; end_edge: { face: 'A' | 'B'; edge_idx: number } } | null {
		const eps = 1e-8;

		// Line direction = cross(nA, nB)
		const dir = vec3.create();
		vec3.cross(dir, fA.n, fB.n);
		const dir_len = vec3.length(dir);
		if (dir_len < k.coplanar_epsilon) return null; // parallel planes
		vec3.scale(dir, dir, 1 / dir_len);

		// Find a point on the intersection line by solving
		// nA·p = dA, nB·p = dB as a 2×2 system.
		// Set the coordinate along dir's largest component to 0.
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

		// Clip the infinite line (p0 + t*dir) to both face quads — track which edge causes each clip
		const ra = this.clip_to_quad_with_edges(p0, dir, fA.corners, fA.n, -1e6, 1e6);
		if (!ra) return null;

		const rb = this.clip_to_quad_with_edges(p0, dir, fB.corners, fB.n, ra[0], ra[1]);
		if (!rb) return null;

		const [tA, tB] = [rb[0], rb[1]];
		if (tA >= tB - eps) return null;

		// Determine which face's edge caused each boundary
		// start (tA): whichever quad tightened t_min last
		const start_edge = (rb[0] > ra[0])
			? { face: 'B' as const, edge_idx: rb[2] }
			: { face: 'A' as const, edge_idx: ra[2] };
		// end (tB): whichever quad tightened t_max last
		const end_edge = (rb[1] < ra[1])
			? { face: 'B' as const, edge_idx: rb[3] }
			: { face: 'A' as const, edge_idx: ra[3] };

		const start = vec3.scaleAndAdd(vec3.create(), p0, dir, tA);
		const end = vec3.scaleAndAdd(vec3.create(), p0, dir, tB);

		const identity = mat4.create();
		const s1 = this.project_vertex(start, identity);
		const s2 = this.project_vertex(end, identity);
		if (s1.w < 0 || s2.w < 0) return null;

		if (ctx) {
			ctx.strokeStyle = `${color}1)`;

			// Intersection lines: skip the two coplanar generating faces, not all faces from both objects
			const visible = this.clip_segment_for_occlusion(
				{ x: s1.x, y: s1.y }, { x: s2.x, y: s2.y }, start, end, '', [fA, fB]
			);
			for (const [a, b] of visible) {
				ctx.beginPath();
				ctx.moveTo(Math.round(a.x) + 0.5, Math.round(a.y) + 0.5);
				ctx.lineTo(Math.round(b.x) + 0.5, Math.round(b.y) + 0.5);
				ctx.stroke();
			}
		}

		return { start, end, start_edge, end_edge };
	}

	/**
	 * Clip a segment against all occluding faces from other SOs.
	 * Uses world-space face normals to determine which side of the face plane
	 * each portion of the edge is on. The portion behind the face (and inside
	 * the face's screen polygon) gets hidden.
	 *
	 * w1, w2: world-space endpoints of the edge segment.
	 */
	/** Clip a segment, returning which occluding face caused each clip boundary. */
	private clip_segment_for_occlusion_rich(
		p1: Pt, p2: Pt, w1: vec3, w2: vec3,
		skip_ids: string | string[],
		skip_planes?: { n: vec3; d: number }[],
	): ClipInterval[] {
		type RichInterval = { a: number; b: number; a_cause: OccFaceRef; b_cause: OccFaceRef; a_poly_edge: number; b_poly_edge: number };
		let intervals: RichInterval[] = [{ a: 0, b: 1, a_cause: null, b_cause: null, a_poly_edge: -1, b_poly_edge: -1 }];
		const skip = Array.isArray(skip_ids) ? skip_ids : [skip_ids];
		const dx = p2.x - p1.x, dy = p2.y - p1.y;
		const identity = mat4.create();

		const edge_min_x = Math.min(p1.x, p2.x), edge_min_y = Math.min(p1.y, p2.y);
		const edge_max_x = Math.max(p1.x, p2.x), edge_max_y = Math.max(p1.y, p2.y);
		const candidates = this.occluding_index
			? this.occluding_index.search(edge_min_x, edge_min_y, edge_max_x, edge_max_y)
			: this.occluding_faces.map((_, i) => i);

		for (const fi of candidates) {
			const face = this.occluding_faces[fi];
			if (!face) continue;
			if (skip.includes(face.obj_id)) continue;
			if (skip_planes && skip_planes.some(sp => {
				const dot = vec3.dot(sp.n, face.n);
				return (Math.abs(dot - 1) < 1e-6 && Math.abs(sp.d - face.d) < 1e-6) ||
							 (Math.abs(dot + 1) < 1e-6 && Math.abs(sp.d + face.d) < 1e-6);
			})) continue;

			const d1 = vec3.dot(face.n, w1) - face.d;
			const d2 = vec3.dot(face.n, w2) - face.d;
			if (d1 > -k.coplanar_epsilon && d2 > -k.coplanar_epsilon) {
				continue;
			}

			let s_behind_start = 0, s_behind_end = 1;
			if (d1 > 0 && d2 <= 0) {
				const t_cross = d1 / (d1 - d2);
				const wc = vec3.lerp(vec3.create(), w1, w2, t_cross);
				const pc = this.project_vertex(wc, identity);
				const cdx = pc.x - p1.x, cdy = pc.y - p1.y;
				s_behind_start = Math.abs(dx) > Math.abs(dy) ? cdx / dx : cdy / dy;
				s_behind_end = 1;
			} else if (d1 <= 0 && d2 > 0) {
				const t_cross = d1 / (d1 - d2);
				const wc = vec3.lerp(vec3.create(), w1, w2, t_cross);
				const pc = this.project_vertex(wc, identity);
				const cdx = pc.x - p1.x, cdy = pc.y - p1.y;
				s_behind_start = 0;
				s_behind_end = Math.abs(dx) > Math.abs(dy) ? cdx / dx : cdy / dy;
			}

			const bs = { x: p1.x + dx * s_behind_start, y: p1.y + dy * s_behind_start };
			const be = { x: p1.x + dx * s_behind_end, y: p1.y + dy * s_behind_end };
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

		// Remove fake visible intervals: if both boundaries of a visible interval
		// are from the same object at non-silhouette polygon edges, the body
		// continues through this interval — it's not really visible
		if (intervals.length >= 1) {
			intervals = intervals.filter(iv => {
				if (!iv.a_cause || !iv.b_cause) return true; // corner boundary — real
				if (iv.a_cause.obj_id !== iv.b_cause.obj_id) return true; // different objects — real
				const a_sil = iv.a_cause.silhouette_edges?.[iv.a_poly_edge] ?? true;
				const b_sil = iv.b_cause.silhouette_edges?.[iv.b_poly_edge] ?? true;
				return a_sil || b_sil; // keep if either boundary is silhouette
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

	/** Clip a segment, returning only visible screen intervals (backward compat). */
	private clip_segment_for_occlusion(
		p1: Pt, p2: Pt, w1: vec3, w2: vec3,
		skip_ids: string | string[],
		skip_planes?: { n: vec3; d: number }[],
	): [Pt, Pt][] {
		return this.clip_segment_for_occlusion_rich(p1, p2, w1, w2, skip_ids, skip_planes)
			.map(ci => [ci.start, ci.end]);
	}

	/**
	 * 2D Cyrus-Beck: clip a segment (p1→p2, t in [0,1]) to a convex polygon.
	 * Returns [t_enter, t_leave] or null if fully outside.
	 */
	private clip_segment_to_polygon_2d(
		p1: { x: number; y: number },
		p2: { x: number; y: number },
		poly: { x: number; y: number }[],
	): [number, number, number, number] | null {
		let t_enter = 0, t_leave = 1;
		let enter_edge = -1, leave_edge = -1;
		const dx = p2.x - p1.x, dy = p2.y - p1.y;

		for (let i = 0; i < poly.length; i++) {

			const c0 = poly[i];
			const c1 = poly[(i + 1) % poly.length];

			// Inward-pointing normal for this edge (CW winding in screen space, Y-down)
			const ex = c1.x - c0.x, ey = c1.y - c0.y;
			const nx = ey, ny = -ex; // rotate edge 90 degrees right = inward for CW

			const denom = nx * dx + ny * dy;
			const num = nx * (p1.x - c0.x) + ny * (p1.y - c0.y);

			if (Math.abs(denom) < 1e-10) {
				// Segment parallel to edge — if outside, reject
				if (num < 0) return null;
				continue;
			}

			const t = -num / denom;
			if (denom > 0) {
				// Entering the half-plane
				if (t > t_enter) { t_enter = t; enter_edge = i; }
			} else {
				// Leaving the half-plane
				if (t < t_leave) { t_leave = t; leave_edge = i; }
			}

			if (t_enter > t_leave) return null;
		}

		if (t_enter >= t_leave) return null;
		return [t_enter, t_leave, enter_edge, leave_edge];
	}

	/**
	 * Clip parameterized line (p0 + t*dir) to the interior of a convex quad.
	 * Returns [t_min, t_max] or null if fully clipped away.
	 * Uses Cyrus-Beck clipping against each edge of the quad.
	 */
	/** Like clip_to_quad but also returns which quad edge caused each clip boundary.
	 *  Returns [t_min, t_max, enter_edge_idx, leave_edge_idx] or null. */
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


	private render_face_names(obj: O_Scene, projected: Projected[], world?: mat4): void {
		if (!obj.faces) return;
		const ctx = this.ctx;
		ctx.font = '10px sans-serif';
		ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const verts = obj.so.vertices;

		for (let fi = 0; fi < obj.faces.length; fi++) {
			const face = obj.faces[fi];
			const winding = this.face_winding(face, projected);
			if (winding >= 0 || Math.abs(winding) < 2000) continue; // skip back-facing and edge-on

			// Compute centroid of face in screen space
			let cx = 0, cy = 0, cz = 0, behind = false;
			for (const vi of face) {
				if (projected[vi].w < 0) { behind = true; break; }
				cx += projected[vi].x;
				cy += projected[vi].y;
				cz += projected[vi].z;
			}
			if (behind) continue;
			cx /= face.length;
			cy /= face.length;
			cz /= face.length;

			// Occlusion: skip label if another SO's face is in front at this screen point
			if (world && this.is_point_occluded(cx, cy, face, verts, world, obj.id)) continue;

			const text = debug.enabled ? `${obj.so.name} ${fi}` : obj.so.name;
			const tw = ctx.measureText(text).width;
			const fls = face_label.state;
			if (!fls || fls.so !== obj.so || fls.face_index !== fi) {
				ctx.fillStyle = 'white';
				ctx.fillRect(Math.round(cx) - tw / 2 - 2, Math.round(cy) - 6, tw + 4, 12);
				ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
				ctx.fillText(text, Math.round(cx), Math.round(cy));
			}

			// Record hit rect for every visible face label (all are clickable)
			this.face_name_rects.push({ so: obj.so, x: cx, y: cy, w: tw, h: 10, z: cz, face_index: fi });
		}
	}

	/** Check if a screen point is occluded by any front-facing face from a different object. */
	private is_point_occluded(
		sx: number, sy: number,
		face: number[], verts: vec3[], world: mat4,
		skip_id: string,
	): boolean {
		if (this.occluding_faces.length === 0) return false;

		// World-space centroid of the face being labeled
		let wx = 0, wy = 0, wz = 0;
		for (const vi of face) {
			const lv = verts[vi];
			const wv = vec4.create();
			vec4.transformMat4(wv, [lv[0], lv[1], lv[2], 1], world);
			wx += wv[0]; wy += wv[1]; wz += wv[2];
		}
		wx /= face.length; wy /= face.length; wz /= face.length;
		const world_centroid: vec3 = [wx, wy, wz];

		// Query spatial index for candidate occluding faces near this screen point
		const candidates = this.occluding_index
			? this.occluding_index.search(sx, sy, sx, sy)
			: this.occluding_faces.map((_, i) => i);

		for (const fi of candidates) {
			const occ = this.occluding_faces[fi];
			if (occ.obj_id === skip_id) continue;

			// Is the label centroid behind this face's plane?
			const dist = vec3.dot(occ.n, world_centroid) - occ.d;
			if (dist > -k.coplanar_epsilon) continue; // in front of (or coplanar with) this face, not occluded by it

			// Is the screen point inside this face's screen polygon?
			if (this.point_in_polygon_2d(sx, sy, occ.poly)) return true;
		}
		return false;
	}

	/** Ray-casting point-in-polygon test (2D screen space). */
	point_in_polygon_2d(px: number, py: number, poly: { x: number; y: number }[]): boolean {
		let inside = false;
		for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
			const yi = poly[i].y, yj = poly[j].y;
			if ((yi > py) !== (yj > py)) {
				const xi = poly[i].x + (py - yi) / (yj - yi) * (poly[j].x - poly[i].x);
				if (px < xi) inside = !inside;
			}
		}
		return inside;
	}

	private draw_debug_face(face: number[], fi: number, projected: Projected[]): void {
		const rgb = this.FACE_RGB[fi] ?? [128, 128, 128];
		const alpha = debug.enabled ? 1 : 0;
		this.ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
		this.ctx.beginPath();
		this.ctx.moveTo(projected[face[0]].x, projected[face[0]].y);
		for (let i = 1; i < face.length; i++) {
			this.ctx.lineTo(projected[face[i]].x, projected[face[i]].y);
		}
		this.ctx.closePath();
		this.ctx.fill();
	}

	private render_selection(): void {
		// Selection shown via thickened edges (in render_edges), not dots
	}

	private render_hover(): void {
		const hover = hits_3d.hover;
		if (!hover || !hover.so.scene) return;
		// Don't draw hover dots when hovering sub-elements of the selected face
		const sel = hits_3d.selection;
		if (sel && sel.so === hover.so && sel.type === T_Hit_3D.face) return;

		const projected = hits_3d.get_projected(hover.so.scene.id);
		if (!projected) return;

		this.ctx.fillStyle = 'red';
		this.render_hit_dots(hover, projected, 'red');
	}

	private render_front_face_label(): void {
		const root_so = scenes.root_so;
		if (!root_so || !root_so.scene?.faces) return;
		const projected = hits_3d.get_projected(root_so.scene.id);
		if (!projected) return;
		const face = hits_3d.front_most_face(root_so);
		const ctx = this.ctx;
		ctx.save();
		ctx.font = '11px monospace';
		ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
		ctx.textAlign = 'right';
		ctx.textBaseline = 'top';
		let y = 8;
		ctx.fillText(`front: ${face}`, this.size.width - 8, y);
		// Show winding for each face
		for (let i = 0; i < root_so.scene.faces.length; i++) {
			y += 14;
			const w = this.face_winding(root_so.scene.faces[i], projected);
			ctx.fillText(`${i}: ${w < 0 ? '▶' : ' '} ${Math.round(w)}`, this.size.width - 8, y);
		}
		ctx.restore();
	}

	// for hover and selection
	private render_hit_dots(
		hit: { so: Smart_Object, type: T_Hit_3D, index: number },
		projected: Projected[],
		color: string,
		world?: mat4,
		for_selection?: boolean,
	): void {
		if (!hit.so.scene) return;
		const so = hit.so;
		const scene_obj = so.scene!;

		// Compute world-space position for a vertex (for occlusion checks)
		const world_pos = (vi: number): vec3 => {
			const lv = so.vertices[vi];
			const wv = vec4.create();
			vec4.transformMat4(wv, [lv[0], lv[1], lv[2], 1], world!);
			return vec3.fromValues(wv[0], wv[1], wv[2]);
		};

		const skip_id = scene_obj.id;
		const occ_faces = for_selection ? this.sel_occluding_faces : this.occluding_faces;
		const occ_index = for_selection ? this.sel_occluding_index : this.occluding_index;
		const draw = (p: Projected, vi?: number, vi2?: number) => {
			if (p.w < 0) return;
			let occluded = false;
			if (world && occ_faces.length > 0) {
				if (vi !== undefined && vi2 !== undefined) {
					const w1 = world_pos(vi), w2 = world_pos(vi2);
					const mid: vec3 = [(w1[0]+w2[0])/2, (w1[1]+w2[1])/2, (w1[2]+w2[2])/2];
					occluded = this.is_dot_occluded(p.x, p.y, mid, skip_id, occ_faces, occ_index);
				} else if (vi !== undefined) {
					occluded = this.is_dot_occluded(p.x, p.y, world_pos(vi), skip_id, occ_faces, occ_index);
				}
			}
			this.ctx.fillStyle = occluded ? 'red' : color;
			this.ctx.beginPath();
			this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
			this.ctx.fill();
		};

		switch (hit.type) {
			case T_Hit_3D.corner:
				draw(projected[hit.index], hit.index);
				break;
			case T_Hit_3D.edge: {
				const [a, b] = scene_obj.edges[hit.index];
				draw(projected[a], a);
				draw(projected[b], b);
				draw(this.midpoint(projected[a], projected[b]), a, b);
				break;
			}
			case T_Hit_3D.face: {
				const face = scene_obj.faces![hit.index];
				for (let i = 0; i < face.length; i++) {
					const vi = face[i];
					const vi2 = face[(i + 1) % face.length];
					draw(projected[vi], vi);
					draw(this.midpoint(projected[vi], projected[vi2]), vi, vi2);
				}
				break;
			}
		}
	}

	/** Check if a screen-space dot is occluded by any front-facing face.
	 *  Unlike edge occlusion, does NOT skip same-object faces — a dot on the
	 *  back face of a box should be red when the front face hides it.
	 *  Coplanar vertices (on the occluding face itself) pass through naturally. */
	private is_dot_occluded(
		sx: number, sy: number, world_pos: vec3, skip_id?: string,
		faces?: typeof this.occluding_faces, index?: Flatbush | null,
	): boolean {
		const occ_faces = faces ?? this.occluding_faces;
		const occ_index = index !== undefined ? index : this.occluding_index;
		const candidates = occ_index
			? occ_index.search(sx, sy, sx, sy)
			: occ_faces.map((_, i) => i);
		for (const fi of candidates) {
			const occ = occ_faces[fi];
			if (skip_id && occ.obj_id === skip_id) continue;
			const dist = vec3.dot(occ.n, world_pos) - occ.d;
			if (dist > -k.coplanar_epsilon) continue;
			if (this.point_in_polygon_2d(sx, sy, occ.poly)) return true;
		}
		return false;
	}

	private midpoint(a: Projected, b: Projected): Projected {
		return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, w: Math.min(a.w, b.w) };
	}

	/** Collect edge keys for a specific face (for guidance highlight). */
	private face_edge_keys(obj: O_Scene, face_index: number): Set<string> {
		const keys = new Set<string>();
		if (!obj.faces || face_index >= obj.faces.length) return keys;
		const face = obj.faces[face_index];
		for (let i = 0; i < face.length; i++) {
			const a = face[i], b = face[(i + 1) % face.length];
			keys.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
		}
		return keys;
	}

	/** Collect edge keys belonging to front-facing faces (for 2D mode). */
	private front_face_edges(obj: O_Scene, projected: Projected[]): Set<string> {
		const edges = new Set<string>();
		if (!obj.faces) return edges;
		for (const face of obj.faces) {
			if (this.face_winding(face, projected) >= 0) continue; // skip back-facing
			for (let i = 0; i < face.length; i++) {
				const a = face[i], b = face[(i + 1) % face.length];
				edges.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
			}
		}
		return edges;
	}

	// Compute face winding (negative = front-facing with CCW convention)
	face_winding(face: number[], projected: Projected[]): number {
		if (face.length < 3 || !projected) return Infinity;
		const p0 = projected[face[0]], p1 = projected[face[1]], p2 = projected[face[2]];
		if (!p0 || !p1 || !p2) return Infinity;
		if (p0.w < 0 || p1.w < 0 || p2.w < 0) return Infinity;
		return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
	}

	/** Draw an arrowhead at (x, y) pointing in direction (dx, dy). */
	draw_arrow(x: number, y: number, dx: number, dy: number): void {
		const len = Math.sqrt(dx * dx + dy * dy);
		if (len < 1) return;

		const ux = dx / len, uy = dy / len;
		const size = 6;

		this.ctx.beginPath();
		this.ctx.moveTo(x, y);
		this.ctx.lineTo(x + ux * size - uy * size * 0.5, y + uy * size + ux * size * 0.5);
		this.ctx.lineTo(x + ux * size + uy * size * 0.5, y + uy * size - ux * size * 0.5);
		this.ctx.closePath();
		this.ctx.fill();
	}
}

export const render = new Render();
