import { distance_point_to_segment_2d, get_last_uniface_placement_result } from '../render/Dimension_Placement';
import type Smart_Object from '../runtime/Smart_Object';
import type { Projected } from '../types/Interfaces';
import { mat4, quat, vec3, vec4 } from 'gl-matrix';
import { dimensions } from '../editors/Dimension';
import { selection } from '../managers/Selection';
import { T_Hit_3D } from '../types/Enumerations';
import { stale_writable } from '../common/Dirty';
import type { Axis_Name } from '../types/Types';
import { angulars } from '../editors/Angular';
import { Point } from '../types/Coordinates';
import { stores } from '../managers/Stores';
import { camera } from '../render/Camera';
import { k } from '../common/Constants';
import { get } from 'svelte/store';

export type Uniface_Placement_Entry = ReturnType<typeof get_last_uniface_placement_result>['placements'][number];

export interface Hit_3D_Result {
	so: Smart_Object;
	type: T_Hit_3D;
	index: number;
}

interface Cache {
	projected: Projected[];
	world: mat4;
	bbox: { minX: number; minY: number; maxX: number; maxY: number };
}

class Hits_3D {
	private objects: Smart_Object[] = [];
	private cache: Map<string, Cache> = new Map();

	corner_radius = 8;
	edge_radius = 5;

	w_hover = stale_writable<Hit_3D_Result | null>(null);

	get hover(): Hit_3D_Result | null { return get(this.w_hover); }
	set hover(result: Hit_3D_Result | null) { this.w_hover.set(result); }

	// The dimension under the cursor (smart object + axis), so the renderer can
	// bold the text and thicken the dimension and witness lines for that one.
	// Set whenever the cursor is over a dimensional's label OR any of its lines
	// (see hit_test). witness_index is one-based and undefined for a label hit.
	w_hovered_dimension = stale_writable<{ so: Smart_Object; axis: Axis_Name; witness_index?: number } | null>(null);

	get hovered_dimension(): { so: Smart_Object; axis: Axis_Name; witness_index?: number } | null { return get(this.w_hovered_dimension); }
	set hovered_dimension(d: { so: Smart_Object; axis: Axis_Name; witness_index?: number } | null) { this.w_hovered_dimension.set(d); }

	// The uniface-path pick whose dim line OR witness lines lie within 3
	// pixels of the cursor. Set by hit_test on every mouse-move; read by
	// the dimension renderer to draw the matched pick's three lines and
	// the measured part's outline in red.
	w_hovered_uniface_placement = stale_writable<Uniface_Placement_Entry | null>(null);

	get hovered_uniface_placement(): Uniface_Placement_Entry | null { return get(this.w_hovered_uniface_placement); }
	set hovered_uniface_placement(p: Uniface_Placement_Entry | null) { this.w_hovered_uniface_placement.set(p); }

	// What the cursor is over within a dimensional: its label, one of its lines,
	// or neither. Drives the state-dependent hover rule (hover_highlight_so_id).
	w_hovered_dim_target = stale_writable<'label' | 'line' | null>(null);

	get hovered_dim_target(): 'label' | 'line' | null { return get(this.w_hovered_dim_target); }
	set hovered_dim_target(t: 'label' | 'line' | null) { this.w_hovered_dim_target.set(t); }

	// The axis a hovered edge (its midpoint drag dot) runs along, so the floating
	// tag can name that axis — the same axis a dimensional along that edge shows.
	w_hovered_edge_axis = stale_writable<Axis_Name | null>(null);

	get hovered_edge_axis(): Axis_Name | null { return get(this.w_hovered_edge_axis); }
	set hovered_edge_axis(a: Axis_Name | null) { this.w_hovered_edge_axis.set(a); }

	/** The single part to draw in the hover color, by state:
	 *  - hovering a dim LABEL highlights that part, unless it is being edited;
	 *  - hovering a dim LINE or the part BODY highlights it, unless it is
	 *    selected and not being edited.
	 *  Returns null when nothing should be hover-highlighted. */
	get hover_highlight_so_id(): string | null {
		const target = this.hovered_dim_target;
		const dim_so = this.hovered_dimension?.so ?? null;
		const body_so = this.hover?.so ?? null;
		const editing_so = dimensions.state?.so ?? null;
		if (target === 'label' && dim_so) {
			return dim_so === editing_so ? null : dim_so.id;
		}
		const part = (target === 'line' ? dim_so : null) ?? body_so;
		if (!part) return null;
		const is_selected = selection.contains(part);
		const is_editing = part === editing_so;
		return (!is_selected || is_editing) ? part.id : null;
	}

