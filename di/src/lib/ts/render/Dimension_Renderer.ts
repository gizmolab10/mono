import { compute_root_tumble_matrix, get_last_uniface_placement_result, convex_hull, compute_dim_render_geometry } from './Dimension_Placement';
import type { Placement_Details, Silhouette_Box } from './Dimension_Placement';
import type { DimensionHost } from './R_Dimensions';
import { hits_3d } from '../events/Hits_3D';
import { scene } from './Scene';
import { stores } from '../managers/Stores';
import { k } from '../common/Constants';
import { vec3 } from 'gl-matrix';

/**
 * Canvas renderer for dimensions. Reads the placement list produced by
 * the new pipeline (in Dimension_Placement.ts) and turns each placement
 * into pixels: two witness lines, one dimension line with arrowheads,
 * a white box, and the number text. Also pushes a hit-test rectangle so
 * hover, click-to-edit, and the part-name popup all keep working, and
 * publishes the dropped-count running average into the same store the
 * status strip reads from.
 *
 * Called from render_dimensions in R_Dimensions.ts every render.
 */

/** How many screen pixels the witness line continues past the dim line.
 *  Per the Glossary's witness-line definition. */
const WITNESS_PAST_DIM_LINE_PX = 10;
/** Per rule 6: the witness line begins this many screen pixels away
 *  from the part edge, never touching the part itself. */
const WITNESS_GAP_FROM_PART_PX = 5;


const SILHOUETTE_BOX_STROKE          = 'rgba(220, 60, 60, 0.9)';
const UNIFACE_BOX_STROKE             = 'rgba(60, 120, 220, 0.9)';
const UNIFACE_BOX_EXCLUDED_STROKE    = 'rgba(120, 120, 120, 0.55)';
const UNIFACE_PICK_STROKE            = 'rgba(60, 120, 220, 0.95)';
const UNIFACE_HOVER_STROKE           = 'rgba(220, 30, 30, 1.0)';
const SILHOUETTE_HEX_STROKE          = 'rgba(40, 170, 60, 0.9)';

// Step 3c — for each pick in the last uniface placement, draw the two
// witness lines (from the part edge to its anchor) and the dim line
// (between the two anchors), all in blue. Witness lines start
// WITNESS_GAP_FROM_PART_PX away from the edge and extend
// WITNESS_PAST_DIM_LINE_PX past the anchor. Picks with no chosen
// uniface (search dropped them) draw nothing.
export function render_uniface_picks(host: DimensionHost): void {
	const result = get_last_uniface_placement_result();
	if (result.placements.length === 0) return;
	const ctx = host.ctx;
	// Diagnostic: the silhouette six-sided shape in green so the eye can
	// see what the silhouette filter is comparing every label rectangle
	// against.
	if (result.silhouette_polygon_screen.length >= 3) {
		ctx.save();
		ctx.strokeStyle = SILHOUETTE_HEX_STROKE;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i = 0; i < result.silhouette_polygon_screen.length; i++) {
			const v = result.silhouette_polygon_screen[i];
			if (i === 0) ctx.moveTo(v.x, v.y);
			else         ctx.lineTo(v.x, v.y);
		}
		ctx.closePath();
		// ctx.stroke();
		ctx.restore();
	}
	ctx.strokeStyle = UNIFACE_PICK_STROKE;
	ctx.lineWidth = 0.75;
	const canvas_w = ctx.canvas.width;
	const canvas_h = ctx.canvas.height;
	let dropped_off_canvas = 0;
	const dropped_off_canvas_names: string[] = [];
	// Build the list of picks that survive the off-canvas filter, then
	// draw in three layers so the label box sits on top of the red hover
	// stroke: blue dim and witness lines first, then the red hover lines
	// (so they overlay the blue), then the arrows and white-boxed number
	// label (so the label box covers any line passing through it).
	const drawable: typeof result.placements[number][] = [];
	for (const placement of result.placements) {
		if (placement.uniface === null) continue;
		if (!placement.edge_p1_screen || !placement.edge_p2_screen) continue;
		if (!placement.anchor_1_screen || !placement.anchor_2_screen) continue;
		// Step 3d filter 3: off-canvas drop. Skip drawing a dim whose
		// two dim-line endpoints both sit outside the visible canvas —
		// it would draw entirely off-screen.
		const a1 = placement.anchor_1_screen;
		const a2 = placement.anchor_2_screen;
		const a1_off = a1.x < 0 || a1.x > canvas_w || a1.y < 0 || a1.y > canvas_h;
		const a2_off = a2.x < 0 || a2.x > canvas_w || a2.y < 0 || a2.y > canvas_h;
		if (a1_off && a2_off) {
			dropped_off_canvas++;
			dropped_off_canvas_names.push(`${placement.so_name} (${placement.axis})`);
			continue;
		}
		drawable.push(placement);
	}
	for (const d of drawable) {
		const p = d;
		draw_witness_and_dim_lines(
			ctx,
			p.edge_p1_screen!, p.anchor_1_screen!,
			p.edge_p2_screen!, p.anchor_2_screen!,
		);
	}
	if (dropped_off_canvas > 0 && k.debug.diagnose_dims) {
		console.log(
			`[uniface render] off-canvas drop removed ${dropped_off_canvas} pick(s): ${dropped_off_canvas_names.join(', ')}`,
		);
	}
	render_uniface_hover(host, result.placements);
	// Step 3e: arrowheads + white-boxed number text drawn last so the
	// label box sits on top of every dim and witness line, including the
	// red hover overlay. The hovered part's labels switch to the red
	// hover colour so the label matches the dim line beneath it.
	const hovered_so_id =
		hits_3d.hovered_uniface_placement?.so_id
		?? hits_3d.hover?.so?.id
		?? null;
	for (const d of drawable) {
		const color = d.so_id === hovered_so_id ? UNIFACE_HOVER_STROKE : UNIFACE_PICK_STROKE;
		draw_uniface_arrows_and_label(host, d, color, d.so_id, d.axis);
	}
}

