import { compute_root_tumble_matrix, get_last_run_result, get_last_uniface_placement, w_dim_dropped_avg, convex_hull } from './Dimension_Placement';
import type { Greedy_Placement, Placement_Details, Silhouette_Box } from './Dimension_Placement';
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

/** Default stroke and text color for dimension labels. */
const NEW_STROKE = 'rgba(60, 120, 220, 0.9)';
const NEW_TEXT   = '#36c';
/** How many screen pixels the witness line continues past the dim line.
 *  Per the Glossary's witness-line definition. */
const WITNESS_PAST_DIM_LINE_PX = 10;
/** Per rule 6: the witness line begins this many screen pixels away
 *  from the part edge, never touching the part itself. */
const WITNESS_GAP_FROM_PART_PX = 5;


const drop_stats = { counter: 0, avg_dropped: 0 };

export function render_new_placements(host: DimensionHost): void {
	const result = get_last_run_result();
	if (!result) return;

	const ctx = host.ctx;
	const hovered = hits_3d.hovered_dimension;

	for (const p of result.placements) {
		render_one(ctx, host, p, NEW_STROKE, NEW_TEXT, hovered);
	}

	publish_drop_count(result.drop_report.dropped.length);
}

export function render_one(
	ctx: CanvasRenderingContext2D,
	host: DimensionHost,
	p: Greedy_Placement,
	stroke: string,
	text_color: string,
	hovered: { so: { id: string }; axis: string } | null,
): void {
	const { pair, label_w_px, label_h_px, witness_length, slidable_position } = p;

	// Witness anchors at the part edge. Per rule 6 the drawn witness
	// line begins 5 screen pixels AWAY from the part along the witness
	// direction — it never touches the part. The dim-line end stays at
	// the original distance (witness_length from the edge in screen
	// pixels along the per-endpoint witness vector).
	const distance_3d = witness_length / pair.avg_wlen_per_3d_unit;
	const w1_end_x = pair.edge_p1_x + pair.wit_1_per3d_x * distance_3d;
	const w1_end_y = pair.edge_p1_y + pair.wit_1_per3d_y * distance_3d;
	const w2_end_x = pair.edge_p2_x + pair.wit_2_per3d_x * distance_3d;
	const w2_end_y = pair.edge_p2_y + pair.wit_2_per3d_y * distance_3d;
	const wit_1_mag = Math.hypot(pair.wit_1_per3d_x, pair.wit_1_per3d_y);
	const wit_2_mag = Math.hypot(pair.wit_2_per3d_x, pair.wit_2_per3d_y);
	const wit_1_ux = wit_1_mag > 0 ? pair.wit_1_per3d_x / wit_1_mag : 0;
	const wit_1_uy = wit_1_mag > 0 ? pair.wit_1_per3d_y / wit_1_mag : 0;
	const wit_2_ux = wit_2_mag > 0 ? pair.wit_2_per3d_x / wit_2_mag : 0;
	const wit_2_uy = wit_2_mag > 0 ? pair.wit_2_per3d_y / wit_2_mag : 0;
	const w1_start_x = pair.edge_p1_x + wit_1_ux * WITNESS_GAP_FROM_PART_PX;
	const w1_start_y = pair.edge_p1_y + wit_1_uy * WITNESS_GAP_FROM_PART_PX;
	const w2_start_x = pair.edge_p2_x + wit_2_ux * WITNESS_GAP_FROM_PART_PX;
	const w2_start_y = pair.edge_p2_y + wit_2_uy * WITNESS_GAP_FROM_PART_PX;

	// Witness lines extend 10 screen pixels past the dim line, per the
	// Glossary's witness-line definition. The 10 is measured along each
	// witness ray's own screen direction (rule 5).
	const wit_1_past_x = w1_end_x + wit_1_ux * WITNESS_PAST_DIM_LINE_PX;
	const wit_1_past_y = w1_end_y + wit_1_uy * WITNESS_PAST_DIM_LINE_PX;
	const wit_2_past_x = w2_end_x + wit_2_ux * WITNESS_PAST_DIM_LINE_PX;
	const wit_2_past_y = w2_end_y + wit_2_uy * WITNESS_PAST_DIM_LINE_PX;

	// Dim line direction (along the rendered dim line, not the projected
	// edge — these differ in perspective when the per-endpoint witness
	// vectors diverge).
	const dl_dx = w2_end_x - w1_end_x;
	const dl_dy = w2_end_y - w1_end_y;
	const dl_len = Math.hypot(dl_dx, dl_dy);
	const dl_ux = dl_len > 0 ? dl_dx / dl_len : 0;
	const dl_uy = dl_len > 0 ? dl_dy / dl_len : 0;

	// Re-snap the label center onto the actual rendered dim line. The
	// search computed `p.center_x`/`p.center_y` using an averaged witness
	// direction; that line and the rendered dim line diverge in
	// perspective and the label would otherwise float between them. Rule
	// 7: the text sits ON the dim line. The slidable value the search
	// picked is in EDGE-length units (the search built its forbidden
	// zones using the projected edge length). The rendered dim line is a
	// different length than the projected edge when the per-endpoint
	// witnesses converge or diverge, so the slide must be RESCALED from
	// edge units into dim-line units before being applied here.
	const edge_len_px = Math.hypot(pair.edge_p2_x - pair.edge_p1_x, pair.edge_p2_y - pair.edge_p1_y);
	const slide_dl = (edge_len_px > 0.001) ? slidable_position * dl_len / edge_len_px : slidable_position;
	const center_x = w1_end_x + dl_ux * slide_dl;
	const center_y = w1_end_y + dl_uy * slide_dl;

	// One-shot trace mirroring the one in Dimension_Placement.ts so we can
	// compare what the search picked against where the renderer places the
	// label centre. Edit the literal below to follow a different label.
	const DBG_TRACE_TEXT = "16' 8 1/2\"";
	if (pair.text === DBG_TRACE_TEXT) {
		const last = (render_one as unknown as { _last_trace?: string })._last_trace ?? '';
		const line =
			`DIM TRACE RENDERER [${DBG_TRACE_TEXT}]: ` +
			`witness 1 end (${w1_end_x.toFixed(1)}, ${w1_end_y.toFixed(1)}), ` +
			`witness 2 end (${w2_end_x.toFixed(1)}, ${w2_end_y.toFixed(1)}), ` +
			`edge length ${edge_len_px.toFixed(1)} px, ` +
			`dim line length ${dl_len.toFixed(1)} px, ` +
			`slide from search ${slidable_position.toFixed(1)} (edge units), ` +
			`slide on dim line ${slide_dl.toFixed(1)} px, ` +
			`rendered centre (${center_x.toFixed(1)}, ${center_y.toFixed(1)})`;
		if (line !== last) {
			(render_one as unknown as { _last_trace?: string })._last_trace = line;
			console.log(line);
		}
	}

	const is_hovered = hovered !== null && hovered.so.id === p.so_id && hovered.axis === p.axis;

	// Two witness lines, each extending 10 px past the dim line.
	ctx.strokeStyle = stroke;
	ctx.lineWidth = is_hovered ? 1.5 : 0.5;
	ctx.beginPath();
	ctx.moveTo(w1_start_x, w1_start_y);
	ctx.lineTo(wit_1_past_x, wit_1_past_y);
	ctx.moveTo(w2_start_x, w2_start_y);
	ctx.lineTo(wit_2_past_x, wit_2_past_y);
	ctx.stroke();

	// Dim line. Per rule 7:
	//   Label between witnesses → just the inside segment, arrows inward.
	//   Label overhanging      → NO inside segment, both outside
	//                            extensions, each arrow on its anchor's
	//                            outside (in the direction the
	//                            extension goes).
	const FIXED_SHORT_EXTENSION_PX = 30;
	const half_w = label_w_px / 2;
	// Use the rescaled slide so the between-vs-overhang check matches
	// where the label actually renders on the dim line.
	const label_left_s  = slide_dl - half_w;
	const label_right_s = slide_dl + half_w;
	const label_sits_between = label_left_s >= 0 && label_right_s <= dl_len;
	ctx.fillStyle = stroke;
	ctx.beginPath();
	if (label_sits_between) {
		ctx.moveTo(w1_end_x, w1_end_y);
		ctx.lineTo(w2_end_x, w2_end_y);
	} else {
		// Overhang: both sides get an outside extension. The label-side
		// extension reaches the label; the other side is a fixed short
		// length so the visual reads as symmetric.
		const left_s  = label_left_s  < 0      ? label_left_s  : -FIXED_SHORT_EXTENSION_PX;
		const right_s = label_right_s > dl_len ? label_right_s : dl_len + FIXED_SHORT_EXTENSION_PX;
		ctx.moveTo(w1_end_x + dl_ux * left_s,  w1_end_y + dl_uy * left_s);
		ctx.lineTo(w1_end_x,                   w1_end_y);
		ctx.moveTo(w2_end_x,                   w2_end_y);
		ctx.lineTo(w1_end_x + dl_ux * right_s, w1_end_y + dl_uy * right_s);
	}
	ctx.stroke();
	if (label_sits_between) {
		// Arrows inward, pointing at each other along the inside segment.
		host.draw_arrow(w1_end_x, w1_end_y, dl_dx, dl_dy);
		host.draw_arrow(w2_end_x, w2_end_y, -dl_dx, -dl_dy);
	} else {
		// Arrows outward, each on the same side of its anchor as its
		// extension goes.
		host.draw_arrow(w1_end_x, w1_end_y, -dl_dx, -dl_dy);
		host.draw_arrow(w2_end_x, w2_end_y, dl_dx, dl_dy);
	}

	// White box + number text at the chosen center.
	ctx.font = is_hovered ? 'bold 12px sans-serif' : '12px sans-serif';
	ctx.fillStyle = 'white';
	ctx.fillRect(center_x - label_w_px / 2 - 2, center_y - label_h_px / 2 - 1, label_w_px + 4, label_h_px + 2);
	ctx.fillStyle = text_color;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(pair.text, center_x, center_y);

	// Hit-test rectangle so hover, click-to-edit, and the popup work.
	const so_o = scene.get_all().find(o => o.so.id === p.so_id);
	if (so_o) {
		host.dimension_rects.push({
			axis: p.axis,
			so: so_o.so,
			x: center_x, y: center_y,
			w: label_w_px, h: label_h_px,
			z: pair.dim_z,
			face_index: -1,
		});
	}
}

