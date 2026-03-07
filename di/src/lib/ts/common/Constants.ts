declare const __BUILD_NOTES__: Array<{ build: number; date: string; note: string }>;
declare const __BUILD_NUMBER__: number;
declare const __ASSETS_DIR__: string;

const common_height = 20;

export default class Constants {

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

	threshold = {
		autorepeat:	  150,
		double_click: 400,
		alteration:	  500,
		long_click:	  800,
	};

	thickness = {
		separator: {
			main:	 5,
			banners: 3,
			content: 2,
		},
		tick:        1,
		track:       4,
	};

	z = {
		common:    0,
		layout:    1,
		action:    2,
		frontmost: 3,
	};

	layout = {
		gap:     4,
		margin:  8,
		padding: 7,
	};

	height = {
		controls:       common_height + 12,
		banner:         common_height,
		button_common:  common_height,
		button_segment: 16,
		font_common:    11,
		collapse:       12,
		slider:         14,
		thumb:           8,
		cell:           10,
	};

	corner = {
		common: common_height / 2,
		banner: common_height / 2,
		box:     4,
	};

	build_notes = __BUILD_NOTES__;
	build_number = __BUILD_NUMBER__;
	assets_directory = __ASSETS_DIR__;

}

export const k = new Constants();
