import { describe, it, expect } from 'vitest';
import { paint_one } from '../render/Dimension_Painter';
import type { Greedy_Placement, Viable_Pair } from '../render/Dimension_Placement';
import type { DimensionHost } from '../render/R_Dimensions';

// ─── Fake canvas + host that records every draw call ─────────────────────────

type Recorded = { op: string; [k: string]: unknown };

class Fake_Ctx {
	calls       : Recorded[] = [];
	canvas      = { width: 1000, height: 1000 };
	strokeStyle : string = '';
	lineWidth   : number = 0;
	fillStyle   : string = '';
	font        : string = '';
	textAlign   : string = '';
	textBaseline: string = '';
	beginPath()                                 { this.calls.push({ op: 'beginPath' }); }
	moveTo(x: number, y: number)                { this.calls.push({ op: 'moveTo', x, y }); }
	lineTo(x: number, y: number)                { this.calls.push({ op: 'lineTo', x, y }); }
	stroke()                                    { this.calls.push({ op: 'stroke' }); }
	fillRect(x: number, y: number, w: number, h: number) { this.calls.push({ op: 'fillRect', x, y, w, h }); }
	fillText(t: string, x: number, y: number)   { this.calls.push({ op: 'fillText', t, x, y }); }
}

function fake_host(): DimensionHost & { arrows: { x: number; y: number; dx: number; dy: number }[]; ctx: Fake_Ctx } {
	const ctx = new Fake_Ctx();
	const arrows: { x: number; y: number; dx: number; dy: number }[] = [];
	return {
		ctx: ctx as unknown as CanvasRenderingContext2D & Fake_Ctx,
		dimension_rects: [],
		project_vertex: () => ({ x: 0, y: 0, z: 0, w: 1 }),
		get_world_matrix: () => new Float32Array(16) as unknown as import('gl-matrix').mat4,
		face_winding: () => 0,
		point_in_polygon_2d: () => false,
		draw_arrow: (x: number, y: number, dx: number, dy: number) => { arrows.push({ x, y, dx, dy }); },
		arrows,
	} as unknown as DimensionHost & { arrows: typeof arrows; ctx: Fake_Ctx };
}

// ─── Greedy_Placement fixtures with per-endpoint witness vectors ─────────────

function pair_with(opts: {
	edge_p1: [number, number];
	edge_p2: [number, number];
	wit_avg: [number, number];
	wit_1: [number, number];
	wit_2: [number, number];
	avg_wlen: number;
	label_w?: number;
	text?: string;
}): Viable_Pair {
	return {
		so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x',
		edge_v1_idx: 0, edge_v2_idx: 1,
		direction: [0, 0, 1],
		witness_length_min: 15, witness_length_max: 80,
		slidable_min: 0, slidable_max: 200,
		avg_wlen_per_3d_unit: opts.avg_wlen,
		label_w_px: opts.label_w ?? 30, label_h_px: 14,
		edge_p1_x: opts.edge_p1[0], edge_p1_y: opts.edge_p1[1],
		edge_p2_x: opts.edge_p2[0], edge_p2_y: opts.edge_p2[1],
		wit_ux: opts.wit_avg[0], wit_uy: opts.wit_avg[1],
		wit_1_per3d_x: opts.wit_1[0], wit_1_per3d_y: opts.wit_1[1],
		wit_2_per3d_x: opts.wit_2[0], wit_2_per3d_y: opts.wit_2[1],
		text: opts.text ?? '8 1/2"',
		dim_z: 0,
	};
}

