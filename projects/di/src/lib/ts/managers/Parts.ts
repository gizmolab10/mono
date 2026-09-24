import { preferences, T_Preference } from './Preferences';
import { T_Hit_3D } from '../types/Enumerations';
import { Smart_Object } from '../runtime';
import { errors, constraints } from '../algebra';
import { selection } from './Selection';
import { history } from './History';
import { scenes } from './Scenes';
import { get, writable } from 'svelte/store';
import { stores } from './Stores';

class Parts {

	w_collapsed_ids = preferences.persistent_set(T_Preference.collapsedIds);

	// Rename-in-flight state. Only one rename can be in flight at a time across
	// the whole app, so this state is shared by both the parts list (inline
	// rename via row click) and the selection panel (always-visible name input).
	w_naming_error      = writable<string | null>(null);
	w_editing_id        = writable<string | null>(null);
	w_editing_original  = writable<string>('');
	private naming_input: HTMLInputElement | null = null;

	private children_of(so: Smart_Object): Smart_Object[] {
		return get(stores.w_all_sos).filter(s => s.scene?.parent?.so === so);
	}

	// True for a part that is a generated duplicate inside a repeater. Clones
	// are the second-and-later children of a part marked as repeating; they
	// are spawned by the repeater sync from a single master and are not
	// individually editable.
	is_clone(so: Smart_Object, sos: Smart_Object[], _tick?: number): boolean {
		const parent = so.scene?.parent?.so;
		if (!parent?.repeater) return false;
		const siblings = sos.filter(s => s.scene?.parent?.so === parent);
		return siblings[0] !== so;
	}

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

	is_ancestor_collapsed(so: Smart_Object, ids: Set<string>): boolean {
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
			const sel = get(selection.w_selection)?.so;
			if (sel && this.is_ancestor_collapsed(sel, ids)) {
				selection.current = { so: R, type: T_Hit_3D.face, index: 0 };
			}
		} else {
			const parent = R.scene?.parent?.so;
			if (!parent) return;
			ids.add(parent.id);
			this.w_collapsed_ids.set(ids);
			selection.current = { so: parent, type: T_Hit_3D.face, index: 0 };
		}
	}

	// Reveal the shallowest hidden generation under so.
	reveal_generation(so: Smart_Object): void {
		const { depth, ancestors } = this.shallowest_hidden_under(so);
		if (depth === 0) return;
		const ids = new Set(get(this.w_collapsed_ids));
		for (const a of ancestors) ids.delete(a.id);
		this.w_collapsed_ids.set(ids);
	}

	// Add or remove so from w_collapsed_ids. When folding a row up that
	// contains the currently selected part, move the selection to that row
	// so the click wins and the selection stays visible.
	toggle_reveal(so: Smart_Object): void {
		const ids = new Set(get(this.w_collapsed_ids));
		const id = so.id;
		if (ids.has(id)) {
			ids.delete(id);
			this.w_collapsed_ids.set(ids);
		} else {
			ids.add(id);
			this.w_collapsed_ids.set(ids);
			const sel = get(selection.w_selection)?.so;
			if (sel && this.is_ancestor_collapsed(sel, ids)) {
				selection.current = { so, type: T_Hit_3D.face, index: 0 };
			}
		}
	}

	apply_generational(so: Smart_Object, OPTION: boolean, SHIFT: boolean): void {
		if (!SHIFT) {
			this.toggle_reveal(so);
		} else if (OPTION) {
			this.hide_generation(so);
		} else {
    		this.reveal_generation(so);
		}
	}

	// ── rename helpers ──
	// Shared by the parts list (inline rename) and the selection panel
	// (always-visible name input). Pure logic; the input element and the
	// validation overlay markup stay in the components.

	begin_rename(so: Smart_Object): void {
		this.w_naming_error.set(null);
		this.w_editing_id.set(so.id);
		this.w_editing_original.set(so.name);
	}

	commit_name(so: Smart_Object, value: string, input?: HTMLInputElement): void {
		if (get(this.w_naming_error)) return;
		const trimmed = value.trim();
		if (trimmed.length > 0 && trimmed !== so.name) {
			const err = errors.validate_name(trimmed, so.id);
			if (err) {
				this.w_naming_error.set(err);
				this.naming_input = input ?? null;
				return;
			}
			history.snapshot();
			const old_name = so.name;
			so.name = trimmed.replace(/_/g, ' ');
			if (so.name !== old_name) constraints.rename_so_in_formulas(old_name, so.name);
			scenes.save();
			stores.w_all_sos.update(sos => sos);
		}
		this.w_naming_error.set(null);
		this.w_editing_id.set(null);
	}

	cancel_rename(so: Smart_Object): void {
		const original = get(this.w_editing_original);
		if (original) so.name = original;
		this.w_editing_id.set(null);
	}

	// Live rename: write the typed text directly to the part's saved name on
	// every keystroke, mirroring the face-label sync pattern. All UI that
	// reads so.name (parts list, drawn face name, selection banner) follows
	// the typing live. No validation, no snapshot — those happen on commit.
	live_rename(so: Smart_Object, value: string): void {
		so.name = value;
		stores.w_all_sos.update(sos => sos);
		selection.w_selections.update(list => list.map(h => ({ ...h })));
	}

	dismiss_naming(): void {
		this.w_naming_error.set(null);
		if (this.naming_input) {
			this.naming_input.value = '';
			this.naming_input = null;
		}
	}

	name_keydown(e: KeyboardEvent, so: Smart_Object): void {
		const has_error = !!get(this.w_naming_error);
		if (has_error && (e.key === 'Enter' || e.key === 'Delete' || e.key === 'Backspace')) {
			const inp = e.target as HTMLInputElement;
			this.w_naming_error.set(null);
			this.naming_input = null;
			if (e.key === 'Enter') {
				e.preventDefault();
				const pos = inp.selectionStart ?? 0;
				inp.value = inp.value.slice(0, pos) + inp.value.slice(inp.selectionEnd ?? inp.value.length);
				inp.setSelectionRange(pos, pos);
			}
		} else if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
		} else if (e.key === 'Escape') {
			this.cancel_rename(so);
		}
		e.stopPropagation();
	}

}

export const parts = new Parts();
