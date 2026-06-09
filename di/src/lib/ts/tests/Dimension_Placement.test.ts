import { describe, it, expect } from 'vitest';
import { k } from '../common/Constants';
import { preferences, T_Preference } from '../managers/Preferences';

// Read the same persisted flag the running app reads. When true, the
// Group B describe blocks below skip — they pin the abandoned placement
// algorithm and the new spec has dropped its shape. The setup file
// bridges process.env.USE_UNIFACE_RULES into local storage at startup.
const USE_UNIFACE_RULES = preferences.read<boolean>(T_Preference.useUnifaceRules) ?? false;
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
	is_occluder_for_dim,
	is_face_front_facing,
	witness_trapezoid_gap,
	compute_viability,
	re_project_persisted_list,
	Persistence,
	compute_silhouette_box,
	compute_uniface_box_from_silhouette,
	is_face_excluded,
	pick_first_viable_uniface_for_axis,
	pick_closest_uniface_for_axis,
	distance_from_point_to_line_2d,
	rectangles_overlap_2d,
	distance_between_rectangles_2d,
	rectangle_inside_rectangle_2d,
	bounding_rectangle_of_points_2d,
	distance_from_rect_to_segment_2d,
	min_distance_between_segments_2d,
	distance_point_to_segment_2d,
	segments_intersect_2d,
	candidate_passes_clearances,
	evaluate_clearances,
	SLIDE_ELIGIBLE_FILTERS,
	point_in_convex_polygon_2d,
	rect_intersects_convex_polygon_2d,
	distance_from_rect_to_convex_polygon_2d,
	UNIFACE_FACE_POS_X,
	UNIFACE_FACE_NEG_X,
	UNIFACE_FACE_POS_Y,
	UNIFACE_FACE_NEG_Y,
	UNIFACE_FACE_POS_Z,
	UNIFACE_FACE_NEG_Z,
	type Persisted_Placement,
	type Reachable_Region,
	type Viable_Pair,
	type Greedy_Placement,
	type Label_Key,
	type Silhouette_Box,
} from '../render/Dimension_Placement';
import { vec3 } from 'gl-matrix';

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

