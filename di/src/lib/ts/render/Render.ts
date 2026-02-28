import type { Projected, O_Scene, Dimension_Rect, Label_Rect, Angle_Rect } from '../types/Interfaces';
import { render_dimensions } from './R_Dimensions';
import { face_label } from '../editors/Face_Label';
import Smart_Object from '../runtime/Smart_Object';
import { T_Hit_3D } from '../types/Enumerations';
import { render_angulars } from './R_Angulars';
import { hits_3d } from '../managers/Hits_3D';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { Size } from '../types/Coordinates';
import { stores } from '../managers/Stores';
import { scenes } from '../managers/Scenes';
import { debug } from '../common/Debug';
import { k } from '../common/Constants';
import { render_grid, render_back_grid, render_root_bottom } from './R_Grid';
import { drag } from '../editors/Drag';
import { camera } from './Camera';
import { scene } from './Scene';
import Flatbush from 'flatbush';

class Render {
	private occluding_index: Flatbush | null = null;  /** Spatial index for screen-space face bounding boxes (rebuilt each frame). */
	ctx!: CanvasRenderingContext2D;
	private mvp_matrix = mat4.create();
	private cached_world: mat4 | null = null;  /** Last world matrix passed to project_vertex (by reference). */
	private cached_mvp = mat4.create();        /** MVP computed from cached_world — reused when world matrix hasn't changed. */
	private canvas!: HTMLCanvasElement;
	private size: Size = Size.zero;
	private dpr = 1;

	/** Per-frame dimension rects for click-to-edit. Cleared each render(). */
	dimension_rects: Dimension_Rect[] = [];

	/** Per-frame face name rects for click-to-edit. Cleared each render(). */
	face_name_rects: Label_Rect[] = [];
	angular_rects: Angle_Rect[] = [];

