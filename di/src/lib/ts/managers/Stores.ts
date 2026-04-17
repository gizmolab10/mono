import { T_Editing, T_Decorations, T_Parts_Tab, T_Hit_3D } from '../types/Enumerations';
import { preferences, T_Preference } from './Preferences';
import type { Hit_3D_Result } from '../events/Hits_3D';
import { stale_writable, make_stale } from '../common/Stale_Writable';
import { k } from '../../ts/common/Constants';
import { writable, get } from 'svelte/store';
import { Smart_Object } from '../runtime';
import { quat } from 'gl-matrix';

class Stores {

	// Session (reset on setup). Stores that feed the canvas are wrapped so
	// every set or update also marks the canvas out of date.
	w_selection			= stale_writable<Hit_3D_Result | null>(null);
	w_editing			= stale_writable<T_Editing>(T_Editing.none);
	w_all_sos			= stale_writable<Smart_Object[]>([]);
	w_tick				= stale_writable<number>(0);
	w_library			= writable<number>(0);
	w_forward_face		= stale_writable<number>(-1);
	w_collapsed_ids		= preferences.persistent_set(T_Preference.collapsedIds);

	// Persistent. Ones that feed the canvas are wrapped the same way.
	w_decorations       = make_stale(preferences.persistent<T_Decorations>(T_Preference.decorations, T_Decorations.dimensions));
	w_orientation		= make_stale(preferences.persistent<number[]>(T_Preference.orientation, [-0.49, -0.28, -0.1, 0.8]));
	w_parts_tab			= preferences.persistent<T_Parts_Tab>(T_Preference.partsTab, T_Parts_Tab.attributes);
	w_view_mode			= make_stale(preferences.persistent<'2d' | '3d'>(T_Preference.viewMode, '3d'));
	w_show_details		= preferences.persistent<boolean>(T_Preference.showDetails, true);
	w_t_details			= preferences.persistent<number>(T_Preference.visibleDetails, 1);
	w_edge_thickness	= make_stale(preferences.persistent<number>(T_Preference.edgeThickness, 2));
	w_grid_opacity		= make_stale(preferences.persistent<number>(T_Preference.gridOpacity, 0.5));
	w_show_grid			= make_stale(preferences.persistent<boolean>(T_Preference.showGrid, true));
	w_solid				= make_stale(preferences.persistent<boolean>(T_Preference.solid, true));
	w_rotation_snap		= preferences.persistent<boolean>(T_Preference.rotationSnap, true);
	w_allow_editing		= preferences.persistent<boolean>(T_Preference.allowEditing, false);
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
	set_selection(result:  Hit_3D_Result | null) { this.w_selection.set(result); }
	get selection():	   Hit_3D_Result | null  { return get(this.w_selection); }
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

	private children_of(so: Smart_Object): Smart_Object[] {
		return get(this.w_all_sos).filter(s => s.scene?.parent?.so === so);
	}

	// Deepest relative depth visible under R, and the direct parents of that layer.
	// Returns depth 0 when R has no visible descendants.
	deepest_visible_under(R: Smart_Object): { depth: number, parents: Set<Smart_Object> } {
		const ids = get(this.w_collapsed_ids);
		let max_depth = 0;
		let parents_at_max: Set<Smart_Object> = new Set();
		const walk = (cur: Smart_Object, parent: Smart_Object | null, d: number) => {
			if (d > max_depth) {
				max_depth = d;
				parents_at_max = new Set();
				if (parent) parents_at_max.add(parent);
			} else if (d === max_depth && parent) {
				parents_at_max.add(parent);
			}
			if (ids.has(cur.id)) return;
			for (const c of this.children_of(cur)) walk(c, cur, d + 1);
		};
		walk(R, null, 0);
		return { depth: max_depth, parents: parents_at_max };
	}

	// Shallowest relative depth hidden under R, and the rows currently in the
	// collapsed set that cause that layer to hide. Returns depth 0 when nothing
	// is hidden below R.
	shallowest_hidden_under(R: Smart_Object): { depth: number, ancestors: Set<Smart_Object> } {
		const ids = get(this.w_collapsed_ids);
		let min_depth = Infinity;
		let ancestors: Set<Smart_Object> = new Set();
		const walk = (cur: Smart_Object, d: number) => {
			if (ids.has(cur.id)) {
				const hidden = d + 1;
				if (hidden < min_depth) {
					min_depth = hidden;
					ancestors = new Set([cur]);
				} else if (hidden === min_depth) {
					ancestors.add(cur);
				}
				return;
			}
			for (const c of this.children_of(cur)) walk(c, d + 1);
		};
		walk(R, 0);
		return { depth: min_depth === Infinity ? 0 : min_depth, ancestors };
	}

	has_visible_descendant(R: Smart_Object): boolean {
		return this.deepest_visible_under(R).depth > 0;
	}

	// Hide the outermost visible generation under R. If nothing is visible
	// below R, bubble up and collapse R's parent instead. Relocates the
	// selection when the current selection becomes hidden (to R, or to R's
	// parent in the bubble-up case).
	hide_generation(R: Smart_Object): void {
		const { depth, parents } = this.deepest_visible_under(R);
		const ids = new Set(get(this.w_collapsed_ids));
		if (depth > 0) {
			for (const p of parents) ids.add(p.id);
			this.w_collapsed_ids.set(ids);
			const sel = get(this.w_selection)?.so;
			if (sel && this.is_ancestor_collapsed(sel)) {
				this.set_selection({ so: R, type: T_Hit_3D.face, index: 0 });
			}
		} else {
			const parent = R.scene?.parent?.so;
			if (!parent) return;
			ids.add(parent.id);
			this.w_collapsed_ids.set(ids);
			this.set_selection({ so: parent, type: T_Hit_3D.face, index: 0 });
		}
	}

	// Reveal the shallowest hidden generation under R.
	reveal_generation(R: Smart_Object): void {
		const { depth, ancestors } = this.shallowest_hidden_under(R);
		if (depth === 0) return;
		const ids = new Set(get(this.w_collapsed_ids));
		for (const a of ancestors) ids.delete(a.id);
		this.w_collapsed_ids.set(ids);
	}

}

export const stores = new Stores();