function placement(pair: Viable_Pair, witness_length: number, slidable_position: number): Greedy_Placement {
	return {
		so_id: pair.so_id, so_name: pair.so_name, kind: pair.kind, axis: pair.axis,
		pair,
		witness_length, slidable_position,
		center_x: 0, center_y: 0,   // painter recomputes this; value here is unused
		label_w_px: pair.label_w_px, label_h_px: pair.label_h_px,
		min_clearance: 0,
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Dimension_Painter — witness lines extend 10 px past the dim line', () => {
	it('continues each witness 10 screen pixels along its own direction past the dim line', () => {
		// Straight-up witnesses on a horizontal edge at y=200. Witness
		// length 30 → the dim line sits at y=170. The witness line ends
		// should be at y = 170 - 10 = 160 (10 px past, along the
		// up-pointing per-3D-unit vector).
		const pair = pair_with({
			edge_p1: [0,   200],
			edge_p2: [200, 200],
			wit_avg: [0, -1],
			wit_1:   [0, -1],
			wit_2:   [0, -1],
			avg_wlen: 1,
		});
		const host = fake_host();
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, 100), 'blue', 'blue', null);

		const lines = host.ctx.calls.filter(c => c.op === 'lineTo');
		const has_left_extension  = lines.some(c => c.x === 0   && c.y === 160);
		const has_right_extension = lines.some(c => c.x === 200 && c.y === 160);
		expect(has_left_extension).toBe(true);
		expect(has_right_extension).toBe(true);
	});
});

describe('Dimension_Painter — witness lines start 5 px away from the part (rule 6)', () => {
	it('moves the witness-line start 5 screen pixels along the witness direction, not from the part vertex', () => {
		// Edge at y=200, witness pointing up. Per rule 6 the witness
		// line must begin AFTER a 5-pixel gap from the part edge — so
		// the moveTo for the witness should be at y = 200 - 5 = 195, not
		// at y = 200 (where the projected vertex sits).
		const pair = pair_with({
			edge_p1: [0,   200],
			edge_p2: [200, 200],
			wit_avg: [0, -1],
			wit_1:   [0, -1],
			wit_2:   [0, -1],
			avg_wlen: 1,
		});
		const host = fake_host();
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, 100), 'blue', 'blue', null);

		// No moveTo at (0, 200) or (200, 200) — those are the part
		// vertices and the witness must NOT touch them.
		const moves = host.ctx.calls.filter(c => c.op === 'moveTo');
		const touches_part_1 = moves.some(c => c.x === 0 && c.y === 200);
		const touches_part_2 = moves.some(c => c.x === 200 && c.y === 200);
		expect(touches_part_1).toBe(false);
		expect(touches_part_2).toBe(false);

		// Witness starts at the gap-offset point: (0, 195) and (200, 195).
		const starts_at_gap_1 = moves.some(c => c.x === 0   && c.y === 195);
		const starts_at_gap_2 = moves.some(c => c.x === 200 && c.y === 195);
		expect(starts_at_gap_1).toBe(true);
		expect(starts_at_gap_2).toBe(true);
	});
});

describe('Dimension_Painter — per-endpoint witness lines (rule 5)', () => {
	it('draws each witness line from its own endpoint, NOT from a shared averaged direction', () => {
		// Two endpoints with DIFFERENT per-3D-unit screen vectors. In
		// perspective, world-parallel rays diverge on screen. The painter
		// must honor each endpoint's own vector, not the average.
		const pair = pair_with({
			edge_p1: [100, 200],
			edge_p2: [200, 200],
			wit_avg: [0, -1],                  // averaged direction: straight up
			wit_1:   [0,    -1],               // endpoint 1: straight up, 1 px per 3D unit
			wit_2:   [0.5,  -1],               // endpoint 2: angled, longer per 3D unit
			avg_wlen: 1,
		});
		const host = fake_host();
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, 50), 'blue', 'blue', null);

		// Witness 1 end: edge_p1 + wit_1 × (30/1) = (100, 200) + (0, -30) = (100, 170)
		// Witness 2 end: edge_p2 + wit_2 × (30/1) = (200, 200) + (15, -30) = (215, 170)
		// These are NOT vertically aligned even though both are 30 px tall —
		// witness 2 leans right, witness 1 goes straight up. That divergence
		// is exactly the rule-5 behavior.
		const moves = host.ctx.calls.filter(c => c.op === 'moveTo' || c.op === 'lineTo');
		const has_left  = moves.some(c => c.x === 100 && c.y === 170);
		const has_right = moves.some(c => c.x === 215 && c.y === 170);
		expect(has_left).toBe(true);
		expect(has_right).toBe(true);
	});
});