/** Redraws hover highlights in red. Two cases:
 *  1. Cursor is on a uniface dim or witness line — highlight just that
 *     pick's three lines plus the measured part's outline.
 *  2. Cursor is on a part (corner/edge/face hover) — highlight every
 *     uniface pick that belongs to that part, plus the part's outline.
 *  When both stores point at the same part, the pick-specific lines also
 *  draw (case 1's union with case 2). */
function render_uniface_hover(host: DimensionHost, placements: ReturnType<typeof get_last_uniface_placement_result>['placements']): void {
	const hovered_placement = hits_3d.hovered_uniface_placement;
	const general_hover = hits_3d.hover;
	const hovered_so_id =
		hovered_placement?.so_id
		?? general_hover?.so.id
		?? null;
	if (hovered_so_id === null) return;
	const ctx = host.ctx;
	ctx.save();
	ctx.strokeStyle = UNIFACE_HOVER_STROKE;
	ctx.fillStyle = UNIFACE_HOVER_STROKE;
	ctx.lineWidth = 1.5;
	// Draw every placement on the hovered part in red. When the cursor
	// is on a specific dim/witness line, that placement is among them;
	// when the cursor is on the part itself, all the part's placements
	// turn red.
	for (const placement of placements) {
		if (placement.so_id !== hovered_so_id) continue;
		const p = placement;
		if (p.uniface === null) continue;
		if (!p.edge_p1_screen || !p.edge_p2_screen || !p.anchor_1_screen || !p.anchor_2_screen) continue;
		draw_witness_and_dim_lines(
			ctx,
			p.edge_p1_screen, p.anchor_1_screen,
			p.edge_p2_screen, p.anchor_2_screen,
		);
	}
	// Outline the part itself with the convex hull of its projected vertices.
	const obj = scene.get_all().find(o => o.so.id === hovered_so_id);
	if (obj) {
		const projected = hits_3d.get_projected(obj.id);
		if (projected && projected.length >= 3) {
			const pts: { x: number; y: number }[] = [];
			for (const pp of projected) if (pp.w >= 0) pts.push({ x: pp.x, y: pp.y });
			if (pts.length >= 3) {
				const hull = convex_hull(pts);
				ctx.beginPath();
				for (let i = 0; i < hull.length; i++) {
					if (i === 0) ctx.moveTo(hull[i].x, hull[i].y);
					else         ctx.lineTo(hull[i].x, hull[i].y);
				}
				ctx.closePath();
				ctx.stroke();
			}
		}
	}
	ctx.restore();
}

function draw_witness_and_dim_lines(
	ctx: CanvasRenderingContext2D,
	edge_p1: { x: number; y: number }, anchor_1: { x: number; y: number },
	edge_p2: { x: number; y: number }, anchor_2: { x: number; y: number },
): void {
	const w1 = unit_vec(edge_p1, anchor_1);
	const w2 = unit_vec(edge_p2, anchor_2);
	const w1_start = offset_point(edge_p1, w1, WITNESS_GAP_FROM_PART_PX);
	const w2_start = offset_point(edge_p2, w2, WITNESS_GAP_FROM_PART_PX);
	const w1_past  = offset_point(anchor_1, w1, WITNESS_PAST_DIM_LINE_PX);
	const w2_past  = offset_point(anchor_2, w2, WITNESS_PAST_DIM_LINE_PX);
	// Witness lines only. The dim line itself is drawn by the arrows-
	// and-label helper because the dim line's shape (inside segment vs.
	// outside extensions) depends on whether the label covers the anchors.
	ctx.beginPath();
	ctx.moveTo(w1_start.x, w1_start.y);
	ctx.lineTo(w1_past.x, w1_past.y);
	ctx.moveTo(w2_start.x, w2_start.y);
	ctx.lineTo(w2_past.x, w2_past.y);
	ctx.stroke();
}

