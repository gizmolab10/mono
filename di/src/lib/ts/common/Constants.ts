declare const __BUILD_NOTES__: Array<{ build: number; date: string; note: string }>;
declare const __BUILD_NUMBER__: number;
declare const __ASSETS_DIR__: string;


export default class Constants {

	details_margin = 0;
	halfIncrement = 0.5;
	printer_aspect_ratio = 11.69 / 8.27;
	cursor_default = 'default';
	corrupted = 'corrupted';
	unknown = 'unknown';
	newLine = '\n';
	wildcard = '*';
	comma = ',';
	quote = '"';
	space = ' ';
	empty = '';
	tab = '\t';

	coplanar_epsilon = 1e-3;

	ratio = {
		zoom_out: 0.9,
		zoom_in:  1.1
	};

	separator = {
		generic: '::',
		small:	 ':::',
		big:	 '::::',
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
			banners: 2.5,
			details: 0.75,
		},
	};

	build_notes = __BUILD_NOTES__;
	build_number = __BUILD_NUMBER__;
	assets_directory = __ASSETS_DIR__;

}

export const k = new Constants();
