import { quat } from 'gl-matrix';
import type { O_Scene } from '../types/Interfaces';
import type { Dictionary } from '../types/Types';
import { Point3 } from '../types/Coordinates';
import Attribute from '../types/Attribute';
import { compile } from '../algebra/Compiler';
import Identifiable from './Identifiable';

// Bounds: min/max for each axis
export type Bound = 'x_min' | 'x_max' | 'y_min' | 'y_max' | 'z_min' | 'z_max';
export type Axis = 'x' | 'y' | 'z';

export default class Smart_Object extends Identifiable {
	attributes_dict_byName: Dictionary<Attribute> = {};
	orientation: quat = quat.create();
	/** When true (default), rotating preserves angle and length. When false (variable), orientation is recomputed from bounds after propagation. */
	fixed: boolean = true;
	scene: O_Scene | null;
	name: string;

	constructor(name: string = '', scene: O_Scene | null = null) {
		super();
		this.name = name;
		this.scene = scene;
		this.setup();
	}

	get hasScene(): boolean { return !!this.scene; }

	setup() {
		for (const name of ['x_min', 'x_max', 'y_min', 'y_max', 'z_min', 'z_max']) {
			this.attributes_dict_byName[name] = new Attribute(name);
		}
		// Default: 1'×2'×3' box centered at origin (stored in mm)
		this.set_bound('x_min', -152.4); this.set_bound('x_max', 152.4);
		this.set_bound('y_min', -304.8); this.set_bound('y_max', 304.8);
		this.set_bound('z_min', -457.2); this.set_bound('z_max', 457.2);
	}

	// ═══════════════════════════════════════════════════════════════════
	// BOUND ACCESSORS
	// ═══════════════════════════════════════════════════════════════════

	get_bound(bound: Bound): number {
		return this.attributes_dict_byName[bound]?.value ?? 0;
	}

	set_bound(bound: Bound, value: number): void {
		const attr = this.attributes_dict_byName[bound];
		if (attr) attr.value = value;
	}

	get x_min(): number { return this.get_bound('x_min'); }
	get x_max(): number { return this.get_bound('x_max'); }
	get y_min(): number { return this.get_bound('y_min'); }
	get y_max(): number { return this.get_bound('y_max'); }
	get z_min(): number { return this.get_bound('z_min'); }
	get z_max(): number { return this.get_bound('z_max'); }

	set x_min(v: number) { this.set_bound('x_min', v); }
	set x_max(v: number) { this.set_bound('x_max', v); }
	set y_min(v: number) { this.set_bound('y_min', v); }
	set y_max(v: number) { this.set_bound('y_max', v); }
	set z_min(v: number) { this.set_bound('z_min', v); }
	set z_max(v: number) { this.set_bound('z_max', v); }

	// Derived dimensions (for convenience)
	get width(): number { return this.x_max - this.x_min; }
	get height(): number { return this.y_max - this.y_min; }
	get depth(): number { return this.z_max - this.z_min; }

	// ═══════════════════════════════════════════════════════════════════
	// VERTEX GENERATION
	// ═══════════════════════════════════════════════════════════════════

	// Generate cube vertices directly from bounds
	// Vertex order:
	//   0-3: front face (z_min), 4-7: back face (z_max)
	//   Within each face: (x_min,y_min), (x_max,y_min), (x_max,y_max), (x_min,y_max)
	// NOTE: Uses actual min/max to keep topology consistent even when bounds cross
	get vertices(): Point3[] {
		const xLo = Math.min(this.x_min, this.x_max), xHi = Math.max(this.x_min, this.x_max);
		const yLo = Math.min(this.y_min, this.y_max), yHi = Math.max(this.y_min, this.y_max);
		const zLo = Math.min(this.z_min, this.z_max), zHi = Math.max(this.z_min, this.z_max);
		return [
			new Point3(xLo, yLo, zLo), new Point3(xHi, yLo, zLo), new Point3(xHi, yHi, zLo), new Point3(xLo, yHi, zLo),
			new Point3(xLo, yLo, zHi), new Point3(xHi, yLo, zHi), new Point3(xHi, yHi, zHi), new Point3(xLo, yHi, zHi),
		];
	}

