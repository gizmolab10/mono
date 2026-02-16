import { T_Editing, T_Decorations } from '../types/Enumerations';
import { preferences, T_Preference } from './Preferences';
import type { Hit_3D_Result } from './Hits_3D';
import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { Smart_Object } from '../runtime';
import { quat } from 'gl-matrix';

class Stores {

	// Session (reset on setup)
	w_selection			= writable<Hit_3D_Result | null>(null);
	w_root_so			= writable<Smart_Object | null>(null);
	w_editing			= writable<T_Editing>(T_Editing.none);
	w_all_sos			= writable<Smart_Object[]>([]);
	w_front_face		= writable<number>(-1);
	w_tick				= writable<number>(0);

	// Persistent
	w_decorations       = this.persistent<T_Decorations>(T_Preference.decorations, T_Decorations.dimensions);
	w_orientation		= this.persistent<number[]>(T_Preference.orientation, [0, 0, 0, 1]);
	w_edge_color		= this.persistent<string>(T_Preference.edgeColor, '#874efe');
	w_view_mode			= this.persistent<'2d' | '3d'>(T_Preference.viewMode, '3d');
	w_show_details		= this.persistent<boolean>(T_Preference.showDetails, true);
	w_t_details			= this.persistent<number>(T_Preference.visibleDetails, 1);
	w_line_thickness	= this.persistent<number>(T_Preference.lineThickness, 2);
	w_solid				= this.persistent<boolean>(T_Preference.solid, false);
	w_precision			= this.persistent<number>(T_Preference.precision, 2);
	w_scale				= this.persistent<number>(T_Preference.scale, 22);

	current_orientation():				    quat { const a = get(this.w_orientation); return quat.fromValues(a[0], a[1], a[2], a[3]); }
	tick():									void { this.w_tick.update(n => n + 1); }	// triggers reactive updates
	toggle_dimensionals():					void { this.w_decorations.update(v => v ^ T_Decorations.dimensions); }
	toggle_angulars():    					void { this.w_decorations.update(v => v ^ T_Decorations.angles); }
	set_orientation(q: quat):			    void { this.w_orientation.set([q[0], q[1], q[2], q[3]]); }
	toggle_details():						void { this.w_show_details.update(v => !v); }
	toggle_solid():							void { this.w_solid.update(v => !v); }
	set_selection(result:  Hit_3D_Result | null) { this.w_selection.set(result); }
	selection():		   Hit_3D_Result | null  { return get(this.w_selection); }
	current_view_mode():			 '2d' | '3d' { return get(this.w_view_mode); }
	editing():						   T_Editing { return get(this.w_editing); }
	current_scale():					  number { return get(this.w_scale); }
	line_thickness():					  number { return get(this.w_line_thickness); }
	current_precision():				  number { return get(this.w_precision); }
	edge_color():						  string { return get(this.w_edge_color); }
	is_solid():							 boolean { return get(this.w_solid); }
	show_details():						 boolean { return get(this.w_show_details); }
	is_editing():						 boolean { return get(this.w_editing) !== T_Editing.none; }
	show_dimensionals():  				 boolean { return (get(this.w_decorations) & T_Decorations.dimensions) !== 0; }
	show_angulars():      				 boolean { return (get(this.w_decorations) & T_Decorations.angles) !== 0; }

	private persistent<T>(key: T_Preference, fallback: T): Writable<T> {
		const w = writable<T>(preferences.read<T>(key) ?? fallback);
		w.subscribe((v) => preferences.write(key, v));
		return w;
	}

}

export const stores = new Stores();