describe('Dimension_Painter — label snapped to the painted dim line (rule 7)', () => {
	it('places the text on the actual dim line, not on the search\'s abstract averaged line', () => {
		// Diverging witness vectors → the painted dim line direction
		// differs from the projected edge direction. The label must sit
		// on the painted line.
		const pair = pair_with({
			edge_p1: [0, 200],
			edge_p2: [100, 200],
			wit_avg: [0, -1],
			wit_1: [0, -1],
			wit_2: [0.3, -1],
			avg_wlen: 1,
		});
		const host = fake_host();
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, 50), 'blue', 'blue', null);

		// w1_end = (0, 170). w2_end = (100 + 9, 170) = (109, 170).
		// dim line goes from (0, 170) to (109, 170) — horizontal here.
		// slidable = 50 is in EDGE-length units (edge is 100 px). The
		// painter rescales it onto the longer dim line: 50 * 109 / 100 = 54.5.
		const text_call = host.ctx.calls.find(c => c.op === 'fillText');
		expect(text_call).toBeTruthy();
		expect(text_call!.x).toBeCloseTo(54.5, 5);
		expect(text_call!.y).toBeCloseTo(170, 5);
	});
});

/** Walk the recorded calls and return every line segment as [(ax, ay), (bx, by)].
 *  A segment is a moveTo immediately followed by a lineTo (single-edge subpath). */
function segments(calls: Recorded[]): [{ x: number; y: number }, { x: number; y: number }][] {
	const out: [{ x: number; y: number }, { x: number; y: number }][] = [];
	for (let i = 0; i < calls.length - 1; i++) {
		if (calls[i].op === 'moveTo' && calls[i + 1].op === 'lineTo') {
			out.push([
				{ x: calls[i].x as number, y: calls[i].y as number },
				{ x: calls[i + 1].x as number, y: calls[i + 1].y as number },
			]);
		}
	}
	return out;
}

describe('Dimension_Painter — dim line layout when label fits between witnesses', () => {
	it('draws a single inside segment between the two witness ends and no outside extension', () => {
		// dim line length 200 px, label 30 px wide, slidable 100 (centered).
		// Label fits between, no overhang → just inside segment.
		const pair = pair_with({
			edge_p1: [0, 200], edge_p2: [200, 200],
			wit_avg: [0, -1], wit_1: [0, -1], wit_2: [0, -1],
			avg_wlen: 1,
			label_w: 30,
		});
		const host = fake_host();
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, 100), 'blue', 'blue', null);

		// Segments where BOTH endpoints sit on the dim line (y=170) are
		// dim-line segments. Witness segments have one endpoint on the
		// edge (y=200) and one on the dim line.
		const segs = segments(host.ctx.calls);
		const dim_segs = segs.filter(s => s[0].y === 170 && s[1].y === 170);
		expect(dim_segs).toHaveLength(1);
		expect(dim_segs[0][0]).toEqual({ x: 0, y: 170 });
		expect(dim_segs[0][1]).toEqual({ x: 200, y: 170 });
	});
});

