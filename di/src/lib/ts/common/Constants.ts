declare const __BUILD_NOTES__: Array<{ build: number; date: string; note: string }>;
declare const __BUILD_NUMBER__: number;
declare const __ASSETS_DIR__: string;

const common_size = 33;

export default class Constants {

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
		wrap_mobile : 1190,
		wrap_phone  : 770,
		details     : 350,
	};

	corner = {
		common: common_size / 2,
		banner: common_size / 2,
		box:    4,
	};

	layout = {
		gap:     common_size / 5,
		padding: common_size / 3,
		margin:  common_size / 3.2,
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
			banners: common_size / 6,
			main:	 common_size / 5,
		},
		tick:        1,
		track:       4,
		thumb:       common_size / 4,
	};

	height = {
		collapse:    common_size / 2 + 2,
		controls:    common_size * 1.4,		// add two gaps
		slider:      common_size - 6,
		cell:        common_size / 2,
		banner:      common_size,
		font: {
			small:   common_size / 2.5,
			large:   common_size / 1.5,
			common:  common_size / 2,
		},
		button: {
			small:   common_size - 6,
			segment: common_size,
			common:  common_size,
		},
	};

}

export const k = new Constants();
