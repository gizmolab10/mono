import type { Projected, Dimension_Rect } from '../types/Interfaces';
import type { O_Scene } from '../types/Interfaces';
import { run_new_placement } from './Dimension_Placement';
import { paint_new_placements } from './Dimension_Painter';
import { vec3 } from 'gl-matrix';
import { mat4 } from 'gl-matrix';

/**
 * Dimension annotations.
 *
 * The old force-driven simulation and painter have been removed. This
 * file is now just the entry point the renderer calls every paint: it
 * runs the new four-degrees-of-freedom search and then asks the new
 * painter to draw the result.
 *
 * The geometry helpers (convex hull, ray-polygon exit, push-outside-
 * hull) and the status-bar drop counter now live in
 * Dimension_Placement.ts. The painter lives in Dimension_Painter.ts.
 */

/** Subset of Render that Dimensions needs. Avoids circular import. */
export interface DimensionHost {
	ctx: CanvasRenderingContext2D;
	project_vertex(v: vec3, world_matrix: mat4): Projected;
	get_world_matrix(obj: O_Scene): mat4;
	face_winding(face: number[], projected: Projected[]): number;
	point_in_polygon_2d(px: number, py: number, poly: { x: number; y: number }[]): boolean;
	draw_arrow(x: number, y: number, dx: number, dy: number): void;
	dimension_rects: Dimension_Rect[];
}

/** Called every paint by the renderer. Clears the previous frame's
 *  hit-test rectangles, runs the search, paints the result. */
export function render_dimensions(host: DimensionHost): void {
	host.dimension_rects.length = 0;
	const canvas_w = host.ctx.canvas.width;
	const canvas_h = host.ctx.canvas.height;
	run_new_placement(canvas_w, canvas_h);
	paint_new_placements(host);
}
