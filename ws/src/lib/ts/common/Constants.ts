import { Size, Point } from '../types/Coordinates';

const dot_size = 14;
const row_height = 16;
const rubberband_thickness = 1;
const tiny_outer_dots_expansion = 6;
const tiny_outer_dots_diameter = dot_size + tiny_outer_dots_expansion;

export default class Constants {

	details_margin = 0;
	halfIncrement = 0.5;
	separator_title_left = 0;
	hid_unknown = 1000000000000;
	radial_widget_inset = dot_size + 14;
	printer_aspect_ratio = 11.69 / 8.27;
	prevent_selection_style = '-webkit-user-select: none; user-select: none; -moz-user-select: none';
	nothing_to_show = 'Please select something to show here';
	name_bulkAdmin = 'Jonathan Sand';
	cursor_default = 'default';
	corrupted = 'corrupted';
	unknown = 'unknown';
	root = 'root';
	empty_id = '""';
	newLine = '\n';
	wildcard = '*';
	comma = ',';
	quote = '"';
	space = ' ';
	empty = '';
	tab = '\t';

	dasharray = {
		relateds: '4,3',
		editing:  '3,2',
	};

	width = {
		details:  219,
		child_gap: 20,
	};

	help_url = {
		local:  'http://localhost:8000/README.html',
		remote: 'https://help.webseriously.org',
	};

	title = {
		default: 'Please, enter a title',
		line:	 '------------------------',
	};

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
	
	tiny_outer_dots = {
		diameter:	tiny_outer_dots_diameter,
		expansion:	tiny_outer_dots_expansion,
		size:		Size.square(tiny_outer_dots_diameter),
		offset:		Point.square(-tiny_outer_dots_expansion).offsetByXY(4.2, 5),
		viewBox:	`0.5 2.35 ${tiny_outer_dots_diameter} ${tiny_outer_dots_diameter}`,	
	};

	radius = {
		text_area_border:  7,
		arcSlider_cap: 	   7.5,
		ring_minimum:  	  55,
		fillets: { 
			thick:	   	  14,
			thin:		   8,
			ultra_thin:	   5,
		},
	};

	height = {
		separator: 7,
		empty:	   22,
		line:	   row_height + 2,
		segmented: row_height + 1,
		row:	   row_height,
		controls:  16,
		button:	   dot_size + 3,
		dot:	   dot_size,
	};

	font_size = {
		cluster_slider:	  dot_size - 5,
		instructions: dot_size - 4,
		separator:	  dot_size - 4,
		details:	  dot_size - 3,
		banners:	  dot_size - 2,
		info:		  dot_size - 1,
		common:		  dot_size,
		segmented:	  dot_size + 1,
		warning:	  dot_size + 2,
		tree_prefs:	  36,
	};

	thickness = {
		stroke:		 0.7,
		rubberband:	 rubberband_thickness,
		radial: {
			ring:	 44,
			arc:	 15,
			fork:	 2.5,
		},
		separator: {
			main:	 5,
			banners: 2.5,
			details: 0.75,
		},
	};

	opacity = {
		none:		  0,
		faint:		  0.1,
		light:		  0.2,
		medium:		  0.4,
		dark:		  0.7,
		cluster: {
			faint:	  0.02,
			armature: 0.1,
			thumb:	  0.1,
			hover:	  0.7,
			titles:	  1,
			active:	  0.3,
		},
	};
}

export const k = new Constants();
