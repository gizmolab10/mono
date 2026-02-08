declare const __BUILD_NOTES__: Array<{ build: number; date: string; note: string }>;
declare const __BUILD_NUMBER__: number;


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

	ratio = {
		zoom_out: 0.9,
		zoom_in:  1.1
	};

	separator = {
		generic: '::',
		small:	 ':::',
		big:	 '::::',
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

}

export const k = new Constants();
