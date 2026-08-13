// single source of truth for entire UX

const bold = 550;
const common_size = 35;						    // minimum fingertip touch size
const common_gap = common_size / 4.5;		    // 7.8
const common_font = common_size / 2.7;		    // 13
const common_thickness = common_gap / 7;	    // 5
const control_height = common_size / 1.6;	    // 21.875

// missing: 50% circles

// One ladder for every type: micro, faint, tiny, small, normal, big, fat, huge, pill.
// A type simply leaves out any step it has no use for.

export default class Constants {
	// How long something takes to move, in milliseconds. One place says it, so a pill growing and
	// the rows below it shifting are one movement rather than two that happen to look alike.
	timeout = {
		slide		 : 700,						// a tag area growing or shrinking
		rest		 : 300,						// how long after it arrives before it reacts to user
		rows		 : 200,						// the pills taking a row of their own, or giving one back
		fade		 : 200,						// something arriving or leaving its position
		hover		 : 333,						// a fill arriving or leaving under the cursor — a third of a second
		asking		 : 1500,					// how often the dispatcher is asked again while it is down
	};

	// How long the mouse has to do a thing before it counts as that thing, in milliseconds. ⟵di
	threshold = {
		autorepeat	 : 150,						// between one repeat and the next, while a press is held
		double_click : 400,						// how long a second press has to arrive within
		alteration	 : 500,						// between one flip and the next, while something blinks
		long_click	 : 800,						// how long a press has to be held to be a long one
	};

	// The empty string, said once so nothing has to write two quote marks and mean something by it.
	empty = '';

	cursor_default = 'default';

	font = {
		faint		 : common_font * 0.7,		// 8.75 — the credit line
		tiny		 : common_font * 0.8,		// 10.4 — labels
		small		 : common_font * 0.9,		// 11.7 — controls
		normal		 : common_font,				// 13 — body
		big			 : common_font * 1.1,		// 14 — the collapsible banner
		fat			 : common_font * 1.4,		// 17.5
		huge		 : common_font * 1.9,		// 24.5
		em           : {
			tiny	 : 0.03,					// em — the banner letter-spacing
			small	 : 1.4,
			normal	 : 2,						// the setting-up words, shown before anything else
			big		 : 8,
		},
		weight       : {
			normal	 : bold,					// 550 — body + controls
			big		 : bold + 100,				// 650 — the collapsible banner
			huge	 : bold + 200,				// 750 — the popup title
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

	inset = {
		popup		 : { edge: common_size * 0.3,    side: common_size * 0.375 },		// 10.5, 13.13
		pill		 : { top: common_size * 0.48,    left: common_size * 1.6 },			// 16.8, 56
		credit		 : { bottom: common_size * 0.35, left: common_size * 0.35 },		// 12.25, 15.75
		cluster		 : common_size / 4,													// 8.75
		numbers		 : common_gap * 2.4,												// where the right edge of every row number stands, from the page's left edge
		list		 : 15,																// how far a list steps its items in; the browser's own is 40
	};

	radius = {
		corner		 : {
			tiny	 : common_size / 3.5,		// 10 — the collapsible banner
			small	 : common_size / 3,			// 11.67 — the build notes
			normal	 : common_size / 2,			// 17.5 — also for Add drop box
			pill	 : 999,
		},
		percent		 : 50,
	};

	// Smallest first, so the list itself reads as a ladder.
	width = {
		small		 : common_size * 7,			// 245 — the details column
		normal		 : 300,						// the window
		big			 : 350,						// the smallest useful width for the region beside details
		fat			 : common_size * 17.3,		// 605.5 — the modal
	};

	layer = {
		frontmost    : 3,
		controls	 : 2,
		hideable	 : 1,
		common		 : 0,
	};

	gap = {
		huge		 : common_gap * 5,			// 38.89 — how far a bar's word is held off the left end
		fat	         : common_gap * 2.1,		// 16.33
		big			 : common_gap * 1.25,		// 9.72 — a normal gap and a faint one
		normal       : common_gap,				// 7.78
		small		 : common_gap / 1.8,		// 4.32
		tiny		 : common_gap / 2,			// 3.89
		faint		 : common_gap / 4,			// 1.94
		micro		 : common_gap / 6,			// 1.3 — the hairline between a double border's two edges
	}

	// Every drawn line, whether an edge or a separator.
	thickness = {
		huge		 : common_gap,				// 7.78 — the separator between sections
		fat			 : common_thickness * 3,	// 3.33
		big			 : common_thickness * 1.5,	// 1.67
		normal		 : common_thickness,		// 1.11
		small        : 0.75,					// the edge every clickable is drawn with; said flat, not from the ladder
		faint		 : common_thickness * 0.5,	// 0.56
	};

	// Smallest first, the same as the widths.
	height = {
		small        : control_height * 0.1,	// 15.31 — one row of the words: a blank line, a rule
		normal		 : control_height,			// 21.88 — one control
		big			 : control_height * 1.3,	// 28.44 — a row that can be hidden
		fat			 : common_size	  * 1.2,	// 42 — the banner
	};

	size = {
		small		 : control_height * 0.9,	// 19.69 — the shared drawn-cross size
		pointer		 : control_height * 0.945,	// 20.67 — the soft pointer beside a heading
		normal		 : control_height,			// 21.88 — one control
		big			 : common_size * 0.7,		// 24.5 — the hamburger
		fat			 : common_size / 1.25,		// 28 — a round button
	};

	margin = {
		header		 : common_gap * 1.7,		// 13.22
	};

	svg = {
		cross		 : common_size / 1.4,		// 25
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

	paging = {
		notes   	 : 10,
	};
}

export const k = new Constants();
