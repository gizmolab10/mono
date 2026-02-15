import type { O_Scene } from '../types/Interfaces';
import type { Dictionary } from '../types/Types';
import Axis, { type Axis_Name } from './Axis';
import { mat3, quat, vec3 } from 'gl-matrix';
import Attribute from '../types/Attribute';
import Identifiable from './Identifiable';
import { compiler } from '../algebra';

// Bounds: min/max for each axis
export type Bound = 'x_min' | 'x_max' | 'y_min' | 'y_max' | 'z_min' | 'z_max';

export interface Rotation_Entry { axis: Axis_Name; angle: number }

/** Serialized per-axis bundle — structurally matches Portable_Axis in Scenes.ts */
export interface Serialized_Axis {
	start: number;
	end: number;
	invariant?: number;
	rotation?: number;
	formulas?: { start?: string; end?: string };
}

export default class Smart_Object extends Identifiable {
	axes: Axis[] = [new Axis('x'), new Axis('y'), new Axis('z')];
	attributes_dict_byName: Dictionary<Attribute> = {};
	orientation: quat = quat.create();
	rotations: Rotation_Entry[] = [];
	fixed: boolean = true;	// When true (default), rotating preserves angle and length. When false (variable), orientation is recomputed from bounds after propagation
	scene: O_Scene | null;
	locked: number = 0;
	name: string;

	// Snap callback — set by Setup to snap mm values to the current precision grid. */
	static snap: (mm: number) => number = (v) => v;

	constructor(name: string = '', scene: O_Scene | null = null) {
		super();
		this.name = name;
		this.scene = scene;
		this.setup();
	}

	get hasScene(): boolean { return !!this.scene; }

	/** Axis accessors by name */
	get x_axis(): Axis { return this.axes[0]; }
	get y_axis(): Axis { return this.axes[1]; }
	get z_axis(): Axis { return this.axes[2]; }

	axis_by_name(name: Axis_Name): Axis {
		return name === 'x' ? this.axes[0] : name === 'y' ? this.axes[1] : this.axes[2];
	}