describe('Dimension_Painter — dim line layout when label fits between but overhangs anyway', () => {
	it('draws ONLY the two outside extensions (no inside segment) when the label overhangs, per rule 7', () => {
		// dim line length 200 px, label 30 px wide (fits between), but
		// search picked slidable = -25 → label overhangs LEFT. Per the
		// updated rule 7, no inside segment is drawn when the label
		// overhangs. Both sides get an outside extension.
		const pair = pair_with({
			edge_p1: [0, 200], edge_p2: [200, 200],
			wit_avg: [0, -1], wit_1: [0, -1], wit_2: [0, -1],
			avg_wlen: 1,
			label_w: 30,
		});
		const host = fake_host();
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, -25), 'blue', 'blue', null);

		const segs = segments(host.ctx.calls);
		const dim_segs = segs.filter(s => s[0].y === 170 && s[1].y === 170);
		expect(dim_segs).toHaveLength(2);

		const has_inside        = dim_segs.some(s => (s[0].x === 0   && s[1].x === 200) || (s[0].x === 200 && s[1].x === 0));
		const has_left_to_label = dim_segs.some(s => s[0].x === -40 || s[1].x === -40);
		const has_right_short   = dim_segs.some(s => s[0].x === 230 || s[1].x === 230);
		expect(has_inside).toBe(false);
		expect(has_left_to_label).toBe(true);
		expect(has_right_short).toBe(true);
	});

	it('draws ONLY the inside segment when the label sits comfortably between with no overhang', () => {
		const pair = pair_with({
			edge_p1: [0, 200], edge_p2: [200, 200],
			wit_avg: [0, -1], wit_1: [0, -1], wit_2: [0, -1],
			avg_wlen: 1,
			label_w: 30,
		});
		const host = fake_host();
		// slidable = 100: label center at 100, label spans 85..115 — fully inside [0, 200].
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, 100), 'blue', 'blue', null);

		const segs = segments(host.ctx.calls);
		const dim_segs = segs.filter(s => s[0].y === 170 && s[1].y === 170);
		expect(dim_segs).toHaveLength(1);
	});
});

describe('Dimension_Painter — dim line layout when label is wider than dim line', () => {
	it('draws no inside segment and gives both sides an outside extension', () => {
		// dim line length 10 px, label 60 px wide. Label can't fit
		// between. Both sides get an extension; the label-side extension
		// reaches the label, the other side is the fixed short length.
		const pair = pair_with({
			edge_p1: [100, 200], edge_p2: [110, 200],
			wit_avg: [0, -1], wit_1: [0, -1], wit_2: [0, -1],
			avg_wlen: 1,
			label_w: 60,
		});
		const host = fake_host();
		// slidable = -20: label center 20 px LEFT of w1_end, label spans -50 to 10 along dim line.
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, -20), 'blue', 'blue', null);

		// w1_end = (100, 170). w2_end = (110, 170). dl_len = 10.
		// Expect TWO dim segments (both at y=170): the left extension
		// from label_left to w1_end, and the right extension from w2_end
		// to the fixed-short distance past w2_end.
		const segs = segments(host.ctx.calls);
		const dim_segs = segs.filter(s => s[0].y === 170 && s[1].y === 170);
		expect(dim_segs).toHaveLength(2);

		// Neither dim segment is the inside gap between w1_end and w2_end.
		const has_inside = dim_segs.some(s =>
			(s[0].x === 100 && s[1].x === 110) || (s[0].x === 110 && s[1].x === 100)
		);
		expect(has_inside).toBe(false);

		// Label-side extension reaches label_left at x = 100 + (-50) = 50.
		const has_label_side = dim_segs.some(s => s[0].x === 50 || s[1].x === 50);
		expect(has_label_side).toBe(true);

		// Other side: w2_end + fixed 30 = 110 + 30 = 140.
		const has_other_side = dim_segs.some(s => s[0].x === 140 || s[1].x === 140);
		expect(has_other_side).toBe(true);
	});
});

