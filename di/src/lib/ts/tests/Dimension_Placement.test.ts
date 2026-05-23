import { describe, it, expect } from 'vitest';
import {
	neighbour_pairs_from_regions,
	pair_can_separate,
	labels_can_separate_via_some_combination,
	Conflict_Graph,
	label_key,
	min_distance_to_placed,
	best_candidate_in_pair,
	order_by_constrainedness,
	greedy_seed_for_regions,
	find_conflicts_in_placement,
	retry_pass,
	stochastic_finish,
	seed_string_from_regions,
	apply_drop_policy,
	drop_duplicates,
	polish_pass,
	is_edge_occluded,
	compute_viability,
	re_project_persisted_list,
	Persistence,
	type Persisted_Placement,
	type Reachable_Region,
	type Viable_Pair,
	type Greedy_Placement,
	type Label_Key,
} from '../render/Dimension_Placement';

// Build a Viable_Pair with horizontal projected edge, perpendicular
// witness pointing UP (negative Y on screen). Lets tests reason in
// simple x/y terms without juggling 3D projections.
function horiz_edge_pair(args: {
	so_id      : string;
	edge_left_x: number;
	edge_y     : number;
	edge_len   : number;
	w_min      : number;
	w_max      : number;
	s_min      : number;
	s_max      : number;
	label_w    : number;
	label_h    : number;
}): Viable_Pair {
	return {
		so_id : args.so_id,
		so_name : args.so_id,
		kind : 'regular',
		axis : 'x',
		edge_v1_idx : 0,
		edge_v2_idx : 1,
		direction : [0, 0, 1],
		witness_length_min : args.w_min,
		witness_length_max : args.w_max,
		slidable_min : args.s_min,
		slidable_max : args.s_max,
		avg_wlen_per_3d_unit : 10,
		label_w_px : args.label_w,
		label_h_px : args.label_h,
		edge_p1_x : args.edge_left_x,
		edge_p1_y : args.edge_y,
		edge_p2_x : args.edge_left_x + args.edge_len,
		edge_p2_y : args.edge_y,
		// Witness direction: up (negative Y on screen). Both endpoints
		// project to the same per-3D-unit screen vector — fine for tests
		// that work in flat 2D where there is no perspective divergence.
		wit_ux : 0,
		wit_uy : -1,
		wit_1_per3d_x : 0,
		wit_1_per3d_y : -1,
		wit_2_per3d_x : 0,
		wit_2_per3d_y : -1,
		text : '0',
		dim_z : 0,
	};
}

// Helper: build a Reachable_Region with just the AABB fields filled in.
// The grid worker only reads the bounds and the so_id/axis identity, so
// the empty `pairs` array is fine.
function region(so_id: string, x_min: number, y_min: number, x_max: number, y_max: number): Reachable_Region {
	return { so_id, so_name: so_id, kind: 'regular', axis: 'x', x_min, y_min, x_max, y_max, pairs: [] };
}

describe('Dimension_Placement — first-pass neighbour pairs', () => {
	it('returns no pairs when no regions overlap', () => {
		const regions = [
			region('A', 0,   0,   20,  20),
			region('B', 200, 200, 220, 220),
			region('C', 500, 500, 520, 520),
		];
		const pairs = neighbour_pairs_from_regions(regions);
		expect(pairs).toEqual([]);
	});

	it('flags two regions whose 33-pixel-expanded boxes overlap', () => {
		const regions = [
			region('A', 0,  0, 20, 20),
			region('B', 40, 0, 60, 20),   // 20 pixels apart — within the 33 margin
		];
		const pairs = neighbour_pairs_from_regions(regions);
		expect(pairs).toHaveLength(1);
		const [p] = pairs;
		const ids = [p.a_so_id, p.b_so_id].sort();
		expect(ids).toEqual(['A', 'B']);
	});

	it('does NOT flag two regions just outside the 33-pixel margin', () => {
		const regions = [
			region('A', 0,   0, 20, 20),
			region('B', 100, 0, 120, 20),   // 80 px apart — well outside 33
		];
		const pairs = neighbour_pairs_from_regions(regions);
		expect(pairs).toEqual([]);
	});

	it('de-duplicates a pair that shares more than one grid cell', () => {
		// Both regions are wide enough to span multiple cells.
		const regions = [
			region('A', 0,  0, 200, 200),
			region('B', 30, 30, 250, 250),
		];
		const pairs = neighbour_pairs_from_regions(regions);
		expect(pairs).toHaveLength(1);
	});

	it('does not pair a region with itself', () => {
		const regions = [
			region('A', 0,  0, 200, 200),
		];
		const pairs = neighbour_pairs_from_regions(regions);
		expect(pairs).toEqual([]);
	});

	it('handles a mix of close and far regions', () => {
		const regions = [
			region('A', 0,    0,   20,  20),
			region('B', 40,   0,   60,  20),    // close to A
			region('C', 500,  500, 520, 520),   // far from everyone
			region('D', 45,   30,  65,  50),    // close to A and B
		];
		const pairs = neighbour_pairs_from_regions(regions);
		const labelled = pairs.map(p => [p.a_so_id, p.b_so_id].sort().join('-')).sort();
		expect(labelled).toEqual(['A-B', 'A-D', 'B-D']);
	});

	it('returns Candidate_Pair entries with axis preserved', () => {
		const r: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'y', x_min: 0, y_min: 0, x_max: 20, y_max: 20, pairs: [] };
		const s: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'z', x_min: 40, y_min: 0, x_max: 60, y_max: 20, pairs: [] };
		const pairs = neighbour_pairs_from_regions([r, s]);
		expect(pairs).toHaveLength(1);
		const sorted = [pairs[0].a_axis, pairs[0].b_axis].sort();
		expect(sorted).toEqual(['y', 'z']);
	});
});

describe('Dimension_Placement — second-pass closed-form separation', () => {
	it('says two pairs CAN separate when their slidable ranges are far apart on the same level', () => {
		// Both labels at witness_length = 30 (so y = -30 in screen coords).
		// Label A slides between x=0 and x=20; label B between x=200 and x=220.
		// Labels are 30 px wide. Plenty of room for 33-pixel clearance.
		const a = horiz_edge_pair({ so_id: 'A', edge_left_x: 0,   edge_y: 0, edge_len: 20,  w_min: 30, w_max: 30, s_min: 0, s_max: 20, label_w: 30, label_h: 14 });
		const b = horiz_edge_pair({ so_id: 'B', edge_left_x: 200, edge_y: 0, edge_len: 20,  w_min: 30, w_max: 30, s_min: 0, s_max: 20, label_w: 30, label_h: 14 });
		expect(pair_can_separate(a, b)).toBe(true);
	});

	it('says two pairs CANNOT separate when reachable AABBs sit fully on top of each other and rectangles are wider than 33 px', () => {
		// Both edges and both label rectangles overlap identically.
		const a = horiz_edge_pair({ so_id: 'A', edge_left_x: 0, edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 0, label_w: 30, label_h: 14 });
		const b = horiz_edge_pair({ so_id: 'B', edge_left_x: 0, edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 0, label_w: 30, label_h: 14 });
		expect(pair_can_separate(a, b)).toBe(false);
	});

	it('says two pairs CAN separate when witness-length ranges allow vertical clearance', () => {
		// Label A at y around -30 (witness up 30). Label B at y around -120 (witness up 120).
		// Vertical gap when each picks the most extreme of its range: 120 - 30 - (14/2 + 14/2) = 76 px. Plenty.
		const a = horiz_edge_pair({ so_id: 'A', edge_left_x: 0, edge_y: 0, edge_len: 20, w_min: 30,  w_max: 30,  s_min: 10, s_max: 10, label_w: 30, label_h: 14 });
		const b = horiz_edge_pair({ so_id: 'B', edge_left_x: 0, edge_y: 0, edge_len: 20, w_min: 120, w_max: 120, s_min: 10, s_max: 10, label_w: 30, label_h: 14 });
		expect(pair_can_separate(a, b)).toBe(true);
	});

	it('respects a custom clearance argument', () => {
		// Same setup as the "can separate when far apart" case; bump
		// clearance to 300 to force failure.
		const a = horiz_edge_pair({ so_id: 'A', edge_left_x: 0,   edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 20, label_w: 30, label_h: 14 });
		const b = horiz_edge_pair({ so_id: 'B', edge_left_x: 200, edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 20, label_w: 30, label_h: 14 });
		expect(pair_can_separate(a, b, 300)).toBe(false);
	});
});

