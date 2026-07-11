
export const common_size = 35;				// minimum fingertip touch size

// missing: 50% circles

export default class Constants {
	width = {
		hamburger	 : common_size,
		phone		 : 620,
		modal	 	 : 600,
		window		 : 400,
		details		 : 350,
		cross	  	 : 22,
		page	   	 : 10,
	};
	radius = {
		corner		 : {
			banner	 : common_size / 3.5,
			build	 : common_size / 3,
			main	 : common_size / 2,		// also for Add drop box
			pill	 : 999,
		},
		percent		 : 50,
	};
	layer = {
		intersection : 10,
		controls	 : 5,
		hideable	 : 1,
		common		 : 0,
	};
	height = {
		banner		 : common_size * 1.2,
		hideable	 : common_size * 0.8,
		build		 : common_size / 1.6,
		pill		 : common_size / 2,
	};
	gap = {
		preferences	 : common_size / 2.1,
		intersection : common_size / 5,
		details		 : 2,
	}
	size = {
		button		 : common_size / 1.25,
	};
}

export const k = new Constants();

