// DO NOT change the order of the following

export enum T_Startup {
	start,
	fetch,
	empty,
	ready,
}

export enum T_Layer {
	common,
	hideable,
	action,
	frontmost,
}

export enum T_Hit_3D {
	corner,
	edge,
	face,
	dimension,
	angle,
	face_label,
	none,
}

// the order of the following is unimportant

export enum T_Details {
	preferences          = 1,
	selection            = 2,
	library              = 4,
	standard_dimensions  = 8,
	list                 = 16,
}

export enum T_Decorations {
	none       = 0,
	dimensions = 1,
	angles     = 2,
	names      = 4,
}

export enum T_Units {
	imperial = 'imperial',
	metric   = 'metric',
	marine   = 'marine',
	archaic  = 'archaic',
}

export enum T_Editing {
	none,
	value,
	angles,
	formula,
	dimension,
	face_label,
	details_name,
}

export enum T_Unit {
	// imperial
	inch			= 'inch',
	foot			= 'foot',
	yard			= 'yard',
	mile			= 'mile',
	// metric
	angstrom		= 'angstrom',
	nanometer		= 'nanometer',
	micrometer		= 'micrometer',
	millimeter		= 'millimeter',
	centimeter		= 'centimeter',
	meter			= 'meter',
	kilometer		= 'kilometer',
	// marine
	fathom			= 'fathom',
	nautical_mile	= 'nautical_mile',
	// archaic
	hand			= 'hand',
	span			= 'span',
	cubit			= 'cubit',
	ell				= 'ell',
	rod				= 'rod',
	perch			= 'perch',
	chain			= 'chain',
	furlong			= 'furlong',
	league			= 'league',
}

export enum T_File_Operation {
	import = 'import',	// persist
	export = 'export',	// fetch
}

export enum T_Persistable {
	access		  = 'Access',
	users		  = 'Users',
	tags		  = 'Tags',
}

export enum T_File_Extension {
	seriously = 'seriously',
	cancel	  = 'cancel',
	json	  = 'json',
	csv		  = 'csv',
}

export enum T_Drag {
	rubberband = 'rubberband',	// selecting widgets
	widget	   = 'widget',		// drag and drop
	graph	   = 'graph',		// repositioning the graph
	none	   = 'none',
}

export enum T_Mouse_Detection {
	autorepeat = 4,
	doubleLong = 3,
	double	   = 1,
	long	   = 2,
	none	   = 0,
}

export enum T_Signal {
	alteration	 = 'alteration',
	reposition	 = 'reposition',	// only for widgets
	reattach	 = 'reattach',
	rebuild		 = 'rebuild',
	thing		 = 'thing',
}

export enum T_Control {
	details	 = 'show details view',
	builds	 = 'show build notes',
	recents	 = 'recents',
	import	 = 'import',
	search	 = 'search',
	shrink	 = 'shrink',
	grow	 = 'grow',
	help	 = '?',
}

export enum T_Browser  {
	explorer = 'explorer',
	unknown  = 'unknown',
	firefox	 = 'firefox',
	chrome	 = 'chrome',
	safari	 = 'safari',
	opera	 = 'opera',
	orion	 = 'orion',
}

export enum T_Image_Extension {
	jpeg   = 'jpeg',
	webp   = 'webp',
	jpg    = 'jpg',
	gif    = 'gif',
	png    = 'png',
	svg    = 'svg',
}

export enum T_Text_Extension {
	svelte = 'svelte',
	html   = 'html',
	json   = 'json',
	css    = 'css',
	csv    = 'csv',
	txt    = 'txt',
	js     = 'js',
	md     = 'md',
	sh     = 'sh',
	ts     = 'ts',
}

export enum T_Hit_Target {
	rubberband	= 'rubberband',
	database	= 'database',
	resizing	= 'resizing',
	rotation	= 'rotation',
	details		= 'details',
	control		= 'control',
	widget		= 'widget',
	reveal		= 'reveal',
	action		= 'action',
	button		= 'button',
	cancel		= 'cancel',
	paging		= 'paging',
	search		= 'search',
	drag		= 'drag',
	glow		= 'glow',
	line		= 'line',
	none		= 'none',
}

export enum T_Preference {
	other_databases	  = 'other_databases',
	detail_types	  = 'detail_types',			// shown in details view, vertical stack
	show_details	  = 'show_details',			// left side
	user_offset		  = 'user_offset',
	auto_adjust		  = 'auto_adjust',
	search_text		  = 'search_text',
	background		  = 'background',
	auto_save		  = 'auto_save',
	font_size		  = 'font_size',
	separator		  = 'separator',
	base_id			  = 'base_id',
	details			  = 'details',				// visible details control
	grabbed			  = 'grabbed',
	search 			  = 'search',
	graph			  = 'graph',
	scale			  = 'scale',
	local			  = 'local',
	font			  = 'font',
	db				  = 'db',
}