describe('Dimension_Placement — labels_can_separate_via_some_combination', () => {
	it('returns true if ANY combination of the input pair-sets can separate', () => {
		// Label A has two pairs: one that overlaps B, one that does not.
		// The non-overlapping pair lets the labels separate.
		const overlap_a   = horiz_edge_pair({ so_id: 'A', edge_left_x: 0, edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 0, label_w: 30, label_h: 14 });
		const far_a       = horiz_edge_pair({ so_id: 'A', edge_left_x: 500, edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 0, label_w: 30, label_h: 14 });
		const b           = horiz_edge_pair({ so_id: 'B', edge_left_x: 0, edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 0, label_w: 30, label_h: 14 });
		expect(labels_can_separate_via_some_combination([overlap_a, far_a], [b])).toBe(true);
	});

	it('returns false if EVERY combination of the input pair-sets collides', () => {
		const a1 = horiz_edge_pair({ so_id: 'A', edge_left_x: 0, edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 0, label_w: 30, label_h: 14 });
		const a2 = horiz_edge_pair({ so_id: 'A', edge_left_x: 0, edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 0, label_w: 30, label_h: 14 });
		const b1 = horiz_edge_pair({ so_id: 'B', edge_left_x: 0, edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 0, label_w: 30, label_h: 14 });
		const b2 = horiz_edge_pair({ so_id: 'B', edge_left_x: 0, edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 0, label_w: 30, label_h: 14 });
		expect(labels_can_separate_via_some_combination([a1, a2], [b1, b2])).toBe(false);
	});

	it('returns false for empty pair sets', () => {
		const a = horiz_edge_pair({ so_id: 'A', edge_left_x: 0, edge_y: 0, edge_len: 20, w_min: 30, w_max: 30, s_min: 0, s_max: 0, label_w: 30, label_h: 14 });
		expect(labels_can_separate_via_some_combination([a], [])).toBe(false);
		expect(labels_can_separate_via_some_combination([], [a])).toBe(false);
	});
});

describe('Conflict_Graph', () => {
	it('starts empty', () => {
		const g = new Conflict_Graph();
		expect(g.size()).toBe(0);
		expect(g.has_edge('A|x', 'B|x')).toBe(false);
		expect(g.neighbours('A|x')).toEqual([]);
		expect(g.conflict_count('A|x')).toBe(0);
	});

	it('records an edge once even when added twice', () => {
		const g = new Conflict_Graph();
		g.add_edge('A|x', 'B|x');
		g.add_edge('A|x', 'B|x');
		expect(g.size()).toBe(1);
		expect(g.has_edge('A|x', 'B|x')).toBe(true);
		expect(g.has_edge('B|x', 'A|x')).toBe(true);   // undirected
	});

	it('ignores a self-edge', () => {
		const g = new Conflict_Graph();
		g.add_edge('A|x', 'A|x');
		expect(g.size()).toBe(0);
	});

	it('reports neighbours symmetrically', () => {
		const g = new Conflict_Graph();
		g.add_edge('A|x', 'B|y');
		g.add_edge('A|x', 'C|z');
		expect(g.neighbours('A|x').sort()).toEqual(['B|y', 'C|z']);
		expect(g.neighbours('B|y')).toEqual(['A|x']);
		expect(g.neighbours('C|z')).toEqual(['A|x']);
		expect(g.conflict_count('A|x')).toBe(2);
		expect(g.conflict_count('B|y')).toBe(1);
	});

	it('returns the canonical pair from all_edges', () => {
		const g = new Conflict_Graph();
		g.add_edge('B|y', 'A|x');   // add in arbitrary order
		const edges = g.all_edges();
		expect(edges).toHaveLength(1);
		// Stored canonically by sort order — 'A|x' < 'B|y'.
		expect(edges[0]).toEqual({ a: 'A|x', b: 'B|y' });
	});

	it('label_key builds the expected string', () => {
		expect(label_key('SO_42', 'z')).toBe('SO_42|z');
	});
});

describe('Dimension_Placement — min_distance_to_placed', () => {
	function placed_label(cx: number, cy: number, w: number, h: number): Greedy_Placement {
		// Most fields are unused by min_distance_to_placed; only center and size matter.
		return {
			so_id: 'P', so_name: 'P', kind: 'regular', axis: 'x',
			pair: {} as Viable_Pair,
			witness_length: 0, slidable_position: 0,
			center_x: cx, center_y: cy,
			label_w_px: w, label_h_px: h,
			min_clearance: 0,
		};
	}

	it('returns Infinity when nothing is placed yet', () => {
		expect(min_distance_to_placed(0, 0, 30, 14, [])).toBe(Infinity);
	});

	it('returns 0 when rectangles overlap', () => {
		const placed = [placed_label(0, 0, 30, 14)];
		expect(min_distance_to_placed(0, 0, 30, 14, placed)).toBe(0);
	});

	it('returns positive distance for separated rectangles', () => {
		// Two 30×14 rectangles centred 100 px apart horizontally — gap = 100 - 30 = 70 px.
		const placed = [placed_label(100, 0, 30, 14)];
		expect(min_distance_to_placed(0, 0, 30, 14, placed)).toBeCloseTo(70, 5);
	});

	it('returns the minimum across multiple placed rectangles', () => {
		const placed = [
			placed_label(100, 0, 30, 14),
			placed_label(50,  0, 30, 14),
		];
		// Centres at 50 and 100 from origin — nearest center is at 50, gap = 50 - 30 = 20.
		expect(min_distance_to_placed(0, 0, 30, 14, placed)).toBeCloseTo(20, 5);
	});
});