	get_projected(scene_id: string): Projected[] | undefined {
		return this.cache.get(scene_id)?.projected;
	}

	get_bbox(scene_id: string): { minX: number; minY: number; maxX: number; maxY: number } | undefined {
		return this.cache.get(scene_id)?.bbox;
	}

	/** Clear all registrations and caches (for HMR re-mount). */
	clear() {
		this.objects = [];
		this.cache.clear();
		this.w_hover.set(null);
		this.w_hovered_dimension.set(null);
		this.w_hovered_uniface_placement.set(null);
		this.w_hovered_edge_axis.set(null);
		selection.current = null;
	}

	register(so: Smart_Object) {
		if (!this.objects.includes(so)) {
			this.objects.push(so);
		}
	}

	unregister(so: Smart_Object) {
		const idx = this.objects.indexOf(so);
		if (idx !== -1) {
			this.objects.splice(idx, 1);
			if (so.scene) this.cache.delete(so.scene.id);
		}
	}

	update_projected(scene_id: string, projected: Projected[], world: mat4) {
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (const p of projected) {
			if (p.w < 0) continue;
			minX = Math.min(minX, p.x);
			minY = Math.min(minY, p.y);
			maxX = Math.max(maxX, p.x);
			maxY = Math.max(maxY, p.y);
		}
		this.cache.set(scene_id, { projected, world, bbox: { minX, minY, maxX, maxY } });
		this.check_face_flip(scene_id, projected);
	}

	private check_face_flip(scene_id: string, _projected: Projected[]): void {
		const sel = selection.current;
		if (!sel || sel.type !== T_Hit_3D.face || !sel.so.scene?.faces) return;
		if (sel.so.scene.id !== scene_id) return;

		// Always track most front-facing face (6 quat transforms, scratch buffers, no allocs)
		const best = this.front_most_face(sel.so);
		if (best >= 0 && best !== sel.index) {
			selection.current = { so: sel.so, type: T_Hit_3D.face, index: best };
		}
	}