	/** Per-frame list of front-facing faces for occlusion: world-space normal, offset, and screen-space polygon. */
	private occluding_faces: {
		n: vec3; d: number;            // face plane in world space (n·p = d)
		corners: vec3[];               // world-space corners
		poly: { x: number; y: number }[]; // screen-space polygon
		obj_id: string;
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

	/** Set canvas buffer to physical pixels, CSS size to logical pixels. */
	private apply_dpr(w: number, h: number): void {
		this.canvas.width = w * this.dpr;
		this.canvas.height = h * this.dpr;
		this.canvas.style.width = w + 'px';
		this.canvas.style.height = h + 'px';
		this.ctx.scale(this.dpr, this.dpr);
	}

	render(): void {
		this.ctx.clearRect(0, 0, this.size.width, this.size.height);
		this.dimension_rects = [];
		this.face_name_rects = [];
		this.angular_rects = [];
		this.cached_world = null;  // invalidate MVP cache (camera may have moved)

		const all_objects = scene.get_all();
		const objects = all_objects.filter(o => o.so.visible);
		const is_2d = stores.current_view_mode() === '2d';
		const solid = stores.is_solid();

		if (is_2d && stores.show_grid()) render_grid(this);

		// Phase 1: project ALL vertices (including hidden) for hit-test caches
		const projected_map = new Map<string, Projected[]>();
		for (const obj of all_objects) {
			const world_matrix = this.get_world_matrix(obj);
			const projected = obj.so.vertices.map((v) => this.project_vertex(v, world_matrix));
			projected_map.set(obj.id, projected);
			hits_3d.update_projected(obj.id, projected, world_matrix);
		}

		if (!is_2d && stores.show_grid()) render_back_grid(this);
		if (!is_2d) render_root_bottom(this);

		// Phase 2: fill front-facing faces (occlusion layer)
		// In solid or 2D mode, fill with white so rear edges are hidden.
		// Sort all front-facing faces back-to-front by average depth.
		if (is_2d || solid) {
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

		// Phase 2b: debug face fills (non-solid mode)
		if (!is_2d && !solid) {
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
		if (is_2d || solid) {
			for (const obj of objects) {
				const projected = projected_map.get(obj.id)!;
				if (!obj.faces) continue;
				const world = this.get_world_matrix(obj);
				const verts = obj.so.vertices;
				for (const face of obj.faces) {
					if (this.face_winding(face, projected) >= 0) continue;
					// Screen-space polygon
					const poly: { x: number; y: number }[] = [];
					let cam_behind = false;
					for (const vi of face) {
						if (projected[vi].w < 0) { cam_behind = true; break; }
						poly.push({ x: projected[vi].x, y: projected[vi].y });
					}
					if (cam_behind) continue;
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
					this.occluding_faces.push({ n, d, corners, poly, obj_id: obj.id });
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

		// Phase 2c: intersection lines between overlapping SOs
		if (objects.length > 1) {
			this.render_intersections(objects);
		}

		// Phase 3: draw edges
		for (const obj of objects) {
			const projected = projected_map.get(obj.id)!;
			const world = (is_2d || solid) ? this.get_world_matrix(obj) : undefined;
			this.render_edges(obj, projected, is_2d, solid, world);
			if (stores.show_names()) this.render_face_names(obj, projected, world);
		}

		this.render_hover();
		this.render_selection();
		if (stores.show_dimensionals()) render_dimensions(this);
		if (stores.show_angulars()) render_angulars(this);
		if (debug.enabled) this.render_front_face_label();
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

	private render_edges(obj: O_Scene, projected: Projected[], is_2d: boolean, solid: boolean, world?: mat4): void {
		const ctx = this.ctx;
		ctx.lineWidth = stores.line_thickness();
		ctx.lineCap = 'square';

		// In 2D or solid mode, only draw edges belonging to front-facing faces
		const front_edges = (is_2d || solid) ? this.front_face_edges(obj, projected) : null;

		// During face drag, highlight the guidance face's edges on the parent SO
		const guide = drag.guidance_face;
		const guidance_edges = (guide && guide.scene === obj) ? this.face_edge_keys(obj, guide.face_index) : null;

		// During rotation, highlight the face whose normal is the rotation axis
		const rot = drag.rotation_face;
		const rotation_edges = (rot && rot.scene === obj) ? this.face_edge_keys(obj, rot.face_index) : null;

		if ((is_2d || solid) && world) {
			// Solid / 2D mode: per-edge occlusion clipping, batch clipped segments by color
			const normal_path = new Path2D();
			const guide_path = new Path2D();
			const rot_path = new Path2D();

			for (const [i, j] of obj.edges) {
				const a = projected[i], b = projected[j];
				if (a.w < 0 || b.w < 0) continue;
				if (front_edges && !front_edges.has(`${Math.min(i, j)}-${Math.max(i, j)}`)) continue;

				const vi = obj.so.vertices[i], vj = obj.so.vertices[j];
				const wi = vec4.create(), wj = vec4.create();
				vec4.transformMat4(wi, [vi[0], vi[1], vi[2], 1], world);
				vec4.transformMat4(wj, [vj[0], vj[1], vj[2], 1], world);

				const visible = this.clip_segment_for_occlusion(
					{ x: a.x, y: a.y }, { x: b.x, y: b.y },
					vec3.fromValues(wi[0], wi[1], wi[2]), vec3.fromValues(wj[0], wj[1], wj[2]), obj.id
				);

				const edge_key = `${Math.min(i, j)}-${Math.max(i, j)}`;
				const path = rotation_edges?.has(edge_key) ? rot_path : guidance_edges?.has(edge_key) ? guide_path : normal_path;
				for (const [s, e] of visible) {
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
				if (front_edges && !front_edges.has(`${Math.min(i, j)}-${Math.max(i, j)}`)) continue;

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

	/**
	 * Draw intersection lines between overlapping SOs (general case).
	 * For each pair of faces (one from each SO), compute the plane-plane
	 * intersection line, then clip it to both face quads.
	 */
	private render_intersections(objects: O_Scene[]): void {
		const ctx = this.ctx;
		ctx.lineWidth = stores.line_thickness();

		// Build world-space face data for each object: normal, offset, 4 corner positions
		type WFace = { n: vec3; d: number; corners: vec3[]; fi: number; obj: O_Scene };
		const obj_faces: WFace[][] = [];

		for (const obj of objects) {
			const world = this.get_world_matrix(obj);

			const faces: WFace[] = [];
			const verts = obj.so.vertices; // local space
			const face_indices = obj.faces;
			if (!face_indices) { obj_faces.push([]); continue; }

			for (let fi = 0; fi < face_indices.length; fi++) {
				// Transform face corners to world space
				const corners: vec3[] = [];
				for (const vi of face_indices[fi]) {
					const lv = verts[vi];
					const wv = vec4.create();
					vec4.transformMat4(wv, [lv[0], lv[1], lv[2], 1], world);
					corners.push(vec3.fromValues(wv[0], wv[1], wv[2]));
				}

				// Derive normal from world-space corners (accounts for all transforms)
				const e1 = vec3.sub(vec3.create(), corners[1], corners[0]);
				const e2 = vec3.sub(vec3.create(), corners[3], corners[0]);
				const n = vec3.cross(vec3.create(), e1, e2);
				vec3.normalize(n, n);

				// Plane offset: d = n · p (any corner)
				const d = vec3.dot(n, corners[0]);
				faces.push({ n, d, corners, fi, obj });
			}
			obj_faces.push(faces);
		}

		// AABB per object — min/max of all world-space face corners
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
				// AABB early-out: skip face pairs if bounding boxes don't overlap
				if (mins[i][0] > maxs[j][0] || mins[j][0] > maxs[i][0] ||
						mins[i][1] > maxs[j][1] || mins[j][1] > maxs[i][1] ||
						mins[i][2] > maxs[j][2] || mins[j][2] > maxs[i][2]) continue;

				for (let fi_a = 0; fi_a < obj_faces[i].length; fi_a++) {
					for (let fi_b = 0; fi_b < obj_faces[j].length; fi_b++) {
						this.intersect_face_pair(ctx, obj_faces[i][fi_a], obj_faces[j][fi_b], objects[j].color);
					}
				}
			}
		}
	}

	/**
	 * Given two face planes in world space, compute their intersection line
	 * and clip it to both face quads. Draw the resulting segment if any.
	 */
	private intersect_face_pair(
		ctx: CanvasRenderingContext2D,
		fA: { n: vec3; d: number; corners: vec3[] },
		fB: { n: vec3; d: number; corners: vec3[] },
		color: string,
	): { start: vec3; end: vec3 } | null {
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

		// Clip the infinite line (p0 + t*dir) to both face quads
		const result_a = this.clip_to_quad(p0, dir, fA.corners, fA.n, -1e6, 1e6);
		if (!result_a) return null;

		const result = this.clip_to_quad(p0, dir, fB.corners, fB.n, result_a[0], result_a[1]);
		if (!result) return null;

		const [tA, tB] = result;
		if (tA >= tB - eps) return null;

		const start = vec3.scaleAndAdd(vec3.create(), p0, dir, tA);
		const end = vec3.scaleAndAdd(vec3.create(), p0, dir, tB);

		const identity = mat4.create();
		const s1 = this.project_vertex(start, identity);
		const s2 = this.project_vertex(end, identity);
		if (s1.w < 0 || s2.w < 0) return null;

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

		return { start, end };
	}

	/**
	 * Clip a segment against all occluding faces from other SOs.
	 * Uses world-space face normals to determine which side of the face plane
	 * each portion of the edge is on. The portion behind the face (and inside
	 * the face's screen polygon) gets hidden.
	 *
	 * w1, w2: world-space endpoints of the edge segment.
	 */
	private clip_segment_for_occlusion(
		p1: { x: number; y: number },
		p2: { x: number; y: number },
		w1: vec3,
		w2: vec3,
		skip_ids: string | string[],
		skip_planes?: { n: vec3; d: number }[],
	): [{ x: number; y: number }, { x: number; y: number }][] {
		// Work entirely in screen space. World space is only used for front/behind test.
		let intervals: [number, number][] = [[0, 1]]; // screen-space t along p1→p2
		const skip = Array.isArray(skip_ids) ? skip_ids : [skip_ids];
		const dx = p2.x - p1.x, dy = p2.y - p1.y;
		const identity = mat4.create();

		// Query spatial index for faces whose screen-space bounding boxes overlap this edge
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

			// Signed distances from edge endpoints to face plane (world space)
			const d1 = vec3.dot(face.n, w1) - face.d;
			const d2 = vec3.dot(face.n, w2) - face.d;

			if (d1 > -k.coplanar_epsilon && d2 > -k.coplanar_epsilon) continue;

			// Find screen-space t where the segment crosses the face plane
			// by projecting the world-space crossing point to screen
			let s_behind_start = 0, s_behind_end = 1;
			if (d1 > 0 && d2 <= 0) {
				const t_cross = d1 / (d1 - d2);
				const wc = vec3.lerp(vec3.create(), w1, w2, t_cross);
				const pc = this.project_vertex(wc, identity);
				// Find screen t of the crossing point along p1→p2
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
			// else both behind: s_behind_start=0, s_behind_end=1

			// Clip the "behind" portion to the face's screen-space polygon
			const bs = { x: p1.x + dx * s_behind_start, y: p1.y + dy * s_behind_start };
			const be = { x: p1.x + dx * s_behind_end, y: p1.y + dy * s_behind_end };

			const clip = this.clip_segment_to_polygon_2d(bs, be, face.poly);
			if (!clip) continue;

			// Map clip t values back to the full screen-space [0,1] range
			const s_range = s_behind_end - s_behind_start;
			const s_enter = s_behind_start + clip[0] * s_range;
			const s_leave = s_behind_start + clip[1] * s_range;

			// Remove the occluded interval
			const new_intervals: [number, number][] = [];
			for (const [a, b] of intervals) {
				if (s_leave <= a || s_enter >= b) {
					new_intervals.push([a, b]);
					continue;
				}
				if (s_enter > a) new_intervals.push([a, s_enter]);
				if (s_leave < b) new_intervals.push([s_leave, b]);
			}
			intervals = new_intervals;
			if (intervals.length === 0) break;
		}

		return intervals.map(([a, b]) => [
			{ x: p1.x + dx * a, y: p1.y + dy * a },
			{ x: p1.x + dx * b, y: p1.y + dy * b },
		]);
	}

	/**
	 * 2D Cyrus-Beck: clip a segment (p1→p2, t in [0,1]) to a convex polygon.
	 * Returns [t_enter, t_leave] or null if fully outside.
	 */
	private clip_segment_to_polygon_2d(
		p1: { x: number; y: number },
		p2: { x: number; y: number },
		poly: { x: number; y: number }[],
	): [number, number] | null {
		let t_enter = 0, t_leave = 1;
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
				if (t > t_enter) t_enter = t;
			} else {
				// Leaving the half-plane
				if (t < t_leave) t_leave = t;
			}

			if (t_enter > t_leave) return null;
		}

		if (t_enter >= t_leave) return null;
		return [t_enter, t_leave];
	}

	/**
	 * Clip parameterized line (p0 + t*dir) to the interior of a convex quad.
	 * Returns [t_min, t_max] or null if fully clipped away.
	 * Uses Cyrus-Beck clipping against each edge of the quad.
	 */
	private clip_to_quad(
		p0: vec3, dir: vec3,
		corners: vec3[], face_normal: vec3,
		t_min: number, t_max: number
	): [number, number] | null {
		const n_edges = corners.length;
		for (let i = 0; i < n_edges; i++) {
			const c0 = corners[i];
			const c1 = corners[(i + 1) % n_edges];

			// Edge vector
			const edge = vec3.sub(vec3.create(), c1, c0);

			// Inward normal of this edge (cross of face normal with edge, pointing inward)
			const inward = vec3.cross(vec3.create(), face_normal, edge);

			// For the line p0 + t*dir, compute:
			//   dot(inward, p0 + t*dir - c0) >= 0  means "inside this edge"
			//   dot(inward, p0 - c0) + t * dot(inward, dir) >= 0
			const diff = vec3.sub(vec3.create(), p0, c0);
			const numer = vec3.dot(inward, diff);
			const alignment = vec3.dot(inward, dir);

			if (Math.abs(alignment) < 1e-12) {
				// Line parallel to edge — check which side
				if (numer < 0) return null; // outside
				continue;
			}

			const t = -numer / alignment;
			if (alignment > 0) {
				// Entering: line moves into inside half-plane
				if (t > t_min) t_min = t;
			} else {
				// Leaving: line moves out of inside half-plane
				if (t < t_max) t_max = t;
			}

			if (t_min > t_max) return null;
		}

		return [t_min, t_max];
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
		const sel = hits_3d.selection;
		if (!sel || !sel.so.scene) return;

		const projected = hits_3d.get_projected(sel.so.scene.id);
		if (!projected) return;

		const world = this.get_world_matrix(sel.so.scene);
		const is_root = !sel.so.scene.parent;
		this.render_hit_dots(sel, projected, 'blue', world, is_root);
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
		is_root?: boolean,
	): void {
		if (!hit.so.scene) return;
		const so = hit.so;
		const scene_obj = so.scene!;

		// For non-root face selection: which vertices/edges are disabled?
		// (Root min-bound drags redirect to opposite max, so all root dots are active.)
		// Vertex: dead if ALL face-axis bounds are _min (can't move at all)
		// Edge midpoint: dead if both endpoints share a _min bound on any face axis
		let dead_verts: Set<number> | null = null;
		let face_axes: [string, string] | null = null;
		if (!is_root && hit.type === T_Hit_3D.face) {
			face_axes = so.face_axes(hit.index) as [string, string];
			dead_verts = new Set();
			const face = scene_obj.faces![hit.index];
			for (const vi of face) {
				if (face_axes.every(axis => so.vertex_bound(vi, axis as any).endsWith('_min'))) {
					dead_verts.add(vi);
				}
			}
		}

		// Compute world-space position for a vertex (for occlusion checks)
		const world_pos = (vi: number): vec3 => {
			const lv = so.vertices[vi];
			const wv = vec4.create();
			vec4.transformMat4(wv, [lv[0], lv[1], lv[2], 1], world!);
			return vec3.fromValues(wv[0], wv[1], wv[2]);
		};

		const draw = (p: Projected, disabled: boolean, vi?: number, vi2?: number) => {
			if (p.w < 0) return;
			let occluded = false;
			if (world && this.occluding_faces.length > 0) {
				if (vi !== undefined && vi2 !== undefined) {
					// Midpoint: average of two vertex world positions
					const w1 = world_pos(vi), w2 = world_pos(vi2);
					const mid: vec3 = [(w1[0]+w2[0])/2, (w1[1]+w2[1])/2, (w1[2]+w2[2])/2];
					occluded = this.is_dot_occluded(p.x, p.y, mid);
				} else if (vi !== undefined) {
					occluded = this.is_dot_occluded(p.x, p.y, world_pos(vi));
				}
			}
			this.ctx.fillStyle = (disabled || occluded) ? 'red' : color;
			this.ctx.beginPath();
			this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
			this.ctx.fill();
		};

		switch (hit.type) {
			case T_Hit_3D.corner:
				draw(projected[hit.index], false, hit.index);
				break;
			case T_Hit_3D.edge: {
				const [a, b] = scene_obj.edges[hit.index];
				draw(projected[a], false, a);
				draw(projected[b], false, b);
				const mid_dead = face_axes
					? face_axes.some(axis => so.vertex_bound(a, axis as any).endsWith('_min') && so.vertex_bound(b, axis as any).endsWith('_min'))
					: false;
				draw(this.midpoint(projected[a], projected[b]), mid_dead, a, b);
				break;
			}
			case T_Hit_3D.face: {
				const face = scene_obj.faces![hit.index];
				for (let i = 0; i < face.length; i++) {
					const vi = face[i];
					const vi2 = face[(i + 1) % face.length];
					draw(projected[vi], dead_verts?.has(vi) ?? false, vi);
					// Edge is dead if both endpoints share a _min bound on any face axis
					const mid_dead = face_axes
						? face_axes.some(axis => so.vertex_bound(vi, axis as any).endsWith('_min') && so.vertex_bound(vi2, axis as any).endsWith('_min'))
						: false;
					draw(this.midpoint(projected[vi], projected[vi2]), mid_dead, vi, vi2);
				}
				break;
			}
		}
	}

	/** Check if a screen-space dot is occluded by any front-facing face.
	 *  Unlike edge occlusion, does NOT skip same-object faces — a dot on the
	 *  back face of a box should be red when the front face hides it.
	 *  Coplanar vertices (on the occluding face itself) pass through naturally. */
	private is_dot_occluded(sx: number, sy: number, world_pos: vec3): boolean {
		const candidates = this.occluding_index
			? this.occluding_index.search(sx, sy, sx, sy)
			: this.occluding_faces.map((_, i) => i);
		for (const fi of candidates) {
			const occ = this.occluding_faces[fi];
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
		if (face.length < 3) return Infinity;
		const p0 = projected[face[0]], p1 = projected[face[1]], p2 = projected[face[2]];
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