describe('Dimension_Placement — best_candidate_in_pair', () => {
	it('picks the safe position farthest from a single placed label', () => {
		// Horizontal edge from (0,0) to (500,0) — long enough that the
		// 20-pixel buffer around each witness anchor still leaves a wide
		// safe between-region. Slidable range [-50, 550] → 5×5 grid at
		// -50, 100, 250, 400, 550. Forbidden zones near anchors at 0 and
		// 500 are [-35, 35] and [465, 535]. Safe grid samples: 100, 250,
		// 400 (between) and -50, 550 (overhang). A blocker on the left
		// pushes the winner toward the right end of the between range.
		const pair: Viable_Pair = {
			so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x',
			edge_v1_idx: 0, edge_v2_idx: 1,
			direction: [0, 0, 1],
			witness_length_min: 30, witness_length_max: 30,
			slidable_min: -50, slidable_max: 550,
			avg_wlen_per_3d_unit: 10,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 0,
			edge_p2_x: 500, edge_p2_y: 0,
			wit_ux: 0, wit_uy: -1, wit_1_per3d_x: 0, wit_1_per3d_y: -1, wit_2_per3d_x: 0, wit_2_per3d_y: -1, text: '0',  dim_z: 0,
		};
		const placed: Greedy_Placement[] = [{
			so_id: 'OTHER', so_name: 'OTHER', kind: 'regular', axis: 'x',
			pair: {} as Viable_Pair,
			witness_length: 0, slidable_position: 0,
			center_x: 0, center_y: -30,
			label_w_px: 30, label_h_px: 14,
			min_clearance: 0,
		}];
		const result = best_candidate_in_pair(pair, placed);
		expect(result).not.toBeNull();
		// Winner sits in a safe between-region. Specifically, the far
		// right between-sample at 400 maximizes raw clearance and is
		// inside the between-witnesses bonus region.
		expect(result!.slidable_position).toBe(400);
	});

	it('prefers a between-the-witnesses slot over an overhang slot of comparable clearance (rule 10 weighting)', () => {
		// Pair: dim line from (0,100) to (100,100). Single witness length
		// 30. Slidable range [-30, 130] → 5×5 grid samples slidable at
		// -30, 10, 50, 90, 130. Inside slots: 10, 50, 90. Overhang slots:
		// -30 (30px past w1) and 130 (30px past w2).
		const pair: Viable_Pair = {
			so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x',
			edge_v1_idx: 0, edge_v2_idx: 1,
			direction: [0, 0, 1],
			witness_length_min: 30, witness_length_max: 30,
			slidable_min: -30, slidable_max: 130,
			avg_wlen_per_3d_unit: 1,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 100,
			edge_p2_x: 100, edge_p2_y: 100,
			wit_ux: 0, wit_uy: -1,
			wit_1_per3d_x: 0, wit_1_per3d_y: -1,
			wit_2_per3d_x: 0, wit_2_per3d_y: -1,
			text: '8 1/2"', dim_z: 0,
		};
		// Blocker rectangle 70 px below the candidate's y (which is 70).
		// Inside candidates see clearance ≈ 56 (vertical gap minus label
		// heights). Overhang candidates are farther horizontally, so they
		// see clearance ≈ 75. Without the penalty, an overhang candidate
		// would win; with the penalty, an inside candidate must win.
		const placed: Greedy_Placement[] = [{
			so_id: 'BLOCKER', so_name: 'BLOCKER', kind: 'regular', axis: 'x',
			pair: {} as Viable_Pair,
			witness_length: 0, slidable_position: 0,
			center_x: 50, center_y: 140,
			label_w_px: 30, label_h_px: 14,
			min_clearance: 0,
		}];
		const result = best_candidate_in_pair(pair, placed);
		expect(result).not.toBeNull();
		// Inside slots are at slidable in {10, 50, 90}. Verify the winner
		// is one of those, not an overhang at -30 or 130.
		expect(result!.slidable_position).toBeGreaterThanOrEqual(0);
		expect(result!.slidable_position).toBeLessThanOrEqual(100);
	});

	it('with no obstacles, picks the centered between-witnesses position (the parabolic centering tie-breaks across infinite-clearance samples)', () => {
		// Long dim line (500 px), label 30 px wide, no placed labels.
		// Grid samples at slidable -50, 100, 250, 400, 550. Forbidden:
		// [-35, 35] and [465, 535]. Safe between: 100, 250, 400.
		// Without obstacles every sample has infinite clearance, so the
		// centering term is the only tie-breaker. Midpoint at 250.
		const pair: Viable_Pair = {
			so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x',
			edge_v1_idx: 0, edge_v2_idx: 1,
			direction: [0, 0, 1],
			witness_length_min: 30, witness_length_max: 30,
			slidable_min: -50, slidable_max: 550,
			avg_wlen_per_3d_unit: 1,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 100,
			edge_p2_x: 500, edge_p2_y: 100,
			wit_ux: 0, wit_uy: -1,
			wit_1_per3d_x: 0, wit_1_per3d_y: -1,
			wit_2_per3d_x: 0, wit_2_per3d_y: -1,
			text: '25\' 8 1/2"', dim_z: 0,
		};
		const result = best_candidate_in_pair(pair, []);
		expect(result).not.toBeNull();
		expect(result!.slidable_position).toBeCloseTo(250, 5);
	});

	it('rejects candidate positions whose label rectangle is inside (or within 15 px of) the silhouette outline', () => {
		// Hull is a 600x80 rectangle from (0, 90) to (600, 170). The dim
		// line sits at y=70 (witness length 30). At slidable=250 the
		// label center is at (250, 70) — that's well outside the hull
		// (y=70 < y=90 of the hull top). Good case.
		// Now move the hull UP so its top reaches y=60 — the label at
		// (250, 70) is INSIDE the hull. The search must NOT pick that
		// slidable position; it should try other samples.
		const pair: Viable_Pair = {
			so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x',
			edge_v1_idx: 0, edge_v2_idx: 1,
			direction: [0, 0, 1],
			witness_length_min: 30, witness_length_max: 30,
			slidable_min: -50, slidable_max: 550,
			avg_wlen_per_3d_unit: 1,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 100,
			edge_p2_x: 500, edge_p2_y: 100,
			wit_ux: 0, wit_uy: -1,
			wit_1_per3d_x: 0, wit_1_per3d_y: -1,
			wit_2_per3d_x: 0, wit_2_per3d_y: -1,
			text: '2\' 6"', dim_z: 0,
		};
		// Hull encloses the area around the dim line including all
		// between-sample y positions. Specifically the rectangle's top
		// covers y in [40, 200], spanning the full range of label
		// rectangles at slidable in [100, 400]. To force only ONE safe
		// position, the hull has a notch — wide everywhere except a gap
		// near x=550.
		// Concretely: hull is a polygon that includes the area where the
		// label would sit at slidable in [50, 450] but NOT at slidable=550.
		const hull = [
			{ x:  50, y:  40 },
			{ x: 450, y:  40 },
			{ x: 450, y: 200 },
			{ x:  50, y: 200 },
		];
		const result = best_candidate_in_pair(pair, [], hull);
		expect(result).not.toBeNull();
		// Safe samples are -50 and 550 (overhang) only, since 100/250/400
		// all fall inside the 50-450 hull along x. Of those, only the
		// overhang is between-allowed... actually let me re-think.
		// At slidable=-50, label center is at (-50, 70). x=-50 is outside the
		// hull's x range [50, 450]. Safe.
		// At slidable=100, label center is at (100, 70). x=100 in [50, 450],
		// y=70 in [40, 200]. INSIDE hull. Rejected.
		// Same for 250, 400.
		// At slidable=550, label center is at (550, 70). x=550 outside.
		// Safe.
		// So the only safe samples are -50 and 550 (overhang positions).
		const s = result!.slidable_position;
		expect(s === -50 || s === 550).toBe(true);
	});

	it('returns null on a degenerate (zero-length) edge', () => {
		const pair: Viable_Pair = {
			so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x',
			edge_v1_idx: 0, edge_v2_idx: 1,
			direction: [0, 0, 1],
			witness_length_min: 30, witness_length_max: 30,
			slidable_min: 0, slidable_max: 0,
			avg_wlen_per_3d_unit: 10,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 0,
			edge_p2_x: 0, edge_p2_y: 0,  // zero-length edge
			wit_ux: 0, wit_uy: -1, wit_1_per3d_x: 0, wit_1_per3d_y: -1, wit_2_per3d_x: 0, wit_2_per3d_y: -1, text: '0',  dim_z: 0,
		};
		expect(best_candidate_in_pair(pair, [])).toBeNull();
	});
});

describe('Dimension_Placement — order_by_constrainedness', () => {
	function region_with_pairs(so_id: string, n_pairs: number, axis: 'x' | 'y' | 'z' = 'x'): Reachable_Region {
		const pairs: Viable_Pair[] = Array.from({ length: n_pairs }, () => ({} as Viable_Pair));
		return { so_id, so_name: so_id, kind: 'regular', axis, x_min: 0, x_max: 1, y_min: 0, y_max: 1, pairs };
	}

	it('sorts fewest viable pairs first', () => {
		const regions = [
			region_with_pairs('A', 5),
			region_with_pairs('B', 2),
			region_with_pairs('C', 8),
		];
		const ordered = order_by_constrainedness(regions, new Map());
		expect(ordered.map(r => r.so_id)).toEqual(['B', 'A', 'C']);
	});

	it('ties broken by ancestry path (alphabetical)', () => {
		const regions = [
			region_with_pairs('Y', 3),
			region_with_pairs('X', 3),
			region_with_pairs('Z', 3),
		];
		const ancestry = new Map([
			['X', 'wall.stud'],
			['Y', 'wall.beam'],
			['Z', 'wall.post'],
		]);
		const ordered = order_by_constrainedness(regions, ancestry);
		expect(ordered.map(r => r.so_id)).toEqual(['Y', 'Z', 'X']);
	});

	it('ties on path broken by axis letter', () => {
		const regions = [
			region_with_pairs('A', 3, 'z'),
			region_with_pairs('A', 3, 'x'),
			region_with_pairs('A', 3, 'y'),
		];
		const ancestry = new Map([['A', 'wall']]);
		const ordered = order_by_constrainedness(regions, ancestry);
		expect(ordered.map(r => r.axis)).toEqual(['x', 'y', 'z']);
	});
});