/** Step 3e — for one uniface pick that already had its two witness lines
 *  and dim line drawn, add the arrowheads and the white-boxed number text.
 *  Arrows point inward when the label fits between the two anchors, and
 *  outward when the label overhangs past one end. The label sits centred
 *  on the chosen position along the dim line. */
function draw_uniface_arrows_and_label(host: DimensionHost, p: Placement_Details, color: string, so_id: string, axis: 'x' | 'y' | 'z'): void {
	const text = p.label_text;
	if (text === null) return;
	const ctx = host.ctx;
	const LABEL_H_PX = 14;
	ctx.font = '12px sans-serif';
	const label_w_px = ctx.measureText(text).width + 4;
	const geom = compute_dim_render_geometry(
		p,
		label_w_px,
		LABEL_H_PX,
		WITNESS_GAP_FROM_PART_PX,
		WITNESS_PAST_DIM_LINE_PX,
		k.dimensions.SLIDABLE_OVERHANG_PX,
		6,
	);
	if (geom === null) return;
	// Dim line — walk every segment in the geometry record.
	ctx.save();
	ctx.strokeStyle = color;
	ctx.lineWidth = 0.75;
	ctx.beginPath();
	for (const seg of geom.dim_line_segments) {
		ctx.moveTo(seg.from.x, seg.from.y);
		ctx.lineTo(seg.to.x, seg.to.y);
	}
	ctx.stroke();
	// Arrowheads — fillStyle must match the dim colour because the
	// arrowhead is a filled triangle.
	ctx.fillStyle = color;
	for (const arrow of geom.arrows) {
		host.draw_arrow(arrow.tip.x, arrow.tip.y, arrow.direction.x, arrow.direction.y);
	}
	ctx.restore();
	// White label box + number text.
	ctx.save();
	ctx.fillStyle = 'white';
	ctx.fillRect(
		geom.label_box.x_min,
		geom.label_box.y_min,
		geom.label_box.x_max - geom.label_box.x_min,
		geom.label_box.y_max - geom.label_box.y_min,
	);
	ctx.fillStyle = color;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, geom.label_text_position.x, geom.label_text_position.y);
	ctx.restore();
	// Register the label rect for hit-testing so hovering on the label
	// triggers the same red highlight as hovering on a dim or witness
	// line or on the part itself.
	const so_o = scene.get_all().find(o => o.so.id === so_id);
	if (so_o) {
		host.dimension_rects.push({
			axis,
			so: so_o.so,
			x: geom.label_text_position.x,
			y: geom.label_text_position.y,
			w: label_w_px,
			h: LABEL_H_PX,
			z: 0,
			face_index: -1,
			witness_index: p.witness_index,
		});
	}
}

function unit_vec(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const len = Math.hypot(dx, dy);
	return len > 1e-9 ? { x: dx / len, y: dy / len } : { x: 0, y: 0 };
}

function offset_point(p: { x: number; y: number }, dir: { x: number; y: number }, distance: number): { x: number; y: number } {
	return { x: p.x + dir.x * distance, y: p.y + dir.y * distance };
}

// Step 1b — draw the silhouette box in red and the three nested uniface
// boxes in blue, so the geometry the new path computes is visible during
// development. Reads from the last uniface placement; if the new path
// has not run this frame (flag off), nothing draws. Excluded faces (the
// ones the placement code refuses because their normal points within
// twenty degrees of the camera direction) are drawn in a dashed grey
// style at a fallback shift, so the full closed box is visible but the
// excluded faces are legible at a glance.
export function render_uniface_diagnostics(host: DimensionHost): void {
	const result = get_last_uniface_placement_result();
	if (!result.uniface_box) return;
	const ctx = host.ctx;
	const tumble = compute_root_tumble_matrix();
	const project = (x: number, y: number, z: number) => {
		const p = host.project_vertex(vec3.fromValues(x, y, z), tumble);
		return { x: p.x, y: p.y };
	};
	// Easy toggle — flip to true to draw the silhouette box wireframe in red.
	const SHOW_SILHOUETTE = false;
	if (SHOW_SILHOUETTE) {
		draw_world_axis_aligned_box(ctx, project, result.uniface_box.silhouette, SILHOUETTE_BOX_STROKE);
	}
	// A face is excluded for the whole family when its level-0 shift is null.
	const face_excluded: boolean[] = [];
	const level_0 = result.uniface_box.shifts[0] ?? [];
	for (let i = 0; i < 6; i++) face_excluded.push(level_0[i] === null || level_0[i] === undefined);
	// Fallback shift used for excluded faces — equivalent screen distance
	// computed from the configured margin and the current scene scale.
	const fallback_world_per_px = 1 / (stores.current_scale || 1);
	for (let level = 1; level <= result.uniface_box.shifts.length; level++) {
		const shifts_for_level = result.uniface_box.shifts[level - 1];
		const fallback_shift = level * k.dimensions.SILHOUETTE_MARGIN_PX * fallback_world_per_px / 2;
		draw_uniface_faces(
			ctx, project, result.uniface_box.silhouette,
			shifts_for_level, face_excluded, fallback_shift,
			UNIFACE_BOX_STROKE, UNIFACE_BOX_EXCLUDED_STROKE,
		);
	}
}