describe.skipIf(USE_UNIFACE_RULES)('Dimension_Placement — first-pass neighbour pairs', () => {
	it('returns no pairs when no regions overlap', () => {
		const regions = [
			region('A', 0,   0,   20,  20),
			region('B', 200, 200, 220, 220),
			region('C', 500, 500, 520, 520),
		];
		const pairs = neighbour_pairs_from_regions(regions);
		expect(pairs).toEqual([]);
	});

	it('flags two regions whose clearance-expanded boxes overlap', () => {
		// Gap = M - 2, just inside the clearance margin. Position read from
		// the shared constants so the test stays correct if the margin moves.
		const M = k.dimensions.PAIR_CLEARANCE_PX;
		const regions = [
			region('A', 0,           0, 20,                0 + 20),
			region('B', 20 + M - 2,  0, 20 + M - 2 + 20,   0 + 20),
		];
		const pairs = neighbour_pairs_from_regions(regions);
		expect(pairs).toHaveLength(1);
		const [p] = pairs;
		const ids = [p.a_so_id, p.b_so_id].sort();
		expect(ids).toEqual(['A', 'B']);
	});

	it('does NOT flag two regions just outside the clearance margin', () => {
		// Gap = M + 5, comfortably outside the clearance margin.
		const M = k.dimensions.PAIR_CLEARANCE_PX;
		const regions = [
			region('A', 0,            0, 20,                  0 + 20),
			region('B', 20 + M + 5,   0, 20 + M + 5 + 20,     0 + 20),
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
		// Positions derived from the clearance margin so the assertion stays
		// stable if the margin changes. B is just inside A's margin (touches);
		// D sits past A in x AND offset in y just enough to escape A's margin
		// but still inside B's. C is alone in the corner.
		const M = k.dimensions.PAIR_CLEARANCE_PX;
		const regions = [
			region('A', 0,             0,             20,              20),
			region('B', 20 + M - 2,    0,             20 + M - 2 + 20, 20),    // gap M-2 from A: inside margin
			region('C', 500,           500,           520,             520),   // far from all
			region('D', 20 + M + 3,    20 + M / 2,    20 + M + 3 + 20, 20 + M / 2 + 20),   // gap M+3 from A in x
		];
		const pairs = neighbour_pairs_from_regions(regions);
		const labelled = pairs.map(p => [p.a_so_id, p.b_so_id].sort().join('-')).sort();
		expect(labelled).toEqual(['A-B', 'B-D']);
	});

	it('returns Candidate_Pair entries with axis preserved', () => {
		const M = k.dimensions.PAIR_CLEARANCE_PX;
		const r: Reachable_Region = { so_id: 'A', so_name: 'A', kind: 'regular', axis: 'y', x_min: 0, y_min: 0, x_max: 20, y_max: 20, pairs: [] };
		const s: Reachable_Region = { so_id: 'B', so_name: 'B', kind: 'regular', axis: 'z', x_min: 20 + M - 2, y_min: 0, x_max: 20 + M - 2 + 20, y_max: 20, pairs: [] };
		const pairs = neighbour_pairs_from_regions([r, s]);
		expect(pairs).toHaveLength(1);
		const sorted = [pairs[0].a_axis, pairs[0].b_axis].sort();
		expect(sorted).toEqual(['y', 'z']);
	});
});

describe.skipIf(USE_UNIFACE_RULES)('Dimension_Placement — second-pass closed-form separation', () => {
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

describe.skipIf(USE_UNIFACE_RULES)('Dimension_Placement — labels_can_separate_via_some_combination', () => {
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

describe.skipIf(USE_UNIFACE_RULES)('Conflict_Graph', () => {
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

describe.skipIf(USE_UNIFACE_RULES)('Dimension_Placement — min_distance_to_placed', () => {
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

describe.skipIf(USE_UNIFACE_RULES)('Dimension_Placement — best_candidate_in_pair', () => {
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

describe.skipIf(USE_UNIFACE_RULES)('Dimension_Placement — greedy_seed_for_regions', () => {
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

	it('flags pairs closer than the clearance margin', () => {
		// B's centre sits so the rectangle-to-rectangle gap is M-2 (just inside the margin).
		const M = k.dimensions.PAIR_CLEARANCE_PX;
		const list = [placed('A', 0, 0), placed('B', 30 + M - 2, 0)];
		expect(find_conflicts_in_placement(list)).toEqual([[0, 1]]);
	});

	it('does not flag pairs at exactly the clearance margin', () => {
		// B's centre sits so the rectangle-to-rectangle gap is exactly M (boundary, not in conflict).
		const M = k.dimensions.PAIR_CLEARANCE_PX;
		const list = [placed('A', 0, 0), placed('B', 30 + M, 0)];
		expect(find_conflicts_in_placement(list)).toEqual([]);
	});

	it('handles multiple overlapping conflicts', () => {
		// A-B and B-C are each gap M-2 (in conflict); A-C is gap 26+2M (well outside).
		const M = k.dimensions.PAIR_CLEARANCE_PX;
		const list = [placed('A', 0, 0), placed('B', 30 + M - 2, 0), placed('C', 2 * (30 + M - 2), 0)];
		expect(find_conflicts_in_placement(list)).toEqual([[0, 1], [1, 2]]);
	});
});

describe.skipIf(USE_UNIFACE_RULES)('Dimension_Placement — retry_pass', () => {
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

describe.skipIf(USE_UNIFACE_RULES)('Dimension_Placement — stochastic_finish', () => {
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

	it('keeps the persisted label when one was remembered last render and the other was not', () => {
		const placed = [
			placement_with_text('A', '8 1/2"'),   // new this render
			placement_with_text('B', '8 1/2"'),   // was around last render
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
		// Reproducing the first-render case: persisted is empty but the
		// scene has regions to dimension. Without the guard, the vacuous
		// `every`-over-empty returns true, the function says "skip the
		// search", and the renderer draws nothing forever.
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

	it('triggers force-cold-run after two consecutive slack-using renders', () => {
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

	it('re-projects every persisted label onto the current render\'s pairs', () => {
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

describe('Dimension_Placement — is_occluder_for_dim (rule 11 potential-blocker set)', () => {
	// Minimal fake scene object — is_occluder_for_dim only reads obj.so.visible.
	const obj = (visible: boolean) => ({ so: { visible } } as never);

	it('treats a part with its visibility ON as a blocker (normal mode)', () => {
		expect(is_occluder_for_dim(obj(true), false, false)).toBe(true);
	});

	it('does NOT treat a part with its visibility OFF as a blocker (normal mode)', () => {
		// An invisible parent that shows its children: not drawn, not a blocker.
		expect(is_occluder_for_dim(obj(false), false, false)).toBe(false);
	});

	it('treats a visible child of a hide-children parent as a blocker (normal mode)', () => {
		// The child's own visibility flag is still on; the parent hides it from
		// the canvas but its geometry is still present. Blocker.
		expect(is_occluder_for_dim(obj(true), false, false)).toBe(true);
	});

	it('flips blocker eligibility when OPTION x-ray mode is on and the scene has hidden parts', () => {
		// In OPTION x-ray mode the dimensioning logic inverts: hidden parts
		// become the foreground. is_occluder_for_dim follows: visible parts
		// step aside, invisible parts become blockers.
		expect(is_occluder_for_dim(obj(true),  true, true)).toBe(false);
		expect(is_occluder_for_dim(obj(false), true, true)).toBe(true);
	});

	it('does NOT enter OPTION x-ray mode when no parts are hidden', () => {
		// OPTION alone, with nothing hidden, leaves normal mode in place.
		expect(is_occluder_for_dim(obj(true),  true, false)).toBe(true);
		expect(is_occluder_for_dim(obj(false), true, false)).toBe(false);
	});
});

describe('Dimension_Placement — witness_trapezoid_gap (rule 11 perspective convergence)', () => {
	const p = (x: number, y: number) => ({ x, y });

	it('equals the anchor distance when both witnesses point the same direction perpendicular to the edge (square)', () => {
		// Edge along x, both witnesses straight up — trapezoid is a rectangle.
		// Perpendicular from either corner to the other witness equals the edge length.
		expect(witness_trapezoid_gap(p(0, 0), p(20, 0), p(0, 10), p(0, 10))).toBeCloseTo(20, 5);
	});

	it('catches the failure mode rule 11 cares about: nearly-parallel witnesses tilted same screen direction', () => {
		// Both witnesses tilted slightly left as they go up — one corner
		// obtuse, one acute. Perpendicular from the obtuse corner crosses
		// the other witness at a distance smaller than the anchor gap.
		const gap = witness_trapezoid_gap(p(0, 0), p(20, 0), p(-1, 10), p(-1, 10));
		expect(gap).toBeLessThan(20);
		expect(gap).toBeGreaterThan(0);
	});

	it('returns 0 when the two anchors coincide (degenerate edge)', () => {
		expect(witness_trapezoid_gap(p(5, 5), p(5, 5), p(0, 10), p(0, 10))).toBe(0);
	});

	it('falls back to the anchor distance when a witness direction has zero magnitude', () => {
		expect(witness_trapezoid_gap(p(0, 0), p(15, 0), p(0, 0), p(0, 10))).toBeCloseTo(15, 5);
	});

	it('matches the perpendicular projection for parallel witnesses (det ≈ 0 branch)', () => {
		// Both witnesses point the same direction (truly parallel on screen).
		// Edge length 25, witnesses straight up. Trapezoid is a rectangle, gap = 25.
		expect(witness_trapezoid_gap(p(0, 0), p(25, 0), p(0, 1), p(0, 1))).toBeCloseTo(25, 5);
	});

	it('ties go to W1 when the two anchor angles are equal (symmetric trapezoid)', () => {
		// Symmetric divergent trapezoid: W1 tilts up-and-left, W2 tilts up-and-right.
		// Both anchor angles obtuse and equal; tie-break picks W1's corner.
		// Just verifies the function returns a finite positive number — the
		// determinism comes from the implementation's tie-break.
		const gap = witness_trapezoid_gap(p(0, 0), p(20, 0), p(-1, 10), p(1, 10));
		expect(Number.isFinite(gap)).toBe(true);
		expect(gap).toBeGreaterThan(0);
	});
});

describe('Dimension_Placement — is_face_front_facing (rule 10 face convention)', () => {
	// Documents the project-wide convention: the renderer treats negative
	// projected winding as front-facing on screen. Dimensioning code must
	// follow the same sign or it picks the wrong face. See Render.ts:452.

	it('treats a NEGATIVE winding as front-facing', () => {
		expect(is_face_front_facing(-1)).toBe(true);
		expect(is_face_front_facing(-0.5)).toBe(true);
		expect(is_face_front_facing(-1e-9)).toBe(true);
	});

	it('treats a POSITIVE winding as back-facing (not front)', () => {
		expect(is_face_front_facing(1)).toBe(false);
		expect(is_face_front_facing(0.5)).toBe(false);
		expect(is_face_front_facing(1e-9)).toBe(false);
	});

	it('treats a ZERO winding (edge-on) as not front-facing', () => {
		// Edge-on faces are degenerate; the dimensioning code treats them
		// as not-front so back-facing fallback can pick a different choice.
		expect(is_face_front_facing(0)).toBe(false);
	});
});

describe('Dimension_Placement — uniface design (rules 1-8) (pending implementation)', () => {
	// These tests describe the expected behaviour of the uniface design
	// captured in uniface rules.md (master spec). Rules 1 through 8 are placement
	// rules; rules 9-10 are meta-rules (carry-over and abandoned).
	// They are marked .todo so they show up in the suite as outstanding
	// work without producing failures while the implementation is missing.
	// Convert each .todo to .it once the corresponding helper exists.

	it.todo('builds a world-axis-aligned 3D box that encloses every rendered non-rotated part (the root silhouette box)');

	it.todo('excludes rotated parts from the root silhouette box — each rotated part gets its own silhouette box per rule 4');

	it.todo('expands each face in world units so its projection sits exactly silhouette margin (15 px per rule 8) outside the projected silhouette of the scene');

	it.todo('recomputes the uniface box every render as the camera moves');

	it('returns an empty silhouette box at the origin when no parts are rendered', () => {
		const box = compute_silhouette_box([]);
		expect(box.min).toEqual([0, 0, 0]);
		expect(box.max).toEqual([0, 0, 0]);
	});

	it.todo('places the dim line in the plane of a uniface (rule 3)');

	it('the witness index picks which of the three nested uniface boxes holds the dim line (rule 1)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		const no_exclusions = (_n: vec3) => false;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 3);
		// Three nested levels exist. Each level's outward distance for a given face is larger than the previous.
		expect(box.shifts.length).toBe(3);
		const f = UNIFACE_FACE_POS_X;
		expect(box.shifts[0][f]).toBeLessThan(box.shifts[1][f] as number);
		expect(box.shifts[1][f]).toBeLessThan(box.shifts[2][f] as number);
		// The picker accepts a witness index and returns a uniface for each level.
		expect(pick_first_viable_uniface_for_axis('x', box, 0)).not.toBeNull();
		expect(pick_first_viable_uniface_for_axis('x', box, 1)).not.toBeNull();
		expect(pick_first_viable_uniface_for_axis('x', box, 2)).not.toBeNull();
	});

	it.todo('drops the label when no witness length places the dim line on a uniface without conflict (rule 3)');

	it.todo('rotated parts get their own uniface box rotated with the part, around a local silhouette of the part and its subparts (rule 4)');

	it.todo('a part-axis dim line is parallel-in-3D to that axis and lies on one of the four unifaces that contain that axis (rule 3)');

	it.todo('two dims along the same axis on different parts can share the same uniface when there is room');

	it.todo('removes the 200-px witness cap for non-rotated parts — interior parts can have arbitrarily long witnesses reaching the uniface');

	// Coverage gaps from step 2 of the test-rollout proposal.

	it('the witness index cap value is 4 and is read from k.dimensions.WITNESS_INDEX_CAP (rule 1)', () => {
		expect(k.dimensions.WITNESS_INDEX_CAP).toBe(4);
	});

	it.todo('the four placement choices are exactly edge, uniface, witness index, label position (rule 2)');

	it.todo('for a rotated part, the label center sits on the uniface closest to the rotated label projected center (rule 4 sub-point 1)');

	it.todo('for a rotated part, the dim line lies on a plane parallel to the rotated silhouette box that passes through the label center (rule 4 sub-point 1)');

	it.todo('dropping a label because its witness index exceeded the cap does not trigger re-placement for labels that depended on this one position (rule 7)');

	it('k.dimensions.PAIR_CLEARANCE_PX is 5 and k.dimensions.SILHOUETTE_MARGIN_PX is 15', () => {
		expect(k.dimensions.PAIR_CLEARANCE_PX).toBe(5);
		expect(k.dimensions.SILHOUETTE_MARGIN_PX).toBe(15);
	});

	// Rule 19 — depth-concentration vote.
	// After the full sweep finds viable depths per (part, direction), each
	// direction tallies how many parts found each depth viable. The two
	// depths with the longest lists win that direction; every other
	// (part, direction, depth) viability record is discarded. Parts viable
	// in a direction only at a losing depth lose that direction entirely.
	it.todo('per direction, only the two witness indices with the most viable parts survive the depth-concentration vote (rule 19)');

	it.todo('a part viable in a direction only at a witness index that lost the depth-concentration vote loses that direction (rule 19)');

	it.todo('the depth-concentration vote leaves each direction with at most two surviving witness indices (rule 19)');

	// Rule 18 — dim line and arrow drawing (renderer behaviour pinned by visual review).
	// Tests live here because the rule is owned by the placement spec; the
	// behaviour itself is implemented in Dimension_Renderer.ts.
	it.todo('the arrowhead tip touches the witness line at the anchor in both the inside case and the overhang case (rule 18)');

	it.todo('an inside arrow that fits between the label box and the witness line points inward at the anchor with no outside extension (rule 18)');

	it.todo('an inside arrow that does NOT fit between the label box and the witness line flips outward, draws a SLIDABLE_OVERHANG_PX extension outside its witness, and the arrow sits on that extension pointing outward (rule 18)');

	it.todo('the inside dim segment between the two anchors is dropped whenever EITHER side flips to outside (rule 18)');

	it.todo('each side of the dim line decides independently whether to flip — one side can be inside while the other is outside (rule 18)');

	it.todo('when the label fully covers an arrowhead (anchor and arrow base both inside the label box at the chosen position), the PLACEMENT SEARCH slides the label past that witness anchor by half-label-width + SLIDABLE_OVERHANG_PX + arrow-length BEFORE running the cross-label clearance check (rule 18)');

	it.todo('two labels whose natural positions would overlap each other after the slide are caught by the label-vs-label clearance check because the slide happens BEFORE the check (rule 18 + rule 19 filter 2)');

	it.todo('the renderer does NOT re-slide the label — it draws at whatever final position placement chose (rule 18)');

	it.todo('an inside arrowhead has the half of the dim line on its side drawn inside, from the anchor toward the label near edge or the other anchor (rule 18)');

	it.todo('a flipped (outside) arrowhead draws NO inside dim line on its side (rule 18)');

	it.todo('once the label has been slid past a witness anchor, BOTH arrows flip outside and BOTH sides of the dim line go outside, regardless of per-side fit (rule 18)');

	it.todo('every outside arrow gets a dim-line extension of EXACTLY SLIDABLE_OVERHANG_PX (20 screen pixels) — no special cases for the slid label (rule 18)');

	it.todo('on the slid side, a connector dim line runs from the extension end to the label near edge (rule 18)');

	it.todo('hovering on the label number box triggers the same red highlight and popup as hovering on a dim line, witness line, or part (rule 18 + rule 20)');
});

describe('Dimension_Placement — uniface box builder (step 1)', () => {
	it('silhouette box encloses every world corner', () => {
		// Two parts: one centered at origin (size 2), one shifted at (10, 5, 0) (size 4).
		const corners: vec3[] = [
			vec3.fromValues(-1, -1, -1), vec3.fromValues(1, -1, -1), vec3.fromValues(1, 1, -1), vec3.fromValues(-1, 1, -1),
			vec3.fromValues(-1, -1,  1), vec3.fromValues(1, -1,  1), vec3.fromValues(1, 1,  1), vec3.fromValues(-1, 1,  1),
			vec3.fromValues(8, 3, -2), vec3.fromValues(12, 3, -2), vec3.fromValues(12, 7, -2), vec3.fromValues(8, 7, -2),
			vec3.fromValues(8, 3,  2), vec3.fromValues(12, 3,  2), vec3.fromValues(12, 7,  2), vec3.fromValues(8, 7,  2),
		];
		const box = compute_silhouette_box(corners);
		expect(box.min).toEqual([-1, -1, -2]);
		expect(box.max).toEqual([12, 7, 2]);
	});

	it('per-uniface shift equals margin when projection is 1 pixel per world unit (no exclusions)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		// Identity-scale projection: drop z, copy x and y to screen.
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		const no_exclusions = (_n: vec3) => false;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 3);
		// +x face moves along world +x; projection sees screen +x change by 1 per world unit.
		// shift at level 1 should equal margin (15).
		expect(box.shifts[0][UNIFACE_FACE_POS_X]).toBeCloseTo(15, 6);
		expect(box.shifts[0][UNIFACE_FACE_NEG_X]).toBeCloseTo(15, 6);
		expect(box.shifts[0][UNIFACE_FACE_POS_Y]).toBeCloseTo(15, 6);
		expect(box.shifts[0][UNIFACE_FACE_NEG_Y]).toBeCloseTo(15, 6);
		// +z and -z faces move along world z, which the identity-xy projection drops.
		// screen_per_world is zero → shift is zero per the safety guard.
		expect(box.shifts[0][UNIFACE_FACE_POS_Z]).toBe(0);
		expect(box.shifts[0][UNIFACE_FACE_NEG_Z]).toBe(0);
	});

	it('per-uniface shift scales linearly with the enum level (no exclusions)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: 2 * w[0], y: 2 * w[1] }); // 2 px per world unit
		const no_exclusions = (_n: vec3) => false;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 3);
		// Enum 1: shift = 15 / 2 = 7.5
		// Enum 2: shift = 30 / 2 = 15
		// Enum 3: shift = 45 / 2 = 22.5
		expect(box.shifts[0][UNIFACE_FACE_POS_X]).toBeCloseTo(7.5, 6);
		expect(box.shifts[1][UNIFACE_FACE_POS_X]).toBeCloseTo(15, 6);
		expect(box.shifts[2][UNIFACE_FACE_POS_X]).toBeCloseTo(22.5, 6);
	});

	it('excluded faces get null shifts at every enum level', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		// Exclude only the +x face.
		const is_excluded = (n: vec3) => n[0] === 1 && n[1] === 0 && n[2] === 0;
		const box = compute_uniface_box_from_silhouette(silhouette, project, is_excluded, 15, 3);
		expect(box.shifts[0][UNIFACE_FACE_POS_X]).toBeNull();
		expect(box.shifts[1][UNIFACE_FACE_POS_X]).toBeNull();
		expect(box.shifts[2][UNIFACE_FACE_POS_X]).toBeNull();
		// Other faces still get numeric shifts.
		expect(box.shifts[0][UNIFACE_FACE_NEG_X]).toBeCloseTo(15, 6);
	});

	it('the excluded-face rule rejects front-facing within 20° of pointing AT the camera and back-facing within 45° of pointing AWAY', () => {
		// Camera looks in +z (forward = (0,0,1)).
		// Back-facing = normal points AWAY from camera (same direction as forward).
		// Front-facing = normal points TOWARD camera (opposite to forward).
		const forward = vec3.fromValues(0, 0, 1);

		// BACK-facing within 45° of straight-back: rejected.
		expect(is_face_excluded(vec3.fromValues(0, 0, 1), forward, 20, 45)).toBe(true);  // straight back
		const back_at_44 = vec3.fromValues(Math.sin(44 * Math.PI / 180), 0, Math.cos(44 * Math.PI / 180));
		expect(is_face_excluded(back_at_44, forward, 20, 45)).toBe(true);  // 44° off — just inside
		// BACK-facing past 45° (closer to perpendicular): kept.
		const back_at_46 = vec3.fromValues(Math.sin(46 * Math.PI / 180), 0, Math.cos(46 * Math.PI / 180));
		expect(is_face_excluded(back_at_46, forward, 20, 45)).toBe(false);  // 46° off — just outside

		// FRONT-facing within 20° of pointing AT the camera: rejected.
		expect(is_face_excluded(vec3.fromValues(0, 0, -1), forward, 20, 45)).toBe(true);  // straight at camera
		const front_at_19 = vec3.fromValues(Math.sin(19 * Math.PI / 180), 0, -Math.cos(19 * Math.PI / 180));
		expect(is_face_excluded(front_at_19, forward, 20, 45)).toBe(true);  // 19° off, just inside

		// FRONT-facing more than 20° off from head-on: kept (useful glancing front faces).
		const front_at_21 = vec3.fromValues(Math.sin(21 * Math.PI / 180), 0, -Math.cos(21 * Math.PI / 180));
		expect(is_face_excluded(front_at_21, forward, 20, 45)).toBe(false);  // 21° off, just outside
		const front_glancing = vec3.fromValues(Math.sin(80 * Math.PI / 180), 0, -Math.cos(80 * Math.PI / 180));
		expect(is_face_excluded(front_glancing, forward, 20, 45)).toBe(false);  // 80° off — very glancing

		// Edge-on (perpendicular to forward) — past both thresholds — kept.
		expect(is_face_excluded(vec3.fromValues(1, 0, 0), forward, 20, 45)).toBe(false);
		expect(is_face_excluded(vec3.fromValues(0, 1, 0), forward, 20, 45)).toBe(false);
	});

	it('per-axis uniface picker returns the first uniface that is not excluded and contains the axis', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		// All six faces are non-excluded.
		const no_exclusions = (_n: vec3) => false;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 3);
		// For each axis, picker should return the first candidate in its preferred order.
		expect(pick_first_viable_uniface_for_axis('x', box, 0)).toBe(UNIFACE_FACE_POS_Y);
		expect(pick_first_viable_uniface_for_axis('y', box, 0)).toBe(UNIFACE_FACE_POS_X);
		expect(pick_first_viable_uniface_for_axis('z', box, 0)).toBe(UNIFACE_FACE_POS_X);
	});

	it('per-axis uniface picker skips excluded faces and falls back to the next candidate', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		// Exclude +y (the first candidate for x-axis).
		const is_excluded = (n: vec3) => n[1] === 1 && n[0] === 0 && n[2] === 0;
		const box = compute_uniface_box_from_silhouette(silhouette, project, is_excluded, 15, 3);
		// x-axis picker falls back from +y to -y.
		expect(pick_first_viable_uniface_for_axis('x', box, 0)).toBe(UNIFACE_FACE_NEG_Y);
	});

	it('per-axis uniface picker returns null when every candidate is excluded', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		// Exclude every face that could contain the x-axis: +y, -y, +z, -z.
		const is_excluded = (n: vec3) => n[0] === 0; // every non-x-axis-normal face
		const box = compute_uniface_box_from_silhouette(silhouette, project, is_excluded, 15, 3);
		expect(pick_first_viable_uniface_for_axis('x', box, 0)).toBeNull();
	});

	it('closest-uniface picker picks the candidate with the smallest screen distance to the seed (step 3a)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		const no_exclusions = (_n: vec3) => false;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 3);
		// x-axis candidates: +y, -y, +z, -z. Set -z smallest among them.
		// +x and -x entries are not candidates for the x-axis so their values are ignored.
		const dists: number[] = [];
		dists[UNIFACE_FACE_POS_X] = 0;
		dists[UNIFACE_FACE_NEG_X] = 0;
		dists[UNIFACE_FACE_POS_Y] = 50;
		dists[UNIFACE_FACE_NEG_Y] = 20;
		dists[UNIFACE_FACE_POS_Z] = 30;
		dists[UNIFACE_FACE_NEG_Z] = 5;
		expect(pick_closest_uniface_for_axis('x', box, 0, dists)).toBe(UNIFACE_FACE_NEG_Z);
	});

	it('closest-uniface picker skips excluded candidates even when their distance would win (step 3a)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		// Exclude the -z face only.
		const exclude_neg_z = (n: vec3) => n[0] === 0 && n[1] === 0 && n[2] === -1;
		const box = compute_uniface_box_from_silhouette(silhouette, project, exclude_neg_z, 15, 3);
		const dists: number[] = [];
		dists[UNIFACE_FACE_POS_X] = 0;
		dists[UNIFACE_FACE_NEG_X] = 0;
		dists[UNIFACE_FACE_POS_Y] = 50;
		dists[UNIFACE_FACE_NEG_Y] = 20;
		dists[UNIFACE_FACE_POS_Z] = 30;
		dists[UNIFACE_FACE_NEG_Z] = 5;  // would win but is excluded
		expect(pick_closest_uniface_for_axis('x', box, 0, dists)).toBe(UNIFACE_FACE_NEG_Y);
	});
});

describe('Dimension_Placement — distance_from_point_to_line_2d (step 3a edge-to-anchor)', () => {
	it('zero distance when the point sits on the line', () => {
		const p = { x: 5, y: 0 };
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(0, 6);
	});

	it('measures perpendicular distance from point to horizontal line', () => {
		const p = { x: 5, y: 7 };
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(7, 6);
	});

	it('measures perpendicular distance from point to vertical line', () => {
		const p = { x: 3, y: 100 };
		const a = { x: 0, y: 0 };
		const b = { x: 0, y: 10 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(3, 6);
	});

	it('measures perpendicular distance from point to a diagonal line', () => {
		// Line y = x (through origin and (1,1)). Point (0, 2) is sqrt(2) away.
		const p = { x: 0, y: 2 };
		const a = { x: 0, y: 0 };
		const b = { x: 1, y: 1 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(Math.SQRT2, 6);
	});

	it('falls back to point-to-endpoint distance when the line is degenerate', () => {
		const p = { x: 3, y: 4 };
		const a = { x: 0, y: 0 };
		const b = { x: 0, y: 0 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(5, 6);
	});

	it('uses the infinite line, not the segment — point off the end still measures perpendicular', () => {
		const p = { x: 100, y: 5 };  // far to the right of the segment, 5 above
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(5, 6);
	});
});

describe('Dimension_Placement — rectangle helpers (step 3a clearance checks)', () => {
	it('rectangles overlap when their interiors intersect', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 5, y_min: 5, x_max: 15, y_max: 15 };
		expect(rectangles_overlap_2d(a, b)).toBe(true);
	});

	it('rectangles do not overlap when only touching at an edge', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 10, y_min: 0, x_max: 20, y_max: 10 };
		expect(rectangles_overlap_2d(a, b)).toBe(false);
	});

	it('rectangles do not overlap when fully separated', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 20, y_min: 20, x_max: 30, y_max: 30 };
		expect(rectangles_overlap_2d(a, b)).toBe(false);
	});

	it('distance between rectangles is zero when they overlap', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 5, y_min: 5, x_max: 15, y_max: 15 };
		expect(distance_between_rectangles_2d(a, b)).toBeCloseTo(0, 6);
	});

	it('distance between rectangles is the side gap when one is purely to the right', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 17, y_min: 0, x_max: 27, y_max: 10 };
		expect(distance_between_rectangles_2d(a, b)).toBeCloseTo(7, 6);
	});

	it('distance between rectangles is the diagonal gap when one is corner-offset from the other', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 13, y_min: 14, x_max: 20, y_max: 20 };
		// horizontal gap 3, vertical gap 4 → diagonal 5
		expect(distance_between_rectangles_2d(a, b)).toBeCloseTo(5, 6);
	});

	it('rectangle-inside-rectangle is true when the inner sits fully inside', () => {
		const outer = { x_min: 0, y_min: 0, x_max: 100, y_max: 100 };
		const inner = { x_min: 10, y_min: 10, x_max: 50, y_max: 50 };
		expect(rectangle_inside_rectangle_2d(inner, outer)).toBe(true);
	});

	it('rectangle-inside-rectangle is true when the inner exactly matches the outer (touching counts)', () => {
		const r = { x_min: 0, y_min: 0, x_max: 100, y_max: 100 };
		expect(rectangle_inside_rectangle_2d(r, r)).toBe(true);
	});

	it('rectangle-inside-rectangle is false when the inner extends past one side', () => {
		const outer = { x_min: 0, y_min: 0, x_max: 100, y_max: 100 };
		const inner = { x_min: 90, y_min: 50, x_max: 110, y_max: 60 };
		expect(rectangle_inside_rectangle_2d(inner, outer)).toBe(false);
	});

	it('bounding rectangle of points returns the tight axis-aligned envelope', () => {
		const points = [{ x: 1, y: 2 }, { x: 5, y: -1 }, { x: 3, y: 4 }];
		const r = bounding_rectangle_of_points_2d(points);
		expect(r.x_min).toBeCloseTo(1, 6);
		expect(r.y_min).toBeCloseTo(-1, 6);
		expect(r.x_max).toBeCloseTo(5, 6);
		expect(r.y_max).toBeCloseTo(4, 6);
	});

	it('bounding rectangle of an empty list returns a zero-extent rectangle at the origin', () => {
		const r = bounding_rectangle_of_points_2d([]);
		expect(r.x_min).toBe(0);
		expect(r.y_min).toBe(0);
		expect(r.x_max).toBe(0);
		expect(r.y_max).toBe(0);
	});

	it('rect-to-segment distance is zero when the segment passes through the rectangle', () => {
		const r = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const a = { x: -5, y: 5 };
		const b = { x: 20, y: 5 };
		expect(distance_from_rect_to_segment_2d(r, a, b)).toBeCloseTo(0, 6);
	});

	it('rect-to-segment distance is the perpendicular gap when the segment runs parallel above the rectangle', () => {
		const r = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const a = { x: 0, y: 17 };
		const b = { x: 10, y: 17 };
		expect(distance_from_rect_to_segment_2d(r, a, b)).toBeCloseTo(7, 6);
	});

	it('rect-to-segment distance is the corner-to-endpoint gap when the segment sits off-corner', () => {
		const r = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const a = { x: 13, y: 14 };
		const b = { x: 20, y: 20 };
		// closest segment point to the rect is endpoint a; rect corner is (10,10); gap = hypot(3,4) = 5
		expect(distance_from_rect_to_segment_2d(r, a, b)).toBeCloseTo(5, 1);
	});
});

describe('Dimension_Placement — candidate_passes_clearances (step 3a full clearance suite)', () => {
	// Common setup: a candidate label centred at (200, 200), 40x14, well away
	// from a silhouette rect at (0..100, 0..100). The candidate's witness
	// anchors are at (170, 200) and (230, 200); the edge endpoints are at
	// (170, 250) and (230, 250). With no previously placed picks, everything
	// should pass.
	const base = () => ({
		candidate_label_rect    : { x_min: 180, x_max: 220, y_min: 193, y_max: 207 } as const,
		candidate_anchor_1      : { x: 170, y: 200 },
		candidate_anchor_2      : { x: 230, y: 200 },
		candidate_edge_p1_screen: { x: 170, y: 250 },
		candidate_edge_p2_screen: { x: 230, y: 250 },
		silhouette              : [
			{ x:   0, y:   0 },
			{ x: 100, y:   0 },
			{ x: 100, y: 100 },
			{ x:   0, y: 100 },
		] as const,
		placed_label_rects      : [] as const,
		placed_anchors          : [] as const,
		placed_witness_segments : [] as const,
		placed_dim_segments     : [] as const,
		pair_clearance_px       : 15,
		silhouette_margin_px    : 15,
	});

	it('passes when nothing else is placed and the silhouette is well away', () => {
		expect(candidate_passes_clearances(base())).toBe(true);
	});

	it('fails when the candidate label rect sits inside the silhouette rect', () => {
		const in_ = { ...base(),
			candidate_label_rect: { x_min: 30, x_max: 70, y_min: 30, y_max: 70 } };
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('fails when the candidate label rect is within 15 px of a placed label rect', () => {
		const in_ = { ...base(),
			placed_label_rects: [{ x_min: 230, x_max: 270, y_min: 193, y_max: 207 }] };
		// gap is 10 px (220 to 230), less than 15
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	// Symmetric clearance — the new requirement.
	it('fails when the candidate ANCHOR sits within 15 px of a previously placed label rect', () => {
		const in_ = { ...base(),
			placed_label_rects: [{ x_min: 160, x_max: 175, y_min: 195, y_max: 205 }] };
		// anchor_1 at (170, 200) is INSIDE that rect, distance 0
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('fails when the candidate ANCHOR sits within 15 px of a previously placed anchor', () => {
		const in_ = { ...base(),
			placed_anchors: [{ x: 180, y: 200 }] };
		// anchor_1 at (170, 200) is 10 away from (180, 200), less than 15
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('fails when the candidate DIM LINE passes within 15 px of a previously placed label rect', () => {
		const in_ = { ...base(),
			placed_label_rects: [{ x_min: 195, x_max: 205, y_min: 210, y_max: 215 }] };
		// dim line from (170,200) to (230,200) is the horizontal line y=200; placed rect top is y=210; gap = 10 < 15
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('fails when the candidate DIM LINE passes within 15 px of a previously placed anchor', () => {
		const in_ = { ...base(),
			placed_anchors: [{ x: 200, y: 212 }] };
		// dim line is y=200 from x=170..230; anchor at (200, 212) is 12 perpendicular pixels away; less than 15
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('passes the symmetric checks when the placed obstacles are well away', () => {
		const in_ = { ...base(),
			placed_label_rects: [{ x_min: 500, x_max: 540, y_min: 500, y_max: 514 }],
			placed_anchors    : [{ x: 600, y: 600 }] };
		expect(candidate_passes_clearances(in_)).toBe(true);
	});

	it('fails when the candidate\'s two witness lines come within 15 px of each other', () => {
		// Bring the second witness's edge endpoint very close to the first witness.
		// Edge p1 is at (170, 250) → anchor_1 (170, 200): vertical line at x = 170.
		// Edge p2 at (180, 250) → anchor_2 (180, 200): vertical line at x = 180.
		// Distance between them = 10 px, which is less than 15.
		const in_ = { ...base(),
			candidate_edge_p2_screen: { x: 180, y: 250 },
			candidate_anchor_2      : { x: 180, y: 200 },
			candidate_label_rect    : { x_min: 175, x_max: 215, y_min: 193, y_max: 207 } };
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('passes when the two witness lines are at least 15 px apart', () => {
		// Same as base — witnesses are at x = 170 and x = 230, 60 px apart.
		expect(candidate_passes_clearances(base())).toBe(true);
	});
});

describe('Dimension_Placement — convex polygon helpers (silhouette hexagon)', () => {
	const square = [
		{ x:   0, y:   0 },
		{ x: 100, y:   0 },
		{ x: 100, y: 100 },
		{ x:   0, y: 100 },
	];
	const hexagon = [
		{ x:  50, y:   0 },
		{ x: 100, y:  30 },
		{ x: 100, y:  70 },
		{ x:  50, y: 100 },
		{ x:   0, y:  70 },
		{ x:   0, y:  30 },
	];

	it('point inside a square is detected', () => {
		expect(point_in_convex_polygon_2d({ x: 50, y: 50 }, square)).toBe(true);
	});
	it('point outside a square returns false', () => {
		expect(point_in_convex_polygon_2d({ x: 150, y: 50 }, square)).toBe(false);
	});
	it('point in the corner cut off by a hexagon returns false', () => {
		// (5, 5) sits inside the square but outside the hexagon (the hex
		// trims the corners of the square).
		expect(point_in_convex_polygon_2d({ x:   5, y:   5 }, hexagon)).toBe(false);
	});
	it('point in the center of the hexagon returns true', () => {
		expect(point_in_convex_polygon_2d({ x: 50, y: 50 }, hexagon)).toBe(true);
	});

	it('rectangle inside the polygon counts as intersecting', () => {
		const rect = { x_min: 40, x_max: 60, y_min: 40, y_max: 60 };
		expect(rect_intersects_convex_polygon_2d(rect, hexagon)).toBe(true);
	});
	it('rectangle far outside the polygon does not intersect', () => {
		const rect = { x_min: 200, x_max: 220, y_min: 200, y_max: 220 };
		expect(rect_intersects_convex_polygon_2d(rect, hexagon)).toBe(false);
	});
	it('rectangle in the cut corner of the hexagon (inside the bounding rectangle) does NOT intersect the hexagon', () => {
		const rect = { x_min: 1, x_max: 9, y_min: 1, y_max: 9 };
		// The rect sits in the corner the hexagon trims off the square.
		expect(rect_intersects_convex_polygon_2d(rect, hexagon)).toBe(false);
	});

	it('distance from rectangle to polygon is zero when they overlap', () => {
		const rect = { x_min: 40, x_max: 60, y_min: 40, y_max: 60 };
		expect(distance_from_rect_to_convex_polygon_2d(rect, hexagon)).toBe(0);
	});
	it('distance from rectangle to polygon equals the screen gap when they are separated', () => {
		// Square hexagon is at x_max = 100. Rect starts at x_min = 110, gap 10.
		const rect = { x_min: 110, x_max: 120, y_min: 40, y_max: 60 };
		expect(distance_from_rect_to_convex_polygon_2d(rect, square)).toBeCloseTo(10, 6);
	});
	it('distance from a corner-cut rectangle to the hexagon is positive', () => {
		// Rect sits in the trimmed corner of the hexagon — close to the
		// nearest hex edge but not touching it. Distance is small but > 0.
		const rect = { x_min: 1, x_max: 9, y_min: 1, y_max: 9 };
		const d = distance_from_rect_to_convex_polygon_2d(rect, hexagon);
		expect(d).toBeGreaterThan(0);
	});
});

describe('Dimension_Placement — evaluate_clearances (named filter rejection)', () => {
	// Same base as the boolean suite above. Each test forces one filter to
	// reject and confirms the returned name plus shortfall.
	const base = () => ({
		candidate_label_rect    : { x_min: 180, x_max: 220, y_min: 193, y_max: 207 } as const,
		candidate_anchor_1      : { x: 170, y: 200 },
		candidate_anchor_2      : { x: 230, y: 200 },
		candidate_edge_p1_screen: { x: 170, y: 250 },
		candidate_edge_p2_screen: { x: 230, y: 250 },
		silhouette              : [
			{ x:   0, y:   0 },
			{ x: 100, y:   0 },
			{ x: 100, y: 100 },
			{ x:   0, y: 100 },
		] as const,
		placed_label_rects      : [] as const,
		placed_anchors          : [] as const,
		placed_witness_segments : [] as const,
		placed_dim_segments     : [] as const,
		pair_clearance_px       : 15,
		silhouette_margin_px    : 15,
	});

	it('passes with ok:true when nothing is in the way', () => {
		const r = evaluate_clearances(base());
		expect(r.ok).toBe(true);
	});

	it('rejects with name silhouette when the label sits inside the silhouette rect', () => {
		const in_ = { ...base(),
			candidate_label_rect: { x_min: 30, x_max: 70, y_min: 30, y_max: 70 } };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('silhouette');
			expect(r.shortfall_px).toBe(15);
		}
	});

	it('rejects with name label-vs-label when the label rect is within 15 px of a placed label', () => {
		const in_ = { ...base(),
			placed_label_rects: [{ x_min: 230, x_max: 270, y_min: 193, y_max: 207 }] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-label');
			expect(r.shortfall_px).toBeCloseTo(5, 6);  // 15 - 10
		}
	});

	it('rejects with name label-vs-placed-anchor when a placed anchor sits within 15 px of the label rect', () => {
		const in_ = { ...base(),
			placed_anchors: [{ x: 225, y: 200 }] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-placed-anchor');
			expect(r.shortfall_px).toBeCloseTo(10, 6);  // 15 - 5
		}
	});

	// DISABLED pending visual review: filter 5 (label-vs-placed-witness)
	// was removed in Dimension_Placement.ts; this test still pins its
	// behaviour. If the filter is reinstated, drop the .skip.
	it.skip('rejects with name label-vs-placed-witness when a placed witness passes within 15 px of the label rect', () => {
		const in_ = { ...base(),
			placed_witness_segments: [[{ x: 200, y: 215 }, { x: 200, y: 300 }] as [{ x: number; y: number }, { x: number; y: number }]] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-placed-witness');
			expect(r.shortfall_px).toBeCloseTo(7, 6);  // 15 - 8
		}
	});

	it('rejects with name label-vs-placed-dim when a placed dim line passes within 15 px of the label rect', () => {
		const in_ = { ...base(),
			placed_dim_segments: [[{ x: 100, y: 215 }, { x: 300, y: 215 }] as [{ x: number; y: number }, { x: number; y: number }]] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-placed-dim');
			expect(r.shortfall_px).toBeCloseTo(7, 6);  // 15 - 8
		}
	});

	it('rejects with name own-anchor-vs-placed when a candidate anchor sits within 15 px of a placed label rect (label rect itself is clear)', () => {
		// Placed rect's right edge is exactly 15 px from the candidate label
		// (label rect distance check passes at 15) but only 5 px from the
		// candidate anchor — so own-anchor-vs-placed fires.
		const in_ = { ...base(),
			placed_label_rects: [{ x_min: 155, x_max: 165, y_min: 195, y_max: 205 }] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('own-anchor-vs-placed');
		}
	});

	it('rejects with name own-dim-vs-placed when the dim line passes within 15 px of a placed label rect (label rect and anchors are clear)', () => {
		// Long dim line so anchors are far from the obstacle. Obstacle sits
		// just below the dim line beyond the candidate label — close enough
		// for the dim line to fail by 9 px short, but x-clear of the label
		// rect by 20 px.
		const in_ = { ...base(),
			candidate_anchor_1 : { x: 50, y: 200 },
			candidate_anchor_2 : { x: 350, y: 200 },
			placed_label_rects: [{ x_min: 240, x_max: 280, y_min: 209, y_max: 217 }] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('own-dim-vs-placed');
			expect(r.shortfall_px).toBeCloseTo(6, 6);  // 15 - 9
		}
	});

	it('rejects with name own-witness-convergence when the two witness lines come within 15 px of each other', () => {
		const in_ = { ...base(),
			candidate_edge_p2_screen: { x: 180, y: 250 },
			candidate_anchor_2      : { x: 180, y: 200 },
			candidate_label_rect    : { x_min: 175, x_max: 215, y_min: 193, y_max: 207 } };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('own-witness-convergence');
			expect(r.shortfall_px).toBeCloseTo(5, 6);  // 15 - 10
		}
	});

	it('lists exactly the five label-rectangle filters as slide-eligible', () => {
		expect(SLIDE_ELIGIBLE_FILTERS.has('silhouette')).toBe(true);
		expect(SLIDE_ELIGIBLE_FILTERS.has('label-vs-label')).toBe(true);
		expect(SLIDE_ELIGIBLE_FILTERS.has('label-vs-placed-anchor')).toBe(true);
		expect(SLIDE_ELIGIBLE_FILTERS.has('label-vs-placed-witness')).toBe(true);
		expect(SLIDE_ELIGIBLE_FILTERS.has('label-vs-placed-dim')).toBe(true);
		expect(SLIDE_ELIGIBLE_FILTERS.has('own-anchor-vs-placed')).toBe(false);
		expect(SLIDE_ELIGIBLE_FILTERS.has('own-dim-vs-placed')).toBe(false);
		expect(SLIDE_ELIGIBLE_FILTERS.has('own-witness-convergence')).toBe(false);
	});

	it('sliding the label by the reported shortfall plus one pixel makes the candidate pass — simulating the slide-and-retry branch', () => {
		// Long dim line so anchors are far from the obstacle. Obstacle is a
		// placed label rect at (230-270, 215-229): just to the right of and
		// below the candidate label, far enough from the dim line and both
		// anchors to clear those filters. Distance from candidate label rect
		// to placed = sqrt(100 + 64) ≈ 12.81; shortfall ≈ 2.19. Sliding LEFT
		// along the dim line by 3.19 px clears the 15 px requirement.
		const in_ = { ...base(),
			candidate_anchor_1 : { x: 170, y: 200 },
			candidate_anchor_2 : { x: 470, y: 200 },
			placed_label_rects: [{ x_min: 230, x_max: 270, y_min: 215, y_max: 229 }] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-label');
			const shift = r.shortfall_px + 1;
			const shifted_rect = {
				x_min: in_.candidate_label_rect.x_min - shift,
				x_max: in_.candidate_label_rect.x_max - shift,
				y_min: in_.candidate_label_rect.y_min,
				y_max: in_.candidate_label_rect.y_max,
			};
			const retry = evaluate_clearances({ ...in_, candidate_label_rect: shifted_rect });
			expect(retry.ok).toBe(true);
		}
	});
});

describe('Dimension_Placement — min_distance_between_segments_2d', () => {
	it('zero when the two segments cross', () => {
		const a1 = { x: 0, y: 0 };
		const a2 = { x: 10, y: 10 };
		const b1 = { x: 0, y: 10 };
		const b2 = { x: 10, y: 0 };
		expect(min_distance_between_segments_2d(a1, a2, b1, b2)).toBeCloseTo(0, 6);
	});

	it('equals the parallel gap when both segments run side by side', () => {
		const a1 = { x: 0, y: 0 };
		const a2 = { x: 100, y: 0 };
		const b1 = { x: 0, y: 7 };
		const b2 = { x: 100, y: 7 };
		expect(min_distance_between_segments_2d(a1, a2, b1, b2)).toBeCloseTo(7, 1);
	});

	it('equals the closest endpoint pair when the segments are well separated', () => {
		const a1 = { x: 0, y: 0 };
		const a2 = { x: 5, y: 0 };
		const b1 = { x: 15, y: 0 };  // 10 px to the right of a2
		const b2 = { x: 20, y: 0 };
		expect(min_distance_between_segments_2d(a1, a2, b1, b2)).toBeCloseTo(10, 6);
	});

	it('returns the perpendicular gap exactly for long parallel segments — closed form, no sampling error', () => {
		// Two parallel segments, each 1000 pixels long, gap of 7 pixels.
		const a1 = { x: 0, y: 0 };
		const a2 = { x: 1000, y: 0 };
		const b1 = { x: 0, y: 7 };
		const b2 = { x: 1000, y: 7 };
		expect(min_distance_between_segments_2d(a1, a2, b1, b2)).toBeCloseTo(7, 6);
	});

	it('catches a near-touch that the old eleven-sample method would miss', () => {
		// First segment is 1000 long horizontally; second is a short vertical
		// dipping down to within 3 px of the first, centred at x=500. The old
		// sampling at every 100 px would never sample exactly x=500 and would
		// miss the close point. Closed form catches it.
		const a1 = { x: 0, y: 0 };
		const a2 = { x: 1000, y: 0 };
		const b1 = { x: 500, y: 3 };
		const b2 = { x: 500, y: 50 };
		expect(min_distance_between_segments_2d(a1, a2, b1, b2)).toBeCloseTo(3, 6);
	});
});

describe('Dimension_Placement — distance_point_to_segment_2d', () => {
	it('zero when the point is on the segment', () => {
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		const p = { x: 5, y: 0 };
		expect(distance_point_to_segment_2d(p, a, b)).toBeCloseTo(0, 6);
	});

	it('perpendicular distance when the projection lands inside the segment', () => {
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		const p = { x: 5, y: 4 };
		expect(distance_point_to_segment_2d(p, a, b)).toBeCloseTo(4, 6);
	});

	it('distance to the nearer endpoint when the projection lands past the segment', () => {
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		const p = { x: 20, y: 4 };
		// closest point is endpoint b at (10, 0); gap = hypot(10, 4) ≈ 10.77
		expect(distance_point_to_segment_2d(p, a, b)).toBeCloseTo(Math.hypot(10, 4), 6);
	});

	it('point-to-endpoint distance when the segment is degenerate', () => {
		const a = { x: 5, y: 5 };
		const b = { x: 5, y: 5 };
		const p = { x: 5, y: 9 };
		expect(distance_point_to_segment_2d(p, a, b)).toBeCloseTo(4, 6);
	});
});

describe('Dimension_Placement — segments_intersect_2d', () => {
	it('true when segments cross', () => {
		expect(segments_intersect_2d({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(true);
	});

	it('false when segments are parallel', () => {
		expect(segments_intersect_2d({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 })).toBe(false);
	});

	it('false when segments would cross only if extended past their endpoints', () => {
		expect(segments_intersect_2d({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 6, y: 0 }, { x: 7, y: 7 })).toBe(false);
	});
});

