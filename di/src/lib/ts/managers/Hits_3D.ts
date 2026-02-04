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

interface Cache {
	projected: Projected[];
	bbox: { minX: number; minY: number; maxX: number; maxY: number };
}

class Hits_3D {
	private objects: Smart_Object[] = [];
	private cache: Map<string, Cache> = new Map();

	corner_radius = 8;
	edge_radius = 5;

	w_hover = writable<Hit_3D_Result | null>(null);
	w_selection = writable<Hit_3D_Result | null>(null);

	get hover(): Hit_3D_Result | null { return get(this.w_hover); }
	get selection(): Hit_3D_Result | null { return get(this.w_selection); }

	set_hover(result: Hit_3D_Result | null) { this.w_hover.set(result); }
	set_selection(result: Hit_3D_Result | null) { this.w_selection.set(result); }

	get_projected(scene_id: string): Projected[] | undefined {
		return this.cache.get(scene_id)?.projected;
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

	update_projected(scene_id: string, projected: Projected[]) {
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (const p of projected) {
			if (p.w < 0) continue;
			minX = Math.min(minX, p.x);
			minY = Math.min(minY, p.y);
			maxX = Math.max(maxX, p.x);
			maxY = Math.max(maxY, p.y);
		}
		this.cache.set(scene_id, { projected, bbox: { minX, minY, maxX, maxY } });
		this.check_face_flip(scene_id, projected);
	}

	private check_face_flip(scene_id: string, projected: Projected[]): void {
		const sel = this.selection;
		if (!sel || sel.type !== T_Hit_3D.face || !sel.so.scene?.faces) return;
		if (sel.so.scene.id !== scene_id) return;

		if (this.facing_front(sel.so.scene.faces[sel.index], projected) < 0) return;

		// Switch to opposite face (paired: 0↔1, 2↔3, 4↔5)
		const opp = sel.index ^ 1;
		if (opp < sel.so.scene.faces.length && this.facing_front(sel.so.scene.faces[opp], projected) < 0) {
			this.set_selection({ so: sel.so, type: T_Hit_3D.face, index: opp });
		}
	}

	test(point: Point): Hit_3D_Result | null {
		for (const so of this.objects) {
			if (!so.scene) continue;
			const c = this.cache.get(so.scene.id);
			if (!c) continue;

			// Quick reject via bbox
			const r = this.corner_radius;
			const b = c.bbox;
			if (point.x < b.minX - r || point.x > b.maxX + r ||
				point.y < b.minY - r || point.y > b.maxY + r) continue;

			const corner = this.test_corners(point, c.projected);
			if (corner !== -1) return { so, type: T_Hit_3D.corner, index: corner };

			const edge = this.test_edges(point, so, c.projected);
			if (edge !== -1) return { so, type: T_Hit_3D.edge, index: edge };

			const face = this.test_faces(point, so, c.projected);
			if (face !== -1) return { so, type: T_Hit_3D.face, index: face };
		}
		return null;
	}

	// Convert corner/edge hit to best face for hover
	hit_to_face(hit: Hit_3D_Result): Hit_3D_Result | null {
		if (hit.type === T_Hit_3D.face) return hit;
		if (!hit.so.scene) return null;
		const projected = this.cache.get(hit.so.scene.id)?.projected;
		if (!projected) return null;

		const vertices = hit.type === T_Hit_3D.corner
			? [hit.index]
			: hit.so.scene.edges[hit.index];
		const face_index = this.best_face_containing(vertices, hit.so, projected);
		return face_index === -1 ? null : { so: hit.so, type: T_Hit_3D.face, index: face_index };
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
		for (let i = 0; i < so.scene.edges.length; i++) {
			const [a, b] = so.scene.edges[i];
			const pa = projected[a], pb = projected[b];
			if (pa.w < 0 || pb.w < 0) continue;
			if (this.proximity(point, pa, pb) < r2) return i;
		}
		return -1;
	}

	private test_faces(point: Point, so: Smart_Object, projected: Projected[]): number {
		if (!so.scene?.faces) return -1;
		for (let i = 0; i < so.scene.faces.length; i++) {
			const face = so.scene.faces[i];
			if (this.facing_front(face, projected) >= 0) continue;
			if (this.point_in_polygon(point, face, projected)) return i;
		}
		return -1;
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