describe('Dimension_Placement — greedy_seed_for_regions', () => {
	function simple_region(so_id: string, slidable_start: number): Reachable_Region {
		// Long dim line (500 px) so the 20-pixel witness-anchor buffer
		// leaves a usable between-region after the forbidden-zone filter.
		const pair: Viable_Pair = {
			so_id, so_name: so_id, kind: 'regular', axis: 'x',
			edge_v1_idx: 0, edge_v2_idx: 1,
			direction: [0, 0, 1],
			witness_length_min: 30, witness_length_max: 30,
			slidable_min: slidable_start, slidable_max: slidable_start + 500,
			avg_wlen_per_3d_unit: 10,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 0,
			edge_p2_x: 500, edge_p2_y: 0,
			wit_ux: 0, wit_uy: -1, wit_1_per3d_x: 0, wit_1_per3d_y: -1, wit_2_per3d_x: 0, wit_2_per3d_y: -1, text: '0',  dim_z: 0,
		};
		return { so_id, so_name: so_id, kind: 'regular', axis: 'x', x_min: 0, x_max: 0, y_min: 0, y_max: 0, pairs: [pair] };
	}

	it('places the first label at any candidate (every candidate has infinite clearance)', () => {
		const regions = [simple_region('A', 0)];
		const placed = greedy_seed_for_regions(regions, new Map([['A', 'A']]));
		expect(placed).toHaveLength(1);
		expect(placed[0].so_id).toBe('A');
	});

	it('places later labels far from earlier ones using safe between-the-witnesses positions', () => {
		// Both labels have the same slidable range [0, 500]. The 5x5
		// grid samples slidable at 0, 125, 250, 375, 500. Forbidden
		// zones (Y=20, label_w=30) around anchors at 0 and 500 are
		// [-35, 35] and [465, 535] — so the safe between samples are
		// 125, 250, 375. The first label goes to the centered position
		// (250) because the centering parabola wins among equal-
		// clearance samples. The second label then picks whichever of
		// the two off-center safe samples is farthest from the first.
		const regions = [
			simple_region('A', 0),
			simple_region('B', 0),
		];
		const placed = greedy_seed_for_regions(regions, new Map([['A', 'A'], ['B', 'B']]));
		expect(placed).toHaveLength(2);
		const gap = Math.abs(placed[0].center_x - placed[1].center_x);
		// A at 250 (centered). B at 125 or 375 — equidistant from A.
		// Gap = 125 in either case.
		expect(gap).toBeCloseTo(125, 5);
	});

	it('keeps a locked label at its carry-over position and seats the rest around it', () => {
		const regions = [
			simple_region('A', 0),
			simple_region('B', 0),
		];
		// A is locked at slidable=125 (a safe between sample on a 500px
		// dim line, the leftmost between grid sample after the forbidden
		// zones).
		const a_locked: Greedy_Placement = {
			so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x',
			pair: regions[0].pairs[0],
			witness_length: 30, slidable_position: 125,
			center_x: 125, center_y: -30,
			label_w_px: 30, label_h_px: 14,
			min_clearance: 0,
		};
		const placed = greedy_seed_for_regions(
			regions,
			new Map([['A', 'A'], ['B', 'B']]),
			[a_locked],
		);
		expect(placed).toHaveLength(2);
		const a = placed.find(p => p.so_id === 'A')!;
		const b = placed.find(p => p.so_id === 'B')!;
		// A stays at exactly its locked position.
		expect(a.center_x).toBeCloseTo(125, 5);
		expect(a.slidable_position).toBeCloseTo(125, 5);
		// B picks the safe between-sample farthest from A (slidable=375).
		expect(b.center_x).toBeCloseTo(375, 5);
	});
});

describe('Dimension_Placement — find_conflicts_in_placement', () => {
	function placed(so_id: string, cx: number, cy: number, w = 30, h = 14): Greedy_Placement {
		return {
			so_id, so_name: so_id, kind: 'regular', axis: 'x',
			pair: {} as Viable_Pair,
			witness_length: 0, slidable_position: 0,
			center_x: cx, center_y: cy,
			label_w_px: w, label_h_px: h,
			min_clearance: 0,
		};
	}

	it('returns no conflicts when every pair is comfortably apart', () => {
		const list = [placed('A', 0, 0), placed('B', 200, 0), placed('C', 400, 0)];
		expect(find_conflicts_in_placement(list)).toEqual([]);
	});

	it('flags pairs closer than 33 pixels rectangle-to-rectangle', () => {
		// A at 0, B at 50: centres 50 apart, rectangles 30 wide → gap = 50 - 30 = 20 → conflict.
		const list = [placed('A', 0, 0), placed('B', 50, 0)];
		expect(find_conflicts_in_placement(list)).toEqual([[0, 1]]);
	});

	it('does not flag pairs at exactly 33 pixels', () => {
		// Centres at 0 and 63, gap = 63 - 30 = 33 → boundary, not in conflict.
		const list = [placed('A', 0, 0), placed('B', 63, 0)];
		expect(find_conflicts_in_placement(list)).toEqual([]);
	});

	it('handles multiple overlapping conflicts', () => {
		const list = [placed('A', 0, 0), placed('B', 50, 0), placed('C', 100, 0)];
		// A-B: gap 20 → conflict. B-C: gap 20 → conflict. A-C: gap 70 → no conflict.
		expect(find_conflicts_in_placement(list)).toEqual([[0, 1], [1, 2]]);
	});
});

describe('Dimension_Placement — retry_pass', () => {
	function build_pair_at(slidable_start: number, slidable_end: number): Viable_Pair {
		return {
			so_id: 'X', so_name: 'X', kind: 'regular', axis: 'x',
			edge_v1_idx: 0, edge_v2_idx: 1,
			direction: [0, 0, 1],
			witness_length_min: 30, witness_length_max: 30,
			slidable_min: slidable_start, slidable_max: slidable_end,
			avg_wlen_per_3d_unit: 10,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 0,
			edge_p2_x: 100, edge_p2_y: 0,
			wit_ux: 0, wit_uy: -1, wit_1_per3d_x: 0, wit_1_per3d_y: -1, wit_2_per3d_x: 0, wit_2_per3d_y: -1, text: '0',  dim_z: 0,
		};
	}

	it('single switch: moves a conflicted label to its other available pair', () => {
		// Label A has two pairs: pair P1 covers slidable 0..0 (its current
		// stuck placement) and pair P2 covers slidable 500..500 (far from B).
		const pair_a_stuck   = { ...build_pair_at(0, 0), so_id: 'A', so_name: 'A' };
		const pair_a_escape  = { ...build_pair_at(500, 500), so_id: 'A', so_name: 'A' };
		const region_a: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [pair_a_stuck, pair_a_escape] };
		const region_b: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [{ ...build_pair_at(0, 0), so_id: 'B', so_name: 'B' }] };

		// Greedy outcome: A at (0, -30), B at (0, -30) — colliding.
		const placed: Greedy_Placement[] = [
			{ so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', pair: pair_a_stuck, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
			{ so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', pair: region_b.pairs[0], witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
		];

		retry_pass(placed, [region_a, region_b]);

		// After repair, A should be at slidable=500 (or near it).
		const a = placed[0];
		expect(a.center_x).toBeCloseTo(500, 0);
		expect(find_conflicts_in_placement(placed)).toEqual([]);
	});

	it('leaves the placement unchanged when nothing is in conflict', () => {
		const pair_a = { ...build_pair_at(0, 0), so_id: 'A', so_name: 'A' };
		const pair_b = { ...build_pair_at(0, 0), so_id: 'B', so_name: 'B' };
		const region_a: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [pair_a] };
		const region_b: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [pair_b] };

		const placed: Greedy_Placement[] = [
			{ so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', pair: pair_a, witness_length: 30, slidable_position: 0, center_x: 0,   center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 100 },
			{ so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', pair: pair_b, witness_length: 30, slidable_position: 0, center_x: 500, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 100 },
		];
		const before = placed.map(p => ({ ...p }));
		retry_pass(placed, [region_a, region_b]);
		expect(placed[0].center_x).toBe(before[0].center_x);
		expect(placed[1].center_x).toBe(before[1].center_x);
	});

	it('gives up gracefully when no alternative resolves the conflict', () => {
		// Both labels have exactly one pair each, both with the same
		// slidable range. No switch is available.
		const pair_a = { ...build_pair_at(0, 0), so_id: 'A', so_name: 'A' };
		const pair_b = { ...build_pair_at(0, 0), so_id: 'B', so_name: 'B' };
		const region_a: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [pair_a] };
		const region_b: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [pair_b] };

		const placed: Greedy_Placement[] = [
			{ so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', pair: pair_a, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
			{ so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', pair: pair_b, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
		];
		retry_pass(placed, [region_a, region_b]);
		// Still in conflict — repair could not fix.
		expect(find_conflicts_in_placement(placed)).toHaveLength(1);
	});

	it('never switches a locked label even when it has an escape pair', () => {
		// A has an escape at slidable=500 that would clear the conflict,
		// but A is locked. Repair must leave it where it is and try the
		// single switch on B (which has only one pair). End state: still
		// in conflict, A still on its locked pair.
		const pair_a_stuck  = { ...build_pair_at(0, 0), so_id: 'A', so_name: 'A' };
		const pair_a_escape = { ...build_pair_at(500, 500), so_id: 'A', so_name: 'A' };
		const pair_b        = { ...build_pair_at(0, 0), so_id: 'B', so_name: 'B' };
		const region_a: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [pair_a_stuck, pair_a_escape] };
		const region_b: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [pair_b] };

		const placed: Greedy_Placement[] = [
			{ so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', pair: pair_a_stuck, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
			{ so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', pair: pair_b,       witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
		];
		const locked = new Set(['A|x']);
		retry_pass(placed, [region_a, region_b], locked);
		expect(placed[0].center_x).toBe(0);
		expect(placed[0].pair).toBe(pair_a_stuck);
	});
});

