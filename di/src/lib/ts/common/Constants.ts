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

	radius = {
		main:	 Math.round(common_size * 0.6),
		content: Math.round(common_size / 3),
		table:   Math.round(common_size / 6),
	};

	corner = {
		common: Math.round(common_size / 2),
		banner: Math.round(common_size / 2),
		input:  2,
		box:    4,
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
		wrap_mobile    : 1570,
		wrap_phone     : 720,
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
		slider:      Math.round(common_size * 0.8),
		collapse:    Math.round(common_size * 0.56),
		cell:        Math.ceil(common_size * 0.5),
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

}

export const k = new Constants();
