// DO NOT change the order of the following

export enum T_Order {	// need two orders, so .... ???
	child,
	other,
}

export enum T_Banner {
	controls,
	graph,
	crumbs,
}

export enum T_Startup {
	start,
	fetch,
	empty,
	ready,
}

export enum T_Search {
	off,
	enter,
	results,
	selected,
}

export enum T_Detail {
	header,
	actions,
	selection,
	tags,
	traits,
	preferences,
	data,
}

export enum T_Action {
	browse,
	focus,
	show,
	center,
	add,
	delete,
	move,
}

export enum T_Layer {
	common,
	graph,
	paging,
	ring,
	necklace,
	line,
	widget,
	dot,
	text,
	details,
	stackable,
	action,
	hideable,
	rubberband,
	frontmost,
}

// the order of the following is unimportant

export enum T_Graph {
	radial = 'radial',
	tree   = 'tree',
}

export enum T_Direction {
	previous = '<',
	next	 = '>',
}

export enum T_Alteration {
	delete = 'delete',
	add	   = 'add',
}

export enum T_File_Operation {
	import = 'import',	// persist
	export = 'export',	// fetch
}

export enum T_Theme {
	standalone = 'standalone',
	bubble	   = 'bubble',
}

export enum T_Cluster_Pager {
	steppers = 'steppers',
	sliders  = 'sliders',
}

export enum T_Breadcrumbs {
	selection = 'selection',
	recents   = 'recents',
	focus	  = 'focus',
}

export enum T_Focus {
	dynamic = 'dynamic',
	static  = 'static',
}

export enum T_Counts_Shown {
	numbers = 'numbers',
	hidden  = 'hidden',
	dots    = 'dots',
}

export enum T_Auto_Adjust_Graph {
	selection = 'center the selection',
	fit		  = 'exactly fit',
	ignore	  = 'ignore',
}

export enum T_Button_SVG {
	triangle = 'triangle',
	arrow = 'arrow',
	none = 'none',
}

export enum T_Search_Preference {
	title = 'title',
	trait = 'trait',
	tags  = 'tags',
}

export enum T_Widget {
	radial = 'radial',
	focus  = 'focus',
	tree   = 'tree',
}

export enum T_Tree_Line {
	flat = 'flat',
	down = 'down',
	up	 = 'up',
}

export enum T_Create {
	isFromPersistent = 'isFrom',
	getPersistentID	 = 'getID',
	none			 = '',
}

export enum T_Storage_Need {
	direction = 'direction',
	format	  = 'format',
	busy	  = 'busy',
}

export enum T_Persistence {
	remote = 'remote',
	local  = 'local',
	none   = 'none',
}

export enum T_Kinship {
	children = 'children',
	related  = 'related',
	parents  = 'parents',
}

export enum T_Drag {
	rubberband = 'rubberband',	// selecting widgets
	widget	   = 'widget',		// drag and drop
	graph	   = 'graph',		// repositioning the graph
	none	   = 'none',
}

export enum T_Radial_Zone {
	resize = 'resize',
	paging = 'paging',
	rotate = 'rotate',
	miss   = 'miss',
}

export enum T_Oblong {
	middle = 'middle',
	right  = 'right',
	left   = 'left',
	full   = 'full',
}

export enum T_Mouse_Detection {
	autorepeat = 4,
	doubleLong = 3,
	double	   = 1,
	long	   = 2,
	none	   = 0,
}

export enum T_Request {
	handle_s_mouse = 'handle_s_mouse',
	is_disabled	   = 'is_disabled',
	is_inverted	   = 'is_inverted',
	is_visible	   = 'is_visible',
	is_hit		   = 'is_hit',
	name		   = 'name',
}

export enum T_Signal {
	alteration	 = 'alteration',
	reposition	 = 'reposition',	// only for widgets
	reattach	 = 'reattach',
	rebuild		 = 'rebuild',
	thing		 = 'thing',
}

export enum T_Persistable {
	relationships = 'Relationships',
	predicates	  = 'Predicates',
	things		  = 'Things',
	traits		  = 'Traits',
	access		  = 'Access',
	users		  = 'Users',
	tags		  = 'Tags',
}

export enum T_Predicate {
	appreciates = 'appreciates',
	explainedBy	= 'explainedBy',
	supportedBy	= 'supportedBy',
	alliedWith	= 'alliedWith',		// steve melville's term
	isRelated	= 'isRelated',
	contains	= 'contains',
	isTagged	= 'isTagged',		// trying this out...
	requires	= 'requires',
}