function draw_world_axis_aligned_box(
	ctx: CanvasRenderingContext2D,
	project: (x: number, y: number, z: number) => { x: number; y: number },
	box: Silhouette_Box,
	stroke: string,
): void {
	const [x0, y0, z0] = box.min;
	const [x1, y1, z1] = box.max;
	const corners = [
		project(x0, y0, z0), project(x1, y0, z0), project(x1, y1, z0), project(x0, y1, z0),
		project(x0, y0, z1), project(x1, y0, z1), project(x1, y1, z1), project(x0, y1, z1),
	];
	const edges: Array<[number, number]> = [
		[0, 1], [1, 2], [2, 3], [3, 0],
		[4, 5], [5, 6], [6, 7], [7, 4],
		[0, 4], [1, 5], [2, 6], [3, 7],
	];
	ctx.strokeStyle = stroke;
	ctx.lineWidth = 1;
	ctx.beginPath();
	for (const [a, b] of edges) {
		ctx.moveTo(corners[a].x, corners[a].y);
		ctx.lineTo(corners[b].x, corners[b].y);
	}
	ctx.stroke();
}

// Each of six uniface faces is the silhouette face shifted outward by
// the per-level world-units shift. All six are drawn. Excluded faces
// (null shift) draw in a dashed grey style at the fallback shift, so
// the closed box is visible and the excluded faces are legible.
function draw_uniface_faces(
	ctx: CanvasRenderingContext2D,
	project: (x: number, y: number, z: number) => { x: number; y: number },
	box: Silhouette_Box,
	shifts: (number | null)[],
	face_excluded: readonly boolean[],
	fallback_shift: number,
	stroke_solid: string,
	stroke_excluded: string,
): void {
	const [x0, y0, z0] = box.min;
	const [x1, y1, z1] = box.max;
	const faces: Array<{ shift_idx: number; corners: Array<[number, number, number]> }> = [
		{ shift_idx: 0, corners: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]] }, // +x
		{ shift_idx: 1, corners: [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]] }, // -x
		{ shift_idx: 2, corners: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] }, // +y
		{ shift_idx: 3, corners: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]] }, // -y
		{ shift_idx: 4, corners: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] }, // +z
		{ shift_idx: 5, corners: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]] }, // -z
	];
	const normals: Array<[number, number, number]> = [
		[ 1, 0, 0], [-1, 0, 0],
		[0,  1, 0], [0, -1, 0],
		[0, 0,  1], [0, 0, -1],
	];
	// Easy toggles — flip to false to hide that style without touching
	// any code below. Both flags off means no uniface faces draw at all.
	const SHOW_KEPT     = false;
	const SHOW_EXCLUDED = false;
	ctx.lineWidth = 1;
	for (const face of faces) {
		const excluded = face_excluded[face.shift_idx];
		if (excluded && !SHOW_EXCLUDED) continue;
		if (!excluded && !SHOW_KEPT) continue;
		const stored = shifts[face.shift_idx];
		const s = excluded || stored === null || stored === undefined ? fallback_shift : stored;
		const n = normals[face.shift_idx];
		const shifted = face.corners.map(([cx, cy, cz]) =>
			project(cx + n[0] * s, cy + n[1] * s, cz + n[2] * s),
		);
		ctx.strokeStyle = excluded ? stroke_excluded : stroke_solid;
		ctx.setLineDash(excluded ? [4, 3] : []);
		ctx.beginPath();
		ctx.moveTo(shifted[0].x, shifted[0].y);
		ctx.lineTo(shifted[1].x, shifted[1].y);
		ctx.lineTo(shifted[2].x, shifted[2].y);
		ctx.lineTo(shifted[3].x, shifted[3].y);
		ctx.lineTo(shifted[0].x, shifted[0].y);
		ctx.stroke();
	}
	ctx.setLineDash([]);
}
