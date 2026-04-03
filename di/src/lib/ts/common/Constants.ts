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
		last_label_log   : '',
		last_facet_log   : '',
		occlusion_logged : false,
		facets_logged    : false,
		merge_logged     : false,
		trace_logged     : false,
		clip_debug       : false,
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

	width = {
		wrap_mobile : 1100,
		wrap_phone  : 610,
		window_min  : 360,
		details     : 350,
	};

	corner = {
		common: common_size / 2,
		banner: common_size / 2,
		input:  2,
		box:    4,
	};

	layout = {
		gap_tiny:       common_size / 7,
		gap_small:      common_size / 5.5,
		gap:            common_size / 5,
		gap_large:      common_size / 5 * 1.5,
		padding_small:  common_size / 4,
		padding:        common_size / 3,
		margin:         common_size / 3.2,
		letter_spacing: 0.5,
		extra: {
			main:       common_size / 5,    // same as gap
			content:    common_size / 3.2,	// same as margin
		}
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

	thickness = {
		separator: {
			content: common_size / 10,
			main:	 common_size / 5,
		},
		thumb:       common_size / 6,
		track:       common_size / 8,
		border:      0.5,
		tick:        1,
	};

	radius = {
		content: common_size / 3,
		main:	 common_size * 0.6
	};

	height = {
		controls:    common_size * 1.4,
		slider:      common_size * 0.8,
		collapse:    common_size * 0.56,
		cell:        common_size * 0.5,
		banner:      common_size,
		font: {
			edit:    common_size / 2.75,
			small:   common_size / 2.5,
			large:   common_size / 1.5,
			common:  common_size / 2,
		},
		button: {
			small:   common_size * 0.8,
			tiny:    common_size * 0.7,
			segment: common_size,
			common:  common_size,
		},
	};

}

export const k = new Constants();
