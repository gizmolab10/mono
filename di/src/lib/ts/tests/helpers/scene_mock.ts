import { vec3 } from 'gl-matrix';
import Smart_Object from '../../runtime/Smart_Object';
import type { O_Scene } from '../../types/Interfaces';

/** The eight corners of a standard cube indexed 0-7 are connected by these
 *  twelve edges. Use this when constructing a cube-shaped scene object. */
export const cube_edges: [number, number][] = [
	[0, 1], [1, 2], [2, 3], [3, 0],
	[4, 5], [5, 6], [6, 7], [7, 4],
	[0, 4], [1, 5], [2, 6], [3, 7],
];

/** Six face windings for the standard cube — bottom, top, left, right,
 *  front, back. Outward-normal winding. */
export const cube_faces: number[][] = [
	[3, 2, 1, 0],  // bottom
	[4, 5, 6, 7],  // top
	[0, 4, 7, 3],  // left
	[2, 6, 5, 1],  // right
	[7, 6, 2, 3],  // front
	[0, 1, 5, 4],  // back
];

/** Build a smart object with the given world-axis-aligned bounds and the
 *  given name. The other properties default to the runtime's defaults. */
export function make_so(
	name: string,
	x_min: number, x_max: number,
	y_min: number, y_max: number,
	z_min: number, z_max: number,
): Smart_Object {
	const so = new Smart_Object(name);
	so.set_bound('x_min', x_min);
	so.set_bound('x_max', x_max);
	so.set_bound('y_min', y_min);
	so.set_bound('y_max', y_max);
	so.set_bound('z_min', z_min);
	so.set_bound('z_max', z_max);
	return so;
}

/** Wrap a smart object in a scene entry that the renderer recognises.
 *  The shape uses the cube edges and faces from this helper file. */
export function make_scene(so: Smart_Object, id: string, parent?: O_Scene): O_Scene {
	return {
		id,
		so,
		edges: cube_edges,
		faces: cube_faces,
		position: vec3.fromValues(0, 0, 0),
		color: 'rgba(0,0,0,',
		parent,
	};
}
