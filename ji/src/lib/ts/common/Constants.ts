// single source of truth for entire UX

const bold = 550;
const common_size = 35;						// minimum fingertip touch size
const common_gap = common_size / 4.5;		// 7.8
const common_thickness = common_gap / 7;	// 5
const common_separator = common_gap / 5;	// 7
const control_height = common_size / 1.6;	// 21.875

// missing: 50% circles

export default class Constants {
	// The empty string, said once so nothing has to write two quote marks and mean something by it.
	empty = '';

	cursor_default = 'default';

	// How often something happens on its own, in milliseconds. ⟵ov
	timeout = {
		drift		 : 1000,					// how often the hits manager asks whether what it holds has gone stale
	};

	// How long the mouse has to do a thing before it counts as that thing, in milliseconds. ⟵ov
	threshold = {
		autorepeat	 : 150,						// between one repeat and the next, while a press is held
		double_click : 400,						// how long a second press has to arrive within
		alteration	 : 500,						// between one flip and the next, while something blinks
		long_click	 : 600,						// how long a press has to be held to be a long one
	};

	font = {
		credit		 : common_size * 0.25,		// 8.75
		label		 : common_size * 0.35,		// 12.25
		base		 : common_size * 0.375,		// 13.13
		banner		 : common_size * 0.4,		// 14
		large		 : common_size * 0.5,		// 17.5
		huge         : common_size * 0.63,		// 24.5
		em           : {
			tracking : 0.03,			// em — the banner letter-spacing
			small	 : 1.4,
			big		 : 8,
		},
		weight       : {
			normal	 : bold,			// 550 — body + controls
			banner	 : bold + 100,		// 650 — the collapsible banner
			title	 : bold + 200,		// 750 — the popup title
		},
	};
	pad = {
		hamburger	 : { y: 2, x: 6 },
		stepper		 : { y: 0, x: 4 },
		control		 : { top: 1, bottom: 3, x: 10 },		// top-light: lifts control text ~2px off the low baseline
		modal		 : { y: 16, x: 20 },
		view		 : { top: 52, x: 24 },
		cell		 : { y: common_gap / 2, x: common_gap },		// left is 0
	};

	radius = {
		corner		 : {
			banner	 : common_size / 3.5,
			build	 : common_size / 3,
			main	 : common_size / 2,			// also for Add drop box
			pill	 : 999,
		},
		percent		 : 50,
	};

	width = {
		modal	 	 : common_size * 17.3,
		details		 : common_size * 7,
		window		 : 350,
		operations   : 300,
	};

	layer = {
		frontmost    : 3,
		controls	 : 2,
		hideable	 : 1,
		common		 : 0,
	};

	gap = {
		huge         : common_gap * 4,
		fat	         : common_gap * 2.1,		// 16.33 — the wider gap around a line carrying something at its middle
		small		 : common_gap / 1.5,
		tight		 : common_gap / 2,
		details		 : common_gap / 4,
		normal       : common_gap,				// 7.78  — the ordinary gap between two sections
	}

	inset = {
		popup		 : { edge: common_size * 0.3,    side: common_size * 0.375 },		// 10.5, 13.13
		pill		 : { top: common_size * 0.48,    left: common_size * 1.6 },			// 16.8, 56
		credit		 : { bottom: common_size * 0.35, left: common_size * 0.35 },		// 12.25, 15.75
		cluster		 : common_size / 4,												// 8.75
	};

	thickness = {
		huge		 : common_gap,				// 7.78 — the heavy line, the one a stack draws between its sections
		bold		 : common_thickness * 1.5,
		fat			 : common_thickness * 2,
		faint		 : common_thickness / 2,
		normal		 : common_thickness,
	};

	separator = {
		normal : common_separator,
		fat    : common_separator * 2,
		huge   : common_separator * 4,
	};

	height = {
		// 24.11 — a folded section's own line to the next one, always. The two half gaps around
		// the fold come out of it, so it can never be smaller than the widest pair's spacing on
		// any screen here: gap.fat 16.33 + thickness.huge 7.78, which is what this is. Below that
		// a fold's height comes out negative, the browser draws it at nothing, and that one pair
		// reads wider than every other — which looks like a spacing fault and is not.
		small		 : common_gap * 3.1,
		hideable	 : control_height * 1.3,
		banner		 : common_size * 1.2,
		control		 : control_height,
	};

	size = {
		svg			 : control_height * 0.9,	// the shared drawn-cross size
		button		 : common_size / 1.25,
		hamburger	 : common_size * 0.7,
		cross	  	 : control_height,
	};

	shadow = {
		y			 : 2,
		blur		 : 8,
		ink			 : 20,		// % of --black mixed into the drop shadow
	};

	opacity = {
		drop		 : 0.6,		// the faded drop-here prompt
		header		 : 0.7,		// the muted table header
		label		 : 0.8,		// the preferences label
	};

	table = {
		date		 : 120,
		build		 : 50,
	};

	margin = {
		header		 : common_gap * 1.7,
	};

	svg = {
		cross		 : common_size / 1.4,
	};

	paging = {
		notes   	 : 10,
	};
}

export const k = new Constants();

