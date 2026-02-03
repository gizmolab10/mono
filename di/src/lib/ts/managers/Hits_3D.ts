import type Smart_Object from '../runtime/Smart_Object';
import type { Projected } from '../types/Interfaces';
import { T_Hit_3D } from '../types/Enumerations';
import { Point } from '../types/Coordinates';
import { writable, get } from 'svelte/store';

export interface Hit_3D_Result {
	so: Smart_Object;
	type: T_Hit_3D;
	index: number;
}

class Hits_3D {
	private objects: Smart_Object[] = [];
	private scene_to_so: Map<string, Smart_Object> = new Map();
	private projected_cache: Map<string, Projected[]> = new Map();

	corner_radius = 8;
	edge_radius = 5;

	w_hover = writable<Hit_3D_Result | null>(null);
	w_selection = writable<Hit_3D_Result | null>(null);

	get hover(): Hit_3D_Result | null { return get(this.w_hover); }
	get selection(): Hit_3D_Result | null { return get(this.w_selection); }

	set_hover(result: Hit_3D_Result | null) {
		this.w_hover.set(result);
	}

	set_selection(result: Hit_3D_Result | null) {
		this.w_selection.set(result);
	}

	get_projected(scene_id: string): Projected[] | undefined {
		return this.projected_cache.get(scene_id);
	}

	register(so: Smart_Object) {
		if (!this.objects.includes(so)) {
			this.objects.push(so);
			if (so.scene) {
				this.scene_to_so.set(so.scene.id, so);
			}
		}
	}

	unregister(so: Smart_Object) {
		const idx = this.objects.indexOf(so);
		if (idx !== -1) {
			this.objects.splice(idx, 1);
			if (so.scene) {
				this.scene_to_so.delete(so.scene.id);
				this.projected_cache.delete(so.scene.id);
			}
		}
	}

	update_projected(scene_id: string, projected: Projected[]) {
		this.projected_cache.set(scene_id, projected);
		this.check_face_flip(scene_id, projected);
	}

	private check_face_flip(scene_id: string, projected: Projected[]): void {
		const sel = this.selection;
		if (!sel || sel.type !== T_Hit_3D.face || !sel.so.scene?.faces) return;
		if (sel.so.scene.id !== scene_id) return; // only check for selected SO

		const face = sel.so.scene.faces[sel.index];
		if (this.is_front_facing(face, projected)) return; // still visible

		// Switch to opposite face (assumes paired faces: 0↔1, 2↔3, 4↔5)
		const opposite_index = sel.index ^ 1;
		if (opposite_index < sel.so.scene.faces.length) {
			const opposite_face = sel.so.scene.faces[opposite_index];
			if (this.is_front_facing(opposite_face, projected)) {
				this.set_selection({ so: sel.so, type: T_Hit_3D.face, index: opposite_index });
			}
		}
	}

	test(point: Point): Hit_3D_Result | null {
		for (const so of this.objects) {
			if (!so.scene) continue;
			const projected = this.projected_cache.get(so.scene.id);
			if (!projected) continue;

			const corner = this.test_corners(point, projected);
			if (corner !== -1) {
				return { so, type: T_Hit_3D.corner, index: corner };
			}

			const edge = this.test_edges(point, so, projected);
			if (edge !== -1) {
				return { so, type: T_Hit_3D.edge, index: edge };
			}

			const face = this.test_faces(point, so, projected);
			if (face !== -1) {
				return { so, type: T_Hit_3D.face, index: face };
			}
		}
		return null;
	}

	private test_corners(point: Point, projected: Projected[]): number {
		for (let i = 0; i < projected.length; i++) {
			const p = projected[i];
			if (p.w < 0) continue;
			const dx = point.x - p.x;
			const dy = point.y - p.y;
			if (dx * dx + dy * dy < this.corner_radius * this.corner_radius) {
				return i;
			}
		}
		return -1;
	}

	private test_edges(point: Point, so: Smart_Object, projected: Projected[]): number {
		if (!so.scene) return -1;
		for (let i = 0; i < so.scene.edges.length; i++) {
			const [a, b] = so.scene.edges[i];
			const pa = projected[a], pb = projected[b];
			if (pa.w < 0 || pb.w < 0) continue;
			if (this.point_near_segment(point, pa, pb, this.edge_radius)) {
				return i;
			}
		}
		return -1;
	}

	private point_near_segment(point: Point, a: Projected, b: Projected, radius: number): boolean {
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const len_sq = dx * dx + dy * dy;
		if (len_sq === 0) return false;
		const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len_sq));
		const proj_x = a.x + t * dx;
		const proj_y = a.y + t * dy;
		const dist_sq = (point.x - proj_x) ** 2 + (point.y - proj_y) ** 2;
		return dist_sq < radius * radius;
	}

	private test_faces(point: Point, so: Smart_Object, projected: Projected[]): number {
		if (!so.scene?.faces) return -1;
		for (let i = 0; i < so.scene.faces.length; i++) {
			const face = so.scene.faces[i];
			if (!this.is_front_facing(face, projected)) continue;
			if (this.point_in_polygon(point, face, projected)) {
				return i;
			}
		}
		return -1;
	}

	// CCW winding in screen space (y-down) means normal points toward camera
	private is_front_facing(face: number[], projected: Projected[]): boolean {
		if (face.length < 3) return false;
		const p0 = projected[face[0]];
		const p1 = projected[face[1]];
		const p2 = projected[face[2]];
		if (p0.w < 0 || p1.w < 0 || p2.w < 0) return false;
		// 2D cross product: (p1-p0) × (p2-p0)
		// Positive = CCW in screen coords (y-down) = front-facing
		const cross = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
		return cross < 0;
	}

	// Ray casting point-in-polygon
	private point_in_polygon(point: Point, face: number[], projected: Projected[]): boolean {
		let inside = false;
		const n = face.length;
		for (let i = 0, j = n - 1; i < n; j = i++) {
			const pi = projected[face[i]];
			const pj = projected[face[j]];
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