export enum T_Control {
	details	 = 'show details view',
	builds	 = 'show build notes',
	preview	 = 'preview',
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

export enum T_File_Extension {
	seriously = 'seriously',
	cancel	  = 'cancel',
	json	  = 'json',
	csv		  = 'csv',
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

export enum T_Thing {
	organization = 'o',
	externals	 = '^',	// list of bulks
	bookmark	 = 'b',
	generic		 = '-',
	person		 = 'p',
	folder		 = 'f',
	found		 = '?',
	root		 = '!',
	bulk		 = '~',
	meme		 = '*',
}

export enum T_Trait {
	consequence = 'consequence',
	location	= 'location',
	citation	= 'citation',
	comment		= 'comment',
	money		= 'money',
	phone		= 'phone',
	quest		= 'quest',
	text		= 'text',
	date		= 'date',
	link		= 'link',
	note		= 'note',
	sum			= 'sum',
}

export enum T_Hit_Target {
	breadcrumbs	= 'breadcrumbs',
	rubberband	= 'rubberband',
	database	= 'database',
	resizing	= 'resizing',
	rotation	= 'rotation',
	details		= 'details',
	control		= 'control',
	action		= 'action',
	button		= 'button',
	cancel		= 'cancel',
	paging		= 'paging',
	reveal		= 'reveal',
	search		= 'search',
	widget		= 'widget',
	title		= 'title',
	trait		= 'trait',
	drag		= 'drag',
	glow		= 'glow',
	line		= 'line',
	none		= 'none',
	tag			= 'tag',
}

export enum T_Preference {
	expanded_children = 'expanded_children',
	focus_forChildren = 'focus_forChildren',
	expanded_parents  = 'expanded_parents',
	focus_forParents  = 'focus_forParents',
	other_databases	  = 'other_databases',
	cluster_sliders	  = 'cluster_sliders',
	show_countsAs	  = 'show_countsAs',
	relationships	  = 'relationships',
	detail_types	  = 'detail_types',			// shown in details view, vertical stack
	paging_style	  = 'paging_style',
	show_details	  = 'show_details',			// left side
	show_related	  = 'show_related',
	ring_radius		  = 'ring_radius',
	user_offset		  = 'user_offset',
	auto_adjust		  = 'auto_adjust',
	breadcrumbs		  = 'breadcrumbs',
	search_text		  = 'search_text',
	background		  = 'background',
	ring_angle  	  = 'ring_angle',
	auto_save		  = 'auto_save',
	countDots		  = 'countDots',
	font_size		  = 'font_size',
	separator		  = 'separator',
	base_id			  = 'base_id',
	details			  = 'details',				// visible details control
	grabbed			  = 'grabbed',
	bubble 			  = 'bubble',
	levels			  = 'levels',
	paging 			  = 'paging',
	search 			  = 'search',
	traits			  = 'traits',
	graph			  = 'graph',
	scale			  = 'scale',
	focus			  = 'focus',
	local			  = 'local',
	thing	    	  = 'thing',
	font			  = 'font',
	tree			  = 'tree',
	db				  = 'db',
}

// default preferences

export class Enum_Spec {
	constructor(public enum_type: object | null, public defaultValue: any) {}
}

export type Enum_Spec_ByType = { [type: string]: Enum_Spec };
export const def = (key: T_Preference): any => spec_dict_byType[key]?.defaultValue ?? null;

export const spec_dict_byType: Enum_Spec_ByType = {
	[T_Preference.auto_adjust]:     new Enum_Spec(T_Auto_Adjust_Graph, null),
	[T_Preference.paging_style]:    new Enum_Spec(T_Cluster_Pager,     T_Cluster_Pager.sliders),
	[T_Preference.breadcrumbs]:     new Enum_Spec(T_Breadcrumbs,       T_Breadcrumbs.selection),
	[T_Preference.show_countsAs]:   new Enum_Spec(T_Counts_Shown,      T_Counts_Shown.dots),
	[T_Preference.tree]:            new Enum_Spec(T_Kinship,           T_Kinship.children),
	[T_Preference.focus]:           new Enum_Spec(T_Focus,             T_Focus.dynamic),
	[T_Preference.graph]:           new Enum_Spec(T_Graph,             T_Graph.tree),
	[T_Preference.countDots]:       new Enum_Spec(null,                []),
	[T_Preference.show_details]:    new Enum_Spec(null,                false),
	[T_Preference.show_related]:    new Enum_Spec(null,                false),
	[T_Preference.other_databases]: new Enum_Spec(null,                false),
	[T_Preference.thing]:           new Enum_Spec(null,                'default'),
	[T_Preference.font]:            new Enum_Spec(null,                'Times New Roman'),
	[T_Preference.detail_types]:    new Enum_Spec(null,                [T_Detail.actions, T_Detail.data]),
};
