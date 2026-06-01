import type { Projected, Dimension_Rect } from '../types/Interfaces';
import type { O_Scene } from '../types/Interfaces';
import { run_new_placement, run_uniface_placement } from './Dimension_Placement';
import { render_new_placements } from './Dimension_Renderer';
import { stores } from '../managers/Stores';
import { vec3 } from 'gl-matrix';
import { mat4 } from 'gl-matrix';

/**
 * Dimension annotations.
 *
 * The old force-driven simulation and renderer have been removed. This
 * file is now just the entry point the renderer calls every render: it
 * runs the new four-degrees-of-freedom search and then asks the new
 * renderer to draw the result.
 *
 * The geometry helpers (convex hull, ray-polygon exit, push-outside-
 * hull) and the status-bar drop counter now live in
 * Dimension_Placement.ts. The renderer lives in Dimension_Renderer.ts.
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

/** Called every render by the renderer. Clears the previous frame's
 *  hit-test rectangles, runs the placement algorithm, renders the
 *  result. Branches on the uniface-placement flag: when off, today's
 *  code runs unchanged. When on, the new uniface placement runs and
 *  the dim-line renderer is skipped (no dim lines draw yet — that
 *  wiring comes in a later sub-step). */
export function render_dimensions(host: DimensionHost): void {
	host.dimension_rects.length = 0;
	const canvas_w = host.ctx.canvas.width;
	const canvas_h = host.ctx.canvas.height;
	if (stores.use_uniface_placement) {
		run_uniface_placement();
		// No render of dim lines yet — the new placement's output shape
		// is not wired into the renderer. Visual diff against the old
		// path is the absence of dim lines while everything else still
		// draws.
	} else {
		run_new_placement(canvas_w, canvas_h);
		render_new_placements(host);
	}
}