	// ═══════════════════════════════════════════════════════════════════
	// TOPOLOGY HELPERS
	// ═══════════════════════════════════════════════════════════════════

	edge_vertices(edge_index: number): [number, number] {
		if (!this.scene) return [0, 0];
		return this.scene.edges[edge_index] ?? [0, 0];
	}

	face_vertices(face_index: number): number[] {
		if (!this.scene?.faces) return [];
		return this.scene.faces[face_index] ?? [];
	}

	corner_in_face(corner_index: number, face_index: number): boolean {
		return this.face_vertices(face_index).includes(corner_index);
	}

	edge_in_face(edge_index: number, face_index: number): boolean {
		const [a, b] = this.edge_vertices(edge_index);
		const face = this.face_vertices(face_index);
		return face.includes(a) && face.includes(b);
	}

	// ═══════════════════════════════════════════════════════════════════
	// BOUND-CENTRIC GEOMETRY
	// Each vertex is at a specific bound on each axis (min or max).
	// Dragging moves only the bounds that vertex touches.
	// ═══════════════════════════════════════════════════════════════════

	// Face normals by index (matches cube_faces in Setup.ts)
	// 0: front (z_min), 1: back (z_max), 2: left (x_min), 3: right (x_max), 4: top (y_max), 5: bottom (y_min)
	private static readonly FACE_NORMALS: Point3[] = [
		new Point3(0, 0, -1), new Point3(0, 0, 1),
		new Point3(-1, 0, 0), new Point3(1, 0, 0),
		new Point3(0, 1, 0), new Point3(0, -1, 0),
	];

	face_normal(face_index: number): Point3 {
		return Smart_Object.FACE_NORMALS[face_index] ?? new Point3(0, 0, 1);
	}

	// Which axis is perpendicular to this face?
	face_fixed_axis(face_index: number): Axis {
		const axes: Axis[] = ['z', 'z', 'x', 'x', 'y', 'y'];
		return axes[face_index] ?? 'z';
	}

	// Which 2 axes does this face allow editing?
	face_axes(face_index: number): [Axis, Axis] {
		const fixed = this.face_fixed_axis(face_index);
		const all: Axis[] = ['x', 'y', 'z'];
		return all.filter(a => a !== fixed) as [Axis, Axis];
	}

	// Unit vector for an axis
	axis_vector(axis: Axis): Point3 {
		switch (axis) {
			case 'x': return new Point3(1, 0, 0);
			case 'y': return new Point3(0, 1, 0);
			case 'z': return new Point3(0, 0, 1);
		}
	}

	// Which bound does this vertex touch on a given axis?
	// Vertex layout: 0-3 at z_min, 4-7 at z_max
	//   0,4: x_min,y_min  1,5: x_max,y_min  2,6: x_max,y_max  3,7: x_min,y_max
	vertex_bound(vertex_index: number, axis: Axis): Bound {
		const v = vertex_index % 4;  // 0-3 pattern repeats for front/back
		switch (axis) {
			case 'x': return (v === 0 || v === 3) ? 'x_min' : 'x_max';
			case 'y': return (v === 0 || v === 1) ? 'y_min' : 'y_max';
			case 'z': return vertex_index < 4 ? 'z_min' : 'z_max';
		}
	}

	// ═══════════════════════════════════════════════════════════════════
	// EDGE EDITING
	// Dragging an edge moves 1 bound (the bound shared by both endpoints).
	// ═══════════════════════════════════════════════════════════════════

	// Which axis does this edge run along?
	edge_along_axis(edge_index: number): Axis {
		const [a, b] = this.edge_vertices(edge_index);
		const verts = this.vertices;
		const va = verts[a], vb = verts[b];
		const dx = Math.abs(vb.x - va.x);
		const dy = Math.abs(vb.y - va.y);
		const dz = Math.abs(vb.z - va.z);
		if (dx >= dy && dx >= dz) return 'x';
		if (dy >= dx && dy >= dz) return 'y';
		return 'z';
	}

	// Which axis does dragging this edge change? (the face axis that's not the edge's axis)
	edge_changes_axis(edge_index: number, face_index: number): Axis {
		const face_axes = this.face_axes(face_index);
		const edge_along = this.edge_along_axis(edge_index);
		return face_axes.find(a => a !== edge_along) ?? face_axes[0];
	}

