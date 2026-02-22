import type { Axis_Name } from './Types';
import type Smart_Object from '../runtime/Smart_Object';
import type { vec3 } from 'gl-matrix';

// Projected stays here (not in Coordinates.ts) because it's a pipeline-specific
// output structure, not a reusable geometry primitive. The `w` field is for
// clip-space culling, not general math.

export interface Projected {
	x: number;
	y: number;
	z: number;
	w: number;
}

// S_SO = "what to edit and where" (identity + screen position).
export interface S_SO {
	so: Smart_Object;
	x: number;          // screen x (center of text)
	y: number;          // screen y (center of text)
}

// w/h/z = "how big it rendered and at what depth" (render output).
export interface Label_Rect extends S_SO {
	w: number;        // text width in pixels
	h: number;        // text height in pixels
	z: number;        // NDC depth at text center
	face_index: number;
}

// axis = which dimension (x/y/z) this label measures.
export interface Dimension_Rect extends Label_Rect {
	axis: Axis_Name;
}

export interface Angle_Rect extends Label_Rect {
	rotation_axis: Axis_Name;
	angle_degrees: number;
}

export interface Repeater {
	count_formula?: string;  // legacy — no longer shown in UI
	gap_axis?: 0 | 1 | 2;
	repeat_axis?: 0 | 1;
	gap_min?: number;
	gap_max?: number;
	spacing?: number;
}

export interface Portable_Attribute {
	formula?: string;
	value?: number;
}

// number = just a value, object = formula/offset/etc.
export type Compact_Attribute = number | Portable_Attribute;

export interface Portable_Axis {
	attributes: {
		origin: Compact_Attribute;
		extent: Compact_Attribute;
		length: Compact_Attribute;
		angle: Compact_Attribute;
	};
	invariant?: number;           // 0=start, 1=end, 2=length (default 2)
}

export interface O_Scene {
	edges: [number, number][];
	faces?: number[][];
	parent?: O_Scene;
	so: Smart_Object;             // back-reference: vertices + orientation come from SO
	position: vec3;
	color: string;
	id: string;
}