function publish_drop_count(dropped_this_render: number): void {
	drop_stats.counter++;
	const k = drop_stats.counter;
	drop_stats.avg_dropped += (dropped_this_render - drop_stats.avg_dropped) / k;
	w_dim_dropped_avg.set(Math.round(drop_stats.avg_dropped));
}

/** Reset the running drop-count average. Test entry point. */
export function reset_drop_stats(): void {
	drop_stats.counter = 0;
	drop_stats.avg_dropped = 0;
}

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
	const result = get_last_uniface_placement();
	if (result.picks.length === 0) return;
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
	const drawable: Array<{ pick: Placement_Details; so_name: string; so_id: string; axis: typeof result.picks[number]['axis'] }> = [];
	for (const entry of result.picks) {
		const p = entry.pick;
		if (p.uniface === null) continue;
		if (!p.edge_p1_screen || !p.edge_p2_screen) continue;
		if (!p.anchor_1_screen || !p.anchor_2_screen) continue;
		// Step 3d filter 3: off-canvas drop. Skip drawing a dim whose
		// two dim-line endpoints both sit outside the visible canvas —
		// it would draw entirely off-screen.
		const a1 = p.anchor_1_screen;
		const a2 = p.anchor_2_screen;
		const a1_off = a1.x < 0 || a1.x > canvas_w || a1.y < 0 || a1.y > canvas_h;
		const a2_off = a2.x < 0 || a2.x > canvas_w || a2.y < 0 || a2.y > canvas_h;
		if (a1_off && a2_off) {
			dropped_off_canvas++;
			dropped_off_canvas_names.push(`${entry.so_name} (${entry.axis})`);
			continue;
		}
		drawable.push({ pick: p, so_name: entry.so_name, so_id: entry.so_id, axis: entry.axis });
	}
	for (const d of drawable) {
		const p = d.pick;
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
	render_uniface_hover(host, result.picks);
	// Step 3e: arrowheads + white-boxed number text drawn last so the
	// label box sits on top of every dim and witness line, including the
	// red hover overlay. The hovered part's labels switch to the red
	// hover colour so the label matches the dim line beneath it.
	const hovered_so_id =
		hits_3d.hovered_uniface_pick?.so_id
		?? hits_3d.hover?.so?.id
		?? null;
	for (const d of drawable) {
		const color = d.so_id === hovered_so_id ? UNIFACE_HOVER_STROKE : UNIFACE_PICK_STROKE;
		draw_uniface_arrows_and_label(host, d.pick, color, d.so_id, d.axis);
	}
}

