declare const __BUILD_NOTES__: Array<{ build: number; date: string; note: string }>;
declare const __BUILD_NUMBER__: number;
declare const __ASSETS_DIR__: string;

// ─── Design token source of truth ────────────────────────────────────────────
//
// Constants is the single origin for all layout measurements, z-index values,
// timing thresholds, and structural geometry. Everything derives from
// `common_size` so the whole UI scales from one number.
//
// Topology:
//   Constants.ts (k.*)
//     → App.svelte onMount: root.setProperty('--x', k.x)
//       → scoped <style> blocks: var(--x)
//         + inline style: only for values that change at runtime
//
// Rule: if it's a static design token, it lives here and flows through CSS vars.
//       if it changes at runtime (computed from JS state), it stays inline.
//
// ─────────────────────────────────────────────────────────────────────────────

const common_size = 33;		// minimum fingertip touch size

export default class Constants {

	debug = {
		show_facets      : false,   // master switch for facet pipeline (false = mothballed)
		show_ep_labels   : false,
		facets_logged    : false,
		merge_logged     : false,
		trace_logged     : false,
		clip_debug       : false,
		diagnose_dims    : true,
		last_label_log   : '',
		last_facet_log   : '',
	};

	assets_directory = __ASSETS_DIR__;
	build_number = __BUILD_NUMBER__;
	build_notes = __BUILD_NOTES__;

	halfIncrement = 0.5;
	coplanar_epsilon = 1e-3;
	printer_aspect_ratio = 11.69 / 8.27;
	cursor_default = 'default';
	unknown = 'unknown';
	newLine = '\n';
	wildcard = '*';
	comma = ',';
	quote = '"';
	space = ' ';
	empty = '';
	tab = '\t';

	ratio = {
		zoom_out: 0.9,
		zoom_in:  1.1
	};

	corner = {
		input: 2,
		box:   4,
	};

	z = {
		common:    0,
		layout:    1,
		action:    2,
		frontmost: 3,
	};

	threshold = {
		autorepeat:	  150,
		double_click: 400,
		alteration:	  500,
		long_click:	  800,
	};

	gap = {
		tiny:  Math.round(common_size / 7),
		small: Math.round(common_size / 5.5),
		main:  Math.round(common_size / 5),
		large: Math.round(common_size / 3.3),
	};

	radius = {
		main:	 Math.round(common_size * 0.6),
		common:  Math.round(common_size / 2),
		content: Math.round(common_size / 3),
		table:   Math.round(common_size / 6),
		box:     Math.round(common_size / 8),
		input:   Math.round(common_size / 16),
	};

	layout = {
		margin:         Math.round(common_size / 3.2),
		padding_small:  Math.round(common_size / 4),
		padding:        Math.round(common_size / 3),
		letter_spacing: 0.5,
		extra: {
			main:       Math.round(common_size / 5),    // same as gap
			content:    Math.round(common_size / 3.2),	// same as margin
		}
	};

	thickness = {
		separator: {
			content: Math.round(common_size / 15),
			banners: Math.round(common_size / 9),
			main:	 Math.round(common_size / 5),
		},
		thumb:       Math.round(common_size / 6),
		track:       Math.round(common_size / 8),
		border:      0.5,
		bold:        2.5,
		tick:        1,
	};

	width = {
		wrap_mobile    : 1150,
		wrap_phone     : 590,
		window_min     : 400,
		details        : 350,
		title          : 120,
		small          : 16,
		indent         : 12,
		// Approximate widths of the two on-canvas neighbors of the status strip
		// at the bottom of the graph. Used to compute the strip's left and right
		// offsets so it sits between them with one layout gap on each side.
		build_button   : 80,
		guides_slider  : 40,
	};

	height = {
		controls:    Math.round(common_size * 1.1),
		slider:      Math.round(common_size * 0.9),
		collapse:    Math.round(common_size * 0.56),
		cell:        Math.ceil (common_size * 0.5),
		banner:      common_size,
		font: {
			tiny:    Math.round(common_size / 4),
			reset:   Math.round(common_size / 2.75),
			small:   Math.round(common_size / 2.5),
			large:   Math.round(common_size / 1.5),
			common:  Math.round(common_size / 2),
			huge:    Math.round(common_size),
			monster: Math.round(common_size * 1.5),
		},
		button: {
			small:   Math.round(common_size * 0.8),
			tiny:    Math.round(common_size * 0.7),
			common:  common_size,
		},
	};

	dimensions = {
		FORBIDDEN_CAM_DOT        : 0.866,
		WITNESS_LEN_MAX_PX       : 300,
		WITNESS_CAP_PX           : 200,
		WITNESS_INDEX_CAP        : 6,
		/** Absolute dot threshold below which the dim's flat plane is
		 *  considered edge-on to the camera and rejected by filter 0.
		 *  0.174 corresponds to within about ten degrees of edge-on. */
		EDGE_ON_DOT_THRESHOLD    : 0.174,
		EXCLUDED_FACE_ANGLE_DEG  : 20,
		EXCLUDED_BACK_FACE_ANGLE_DEG : 45,
		SLIDABLE_OVERHANG_PX     : 20,
		SILHOUETTE_MARGIN_PX     : 15,
		/** Buffer pixels the label rectangle must leave between itself and
		 *  either witness anchor along the dim line (rule 1 item 4 + rule 10).
		 *  Forbidden zone around witness 1: slidable in [-Y - label_w/2, Y + label_w/2].
		 *  Forbidden zone around witness 2: same shape, centered on dim_line_length. */
		WITNESS_ANCHOR_BUFFER_PX : 20,
		/** Cap on the clearance term used in scoring. Past this, additional
		 *  clearance doesn't matter for ranking — the between bonus and the
		 *  centering parabola get to differentiate. */
		CLEARANCE_SCORE_CAP_PX   : 2000,
		/** Maximum centering penalty (score units), reached at the witness
		 *  anchors. Zero at the midpoint between the witnesses. A parabola
		 *  in between. Higher values pull the label more strongly toward
		 *  the midpoint. Rule 10. */
		CENTERING_MAX_PX         : 250,
		/** Bonus added to a candidate's score when its dim-line direction
		 *  came from a front-facing adjacent face (the face whose normal
		 *  points toward the camera). Tilts the search toward placing
		 *  dimensions on the visible side of a part. Rule 10. */
		FRONT_FACE_BONUS         : 300,
		/** Score penalty per pixel of witness length beyond the minimum.
		 *  Biases the search toward SHORT witnesses when clearance is
		 *  otherwise equal — without this, the search picks the maximum
		 *  witness length and labels float far from the part. */
		WITNESS_LENGTH_PENALTY_PER_PX : 2,
		NEIGHBOUR_GRID_CELL_PX   : 50,
		WITNESS_CLEARANCE_PX     : 15,
		PAIR_CLEARANCE_PX        : 5,
		/** Continuous-DOF grid resolution per (edge, direction) pair. 5 × 5 = 25
		 *  candidates per pair, per rule 23's continuous-optimization step. */
		GRID_RESOLUTION          : 5,
		PERSISTENCE_TOLERANCE_PX : 2,	// Persistence with 2-pixel tolerance (rule 19)
		WITNESS_GAP_FROM_PART_PX : 5,
	};

}

export const k = new Constants();