	setup() {
		// Populate attributes_dict_byName from Axis attributes (start + end only)
		for (const axis of this.axes) {
			this.attributes_dict_byName[axis.start.name] = axis.start;
			this.attributes_dict_byName[axis.end.name]   = axis.end;
		}
		// Default: 1"×2"×3" box centered at origin (stored in mm)
		// this.set_bound('x_min', -12.7); this.set_bound('x_max', 12.7);
		// this.set_bound('y_min', -25.4); this.set_bound('y_max', 25.4);
		// this.set_bound('z_min', -38.1); this.set_bound('z_max', 38.1);
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
	get vertices(): vec3[] {
		const xLo = Math.min(this.x_min, this.x_max), xHi = Math.max(this.x_min, this.x_max);
		const yLo = Math.min(this.y_min, this.y_max), yHi = Math.max(this.y_min, this.y_max);
		const zLo = Math.min(this.z_min, this.z_max), zHi = Math.max(this.z_min, this.z_max);
		return [
			vec3.fromValues(xLo, yLo, zLo), vec3.fromValues(xHi, yLo, zLo), vec3.fromValues(xHi, yHi, zLo), vec3.fromValues(xLo, yHi, zLo),
			vec3.fromValues(xLo, yLo, zHi), vec3.fromValues(xHi, yLo, zHi), vec3.fromValues(xHi, yHi, zHi), vec3.fromValues(xLo, yHi, zHi),
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
	private readonly FACE_NORMALS: vec3[] = [
		vec3.fromValues(0, 0, -1), vec3.fromValues(0, 0, 1),
		vec3.fromValues(-1, 0, 0), vec3.fromValues(1, 0, 0),
		vec3.fromValues(0, 1, 0), vec3.fromValues(0, -1, 0),
	];

	face_normal(face_index: number): vec3 {
		return this.FACE_NORMALS[face_index] ?? vec3.fromValues(0, 0, 1);
	}

	// Which axis is perpendicular to this face?
	face_fixed_axis(face_index: number): Axis_Name {
		const axes: Axis_Name[] = ['z', 'z', 'x', 'x', 'y', 'y'];
		return axes[face_index] ?? 'z';
	}

	// Which 2 axes does this face allow editing?
	face_axes(face_index: number): [Axis_Name, Axis_Name] {
		const fixed = this.face_fixed_axis(face_index);
		const all: Axis_Name[] = ['x', 'y', 'z'];
		return all.filter(a => a !== fixed) as [Axis_Name, Axis_Name];
	}

	// Unit vector for an axis
	axis_vector(axis: Axis_Name): vec3 {
		switch (axis) {
			case 'x': return vec3.fromValues(1, 0, 0);
			case 'y': return vec3.fromValues(0, 1, 0);
			case 'z': return vec3.fromValues(0, 0, 1);
		}
	}

	// Which bound does this vertex touch on a given axis?
	// Vertex layout: 0-3 at z_min, 4-7 at z_max
	//   0,4: x_min,y_min  1,5: x_max,y_min  2,6: x_max,y_max  3,7: x_min,y_max
	vertex_bound(vertex_index: number, axis: Axis_Name): Bound {
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
	edge_along_axis(edge_index: number): Axis_Name {
		const [a, b] = this.edge_vertices(edge_index);
		const verts = this.vertices;
		const va = verts[a], vb = verts[b];
		const dx = Math.abs(vb[0] - va[0]);
		const dy = Math.abs(vb[1] - va[1]);
		const dz = Math.abs(vb[2] - va[2]);
		if (dx >= dy && dx >= dz) return 'x';
		if (dy >= dx && dy >= dz) return 'y';
		return 'z';
	}

	// Which axis does dragging this edge change? (the face axis that's not the edge's axis)
	edge_changes_axis(edge_index: number, face_index: number): Axis_Name {
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
	apply_edge_drag(edge_index: number, face_index: number, local_delta: vec3): void {
		const axis = this.edge_changes_axis(edge_index, face_index);
		const bound = this.edge_bound(edge_index, face_index);
		const axis_vec = this.axis_vector(axis);
		const amount = vec3.dot(local_delta, axis_vec);

		const current = this.get_bound(bound);
		const opposite = bound.endsWith('_min')
			? this.get_bound(bound.replace('_min', '_max') as Bound)
			: this.get_bound(bound.replace('_max', '_min') as Bound);

		// Clamp: don't let min exceed max (leave 0.1 gap)
		const is_min = bound.endsWith('_min');
		const clamped = is_min
			? Math.min(current + amount, opposite - 0.1)
			: Math.max(current + amount, opposite + 0.1);

		this.set_bound(bound, Smart_Object.snap(clamped));
	}

	// ═══════════════════════════════════════════════════════════════════
	// CORNER EDITING
	// Dragging a corner moves 2 bounds (the bounds that vertex touches on the face's axes).
	// ═══════════════════════════════════════════════════════════════════

	// Apply corner drag: moves 2 bounds
	apply_corner_drag(corner_index: number, face_index: number, local_delta: vec3): void {
		const axes = this.face_axes(face_index);

		for (const axis of axes) {
			const bound = this.vertex_bound(corner_index, axis);
			const axis_vec = this.axis_vector(axis);
			const amount = vec3.dot(local_delta, axis_vec);

			const current = this.get_bound(bound);
			const opposite = bound.endsWith('_min')
				? this.get_bound(bound.replace('_min', '_max') as Bound)
				: this.get_bound(bound.replace('_max', '_min') as Bound);

			// Clamp: don't let min exceed max
			const is_min = bound.endsWith('_min');
			const clamped = is_min
				? Math.min(current + amount, opposite - 0.1)
				: Math.max(current + amount, opposite + 0.1);

			this.set_bound(bound, Smart_Object.snap(clamped));
		}
	}

	// ═══════════════════════════════════════════════════════════════════
	// HIERARCHY
	// ═══════════════════════════════════════════════════════════════════

	/** Create a child SO with bounds derived from this parent.
	 *  Returns the child and a map of formulas to apply (caller wires via constraints). */
	create_child(used_names: Set<string>): { child: Smart_Object; formulas: Partial<Record<Bound, string>> } {
		let name = 'A';
		while (used_names.has(name)) {
			name = String.fromCharCode(name.charCodeAt(0) + 1);
		}

		const child = new Smart_Object(name);
		const half = Math.min(this.width, this.height, this.depth) / 2;

		// Max bounds: absolute values (no formula)
		child.set_bound('x_max', this.x_min + half);
		child.set_bound('y_max', this.y_min + half);
		child.set_bound('z_max', this.z_min + half);

		// Min bounds: formulas referencing parent by id (caller applies via constraints)
		const formulas: Partial<Record<Bound, string>> = {
			x_min: `${this.id}.x_min`,
			y_min: `${this.id}.y_min`,
			z_min: `${this.id}.z_min`,
		};

		return { child, formulas };
	}

	// ═══════════════════════════════════════════════════════════════════
	// ROTATION PAIRS — source of truth for angular annotations
	// ═══════════════════════════════════════════════════════════════════

	/**
	 * Apply a rotation around a single axis.
	 * - If axis matches an existing entry, merge (add angles).
	 * - If new and length < 2, push a new entry.
	 * - If new and length = 2, compact: compose into quat, decompose back.
	 * Recomputes `this.orientation` from the rotation pair.
	 */
	apply_rotation(axis: Axis_Name, delta_radians: number): void {
		const existing = this.rotations.find(r => r.axis === axis);
		if (existing) {
			existing.angle += delta_radians;
		} else if (this.rotations.length < 2) {
			this.rotations.push({ axis, angle: delta_radians });
		} else {
			// Compact: compose current pair + new rotation into quat, decompose back
			this.recompute_orientation();
			const delta_q = quat.create();
			quat.setAxisAngle(delta_q, this.axis_vector(axis) as [number, number, number], delta_radians);
			quat.multiply(this.orientation, delta_q, this.orientation);
			// Decompose back into the frozen axis pair
			this.rotations = this.decompose_into(this.rotations[0].axis, this.rotations[1].axis);
		}
		this.recompute_orientation();
	}

	/**
	 * Set a specific rotation entry by axis (for editing via angular input).
	 * If the axis already exists, replaces its angle.
	 * If it doesn't exist and there's room, adds it.
	 */
	set_rotation(axis: Axis_Name, radians: number): void {
		const existing = this.rotations.find(r => r.axis === axis);
		if (existing) {
			existing.angle = radians;
		} else if (this.rotations.length < 2) {
			this.rotations.push({ axis, angle: radians });
		}
		this.recompute_orientation();
	}

	/**
	 * Compose the rotation pair into `this.orientation` (quat).
	 * Applies rotations in order: first entry, then second entry.
	 */
	recompute_orientation(): void {
		const q = quat.create(); // identity
		for (const r of this.rotations) {
			const step = quat.create();
			quat.setAxisAngle(step, this.axis_vector(r.axis) as [number, number, number], r.angle);
			quat.multiply(q, step, q);
		}
		quat.copy(this.orientation, q);
	}

	/**
	 * Decompose a quaternion into two sequential single-axis rotations.
	 * Given frozen axes (a1, a2), extracts angle1 around a1 then angle2 around a2
	 * such that: rotate(a1, angle1) * rotate(a2, angle2) ≈ this.orientation.
	 *
	 * Uses rotation matrix extraction with atan2 for each of the 6 axis pair cases.
	 */
	decompose_into(a1: Axis_Name, a2: Axis_Name): Rotation_Entry[] {
		const m = mat3.fromQuat(mat3.create(), this.orientation);
		// m is column-major: m[col*3+row], so m[0]=m00, m[1]=m10, m[2]=m20, m[3]=m01, m[4]=m11, m[5]=m21, m[6]=m02, m[7]=m12, m[8]=m22
		const key = a1 + a2;
		let angle1: number, angle2: number;

		// Convention: R_total = R(a1, angle1) * R(a2, angle2)
		// Each case extracts angles from the composed rotation matrix.
		switch (key) {
			case 'xy': // Rz then Ry in extrinsic = Rx(a1)*Ry(a2)
				// R = Rx(a1)*Ry(a2)
				// m[6]=m02 = sin(a2),  m[7]=m12 = -sin(a1)*cos(a2),  m[8]=m22 = cos(a1)*cos(a2)
				angle2 = Math.asin(Math.max(-1, Math.min(1, m[6])));
				angle1 = Math.atan2(-m[7], m[8]);
				break;
			case 'xz':
				// R = Rx(a1)*Rz(a2)
				// m[3]=m01 = -sin(a2), m[4]=m11 = cos(a1)*cos(a2), m[5]=m21 = sin(a1)*cos(a2)
				angle2 = Math.asin(Math.max(-1, Math.min(1, -m[3])));
				angle1 = Math.atan2(m[5], m[4]);
				break;
			case 'yx':
				// R = Ry(a1)*Rx(a2)
				// m[5]=m21 = -sin(a2), m[2]=m20 = sin(a1)*cos(a2), m[8]=m22 = cos(a1)*cos(a2)
				angle2 = Math.asin(Math.max(-1, Math.min(1, -m[5])));
				angle1 = Math.atan2(m[2], m[8]);
				break;
			case 'yz':
				// R = Ry(a1)*Rz(a2)
				// m[3]=m01 = -cos(a1)*sin(a2), m[0]=m00 = cos(a1)*cos(a2), m[6]=m02 = -sin(a1)
				angle1 = Math.asin(Math.max(-1, Math.min(1, -m[6])));
				angle2 = Math.atan2(-m[3], m[0]);
				break;
			case 'zx':
				// R = Rz(a1)*Rx(a2)
				// m[1]=m10 = sin(a1)*cos(a2), m[4]=m11 = cos(a1)*cos(a2), m[7]=m12 = -sin(a2)
				angle2 = Math.asin(Math.max(-1, Math.min(1, -m[7])));
				angle1 = Math.atan2(m[1], m[4]);
				break;
			case 'zy':
				// R = Rz(a1)*Ry(a2)
				// m[2]=m20 = -sin(a1)*cos(a2), m[0]=m00 = cos(a1)*cos(a2), m[5]=m21 = sin(a2)
				angle2 = Math.asin(Math.max(-1, Math.min(1, m[5])));
				angle1 = Math.atan2(-m[2], m[0]);
				break;
			default:
				// Same axis twice — collapse to single
				angle1 = 2 * Math.acos(Math.max(-1, Math.min(1, this.orientation[3])));
				angle2 = 0;
		}

		const result: Rotation_Entry[] = [{ axis: a1, angle: angle1 }];
		if (Math.abs(angle2) > 1e-10) {
			result.push({ axis: a2, angle: angle2 });
		}
		return result;
	}

	// ═══════════════════════════════════════════════════════════════════
	// SERIALIZATION
	// ═══════════════════════════════════════════════════════════════════

	/** Serialize to Portable_SO shape (per-axis bundles) */
	serialize(): { id: string; name: string; x: Serialized_Axis; y: Serialized_Axis; z: Serialized_Axis; locked?: number; scale?: number; fixed?: boolean } {
		const axis_names: Axis_Name[] = ['x', 'y', 'z'];
		const axes: Record<string, Serialized_Axis> = {};

		for (let i = 0; i < 3; i++) {
			const name = axis_names[i];
			const axis = this.axes[i];
			const pa: Serialized_Axis = {
				start: axis.start.value,
				end: axis.end.value,
			};
			if (axis.invariant !== 2) pa.invariant = axis.invariant;
			const rot = this.rotations.find(r => r.axis === name);
			if (rot && Math.abs(rot.angle) > 1e-10) pa.rotation = rot.angle;
			const start_formula = axis.start.formula;
			const end_formula = axis.end.formula;
			if (start_formula || end_formula) {
				pa.formulas = {};
				if (start_formula) pa.formulas.start = start_formula;
				if (end_formula) pa.formulas.end = end_formula;
			}
			axes[name] = pa;
		}

		const scale = this.scene?.scale ?? 1;
		return {
			id: this.id,
			name: this.name,
			x: axes.x, y: axes.y, z: axes.z,
			...(this.locked !== 0 ? { locked: this.locked } : {}),
			...(scale !== 1 ? { scale } : {}),
			...(!this.fixed ? { fixed: false } : {}),
		};
	}

	/** Deserialize from Portable_SO shape (per-axis bundles) */
	static deserialize(data: { id: string; name: string; x: Serialized_Axis; y: Serialized_Axis; z: Serialized_Axis; locked?: number; scale?: number; fixed?: boolean }): { so: Smart_Object; scale: number } {
		const so = new Smart_Object(data.name);
		so.setID(data.id);

		const axis_names: Axis_Name[] = ['x', 'y', 'z'];
		const axis_data = [data.x, data.y, data.z];

		for (let i = 0; i < 3; i++) {
			const name = axis_names[i];
			const pa = axis_data[i];
			const axis = so.axes[i];

			// Bounds
			axis.start.value = pa.start;
			axis.end.value = pa.end;

			// Invariant
			if (pa.invariant !== undefined) axis.invariant = pa.invariant;

			// Rotation
			if (pa.rotation !== undefined && Math.abs(pa.rotation) > 1e-10) {
				so.rotations.push({ axis: name, angle: pa.rotation });
			}

			// Formulas
			if (pa.formulas) {
				if (pa.formulas.start) {
					axis.start.formula = pa.formulas.start;
					try { axis.start.compiled = compiler.compile(pa.formulas.start); } catch { /* skip */ }
				}
				if (pa.formulas.end) {
					axis.end.formula = pa.formulas.end;
					try { axis.end.compiled = compiler.compile(pa.formulas.end); } catch { /* skip */ }
				}
			}
		}

		if (so.rotations.length > 0) so.recompute_orientation();
		if (data.locked !== undefined) so.locked = data.locked;
		if (data.fixed === false) so.fixed = false;

		return { so, scale: data.scale ?? 1 };
	}
}
