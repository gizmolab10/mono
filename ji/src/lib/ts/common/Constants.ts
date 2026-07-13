
const common_size = 35;				// minimum fingertip touch size
const common_gap = common_size / 5;
const common_thickness = common_gap / 7;
const control_height = common_size / 1.6;
const bold = 550;					// single source of truth about bold

// missing: 50% circles

export default class Constants {
	font = {
		credit		 : common_size * 0.25,		// 8.75
		label		 : common_size * 0.35,		// 12.25
		base		 : common_size * 0.375,		// 13.13
		banner		 : common_size * 0.4,		// 14
		large		 : common_size / 2,			// 17.5
		em : {
			tracking : 0.03,			// em — the banner letter-spacing
			small	 : 1.4,
			big		 : 8,
		},
		weight : {
			normal	 : bold,			// 550 — body + controls
			banner	 : bold + 100,		// 650 — the collapsible banner
			title	 : bold + 200,		// 750 — the popup title
		},
	};
	pad = {
		slot		 : 8,
		hamburger	 : { y: 2, x: 6 },
		stepper		 : { y: 0, x: 4 },
		control		 : { y: 2, x: 10 },
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
		phone		 : 620,
		modal	 	 : 600,
		window		 : 400,
		details		 : 350,
		page	   	 : 10,
	};
	layer = {
		intersection : 10,
		controls	 : 5,
		hideable	 : 1,
		common		 : 0,
	};
	height = {
		banner		 : common_size * 1.2,
		hideable	 : control_height * 1.3,
		control		 : control_height,
	};
	gap = {
		preferences	 : common_gap * 2.1,
		tight		 : common_gap / 2,
		details		 : common_gap / 4,
		intersection : common_gap,
	}
	inset = {
		cluster		 : common_size * 0.25,												// 8.75
		pill		 : { top: common_size * 0.48,    left: common_size * 1.6 },			// 16.8, 56
		popup		 : { edge: common_size * 0.3,    side: common_size * 0.375 },		// 10.5, 13.13
		credit		 : { bottom: common_size * 0.35, left: common_size * 0.45 },		// 12.25, 15.75
	};
	thickness = {
		bold		 : common_thickness * 1.5,
		fat			 : common_thickness * 2,
		faint		 : common_thickness / 2,
		normal		 : common_thickness,
	};
	size = {
		button		 : common_size / 1.25,
		cross	  	 : control_height,
		hamburger	 : common_size,
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
		build		 : 50,
		date		 : 120,
	};
	margin = {
		header		 : common_gap * 1.7,
	};
	svg = {
		cross		 : common_size / 1.4,
	};
}

export const k = new Constants();

