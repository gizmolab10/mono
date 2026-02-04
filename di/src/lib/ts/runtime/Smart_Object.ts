import type { O_Scene } from '../types/Interfaces';
import type { Dictionary } from '../types/Types';
import { Point3 } from '../types/Coordinates';
import Attribute from '../types/Attribute';
import Identifiable from './Identifiable';

// SO has 3 dimensions: width (X), height (Y), depth (Z)
type Dim = 'width' | 'height' | 'depth';

export default class Smart_Object extends Identifiable {
	attributes_dict_byName: Dictionary<Attribute> = {};
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
		for (const name of ['x', 'y', 'z', 'width', 'height', 'depth']) {
			this.attributes_dict_byName[name] = new Attribute(name);
		}
	}

	// Move a single vertex by delta (in world coords)
	move_vertex(index: number, delta: Point3): void {
		if (!this.scene) return;
		const v = this.scene.vertices[index];
		if (!v) return;
		this.scene.vertices[index] = v.offset_by(delta);
	}

	// Move multiple vertices (for edge/face drag)
	move_vertices(indices: number[], delta: Point3): void {
		for (const i of indices) {
			this.move_vertex(i, delta);
		}
	}

	// Get vertex indices for an edge
	edge_vertices(edge_index: number): number[] {
		if (!this.scene) return [];
		const edge = this.scene.edges[edge_index];
		return edge ? [edge[0], edge[1]] : [];
	}

	// Get vertex indices for a face
	face_vertices(face_index: number): number[] {
		if (!this.scene?.faces) return [];
		return this.scene.faces[face_index] ?? [];
	}

	// Check if a corner (vertex) belongs to a face
	corner_in_face(corner_index: number, face_index: number): boolean {
		const face_verts = this.face_vertices(face_index);
		return face_verts.includes(corner_index);
	}

	// Check if an edge belongs to a face (both endpoints must be in the face)
	edge_in_face(edge_index: number, face_index: number): boolean {
		const [a, b] = this.edge_vertices(edge_index);
		const face_verts = this.face_vertices(face_index);
		return face_verts.includes(a) && face_verts.includes(b);
	}

	// Get face normal in local coordinates (before object rotation)
	face_normal(face_index: number): Point3 | null {
		if (!this.scene?.faces) return null;
		const face = this.scene.faces[face_index];
		if (!face || face.length < 3) return null;

		const v0 = this.scene.vertices[face[0]];
		const v1 = this.scene.vertices[face[1]];
		const v2 = this.scene.vertices[face[2]];
		if (!v0 || !v1 || !v2) return null;

		const e1 = v0.vector_to(v1);
		const e2 = v0.vector_to(v2);
		return e1.cross(e2).normalized;
	}

	// ═══════════════════════════════════════════════════════════════════
	// DIMENSION-CENTRIC MODEL
	// Face selects 2 of 3 dimensions. Edge selects 1 of those 2.
	// ═══════════════════════════════════════════════════════════════════

	// Which dimension is fixed (perpendicular to this face)?
	face_fixed_dimension(face_index: number): Dim | null {
		const normal = this.face_normal(face_index);
		if (!normal) return null;

		const ax = Math.abs(normal.x);
		const ay = Math.abs(normal.y);
		const az = Math.abs(normal.z);

		if (ax >= ay && ax >= az) return 'width';   // left/right face
		if (ay >= ax && ay >= az) return 'height';  // top/bottom face
		return 'depth';                              // front/back face
	}

	// Which 2 dimensions does this face control?
	face_dimensions(face_index: number): [Dim, Dim] | null {
		const fixed = this.face_fixed_dimension(face_index);
		if (!fixed) return null;

		const all: Dim[] = ['width', 'height', 'depth'];
		const dims = all.filter(d => d !== fixed) as [Dim, Dim];
		return dims;
	}

	// Get edge direction vector (normalized, in local coords)
	edge_direction(edge_index: number): Point3 | null {
		if (!this.scene) return null;
		const [a, b] = this.edge_vertices(edge_index);
		const va = this.scene.vertices[a];
		const vb = this.scene.vertices[b];
		if (!va || !vb) return null;
		return va.vector_to(vb).normalized;
	}

	// Which dimension does this edge run along (constant when dragging)?
	edge_along_dimension(edge_index: number): Dim | null {
		const dir = this.edge_direction(edge_index);
		if (!dir) return null;

		const ax = Math.abs(dir.x);
		const ay = Math.abs(dir.y);
		const az = Math.abs(dir.z);

		if (ax >= ay && ax >= az) return 'width';
		if (ay >= ax && ay >= az) return 'height';
		return 'depth';
	}

	// Which dimension does dragging this edge change?
	// It's the face dimension that's NOT the edge's along-dimension
	edge_changes_dimension(edge_index: number, face_index: number): Dim | null {
		const face_dims = this.face_dimensions(face_index);
		const edge_along = this.edge_along_dimension(edge_index);
		if (!face_dims || !edge_along) return null;

		// The dimension being changed is the face dimension that isn't the edge's axis
		return face_dims.find(d => d !== edge_along) ?? null;
	}

	// Unit vector for a dimension
	dimension_axis(dim: Dim): Point3 {
		switch (dim) {
			case 'width': return new Point3(1, 0, 0);
			case 'height': return new Point3(0, 1, 0);
			case 'depth': return new Point3(0, 0, 1);
		}
	}

	// Get coordinate value for a dimension
	vertex_dim_value(vertex_index: number, dim: Dim): number | null {
		if (!this.scene) return null;
		const v = this.scene.vertices[vertex_index];
		if (!v) return null;
		switch (dim) {
			case 'width': return v.x;
			case 'height': return v.y;
			case 'depth': return v.z;
		}
	}

	// Find all vertices that share the same value on a dimension
	vertices_at_dim_value(dim: Dim, value: number, epsilon = 0.001): number[] {
		if (!this.scene) return [];
		const result: number[] = [];
		for (let i = 0; i < this.scene.vertices.length; i++) {
			const v = this.vertex_dim_value(i, dim);
			if (v !== null && Math.abs(v - value) < epsilon) {
				result.push(i);
			}
		}
		return result;
	}

	// Resize SO by moving all vertices at edge's position on change-dimension
	move_edge_resize(edge_index: number, face_index: number, local_delta: Point3): number {
		const dim = this.edge_changes_dimension(edge_index, face_index);
		if (!dim) return 0;

		const axis = this.dimension_axis(dim);
		const amount = local_delta.dot(axis);
		const move = axis.multiplied_equally_by(amount);

		// Get the edge's position on the change-dimension
		const [a] = this.edge_vertices(edge_index);
		const edge_value = this.vertex_dim_value(a, dim);
		if (edge_value === null) return 0;

		// Move ALL vertices at that position (not just the edge)
		const verts_to_move = this.vertices_at_dim_value(dim, edge_value);
		this.move_vertices(verts_to_move, move);

		return amount;
	}

	// Update dimension attribute
	update_dimension(dim: Dim, delta: number): void {
		const attr = this.attributes_dict_byName[dim];
		if (attr) {
			attr.value = (attr.value ?? 0) + delta;
		}
	}
}