describe('Dimension_Placement — stochastic_finish', () => {
	function build_pair_at(slidable_start: number, slidable_end: number, so_id: string): Viable_Pair {
		return {
			so_id, so_name: so_id, kind: 'regular', axis: 'x',
			edge_v1_idx: 0, edge_v2_idx: 1,
			direction: [0, 0, 1],
			witness_length_min: 30, witness_length_max: 30,
			slidable_min: slidable_start, slidable_max: slidable_end,
			avg_wlen_per_3d_unit: 10,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 0,
			edge_p2_x: 100, edge_p2_y: 0,
			wit_ux: 0, wit_uy: -1, wit_1_per3d_x: 0, wit_1_per3d_y: -1, wit_2_per3d_x: 0, wit_2_per3d_y: -1, text: '0',  dim_z: 0,
		};
	}

	it('resolves a conflict by switching to an alternative pair', () => {
		// Label A has a stuck pair at slidable=0 and an escape at slidable=500.
		// Label B has only a stuck pair at slidable=0. Stochastic switch on A
		// should resolve the conflict.
		const a_stuck  = build_pair_at(0, 0, 'A');
		const a_escape = build_pair_at(500, 500, 'A');
		const b_stuck  = build_pair_at(0, 0, 'B');
		const region_a: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [a_stuck, a_escape] };
		const region_b: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [b_stuck] };

		const placed: Greedy_Placement[] = [
			{ so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', pair: a_stuck, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
			{ so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', pair: b_stuck, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
		];

		stochastic_finish(placed, [region_a, region_b], 'test-seed');
		expect(find_conflicts_in_placement(placed)).toEqual([]);
	});

	it('is deterministic given the same seed', () => {
		const a_stuck  = build_pair_at(0,   0,   'A');
		const a_escape = build_pair_at(500, 500, 'A');
		const b_stuck  = build_pair_at(0,   0,   'B');
		const region_a: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [a_stuck, a_escape] };
		const region_b: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [b_stuck] };
		const make_placed = (): Greedy_Placement[] => [
			{ so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', pair: a_stuck, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
			{ so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', pair: b_stuck, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
		];

		const run_a = make_placed();
		const run_b = make_placed();
		stochastic_finish(run_a, [region_a, region_b], 'fixed-seed');
		stochastic_finish(run_b, [region_a, region_b], 'fixed-seed');

		expect(run_a[0].center_x).toBe(run_b[0].center_x);
		expect(run_a[0].slidable_position).toBe(run_b[0].slidable_position);
		expect(run_a[1].center_x).toBe(run_b[1].center_x);
	});

	it('leaves a clean placement untouched', () => {
		const a = build_pair_at(0, 0, 'A');
		const b = build_pair_at(0, 0, 'B');
		const region_a: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [a] };
		const region_b: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [b] };
		const placed: Greedy_Placement[] = [
			{ so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', pair: a, witness_length: 30, slidable_position: 0, center_x: 0,   center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 500 },
			{ so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', pair: b, witness_length: 30, slidable_position: 0, center_x: 500, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 500 },
		];
		const before_x = [placed[0].center_x, placed[1].center_x];
		stochastic_finish(placed, [region_a, region_b], 'seed');
		expect([placed[0].center_x, placed[1].center_x]).toEqual(before_x);
	});

	it('respects the iteration cap', () => {
		// A scene where every alternative leaves the conflict — the iteration
		// cap of 0 means no switches are attempted.
		const a = build_pair_at(0, 0, 'A');
		const b = build_pair_at(0, 0, 'B');
		const region_a: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [a] };
		const region_b: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [b] };
		const placed: Greedy_Placement[] = [
			{ so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', pair: a, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
			{ so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', pair: b, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
		];
		stochastic_finish(placed, [region_a, region_b], 'seed', 0);
		// Same in/out — no iterations ran.
		expect(placed[0].center_x).toBe(0);
		expect(placed[1].center_x).toBe(0);
	});

	it('never picks a locked label as a swap target', () => {
		// A has an escape pair at slidable=500, B has only its stuck pair.
		// Lock A: even though A is conflicted and has an alternative, the
		// stochastic finish must not touch it. B can't move (only one pair),
		// so the conflict survives — exactly the locked-labels-never-move
		// promise of rule 19.
		const a_stuck  = build_pair_at(0, 0, 'A');
		const a_escape = build_pair_at(500, 500, 'A');
		const b_stuck  = build_pair_at(0, 0, 'B');
		const region_a: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [a_stuck, a_escape] };
		const region_b: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [b_stuck] };
		const placed: Greedy_Placement[] = [
			{ so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', pair: a_stuck, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
			{ so_id: 'B', so_name: 'B', kind: 'regular', axis: 'x', pair: b_stuck, witness_length: 30, slidable_position: 0, center_x: 0, center_y: -30, label_w_px: 30, label_h_px: 14, min_clearance: 0 },
		];
		const locked = new Set(['A|x']);
		stochastic_finish(placed, [region_a, region_b], 'seed', 200, locked);
		expect(placed[0].center_x).toBe(0);
		expect(placed[0].pair).toBe(a_stuck);
	});
});

