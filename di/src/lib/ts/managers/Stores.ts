import { preferences, T_Preference } from './Preferences';
import { T_Editing, T_Decorations } from '../types/Enumerations';
import type { Hit_3D_Result } from './Hits_3D';
import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { Smart_Object } from '../runtime';

class Stores {

	// Session (reset on setup)
	w_scale  			= writable<number>(22);
	w_all_sos			= writable<Smart_Object[]>([]);
	w_root_so			= writable<Smart_Object | null>(null);
	w_editing			= writable<T_Editing>(T_Editing.none);
	w_selection			= writable<Hit_3D_Result | null>(null);
	w_front_face		= writable<number>(-1);

	// Persistent
	w_decorations       = this.persistent<T_Decorations>(T_Preference.decorations, T_Decorations.both);
	w_edge_color		= this.persistent<string>(T_Preference.edgeColor, '#874efe');
	w_view_mode			= this.persistent<'2d' | '3d'>(T_Preference.viewMode, '3d');
	w_show_details		= this.persistent<boolean>(T_Preference.showDetails, true);
	w_line_thickness	= this.persistent<number>(T_Preference.lineThickness, 2);
	w_solid				= this.persistent<boolean>(T_Preference.solid, false);
	w_precision			= this.persistent<number>(T_Preference.precision, 2);

	// Hideable sections
	w_show_selection	= this.persistent<boolean>(T_Preference.showSelection, true);
	w_show_preferences	= this.persistent<boolean>(T_Preference.showPreferences, true);
	w_show_library		= this.persistent<boolean>(T_Preference.showLibrary, true);

	// Selection
	selection():		   Hit_3D_Result | null  { return get(this.w_selection); }
	set_selection(result:  Hit_3D_Result | null) { this.w_selection.set(result); }

	// Toggles
	toggle_dimensionals(): void {
		this.w_decorations.update(v => {
			if (v === T_Decorations.both) return T_Decorations.angles;
			if (v === T_Decorations.dimensions) return T_Decorations.none;
			if (v === T_Decorations.angles) return T_Decorations.both;
			return T_Decorations.dimensions; // none → dimensions
		});
	}
	toggle_angulars(): void {
		this.w_decorations.update(v => {
			if (v === T_Decorations.both) return T_Decorations.dimensions;
			if (v === T_Decorations.angles) return T_Decorations.none;
			if (v === T_Decorations.dimensions) return T_Decorations.both;
			return T_Decorations.angles; // none → angles
		});
	}
	toggle_solid():							void { this.w_solid.update(v => !v); }
	toggle_details():						void { this.w_show_details.update(v => !v); }

	// Editing
	editing():							T_Editing { return get(this.w_editing); }
	is_editing():						  boolean { return get(this.w_editing) !== T_Editing.none; }

	// Synchronous readers (for non-reactive contexts like Render)
	is_solid():							 boolean { return get(this.w_solid); }
	show_dimensionals(): boolean {
		const d = get(this.w_decorations);
		return d === T_Decorations.dimensions || d === T_Decorations.both;
	}
	show_angulars(): boolean {
		const d = get(this.w_decorations);
		return d === T_Decorations.angles || d === T_Decorations.both;
	}
	line_thickness():					  number { return get(this.w_line_thickness); }
	current_precision():				  number { return get(this.w_precision); }
	edge_color():						  string { return get(this.w_edge_color); }
	current_view_mode():			 '2d' | '3d' { return get(this.w_view_mode); }
	show_details():					 boolean { return get(this.w_show_details); }

	private persistent<T>(key: T_Preference, fallback: T): Writable<T> {
		const w = writable<T>(preferences.read<T>(key) ?? fallback);
		w.subscribe((v) => preferences.write(key, v));
		return w;
	}

}

export const stores = new Stores();