	hit_test(point: Point, option_down: boolean = false): Hit_3D_Result | null {
		const selected_so = selection.current?.so ?? null;

		// Evaluate uniface-line proximity FIRST so the renderer's red
		// highlight store is updated on every hover regardless of what
		// the rest of the hit-test returns. Otherwise a dim or angle
		// short-circuit below leaves a stale uniface-pick in the store
		// and the previous hover target never un-hovers. Runs regardless
		// of the dimensions toggle: when the toggle is off, the only
		// placements in the search result are those for selected parts
		// (eligibility rule 2.1.2), so the hit test naturally only finds
		// hits on the dimensionals that are actually drawn.
		const uniface_hit = this.test_uniface_lines(point);
		this.w_hovered_uniface_placement.set(uniface_hit);

		// The cursor counts as "over a dimensional" when it is over that
		// dimensional's label OR any of its lines. Fill the hovered-dimension
		// store from either, so the hover pill, the bold text, and the floating
		// tag's "width (x)" all light up over ANY part of a dimensional — even
		// when a part face sits behind it and wins the click below. The label
		// wins over a line when both are under the cursor.
		const dim_label = dimensions.hit_test(point.x, point.y);
		let hovered_dim: { so: Smart_Object; axis: Axis_Name; witness_index?: number } | null = null;
		if (dim_label) {
			hovered_dim = { so: dim_label.so, axis: dim_label.axis, witness_index: dim_label.witness_index };
		} else if (uniface_hit) {
			const so_for_line = this.objects.find(o => o.id === uniface_hit.so_id) ?? null;
			if (so_for_line) hovered_dim = { so: so_for_line, axis: uniface_hit.axis, witness_index: uniface_hit.witness_index };
		}
		this.w_hovered_dimension.set(hovered_dim);
		if (k.debug.diagnose_dims) {
			console.log(`[hover] over dimensional: ${hovered_dim ? `${hovered_dim.so.name} ${hovered_dim.axis}` : 'none'} — label under cursor: ${dim_label ? 'yes' : 'no'}, line under cursor: ${uniface_hit ? 'yes' : 'no'}.`);
		}

		// Dimension / angle labels win over everything (corners, edges,
		// faces) for the click target too. Same reasoning as above — the label
		// rectangles in render.dimension_rects only get pushed for drawn
		// dimensionals, so the hit test is safe without the toggle gate.
		if (dim_label) return { so: dim_label.so, type: T_Hit_3D.dimension, index: 0 };
		if (stores.show_angulars) {
			const ang = angulars.hit_test(point.x, point.y);
			if (ang) return { so: ang.so, type: T_Hit_3D.angle, index: 0 };
		}

		// Selected SO's corners/edges get priority (for resizing through overlap)
		if (selected_so) {
			if (!selected_so.scene) return null;
			const c = this.cache.get(selected_so.scene.id);
			if (c) {
				const corner = this.test_corners(point, c.projected);
				if (corner !== -1) return { so: selected_so, type: T_Hit_3D.corner, index: corner };

				const edge = this.test_edges(point, selected_so, c.projected);
				if (edge !== -1) return { so: selected_so, type: T_Hit_3D.edge, index: edge };
			}
		}

		// Face hits: build a fresh list of every part the click landed on,
		// front to back. One entry per part (the closest front-facing face
		// of that part at the click point). Drill-down rule: if the
		// currently selected part is in the list, return the one right
		// after it, wrapping at the end. Otherwise return the front-most.
		const stack: { result: Hit_3D_Result; z: number }[] = [];
		for (const so of this.objects) {
			if (!so.scene?.faces) continue;
			if (!so.scene.parent) continue; // root is non-interactive
			if (so.visible === false && !option_down) continue; // skip parts marked not visible (unless OPTION is held — then they're hittable)
			if (this.is_repeater_clone(so)) continue; // clones are derived; only the master can be hit
			const c = this.cache.get(so.scene.id);
			if (!c) continue;

			// Quick reject via bbox
			const r = this.corner_radius;
			const b = c.bbox;
			if (point.x < b.minX - r || point.x > b.maxX + r ||
				point.y < b.minY - r || point.y > b.maxY + r) continue;

			let so_best_z = Infinity;
			let so_best_face = -1;
			for (let fi = 0; fi < so.scene.faces.length; fi++) {
				if (this.facing_front(so.scene.faces[fi], c.projected) >= 0) continue;
				if (!this.point_in_polygon(point, so.scene.faces[fi], c.projected)) continue;

				const z = this.face_depth_at(point, so.scene.faces[fi], so, c.world);
				if (z === null) continue;

				if (z < so_best_z) {
					so_best_z = z;
					so_best_face = fi;
				}
			}
			if (so_best_face >= 0) {
				stack.push({ result: { so, type: T_Hit_3D.face, index: so_best_face }, z: so_best_z });
			}
		}

		if (stack.length === 0) {
			// Nothing in the SO stack — fall back to the uniface line hit
			// (if any). This is the LAST resort, so an SO under the cursor
			// always wins over the dim/witness lines that float around it.
			// The hovered-dimension store is already set above (label-or-line),
			// so this branch only needs to return the click target.
			if (uniface_hit) {
				const so_for_hit = this.objects.find(o => o.id === uniface_hit.so_id) ?? null;
				if (so_for_hit) return { so: so_for_hit, type: T_Hit_3D.uniface_line, index: 0 };
			}
			return null;
		}
		stack.sort((a, b) => a.z - b.z);

		if (selected_so) {
			const idx = stack.findIndex(h => h.result.so === selected_so);
			if (idx >= 0) return stack[(idx + 1) % stack.length].result;
		}
		return stack[0].result;
	}

	/** Finds the closest uniface-path placement whose dim line or either
	 *  witness line lies within three pixels of the given point. Returns
	 *  the matched placement, or null when nothing is within reach. The
	 *  test treats each line as a fat segment three pixels wide. */
	private test_uniface_lines(point: Point): Uniface_Placement_Entry | null {
		const result = get_last_uniface_placement_result();
		if (result.placements.length === 0) return null;
		const cursor = { x: point.x, y: point.y };
		const HIT_RADIUS_PX = 10;
		let best: Uniface_Placement_Entry | null = null;
		let best_dist = Infinity;
		for (const placement of result.placements) {
			if (placement.uniface === null) continue;
			if (!placement.edge_p1_screen || !placement.edge_p2_screen) continue;
			if (!placement.anchor_1_screen || !placement.anchor_2_screen) continue;
			const d_dim = distance_point_to_segment_2d(cursor, placement.anchor_1_screen, placement.anchor_2_screen);
			const d_w1  = distance_point_to_segment_2d(cursor, placement.edge_p1_screen, placement.anchor_1_screen);
			const d_w2  = distance_point_to_segment_2d(cursor, placement.edge_p2_screen, placement.anchor_2_screen);
			const d = Math.min(d_dim, d_w1, d_w2);
			if (d < best_dist) { best_dist = d; best = placement; }
		}
		if (best === null || best_dist > HIT_RADIUS_PX) return null;
		return best;
	}