describe('Dimension_Placement — drop_duplicates (rule 4)', () => {
	function placement_with_text(so_id: string, text: string): Greedy_Placement {
		const pair: Viable_Pair = {
			so_id, so_name: so_id, kind: 'regular', axis: 'x',
			edge_v1_idx: 0, edge_v2_idx: 1,
			direction: [0, 0, 1],
			witness_length_min: 30, witness_length_max: 30,
			slidable_min: 0, slidable_max: 0,
			avg_wlen_per_3d_unit: 10,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 0,
			edge_p2_x: 100, edge_p2_y: 0,
			wit_ux: 0, wit_uy: -1,
			wit_1_per3d_x: 0, wit_1_per3d_y: -1,
			wit_2_per3d_x: 0, wit_2_per3d_y: -1,
			text,
			dim_z: 0,
		};
		return {
			so_id, so_name: so_id, kind: 'regular', axis: 'x',
			pair,
			witness_length: 30, slidable_position: 0,
			center_x: 0, center_y: -30,
			label_w_px: 30, label_h_px: 14,
			min_clearance: 0,
		};
	}

	it('drops the later occurrence when text and edge direction match', () => {
		const placed = [
			placement_with_text('A', '8 1/2"'),
			placement_with_text('B', '8 1/2"'),
		];
		const dirs = new Map<Label_Key, [number, number, number]>([
			['A|x', [1, 0, 0]],
			['B|x', [1, 0, 0]],
		]);
		const ancestry = new Map([['A', 'root.A'], ['B', 'root.B']]);
		const dropped = drop_duplicates(placed, new Set(), dirs, ancestry);
		expect(dropped).toHaveLength(1);
		expect(dropped[0].so_id).toBe('B');
		expect(dropped[0].reason).toBe('duplicate_text');
		expect(placed.map(p => p.so_id)).toEqual(['A']);
	});

	it('keeps both when text matches but edges point in different 3D directions', () => {
		const placed = [
			placement_with_text('A', '8 1/2"'),
			placement_with_text('B', '8 1/2"'),
		];
		const dirs = new Map<Label_Key, [number, number, number]>([
			['A|x', [1, 0, 0]],
			['B|x', [0, 1, 0]],
		]);
		const ancestry = new Map([['A', 'root.A'], ['B', 'root.B']]);
		const dropped = drop_duplicates(placed, new Set(), dirs, ancestry);
		expect(dropped).toEqual([]);
		expect(placed).toHaveLength(2);
	});

	it('keeps both when edges are parallel but texts differ', () => {
		const placed = [
			placement_with_text('A', '8 1/2"'),
			placement_with_text('B', '9"'),
		];
		const dirs = new Map<Label_Key, [number, number, number]>([
			['A|x', [1, 0, 0]],
			['B|x', [1, 0, 0]],
		]);
		const ancestry = new Map([['A', 'root.A'], ['B', 'root.B']]);
		const dropped = drop_duplicates(placed, new Set(), dirs, ancestry);
		expect(dropped).toEqual([]);
		expect(placed).toHaveLength(2);
	});

	it('treats v1->v2 and v2->v1 as the same edge direction', () => {
		const placed = [
			placement_with_text('A', '8 1/2"'),
			placement_with_text('B', '8 1/2"'),
		];
		const dirs = new Map<Label_Key, [number, number, number]>([
			['A|x', [1, 0, 0]],
			['B|x', [-1, 0, 0]],   // flipped
		]);
		const ancestry = new Map([['A', 'root.A'], ['B', 'root.B']]);
		const dropped = drop_duplicates(placed, new Set(), dirs, ancestry);
		expect(dropped).toHaveLength(1);
		expect(dropped[0].so_id).toBe('B');
	});

	it('keeps the persisted label when one was remembered last paint and the other was not', () => {
		const placed = [
			placement_with_text('A', '8 1/2"'),   // new this paint
			placement_with_text('B', '8 1/2"'),   // was around last paint
		];
		const dirs = new Map<Label_Key, [number, number, number]>([
			['A|x', [1, 0, 0]],
			['B|x', [1, 0, 0]],
		]);
		const ancestry = new Map([['A', 'root.A'], ['B', 'root.B']]);
		const persisted = new Set<Label_Key>(['B|x']);
		const dropped = drop_duplicates(placed, persisted, dirs, ancestry);
		expect(dropped).toHaveLength(1);
		expect(dropped[0].so_id).toBe('A');
		expect(placed.map(p => p.so_id)).toEqual(['B']);
	});

	it('tie-breaks alphabetically by ancestry when neither is persisted', () => {
		const placed = [
			placement_with_text('Z', '8 1/2"'),   // alphabetically later
			placement_with_text('A', '8 1/2"'),
		];
		const dirs = new Map<Label_Key, [number, number, number]>([
			['Z|x', [1, 0, 0]],
			['A|x', [1, 0, 0]],
		]);
		const ancestry = new Map([['Z', 'root.Z'], ['A', 'root.A']]);
		const dropped = drop_duplicates(placed, new Set(), dirs, ancestry);
		expect(dropped).toHaveLength(1);
		expect(dropped[0].so_id).toBe('Z');
		expect(placed.map(p => p.so_id)).toEqual(['A']);
	});

	it('drops all but one when more than two labels are duplicates', () => {
		const placed = [
			placement_with_text('A', '8 1/2"'),
			placement_with_text('B', '8 1/2"'),
			placement_with_text('C', '8 1/2"'),
		];
		const dirs = new Map<Label_Key, [number, number, number]>([
			['A|x', [1, 0, 0]],
			['B|x', [1, 0, 0]],
			['C|x', [1, 0, 0]],
		]);
		const ancestry = new Map([['A', 'root.A'], ['B', 'root.B'], ['C', 'root.C']]);
		const dropped = drop_duplicates(placed, new Set(), dirs, ancestry);
		expect(dropped).toHaveLength(2);
		expect(placed.map(p => p.so_id)).toEqual(['A']);
	});

	it('prefers the parent over the child when ancestry depth differs and neither is persisted (rule 4 step 2)', () => {
		// A is one level under root (path "A"); B is two levels under root
		// (path "A.B"). Shallower path wins. Without persistence, parent A
		// keeps its label, child B's is dropped — even though B is later
		// in the placed list and even though "A.B" is alphabetically after
		// "A" (which would also pick A, but the test sets up a case where
		// alphabetical would pick differently — see next test).
		const placed = [
			placement_with_text('A', '8 1/2"'),
			placement_with_text('B', '8 1/2"'),
		];
		const dirs = new Map<Label_Key, [number, number, number]>([
			['A|x', [1, 0, 0]],
			['B|x', [1, 0, 0]],
		]);
		const ancestry = new Map([['A', 'A'], ['B', 'A.B']]);   // B is a child of A
		const dropped = drop_duplicates(placed, new Set(), dirs, ancestry);
		expect(dropped).toHaveLength(1);
		expect(dropped[0].so_id).toBe('B');
		expect(placed.map(p => p.so_id)).toEqual(['A']);
	});

	it('depth tie-break wins over alphabetical when they disagree', () => {
		// Z lives at root level (path "Z"). A lives two levels deep (path
		// "Y.A"). Alphabetical would pick A (earlier letter), but the
		// depth tie-break runs FIRST: shallower wins → Z stays.
		const placed = [
			placement_with_text('A', '8 1/2"'),
			placement_with_text('Z', '8 1/2"'),
		];
		const dirs = new Map<Label_Key, [number, number, number]>([
			['A|x', [1, 0, 0]],
			['Z|x', [1, 0, 0]],
		]);
		const ancestry = new Map([['A', 'Y.A'], ['Z', 'Z']]);
		const dropped = drop_duplicates(placed, new Set(), dirs, ancestry);
		expect(dropped).toHaveLength(1);
		expect(dropped[0].so_id).toBe('A');
		expect(placed.map(p => p.so_id)).toEqual(['Z']);
	});
});

describe('Dimension_Placement — polish_pass (post-drop re-centering)', () => {
	function pair_for(so_id: string, edge_p1: [number, number], edge_p2: [number, number]): Viable_Pair {
		return {
			so_id, so_name: so_id, kind: 'regular', axis: 'x',
			edge_v1_idx: 0, edge_v2_idx: 1,
			direction: [0, 0, 1],
			witness_length_min: 30, witness_length_max: 30,
			slidable_min: -50, slidable_max: 550,
			avg_wlen_per_3d_unit: 1,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: edge_p1[0], edge_p1_y: edge_p1[1],
			edge_p2_x: edge_p2[0], edge_p2_y: edge_p2[1],
			wit_ux: 0, wit_uy: -1,
			wit_1_per3d_x: 0, wit_1_per3d_y: -1,
			wit_2_per3d_x: 0, wit_2_per3d_y: -1,
			text: '0', dim_z: 0,
		};
	}

	function region_for(so_id: string, pair: Viable_Pair): Reachable_Region {
		return { so_id, so_name: so_id, kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [pair] };
	}

	function placement_at(pair: Viable_Pair, slidable_position: number, center_x: number, center_y: number): Greedy_Placement {
		return {
			so_id: pair.so_id, so_name: pair.so_name, kind: pair.kind, axis: pair.axis,
			pair,
			witness_length: 30, slidable_position,
			center_x, center_y,
			label_w_px: pair.label_w_px, label_h_px: pair.label_h_px,
			min_clearance: 0,
		};
	}

	it('re-centers a surviving label after its blocker is removed', () => {
		// Label A has a 500-pixel dim line, an isolated midpoint at 250.
		// The initial search placed A at slidable 100 (off-center)
		// because a now-removed blocker B sat near 250. After the polish
		// pass with just A in the survivor list, A returns to the
		// midpoint.
		const pair_a = pair_for('A', [0, 100], [500, 100]);
		const region_a = region_for('A', pair_a);
		const survivors: Greedy_Placement[] = [
			placement_at(pair_a, 100, 100, 70),    // off-center
		];
		polish_pass(survivors, [region_a]);
		expect(survivors).toHaveLength(1);
		expect(survivors[0].slidable_position).toBeCloseTo(250, 5);
	});

	it('leaves a label alone when it was already at its best position', () => {
		const pair_a = pair_for('A', [0, 100], [500, 100]);
		const region_a = region_for('A', pair_a);
		const survivors: Greedy_Placement[] = [
			placement_at(pair_a, 250, 250, 70),    // already at midpoint
		];
		polish_pass(survivors, [region_a]);
		expect(survivors[0].slidable_position).toBeCloseTo(250, 5);
	});

	it('keeps two survivors apart when re-centering would put them on top of each other', () => {
		// Two labels with overlapping ranges. If both polished to 250
		// they'd collide. Polish considers other survivors as obstacles.
		const pair_a = pair_for('A', [0, 100], [500, 100]);
		const pair_b = pair_for('B', [0, 100], [500, 100]);
		const region_a = region_for('A', pair_a);
		const region_b = region_for('B', pair_b);
		const survivors: Greedy_Placement[] = [
			placement_at(pair_a, 100, 100, 70),
			placement_at(pair_b, 400, 400, 70),
		];
		polish_pass(survivors, [region_a, region_b]);
		// Neither A nor B should sit at the midpoint of the other
		// (the search avoids the conflict).
		const a = survivors.find(p => p.so_id === 'A')!;
		const b = survivors.find(p => p.so_id === 'B')!;
		expect(Math.abs(a.center_x - b.center_x)).toBeGreaterThan(30);   // 30 = label width
	});
});