/** Redraws hover highlights in red. Two cases:
 *  1. Cursor is on a uniface dim or witness line — highlight just that
 *     pick's three lines plus the measured part's outline.
 *  2. Cursor is on a part (corner/edge/face hover) — highlight every
 *     uniface pick that belongs to that part, plus the part's outline.
 *  When both stores point at the same part, the pick-specific lines also
 *  draw (case 1's union with case 2). */
function render_uniface_hover(host: DimensionHost, picks: ReturnType<typeof get_last_uniface_placement>['picks']): void {
	const hovered_pick = hits_3d.hovered_uniface_pick;
	const general_hover = hits_3d.hover;
	const hovered_so_id =
		hovered_pick?.so_id
		?? general_hover?.so.id
		?? null;
	if (hovered_so_id === null) return;
	const ctx = host.ctx;
	ctx.save();
	ctx.strokeStyle = UNIFACE_HOVER_STROKE;
	ctx.fillStyle = UNIFACE_HOVER_STROKE;
	ctx.lineWidth = 1.5;
	// Draw every pick on the hovered part in red. When the cursor is on
	// a specific dim/witness line, that pick is among them; when the
	// cursor is on the part itself, all of the part's picks turn red.
	for (const entry of picks) {
		if (entry.so_id !== hovered_so_id) continue;
		const p = entry.pick;
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
	const a1 = p.anchor_1_screen;
	const a2 = p.anchor_2_screen;
	const label_pos = p.natural_label_position;
	const text = p.label_text;
	if (!a1 || !a2 || !label_pos || text === null) return;
	const ctx = host.ctx;
	const dx = a2.x - a1.x;
	const dy = a2.y - a1.y;
	const dl_len = Math.hypot(dx, dy);
	if (dl_len < 1e-9) return;
	const ux = dx / dl_len;
	const uy = dy / dl_len;
	const LABEL_H_PX = 14;
	ctx.font = '12px sans-serif';
	const label_w_px = ctx.measureText(text).width + 4;
	const half_w = label_w_px / 2;
	const overhang_px = k.dimensions.SLIDABLE_OVERHANG_PX;
	const ARROW_SIZE_PX = 6;
	// Placement has already done the rule-18 slide for full coverage, so
	// the label position stored on the pick is already final. The renderer
	// just decides per-side whether each arrow should sit inside (pointing
	// inward) or outside (pointing outward along a twenty-pixel extension)
	// and whether to draw the inside dim segment between the two anchors.
	// To know whether the label was the slid one (and so should force
	// full overhang on both sides), check whether the label center sits
	// past either witness anchor along the dim line.
	const effective_label_pos = label_pos;
	const proj_label = (effective_label_pos.x - a1.x) * ux + (effective_label_pos.y - a1.y) * uy;
	const slid_past_a1 = proj_label < 0;
	const slid_past_a2 = proj_label > dl_len;
	const slid = slid_past_a1 || slid_past_a2;
	// Check whether the inside arrow at this anchor would fit between the
	// label box and the witness line, measured along the dim line itself
	// (the screen-axis rectangle padding misses diagonal cases). The
	// anchor must sit at least (half-label-width + 2 + arrow-length)
	// away from the label center along the dim direction, on the side of
	// the label that the anchor's arrow would point AWAY from.
	const arrow_blocked = (anchor: { x: number; y: number }, sign: number): boolean => {
		const min_gap_along_dim = half_w + 2 + ARROW_SIZE_PX;
		const anchor_proj = (anchor.x - effective_label_pos.x) * ux + (anchor.y - effective_label_pos.y) * uy;
		// sign +1 means arrow points in +dir (anchor on -dir side of dim),
		// sign -1 means arrow points in -dir (anchor on +dir side).
		// The expected projection of a viable inside arrow's anchor is on
		// the OPPOSITE side of dir from the arrow's pointing direction.
		// For sign +1: anchor_proj should be sufficiently NEGATIVE.
		// For sign -1: anchor_proj should be sufficiently POSITIVE.
		const signed_distance_outside_label = -sign * anchor_proj;
		return signed_distance_outside_label < min_gap_along_dim;
	};
	// Per-side decide outside vs inside. The slid case forces both sides
	// outside regardless of per-side fit (full overhang takes over).
	const a1_outside = slid || arrow_blocked(a1, +1);
	const a2_outside = slid || arrow_blocked(a2, -1);
	// Label-near-edge points (used for the inside dim half-line and for
	// the slid case's near-witness extension that stretches FROM the
	// anchor TO the label's near edge).
	const proj_a1 = (a1.x - effective_label_pos.x) * ux + (a1.y - effective_label_pos.y) * uy;
	const proj_a2 = (a2.x - effective_label_pos.x) * ux + (a2.y - effective_label_pos.y) * uy;
	const sign_a1 = proj_a1 >= 0 ? 1 : -1;
	const sign_a2 = proj_a2 >= 0 ? 1 : -1;
	const label_near_edge_a1 = {
		x: effective_label_pos.x + sign_a1 * (half_w + 2) * ux,
		y: effective_label_pos.y + sign_a1 * (half_w + 2) * uy,
	};
	const label_near_edge_a2 = {
		x: effective_label_pos.x + sign_a2 * (half_w + 2) * ux,
		y: effective_label_pos.y + sign_a2 * (half_w + 2) * uy,
	};
	ctx.save();
	ctx.strokeStyle = color;
	ctx.lineWidth = 0.75;
	ctx.beginPath();
	if (slid) {
		// Both outside extensions are SLIDABLE_OVERHANG_PX — same as
		// every other outside arrow. On the slid side, an extra
		// connector line runs from the extension end to the label's
		// near edge so the arrow and the label read as one shape.
		ctx.moveTo(a1.x - ux * overhang_px, a1.y - uy * overhang_px);
		ctx.lineTo(a1.x, a1.y);
		ctx.moveTo(a2.x, a2.y);
		ctx.lineTo(a2.x + ux * overhang_px, a2.y + uy * overhang_px);
		if (slid_past_a1) {
			ctx.moveTo(a1.x - ux * overhang_px, a1.y - uy * overhang_px);
			ctx.lineTo(label_near_edge_a1.x, label_near_edge_a1.y);
		} else {
			ctx.moveTo(a2.x + ux * overhang_px, a2.y + uy * overhang_px);
			ctx.lineTo(label_near_edge_a2.x, label_near_edge_a2.y);
		}
	} else if (!a1_outside && !a2_outside) {
		ctx.moveTo(a1.x, a1.y);
		ctx.lineTo(a2.x, a2.y);
	} else if (!a1_outside && a2_outside) {
		ctx.moveTo(a1.x, a1.y);
		ctx.lineTo(label_near_edge_a1.x, label_near_edge_a1.y);
		ctx.moveTo(a2.x, a2.y);
		ctx.lineTo(a2.x + ux * overhang_px, a2.y + uy * overhang_px);
	} else if (a1_outside && !a2_outside) {
		ctx.moveTo(a1.x - ux * overhang_px, a1.y - uy * overhang_px);
		ctx.lineTo(a1.x, a1.y);
		ctx.moveTo(label_near_edge_a2.x, label_near_edge_a2.y);
		ctx.lineTo(a2.x, a2.y);
	} else {
		ctx.moveTo(a1.x - ux * overhang_px, a1.y - uy * overhang_px);
		ctx.lineTo(a1.x, a1.y);
		ctx.moveTo(a2.x, a2.y);
		ctx.lineTo(a2.x + ux * overhang_px, a2.y + uy * overhang_px);
	}
	ctx.stroke();
	ctx.fillStyle = color;
	if (a1_outside) host.draw_arrow(a1.x, a1.y, -dx, -dy);
	else            host.draw_arrow(a1.x, a1.y,  dx,  dy);
	if (a2_outside) host.draw_arrow(a2.x, a2.y,  dx,  dy);
	else            host.draw_arrow(a2.x, a2.y, -dx, -dy);
	ctx.restore();
	ctx.save();
	ctx.fillStyle = 'white';
	ctx.fillRect(effective_label_pos.x - half_w - 2, effective_label_pos.y - LABEL_H_PX / 2 - 1, label_w_px + 4, LABEL_H_PX + 2);
	ctx.fillStyle = color;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, effective_label_pos.x, effective_label_pos.y);
	ctx.restore();
	// Register the label rect for hit-testing so hovering on the label
	// triggers the same red highlight as hovering on a dim or witness
	// line or on the part itself.
	const so_o = scene.get_all().find(o => o.so.id === so_id);
	if (so_o) {
		host.dimension_rects.push({
			axis,
			so: so_o.so,
			x: effective_label_pos.x,
			y: effective_label_pos.y,
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
	const result = get_last_uniface_placement();
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
