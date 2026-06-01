import { T_Editing, T_Decorations, T_Parts_Tab } from '../types/Enumerations';
import { preferences, T_Preference } from './Preferences';
import { stale_writable, make_stale } from '../common/Dirty';
import { k } from '../../ts/common/Constants';
import { writable, get } from 'svelte/store';
import { Smart_Object } from '../runtime';
import { quat } from 'gl-matrix';

class Stores {

	// Session (reset on setup). Stores that feed the canvas are wrapped so
	// every set or update also marks the canvas out of date.
	w_editing			= stale_writable<T_Editing>(T_Editing.none);
	w_all_sos			= stale_writable<Smart_Object[]>([]);
	w_tick				= stale_writable<number>(0);
	w_forward_face		= stale_writable<number>(-1);
	w_library			= writable<number>(0);
	w_use_uniface_placement = stale_writable<boolean>(false);

	// Persistent. Ones that feed the canvas are wrapped the same way.
	w_decorations       = make_stale(preferences.persistent<T_Decorations>(T_Preference.decorations, T_Decorations.dimensions));
	w_orientation		= make_stale(preferences.persistent<number[]>(T_Preference.orientation, [-0.49, -0.28, -0.1, 0.8]));
	w_parts_tab			= preferences.persistent<T_Parts_Tab>(T_Preference.partsTab, T_Parts_Tab.attributes);
	w_view_mode			= make_stale(preferences.persistent<'2d' | '3d'>(T_Preference.viewMode, '3d'));
	w_show_details		= preferences.persistent<boolean>(T_Preference.showDetails, true);
	w_show_help_sidebar	= preferences.persistent<boolean>(T_Preference.showHelpSidebar, true);
	w_help_page_id		= preferences.persistent<string>(T_Preference.helpPageId, 'index');
	w_t_details			= preferences.persistent<number>(T_Preference.visibleDetails, 1);
	w_edge_thickness	= make_stale(preferences.persistent<number>(T_Preference.edgeThickness, 2));
	w_grid_opacity		= make_stale(preferences.persistent<number>(T_Preference.gridOpacity, 0.5));
	w_show_grid			= make_stale(preferences.persistent<boolean>(T_Preference.showGrid, true));
	w_solid				= make_stale(preferences.persistent<boolean>(T_Preference.solid, true));
	w_rotation_snap		= preferences.persistent<boolean>(T_Preference.rotationSnap, false);
	w_allow_editing		= preferences.persistent<boolean>(T_Preference.allowEditing, true);
	w_precision			= make_stale(preferences.persistent<number>(T_Preference.precision, 2));
	w_scale				= make_stale(preferences.persistent<number>(T_Preference.scale, 2.5));

	current_orientation():				    quat { const a = get(this.w_orientation); return quat.fromValues(a[0], a[1], a[2], a[3]); }
	tick():									void { this.w_tick.update(n => n + 1); }	// triggers reactive updates
	toggle_dimensionals():					void { this.w_decorations.update(v => v ^ T_Decorations.dimensions); }
	toggle_angulars():    					void { this.w_decorations.update(v => v ^ T_Decorations.angles); }
	toggle_names():							void { this.w_decorations.update(v => v ^ T_Decorations.names); }
	set_orientation(q: quat):			    void { this.w_orientation.set([q[0], q[1], q[2], q[3]]); }
	toggle_details():						void { this.w_show_details.update(v => !v); }
	toggle_solid():							void { this.w_solid.update(v => !v); }
	toggle_rotation_snap():					void { this.w_rotation_snap.update(v => !v); }
	toggle_allow_editing():					void { this.w_allow_editing.update(v => !v); }
	toggle_grid():							void { this.w_show_grid.update(v => !v); }
	toggle_uniface_placement():				void { this.w_use_uniface_placement.update(v => !v); }
	get use_uniface_placement():		 boolean { return get(this.w_use_uniface_placement); }
	get current_view_mode():		 '2d' | '3d' { return get(this.w_view_mode); }
	get editing():					   T_Editing { return get(this.w_editing); }
	get current_scale():				  number { return get(this.w_scale); }
	get current_precision():			  number { return get(this.w_precision); }
	get grid_opacity():					  number { return get(this.w_grid_opacity); }
	get edge_thickness():				  number { return get(this.w_edge_thickness); }
	get bold_thickness():				  number { return get(this.w_edge_thickness) * k.thickness.bold; }
	get is_solid():						 boolean { return get(this.w_solid); }
	get rotation_snap():				 boolean { return get(this.w_rotation_snap); }
	get allow_editing():				 boolean { return get(this.w_allow_editing); }
	get show_grid():					 boolean { return get(this.w_show_grid); }
	get show_details():					 boolean { return get(this.w_show_details); }
	get is_editing():					 boolean { return get(this.w_editing) !== T_Editing.none; }
	get show_names():					 boolean { return (get(this.w_decorations) & T_Decorations.names) !== 0; }
	get show_angulars():      			 boolean { return (get(this.w_decorations) & T_Decorations.angles) !== 0; }
	get show_dimensionals(): 			 boolean { return (get(this.w_decorations) & T_Decorations.dimensions) !== 0; }

}

export const stores = new Stores();
