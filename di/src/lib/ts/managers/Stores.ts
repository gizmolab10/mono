import { T_Editing, T_Decorations, T_Parts_Tab } from '../types/Enumerations';
import { preferences, T_Preference } from './Preferences';
import type { Hit_3D_Result } from '../events/Hits_3D';
import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { Smart_Object } from '../runtime';
import { quat } from 'gl-matrix';

class Stores {

	// Session (reset on setup)
	w_selection			= writable<Hit_3D_Result | null>(null);
	w_editing			= writable<T_Editing>(T_Editing.none);
	w_all_sos			= writable<Smart_Object[]>([]);
	w_tick				= writable<number>(0);
	w_library			= writable<number>(0);
	w_forward_face		= writable<number>(-1);
	w_collapsed_ids		= writable<Set<string>>(new Set());

	// Persistent
	w_decorations       = this.persistent<T_Decorations>(T_Preference.decorations, T_Decorations.dimensions);
	w_orientation		= this.persistent<number[]>(T_Preference.orientation, [-0.49, -0.28, -0.1, 0.8]);
	w_parts_tab			= this.persistent<T_Parts_Tab>(T_Preference.partsTab, T_Parts_Tab.attributes);
	w_edge_color		= this.persistent<string>(T_Preference.edgeColor, '#874efe');
	w_view_mode			= this.persistent<'2d' | '3d'>(T_Preference.viewMode, '3d');
	w_show_details		= this.persistent<boolean>(T_Preference.showDetails, true);
	w_t_details			= this.persistent<number>(T_Preference.visibleDetails, 1);
	w_line_thickness	= this.persistent<number>(T_Preference.lineThickness, 2);
	w_grid_opacity		= this.persistent<number>(T_Preference.gridOpacity, 0.5);
	w_show_grid			= this.persistent<boolean>(T_Preference.showGrid, true);
	w_solid				= this.persistent<boolean>(T_Preference.solid, true);
	w_rotation_snap		= this.persistent<boolean>(T_Preference.rotationSnap, true);
	w_allow_editing		= this.persistent<boolean>(T_Preference.allowEditing, false);
	w_precision			= this.persistent<number>(T_Preference.precision, 2);
	w_scale				= this.persistent<number>(T_Preference.scale, 2.5);

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
	set_selection(result:  Hit_3D_Result | null) { this.w_selection.set(result); }
	selection():		   Hit_3D_Result | null  { return get(this.w_selection); }
	current_view_mode():			 '2d' | '3d' { return get(this.w_view_mode); }
	editing():						   T_Editing { return get(this.w_editing); }
	current_scale():					  number { return get(this.w_scale); }
	current_precision():				  number { return get(this.w_precision); }
	grid_opacity():						  number { return get(this.w_grid_opacity); }
	line_thickness():					  number { return get(this.w_line_thickness); }
	edge_color():						  string { return get(this.w_edge_color); }
	is_solid():							 boolean { return get(this.w_solid); }
	rotation_snap():					 boolean { return get(this.w_rotation_snap); }
	allow_editing():					 boolean { return get(this.w_allow_editing); }
	show_grid():						 boolean { return get(this.w_show_grid); }
	show_details():						 boolean { return get(this.w_show_details); }
	is_editing():						 boolean { return get(this.w_editing) !== T_Editing.none; }
	show_names():						 boolean { return (get(this.w_decorations) & T_Decorations.names) !== 0; }
	show_angulars():      				 boolean { return (get(this.w_decorations) & T_Decorations.angles) !== 0; }
	show_dimensionals():  				 boolean { return (get(this.w_decorations) & T_Decorations.dimensions) !== 0; }

	tree_order(sos: Smart_Object[]): Smart_Object[] {
		const result: Smart_Object[] = [];
		const by_parent = new Map<Smart_Object | undefined, Smart_Object[]>();
		for (const so of sos) {
			const p = so.scene?.parent?.so;
			let list = by_parent.get(p);
			if (!list) { list = []; by_parent.set(p, list); }
			list.push(so);
		}
		const walk = (parent: Smart_Object | undefined) => {
			const children = by_parent.get(parent);
			if (!children) return;
			for (const so of children) {
				result.push(so);
				walk(so);
			}
		};
		walk(undefined);
		// include any orphans not reached by the tree walk
		if (result.length < sos.length) {
			const seen = new Set(result);
			for (const so of sos) { if (!seen.has(so)) result.push(so); }
		}
		return result;
	}

	is_ancestor_collapsed(so: Smart_Object): boolean {
		const ids = get(this.w_collapsed_ids);
		let scene = so.scene?.parent;
		while (scene) {
			if (ids.has(scene.so.id)) return true;
			scene = scene.parent;
		}
		return false;
	}

	reveal_so(so: Smart_Object): void {
		const ids = get(this.w_collapsed_ids);
		let changed = false;
		let scene = so.scene?.parent;
		while (scene) {
			if (ids.has(scene.so.id)) { ids.delete(scene.so.id); changed = true; }
			scene = scene.parent;
		}
		if (changed) this.w_collapsed_ids.set(new Set(ids));
	}

	private persistent<T>(key: T_Preference, fallback: T): Writable<T> {
		const w = writable<T>(preferences.read<T>(key) ?? fallback);
		w.subscribe((v) => preferences.write(key, v));
		return w;
	}

}

export const stores = new Stores();