describe('Dimension_Painter — arrowheads sit on the same side of the anchor as the dim line', () => {
	it('points arrows inward when the label sits between the two witnesses', () => {
		const pair = pair_with({
			edge_p1: [0, 200], edge_p2: [200, 200],
			wit_avg: [0, -1], wit_1: [0, -1], wit_2: [0, -1],
			avg_wlen: 1,
			label_w: 30,
		});
		const host = fake_host();
		// slidable = 100 → label centered between witnesses.
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, 100), 'blue', 'blue', null);

		expect(host.arrows).toHaveLength(2);
		// Left arrow at (0, 170) points right (toward right witness).
		const a1 = host.arrows.find(a => a.x === 0 && a.y === 170);
		expect(a1).toBeTruthy();
		expect(a1!.dx).toBeGreaterThan(0);
		// Right arrow at (200, 170) points left (toward left witness).
		const a2 = host.arrows.find(a => a.x === 200 && a.y === 170);
		expect(a2).toBeTruthy();
		expect(a2!.dx).toBeLessThan(0);
	});

	it('points arrows outward when the label overhangs to the left', () => {
		const pair = pair_with({
			edge_p1: [0, 200], edge_p2: [500, 200],
			wit_avg: [0, -1], wit_1: [0, -1], wit_2: [0, -1],
			avg_wlen: 1,
			label_w: 30,
		});
		const host = fake_host();
		// slidable = -50 → label is past the left witness anchor.
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, -50), 'blue', 'blue', null);

		const a1 = host.arrows.find(a => a.x === 0 && a.y === 170);
		const a2 = host.arrows.find(a => a.x === 500 && a.y === 170);
		// Left arrow points LEFT (away from right witness, toward label side).
		expect(a1!.dx).toBeLessThan(0);
		// Right arrow points RIGHT (away from left witness, toward its own extension).
		expect(a2!.dx).toBeGreaterThan(0);
	});

	it('points arrows outward when the label overhangs to the right', () => {
		const pair = pair_with({
			edge_p1: [0, 200], edge_p2: [500, 200],
			wit_avg: [0, -1], wit_1: [0, -1], wit_2: [0, -1],
			avg_wlen: 1,
			label_w: 30,
		});
		const host = fake_host();
		// slidable = 550 → label is past the right witness anchor.
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, 550), 'blue', 'blue', null);

		const a1 = host.arrows.find(a => a.x === 0 && a.y === 170);
		const a2 = host.arrows.find(a => a.x === 500 && a.y === 170);
		// Left arrow points LEFT (its own extension side).
		expect(a1!.dx).toBeLessThan(0);
		// Right arrow points RIGHT (toward the label).
		expect(a2!.dx).toBeGreaterThan(0);
	});

	it('does NOT draw the inside segment when the label overhangs', () => {
		const pair = pair_with({
			edge_p1: [0, 200], edge_p2: [500, 200],
			wit_avg: [0, -1], wit_1: [0, -1], wit_2: [0, -1],
			avg_wlen: 1,
			label_w: 30,
		});
		const host = fake_host();
		// slidable = -50 → overhang left. dim line BETWEEN witnesses (y=170, x in [0, 500])
		// should NOT appear as a drawn segment.
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, -50), 'blue', 'blue', null);
		const segs = segments(host.ctx.calls);
		const inside_segs = segs.filter(s =>
			s[0].y === 170 && s[1].y === 170 &&
			((s[0].x === 0 && s[1].x === 500) || (s[0].x === 500 && s[1].x === 0))
		);
		expect(inside_segs).toHaveLength(0);
	});
});

describe('Dimension_Painter — text is drawn after the white box', () => {
	it('draws a white background rectangle and then the number text at the same center', () => {
		const pair = pair_with({
			edge_p1: [0, 200], edge_p2: [200, 200],
			wit_avg: [0, -1], wit_1: [0, -1], wit_2: [0, -1],
			avg_wlen: 1,
		});
		const host = fake_host();
		paint_one(host.ctx as unknown as CanvasRenderingContext2D, host, placement(pair, 30, 100), 'blue', 'blue', null);

		const box  = host.ctx.calls.find(c => c.op === 'fillRect');
		const text = host.ctx.calls.find(c => c.op === 'fillText');
		expect(box).toBeTruthy();
		expect(text).toBeTruthy();
		// Center of box = (boxX + boxW/2, boxY + boxH/2) should match text (x, y).
		const cx = (box!.x as number) + (box!.w as number) / 2;
		const cy = (box!.y as number) + (box!.h as number) / 2;
		expect(cx).toBeCloseTo(text!.x as number, 5);
		expect(cy).toBeCloseTo(text!.y as number, 5);
	});
});
