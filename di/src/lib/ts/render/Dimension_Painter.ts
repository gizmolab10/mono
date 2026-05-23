import { get_last_run_result, w_dim_dropped_avg } from './Dimension_Placement';
import type { Greedy_Placement } from './Dimension_Placement';
import type { DimensionHost } from './R_Dimensions';
import { hits_3d } from '../events/Hits_3D';
import { scene } from './Scene';

/**
 * Canvas painter for dimensions. Reads the placement list produced by
 * the new pipeline (in Dimension_Placement.ts) and turns each placement
 * into pixels: two witness lines, one dimension line with arrowheads,
 * a white box, and the number text. Also pushes a hit-test rectangle so
 * hover, click-to-edit, and the part-name popup all keep working, and
 * publishes the dropped-count running average into the same store the
 * status strip reads from.
 *
 * Called from render_dimensions in R_Dimensions.ts every paint.
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

export function paint_new_placements(host: DimensionHost): void {
	const result = get_last_run_result();
	if (!result) return;

	const ctx = host.ctx;
	const hovered = hits_3d.hovered_dimension;

	for (const p of result.placements) {
		paint_one(ctx, host, p, NEW_STROKE, NEW_TEXT, hovered);
	}

	publish_drop_count(result.drop_report.dropped.length);
}

export function paint_one(
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

	// Dim line direction (along the painted dim line, not the projected
	// edge — these differ in perspective when the per-endpoint witness
	// vectors diverge).
	const dl_dx = w2_end_x - w1_end_x;
	const dl_dy = w2_end_y - w1_end_y;
	const dl_len = Math.hypot(dl_dx, dl_dy);
	const dl_ux = dl_len > 0 ? dl_dx / dl_len : 0;
	const dl_uy = dl_len > 0 ? dl_dy / dl_len : 0;

	// Re-snap the label center onto the actual painted dim line. The
	// search computed `p.center_x`/`p.center_y` using an averaged witness
	// direction; that line and the painted dim line diverge in
	// perspective and the label would otherwise float between them. Rule
	// 7: the text sits ON the dim line. The slidable choice the search
	// picked is reinterpreted as a distance along the painted dim line
	// from the first witness end.
	const center_x = w1_end_x + dl_ux * slidable_position;
	const center_y = w1_end_y + dl_uy * slidable_position;

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
	const label_left_s  = slidable_position - half_w;
	const label_right_s = slidable_position + half_w;
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

function publish_drop_count(dropped_this_paint: number): void {
	drop_stats.counter++;
	const k = drop_stats.counter;
	drop_stats.avg_dropped += (dropped_this_paint - drop_stats.avg_dropped) / k;
	w_dim_dropped_avg.set(Math.round(drop_stats.avg_dropped));
}

/** Reset the running drop-count average. Test entry point. */
export function reset_drop_stats(): void {
	drop_stats.counter = 0;
	drop_stats.avg_dropped = 0;
}