	// Which bound does dragging this edge move?
	edge_bound(edge_index: number, face_index: number): Bound {
		const axis = this.edge_changes_axis(edge_index, face_index);
		const [a] = this.edge_vertices(edge_index);
		return this.vertex_bound(a, axis);
	}

	// Apply edge drag: moves 1 bound
	apply_edge_drag(edge_index: number, face_index: number, local_delta: Point3): void {
		const axis = this.edge_changes_axis(edge_index, face_index);
		const bound = this.edge_bound(edge_index, face_index);
		const axis_vec = this.axis_vector(axis);
		const amount = local_delta.dot(axis_vec);

		const current = this.get_bound(bound);
		const opposite = bound.endsWith('_min')
			? this.get_bound(bound.replace('_min', '_max') as Bound)
			: this.get_bound(bound.replace('_max', '_min') as Bound);

		// Clamp: don't let min exceed max (leave 0.1 gap)
		const is_min = bound.endsWith('_min');
		const new_value = is_min
			? Math.min(current + amount, opposite - 0.1)
			: Math.max(current + amount, opposite + 0.1);

		this.set_bound(bound, new_value);
	}

	// ═══════════════════════════════════════════════════════════════════
	// CORNER EDITING
	// Dragging a corner moves 2 bounds (the bounds that vertex touches on the face's axes).
	// ═══════════════════════════════════════════════════════════════════

	// Apply corner drag: moves 2 bounds
	apply_corner_drag(corner_index: number, face_index: number, local_delta: Point3): void {
		const axes = this.face_axes(face_index);

		for (const axis of axes) {
			const bound = this.vertex_bound(corner_index, axis);
			const axis_vec = this.axis_vector(axis);
			const amount = local_delta.dot(axis_vec);

			const current = this.get_bound(bound);
			const opposite = bound.endsWith('_min')
				? this.get_bound(bound.replace('_min', '_max') as Bound)
				: this.get_bound(bound.replace('_max', '_min') as Bound);

			// Clamp: don't let min exceed max
			const is_min = bound.endsWith('_min');
			const new_value = is_min
				? Math.min(current + amount, opposite - 0.1)
				: Math.max(current + amount, opposite + 0.1);

			this.set_bound(bound, new_value);
		}
	}

	// ═══════════════════════════════════════════════════════════════════
	// SERIALIZATION
	// ═══════════════════════════════════════════════════════════════════

	serialize(): { name: string; bounds: Record<Bound, number>; orientation: number[]; scale: number; fixed?: boolean; formulas?: Record<string, string> } {
		const formulas: Record<string, string> = {};
		for (const attr of Object.values(this.attributes_dict_byName)) {
			if (attr.formula) formulas[attr.name] = attr.formula;
		}
		return {
			name: this.name,
			bounds: {
				x_min: this.x_min, x_max: this.x_max,
				y_min: this.y_min, y_max: this.y_max,
				z_min: this.z_min, z_max: this.z_max,
			},
			orientation: Array.from(this.orientation),
			scale: this.scene?.scale ?? 1,
			...(!this.fixed ? { fixed: false } : {}),
			...(Object.keys(formulas).length > 0 ? { formulas } : {}),
		};
	}

	static deserialize(data: { name: string; bounds: Record<Bound, number>; orientation?: number[]; scale?: number; fixed?: boolean; formulas?: Record<string, string> }): { so: Smart_Object; scale: number } {
		const so = new Smart_Object(data.name);
		for (const [key, value] of Object.entries(data.bounds)) {
			so.set_bound(key as Bound, value);
		}
		if (data.orientation) {
			quat.set(so.orientation, data.orientation[0], data.orientation[1], data.orientation[2], data.orientation[3]);
		}
		if (data.fixed === false) so.fixed = false;
		if (data.formulas) {
			for (const [bound, formula] of Object.entries(data.formulas)) {
				const attr = so.attributes_dict_byName[bound];
				if (attr) {
					attr.formula = formula;
					try { attr.compiled = compile(formula); } catch { /* skip bad formulas */ }
				}
			}
		}
		return { so, scale: data.scale ?? 1 };
	}
}