describe('Dimension_Placement — apply_drop_policy', () => {
	function placed(so_id: string, cx: number, cy: number, w = 30, h = 14): Greedy_Placement {
		return {
			so_id, so_name: so_id, kind: 'regular', axis: 'x',
			pair: {} as Viable_Pair,
			witness_length: 0, slidable_position: 0,
			center_x: cx, center_y: cy,
			label_w_px: w, label_h_px: h,
			min_clearance: 0,
		};
	}

	it('returns empty drops when there are no conflicts and everything is on canvas', () => {
		const list = [placed('A', 100, 100), placed('B', 300, 100)];
		const report = apply_drop_policy(list, 800, 600);
		expect(report.dropped).toEqual([]);
		expect(report.kept_max_conflict).toBe(0);
		expect(list).toHaveLength(2);
	});

	it('drops one label from a single conflicting pair (most-conflicted wins, alphabetical tie-break loses)', () => {
		// A and B both at the same spot. Both have conflict count 1.
		// Tie-break: drop the alphabetically later one, so B goes, A stays.
		const list = [placed('A', 100, 100), placed('B', 100, 100)];
		const report = apply_drop_policy(list, 800, 600);
		expect(report.dropped).toHaveLength(1);
		expect(report.dropped[0].so_id).toBe('B');
		expect(report.dropped[0].reason).toBe('remaining_conflict');
		expect(list).toHaveLength(1);
		expect(list[0].so_id).toBe('A');
	});

	it('drops the most-conflicted label first in a chain of overlaps', () => {
		// A at 100, B at 100 (conflicts with A), C at 100 (conflicts with A and B).
		// Wait: C conflicts with both A and B; A with B and C; B with A and C.
		// All have conflict count 2. With alphabetical tie-break, C goes first.
		const list = [placed('A', 100, 100), placed('B', 100, 100), placed('C', 100, 100)];
		const report = apply_drop_policy(list, 800, 600);
		// After C drops, A and B still conflict; drop B; A survives.
		expect(report.dropped.map(d => d.so_id)).toEqual(['C', 'B']);
		expect(list.map(p => p.so_id)).toEqual(['A']);
	});

	it('drops a label whose rectangle extends past the canvas edge', () => {
		const list = [placed('A', 5, 100, 30, 14)];  // centre at x=5, half-width=15 → left edge at -10, off canvas
		const report = apply_drop_policy(list, 800, 600);
		expect(report.dropped).toHaveLength(1);
		expect(report.dropped[0].reason).toBe('off_canvas');
		expect(list).toHaveLength(0);
	});

	it('records the no-viable-pair labels passed in', () => {
		const list = [placed('A', 100, 100)];
		const no_viable = [{ so_id: 'X', so_name: 'X', kind: 'regular', axis: 'y' as const }];
		const report = apply_drop_policy(list, 800, 600, no_viable);
		expect(report.dropped).toHaveLength(1);
		expect(report.dropped[0].so_id).toBe('X');
		expect(report.dropped[0].reason).toBe('no_viable_pair');
		expect(list).toHaveLength(1);
	});

	it('leaves kept_max_conflict at 0 because every conflict has been resolved', () => {
		// Heavy overlap — multiple drops needed.
		const list = [
			placed('A', 100, 100),
			placed('B', 100, 100),
			placed('C', 100, 100),
			placed('D', 500, 500),  // unrelated
		];
		const report = apply_drop_policy(list, 800, 600);
		expect(report.kept_max_conflict).toBe(0);
		expect(find_conflicts_in_placement(list)).toEqual([]);
	});
});

describe('Dimension_Placement — compute_viability', () => {
	function build_region(so_id: string, pair_props: { w_min: number; w_max: number; s_min: number; s_max: number; edge_v1_idx?: number; edge_v2_idx?: number }): Reachable_Region {
		const pair: Viable_Pair = {
			so_id, so_name: so_id, kind: 'regular', axis: 'x',
			edge_v1_idx: pair_props.edge_v1_idx ?? 0,
			edge_v2_idx: pair_props.edge_v2_idx ?? 1,
			direction: [0, 0, 1],
			witness_length_min: pair_props.w_min, witness_length_max: pair_props.w_max,
			slidable_min: pair_props.s_min, slidable_max: pair_props.s_max,
			avg_wlen_per_3d_unit: 10,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 0,
			edge_p2_x: 100, edge_p2_y: 0,
			wit_ux: 0, wit_uy: -1, wit_1_per3d_x: 0, wit_1_per3d_y: -1, wit_2_per3d_x: 0, wit_2_per3d_y: -1, text: '0',  dim_z: 0,
		};
		return { so_id, so_name: so_id, kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [pair] };
	}

	function persisted(so_id: string, witness_length: number, slidable_position: number, edge_v1_idx = 0, edge_v2_idx = 1): Persisted_Placement {
		return {
			so_id, so_name: so_id, axis: 'x',
			edge_v1_idx, edge_v2_idx,
			direction: [0, 0, 1],
			witness_length, slidable_position,
			label_w_px: 30, label_h_px: 14,
		};
	}

	it('says skip_search when every persisted label is still within strict range and well separated', () => {
		const regions = [
			build_region('A', { w_min: 30, w_max: 30, s_min: 0,   s_max: 0 }),
			build_region('B', { w_min: 30, w_max: 30, s_min: 500, s_max: 500 }),
		];
		const persisted_list = [persisted('A', 30, 0), persisted('B', 30, 500)];
		const result = compute_viability(persisted_list, regions);
		expect(result.kind).toBe('skip_search');
		if (result.kind !== 'skip_search') return;
		expect(result.placements).toHaveLength(2);
		expect(result.any_slack_used).toBe(false);
	});

	it('says skip_search but flags slack when a witness length is just outside strict range', () => {
		// New strict range is [30, 30]; persisted is at 29 → outside strict but within tolerance.
		const regions = [
			build_region('A', { w_min: 30, w_max: 30, s_min: 0,   s_max: 0 }),
			build_region('B', { w_min: 30, w_max: 30, s_min: 500, s_max: 500 }),
		];
		const persisted_list = [persisted('A', 29, 0), persisted('B', 30, 500)];
		const result = compute_viability(persisted_list, regions);
		expect(result.kind).toBe('skip_search');
		if (result.kind !== 'skip_search') return;
		expect(result.any_slack_used).toBe(true);
	});

	it('says cold_run when a witness length is outside the 2-pixel tolerance', () => {
		const regions = [
			build_region('A', { w_min: 30, w_max: 30, s_min: 0,   s_max: 0 }),
			build_region('B', { w_min: 30, w_max: 30, s_min: 500, s_max: 500 }),
		];
		// A at witness 25 — 5 pixels outside strict, outside tolerance.
		const persisted_list = [persisted('A', 25, 0), persisted('B', 30, 500)];
		const result = compute_viability(persisted_list, regions);
		expect(result.kind).toBe('cold_run');
		if (result.kind !== 'cold_run') return;
		expect(result.free_label_keys).toContain('A|x');
		expect(result.locked).toHaveLength(1);
		expect(result.locked[0].so_id).toBe('B');
	});

	it('says cold_run with the affected label FREE when its pair no longer exists in the region', () => {
		const regions = [
			build_region('A', { w_min: 30, w_max: 30, s_min: 0, s_max: 0, edge_v1_idx: 0, edge_v2_idx: 1 }),
		];
		// Persisted label used edges (2, 3), no longer present.
		const persisted_list = [persisted('A', 30, 0, 2, 3)];
		const result = compute_viability(persisted_list, regions);
		expect(result.kind).toBe('cold_run');
		if (result.kind !== 'cold_run') return;
		expect(result.free_label_keys).toContain('A|x');
		expect(result.locked).toHaveLength(0);
	});

	it('says cold_run when two persisted labels are now within 33 pixels of each other', () => {
		// Both labels remembered at the same centre — overlap.
		const regions = [
			build_region('A', { w_min: 30, w_max: 30, s_min: 0, s_max: 0 }),
			build_region('B', { w_min: 30, w_max: 30, s_min: 0, s_max: 0 }),
		];
		const persisted_list = [persisted('A', 30, 0), persisted('B', 30, 0)];
		const result = compute_viability(persisted_list, regions);
		expect(result.kind).toBe('cold_run');
		if (result.kind !== 'cold_run') return;
		// Both labels failed strict; both should be free.
		expect(result.free_label_keys.sort()).toEqual(['A|x', 'B|x']);
	});

	it('returns cold_run when nothing has been remembered yet (vacuous-truth guard)', () => {
		// Reproducing the first-paint case: persisted is empty but the
		// scene has regions to dimension. Without the guard, the vacuous
		// `every`-over-empty returns true, the function says "skip the
		// search", and the painter draws nothing forever.
		const region = build_region('A', { w_min: 30, w_max: 30, s_min: 0, s_max: 0 });
		const result = compute_viability([], [region]);
		expect(result.kind).toBe('cold_run');
		if (result.kind !== 'cold_run') return;
		expect(result.locked).toEqual([]);
	});

	it('handles fully empty inputs as cold_run with nothing locked and nothing free', () => {
		const result = compute_viability([], []);
		expect(result.kind).toBe('cold_run');
		if (result.kind !== 'cold_run') return;
		expect(result.locked).toEqual([]);
		expect(result.free_label_keys).toEqual([]);
	});
});