	// Convert corner/edge hit to best face for hover
	hit_to_face(hit: Hit_3D_Result): Hit_3D_Result | null {
		if (hit.type === T_Hit_3D.face) return hit;
		if (!hit.so.scene) return null;

		// Dimension, angle, and uniface-line hits don't point to a specific
		// face — pick the front-most face of the smart object so the hover
		// state still drives the smart object highlight and the name popup.
		if (hit.type === T_Hit_3D.dimension || hit.type === T_Hit_3D.angle || hit.type === T_Hit_3D.uniface_line) {
			const face = this.front_most_face(hit.so);
			return face >= 0 ? { so: hit.so, type: T_Hit_3D.face, index: face } : null;
		}

		const projected = this.cache.get(hit.so.scene.id)?.projected;
		if (!projected) return null;

		const vertices = hit.type === T_Hit_3D.corner
			? [hit.index]
			: hit.so.scene.edges[hit.index];
		const face_index = this.best_face_containing(vertices, hit.so, projected);
		return face_index === -1 ? null : { so: hit.so, type: T_Hit_3D.face, index: face_index };
	}

	// A repeater clone is a 2nd-onward sibling under a parent that has a repeater.
	// The first sibling (the template) is the master; clones are derived from it,
	// so only the master should be hittable/hoverable.
	private is_repeater_clone(so: Smart_Object): boolean {
		const parent = so.scene?.parent?.so;
		if (!parent?.repeater) return false;
		const siblings = this.objects.filter(s => s.scene?.parent?.so === parent);
		return siblings[0] !== so;
	}

	// Scratch allocations for front_most_face (avoid per-frame GC pressure)
	private readonly _scratch_quat = quat.create();
	private readonly _scratch_vec = vec3.create();

	// Find the most front-facing face for a given SO (normal most aligned with camera)
	front_most_face(so: Smart_Object): number {
		if (!so.scene?.faces) return -1;
		const projected = this.cache.get(so.scene.id)?.projected;
		if (!projected) return -1;
		// Compose full orientation: child's own rotation × all ancestor rotations up to root tumble
		const orientation = this.effective_orientation(so, this._scratch_quat);
		let best = -1, best_z = -Infinity;
		for (let i = 0; i < so.scene.faces.length; i++) {
			// Only consider faces that are front-facing (negative winding)
			if (this.facing_front(so.scene.faces[i], projected) >= 0) continue;
			vec3.transformQuat(this._scratch_vec, so.face_normal(i), orientation);
			if (this._scratch_vec[2] > best_z) { best_z = this._scratch_vec[2]; best = i; }
		}
		return best;
	}

	/** Which canonical face (0-5) does this orientation point through? Pure: no cache or scene needed. */
	front_most_face_from_orientation(orientation: quat): number {
		const inv = quat.conjugate(quat.create(), orientation);
		const v = vec3.transformQuat(vec3.create(), vec3.fromValues(0, 0, 1), inv);
		const ax = Math.abs(v[0]);
		const ay = Math.abs(v[1]);
		const az = Math.abs(v[2]);
		if (ax >= ay && ax >= az) return v[0] > 0 ? 3 : 2;
		if (ay >= az) return v[1] > 0 ? 4 : 5;
		return v[2] > 0 ? 1 : 0;
	}

	// Opposite face from front_most_face (face pairs: 0/1, 2/3, 4/5)
	back_most_face(so: Smart_Object): number {
		const front = this.front_most_face(so);
		return front < 0 ? -1 : front ^ 1;
	}

