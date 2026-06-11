import type { Projected, Dimension_Rect } from '../types/Interfaces';
import type { O_Scene } from '../types/Interfaces';
import { run_uniface_placement } from './Dimension_Placement';
import { render_uniface_diagnostics, render_uniface_picks } from './Dimension_Renderer';
import { vec3 } from 'gl-matrix';
import { mat4 } from 'gl-matrix';

/**
 * Dimension annotations.
 *
 * Entry point the renderer calls every render: clears the previous
 * frame's hit-test rectangles, runs the four-degrees-of-freedom search,
 * and asks the renderer to draw the result.
 */

/** Subset of Render that Dimensions needs. Avoids circular import. */
export interface DimensionHost {
	ctx: CanvasRenderingContext2D;
	project_vertex(v: vec3, world_matrix: mat4): Projected;
	get_world_matrix(obj: O_Scene): mat4;
	get_static_world_matrix(obj: O_Scene): mat4;
	face_winding(face: number[], projected: Projected[]): number;
	point_in_polygon_2d(px: number, py: number, poly: { x: number; y: number }[]): boolean;
	draw_arrow(x: number, y: number, dx: number, dy: number): void;
	dimension_rects: Dimension_Rect[];
}

/** Called every render by the renderer. Clears the previous frame's
 *  hit-test rectangles, runs the placement search, then draws the
 *  result. */
export function render_dimensions(host: DimensionHost): void {
	host.dimension_rects.length = 0;
	run_uniface_placement();
	render_uniface_diagnostics(host);
	render_uniface_picks(host);
}