describe('Dimension_Placement — Persistence class', () => {
	function fake_placement(so_id: string, w: number, s: number): Greedy_Placement {
		const pair: Viable_Pair = {
			so_id, so_name: so_id, kind: 'regular', axis: 'x',
			edge_v1_idx: 0, edge_v2_idx: 1,
			direction: [0, 0, 1],
			witness_length_min: w, witness_length_max: w,
			slidable_min: s, slidable_max: s,
			avg_wlen_per_3d_unit: 10,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 0,
			edge_p2_x: 100, edge_p2_y: 0,
			wit_ux: 0, wit_uy: -1, wit_1_per3d_x: 0, wit_1_per3d_y: -1, wit_2_per3d_x: 0, wit_2_per3d_y: -1, text: '0',  dim_z: 0,
		};
		return {
			so_id, so_name: so_id, kind: 'regular', axis: 'x',
			pair, witness_length: w, slidable_position: s,
			center_x: 0, center_y: -w,
			label_w_px: 30, label_h_px: 14,
			min_clearance: 100,
		};
	}

	it('starts empty', () => {
		const p = new Persistence();
		expect(p.size()).toBe(0);
		expect(p.has('A|x')).toBe(false);
	});

	it('records and recalls placements by label key', () => {
		const p = new Persistence();
		p.remember(fake_placement('A', 30, 0));
		expect(p.size()).toBe(1);
		expect(p.has('A|x')).toBe(true);
		const all = p.get_all();
		expect(all).toHaveLength(1);
		expect(all[0].so_id).toBe('A');
		expect(all[0].witness_length).toBe(30);
	});

	it('forgets a label by key', () => {
		const p = new Persistence();
		p.remember(fake_placement('A', 30, 0));
		p.forget('A|x');
		expect(p.has('A|x')).toBe(false);
		expect(p.size()).toBe(0);
	});

	it('clears everything and resets the slack streak', () => {
		const p = new Persistence();
		p.remember(fake_placement('A', 30, 0));
		p.note_slack_use();
		p.note_slack_use();
		p.clear();
		expect(p.size()).toBe(0);
		expect(p.should_force_cold_run()).toBe(false);
	});

	it('triggers force-cold-run after two consecutive slack-using paints', () => {
		const p = new Persistence();
		expect(p.should_force_cold_run()).toBe(false);
		p.note_slack_use();
		expect(p.should_force_cold_run()).toBe(false);
		p.note_slack_use();
		expect(p.should_force_cold_run()).toBe(true);
	});

	it('resets the slack streak when explicitly cleared', () => {
		const p = new Persistence();
		p.note_slack_use();
		p.note_slack_use();
		p.clear_slack_streak();
		expect(p.should_force_cold_run()).toBe(false);
	});
});

describe('Dimension_Placement — seed_string_from_regions', () => {
	it('builds the same seed regardless of input order', () => {
		const r1: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [] };
		const r2: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'y', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [] };
		expect(seed_string_from_regions([r1, r2])).toBe(seed_string_from_regions([r2, r1]));
	});

	it('differs when the label set differs', () => {
		const r1: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [] };
		const r2: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'y', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [] };
		expect(seed_string_from_regions([r1])).not.toBe(seed_string_from_regions([r1, r2]));
	});
});

describe('Dimension_Placement — re_project_persisted_list (layout-freeze)', () => {
	function viable(so_id: string, edge_v1_idx: number, edge_v2_idx: number): Viable_Pair {
		return {
			so_id, so_name: so_id, kind: 'regular', axis: 'x',
			edge_v1_idx, edge_v2_idx,
			direction: [0, 0, 1],
			witness_length_min: 15, witness_length_max: 80,
			slidable_min: 0, slidable_max: 100,
			avg_wlen_per_3d_unit: 1,
			label_w_px: 30, label_h_px: 14,
			edge_p1_x: 0, edge_p1_y: 0,
			edge_p2_x: 100, edge_p2_y: 0,
			wit_ux: 0, wit_uy: -1,
			wit_1_per3d_x: 0, wit_1_per3d_y: -1,
			wit_2_per3d_x: 0, wit_2_per3d_y: -1,
			text: '8 1/2"',
			dim_z: 0,
		};
	}

	function persisted(so_id: string, witness_length: number, slidable_position: number, edge_v1_idx = 0, edge_v2_idx = 1): Persisted_Placement {
		return {
			so_id, so_name: so_id, axis: 'x',
			edge_v1_idx, edge_v2_idx,
			direction: [0, 0, 1],
			witness_length, slidable_position,
			label_w_px: 30, label_h_px: 14,
		};
	}

	function region(so_id: string, pair: Viable_Pair): Reachable_Region {
		return { so_id, so_name: so_id, kind: 'regular', axis: 'x', x_min: 0, y_min: 0, x_max: 0, y_max: 0, pairs: [pair] };
	}

	it('re-projects every persisted label onto the current paint\'s pairs', () => {
		const pair_a = viable('A', 0, 1);
		const pair_b = viable('B', 0, 1);
		const placements = re_project_persisted_list(
			[persisted('A', 30, 50), persisted('B', 40, 20)],
			[region('A', pair_a), region('B', pair_b)],
		);
		expect(placements).toHaveLength(2);
		expect(placements[0].so_id).toBe('A');
		expect(placements[0].witness_length).toBe(30);
		expect(placements[0].slidable_position).toBe(50);
		expect(placements[1].so_id).toBe('B');
		expect(placements[1].witness_length).toBe(40);
	});

	it('silently drops a persisted entry whose region no longer exists', () => {
		const pair_a = viable('A', 0, 1);
		// Only A's region exists; B disappeared.
		const placements = re_project_persisted_list(
			[persisted('A', 30, 50), persisted('B', 40, 20)],
			[region('A', pair_a)],
		);
		expect(placements).toHaveLength(1);
		expect(placements[0].so_id).toBe('A');
	});

	it('silently drops a persisted entry whose matching pair no longer exists', () => {
		const pair_other_edge = viable('A', 2, 3);   // different edge indices
		const placements = re_project_persisted_list(
			[persisted('A', 30, 50, 0, 1)],
			[region('A', pair_other_edge)],
		);
		expect(placements).toEqual([]);
	});
});

describe('Dimension_Placement — is_edge_occluded (rule 11 edge visibility)', () => {
	// Edge endpoints are projected screen positions with z (depth).
	const p = (x: number, y: number, z: number) => ({ x, y, z, w: 1 });

	it('returns false when there are no occluders', () => {
		expect(is_edge_occluded(p(0, 100, 0.5), p(100, 100, 0.5), [])).toBe(false);
	});

	it('returns false when an occluder face is BEHIND the edge', () => {
		// Edge at depth 0.5. Occluder face at depth 0.9 (behind, further
		// from camera assuming larger z is farther). Should NOT occlude.
		const occluder = {
			projected: [p(-50, 50, 0.9), p(200, 50, 0.9), p(200, 200, 0.9), p(-50, 200, 0.9)],
			faces: [[0, 1, 2, 3]],
		};
		expect(is_edge_occluded(p(0, 100, 0.5), p(100, 100, 0.5), [occluder])).toBe(false);
	});

	it('returns true when an occluder face IN FRONT covers the edge midpoint', () => {
		// Edge at depth 0.5. Occluder face at depth 0.2 (in front).
		// Occluder covers x in [40, 60], y in [50, 150] — covers the edge midpoint at (50, 100).
		const occluder = {
			projected: [p(40, 50, 0.2), p(60, 50, 0.2), p(60, 150, 0.2), p(40, 150, 0.2)],
			faces: [[0, 1, 2, 3]],
		};
		expect(is_edge_occluded(p(0, 100, 0.5), p(100, 100, 0.5), [occluder])).toBe(true);
	});

	it('returns false when an in-front face does NOT overlap the edge on screen', () => {
		// Edge at y=100. Occluder at y in [300, 400] — far below; no overlap.
		const occluder = {
			projected: [p(0, 300, 0.2), p(100, 300, 0.2), p(100, 400, 0.2), p(0, 400, 0.2)],
			faces: [[0, 1, 2, 3]],
		};
		expect(is_edge_occluded(p(0, 100, 0.5), p(100, 100, 0.5), [occluder])).toBe(false);
	});

	it('returns true when a partial occluder covers one endpoint but not the other', () => {
		// Occluder covers x in [-50, 30] — covers the left endpoint and a few sample points.
		const occluder = {
			projected: [p(-50, 50, 0.2), p(30, 50, 0.2), p(30, 150, 0.2), p(-50, 150, 0.2)],
			faces: [[0, 1, 2, 3]],
		};
		expect(is_edge_occluded(p(0, 100, 0.5), p(100, 100, 0.5), [occluder])).toBe(true);
	});
});