	/** Compose effective orientation into `out`: walk up parent chain, composing each SO's
	 *  orientation, with root tumble (from store) at the top. */
	private effective_orientation(so: Smart_Object, out: quat): quat {
		if (!so.scene?.parent) return stores.current_orientation();
		const parent_orient = this.effective_orientation(so.scene.parent.so, out);
		quat.multiply(out, parent_orient, so.orientation);
		return out;
	}

	// ===== Hit tests =====

	private test_corners(point: Point, projected: Projected[]): number {
		const r2 = this.corner_radius * this.corner_radius;
		for (let i = 0; i < projected.length; i++) {
			const p = projected[i];
			if (p.w < 0) continue;
			const dx = point.x - p.x, dy = point.y - p.y;
			if (dx * dx + dy * dy < r2) return i;
		}
		return -1;
	}

	private test_edges(point: Point, so: Smart_Object, projected: Projected[]): number {
		if (!so.scene) return -1;
		const r2 = this.edge_radius * this.edge_radius;
		let best = -1;
		let best_dist = r2;
		for (let i = 0; i < so.scene.edges.length; i++) {
			const [a, b] = so.scene.edges[i];
			const pa = projected[a], pb = projected[b];
			if (pa.w < 0 || pb.w < 0) continue;
			const d = this.proximity(point, pa, pb);
			if (d < best_dist) {
				best_dist = d;
				best = i;
			}
		}
		return best;
	}

	// ===== Depth =====

	/** Projected z of the mouse ray's intersection with a face plane.
	 *  Uses camera ray → world-space face plane intersection → MVP projection. */
	face_depth_at(point: { x: number; y: number }, face: number[], so: Smart_Object, world: mat4): number | null {
		const verts = so.vertices;

		// Build face plane in world space from first 3 vertices
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

		// Ray through mouse point
		const ray = camera.screen_to_ray(point.x, point.y);
		const denom = vec3.dot(ray.dir, n);
		if (Math.abs(denom) < 0.0001) return null;

		const diff = vec3.create();
		vec3.subtract(diff, corners[0], ray.origin);
		const t = vec3.dot(diff, n) / denom;
		if (t < 0) return null;

		// World-space intersection point
		const hit = vec3.create();
		vec3.scaleAndAdd(hit, ray.origin, ray.dir, t);

		// Project to clip space to get z
		const vp = mat4.create();
		mat4.multiply(vp, camera.projection, camera.view);
		const clip = vec4.create();
		vec4.transformMat4(clip, [hit[0], hit[1], hit[2], 1], vp);
		return clip[2] / clip[3]; // NDC z
	}

	// ===== Geometry helpers =====

	private facing_front(face: number[], projected: Projected[]): number {
		if (face.length < 3) return Infinity;
		const p0 = projected[face[0]], p1 = projected[face[1]], p2 = projected[face[2]];
		if (p0.w < 0 || p1.w < 0 || p2.w < 0) return Infinity;
		return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
	}

	private best_face_containing(vertices: number[], so: Smart_Object, projected: Projected[]): number {
		if (!so.scene?.faces) return -1;
		let best = -1, best_cross = Infinity;
		for (let i = 0; i < so.scene.faces.length; i++) {
			const face = so.scene.faces[i];
			if (!vertices.every(v => face.includes(v))) continue;
			const cross = this.facing_front(face, projected);
			if (cross < best_cross) { best_cross = cross; best = i; }
		}
		return best_cross < 0 ? best : -1;
	}

	private proximity(point: Point, a: Projected, b: Projected): number {
		const dx = b.x - a.x, dy = b.y - a.y;
		const len_sq = dx * dx + dy * dy;
		if (len_sq === 0) return Infinity;
		const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len_sq));
		const px = a.x + t * dx, py = a.y + t * dy;
		return (point.x - px) ** 2 + (point.y - py) ** 2;
	}

	private point_in_polygon(point: Point, face: number[], projected: Projected[]): boolean {
		let inside = false;
		const n = face.length;
		for (let i = 0, j = n - 1; i < n; j = i++) {
			const pi = projected[face[i]], pj = projected[face[j]];
			if (pi.w < 0 || pj.w < 0) return false;
			if (((pi.y > point.y) !== (pj.y > point.y)) &&
				(point.x < (pj.x - pi.x) * (point.y - pi.y) / (pj.y - pi.y) + pi.x)) {
				inside = !inside;
			}
		}
		return inside;
	}
}

export const hits_3d = new Hits_3D();
