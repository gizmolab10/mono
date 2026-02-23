import type { Ancestry }     from '../nav/Ancestry';
import type { Integer }      from '../types/Types';
import { Seriously_Range }   from '../types/Seriously_Range';
import { T_Edit }            from '../common/Enumerations';
import { Point }             from '../types/Coordinates';

// ————————————————————————————————————————— Types

interface S_Recent {
	focus: Ancestry;
	grabs: Ancestry[];
	depth: number;
}

// ————————————————————————————————————————— UX Singleton

class S_UX {
	recents            = $state<S_Recent[]>([]);
	recents_index      = $state(0);
	global_depth_limit = $state(5);
	expanded_hids      = $state(new Set<Integer>());
	scale              = $state(1);
	user_graph_offset  = $state(Point.zero);

	// ————————————————————————————————————————— Derived from recents

	get current_recent(): S_Recent | null {
		return this.recents[this.recents_index] ?? null;
	}

	get ancestry_focus(): Ancestry | null {
		return this.current_recent?.focus ?? null;
	}

	get grabs(): Ancestry[] {
		return this.current_recent?.grabs ?? [];
	}

	get ancestry_forDetails(): Ancestry | null {
		const grabs = this.grabs;
		if (grabs.length > 0) return grabs[grabs.length - 1];
		return this.ancestry_focus;
	}

	// ————————————————————————————————————————— Focus

	becomeFocus(ancestry: Ancestry): boolean {
		const prior = this.ancestry_focus;
		if (prior && ancestry.equals(prior)) return false;
		this.recents = [...this.recents.slice(0, this.recents_index + 1), {
			focus: ancestry,
			grabs: [...this.grabs],
			depth: this.global_depth_limit,
		}];
		this.recents_index = this.recents.length - 1;
		this.expand(ancestry);
		return true;
	}

	// ————————————————————————————————————————— Grabs

	grab(ancestry: Ancestry): void {
		const items = this.grabs.filter(a => !a.equals(ancestry));
		items.push(ancestry);
		this._push_recent_withGrabs(items);
	}

	grabOnly(ancestry: Ancestry): void {
		this._push_recent_withGrabs([ancestry]);
	}

	grab_none(): void {
		this._push_recent_withGrabs([]);
	}

	ungrab(ancestry: Ancestry): void {
		const items = this.grabs.filter(a => !a.equals(ancestry));
		this._push_recent_withGrabs(items);
	}

	ungrab_invisible_grabs(): void {
		const visible = this.grabs.filter(g =>
			!g.hidden_by_depth_limit
		);
		if (visible.length !== this.grabs.length) {
			this._push_recent_withGrabs(visible);
		}
	}

	isGrabbed(ancestry: Ancestry): boolean {
		return this.grabs.some(a => a.equals(ancestry));
	}

	private _push_recent_withGrabs(grabs: Ancestry[]): void {
		const focus = this.ancestry_focus;
		if (!focus) return;
		this.recents = [...this.recents.slice(0, this.recents_index + 1), {
			focus,
			grabs,
			depth: this.global_depth_limit,
		}];
		this.recents_index = this.recents.length - 1;
	}

	// ————————————————————————————————————————— Expansion

	isExpanded(ancestry: Ancestry): boolean {
		return ancestry.isRoot || this.expanded_hids.has(ancestry.hid);
	}

	expand(ancestry: Ancestry): boolean {
		if (ancestry.isRoot || this.isExpanded(ancestry)) return false;
		this.expanded_hids = new Set([...this.expanded_hids, ancestry.hid]);
		return true;
	}

	collapse(ancestry: Ancestry): boolean {
		if (ancestry.isRoot || !this.isExpanded(ancestry)) return false;
		const next = new Set(this.expanded_hids);
		next.delete(ancestry.hid);
		this.expanded_hids = next;
		return true;
	}

	toggle_expansion(ancestry: Ancestry): boolean {
		return this.isExpanded(ancestry) ? this.collapse(ancestry) : this.expand(ancestry);
	}

	// ————————————————————————————————————————— Title editing

	title_edit_ancestry = $state<Ancestry | null>(null);
	title_edit_state    = $state<T_Edit>(T_Edit.idle);
	selection_range     = $state<Seriously_Range | null>(null);

	get is_editing(): boolean {
		return this.title_edit_state === T_Edit.active;
	}

	isEditing_ancestry(ancestry: Ancestry): boolean {
		return this.is_editing && !!this.title_edit_ancestry?.equals(ancestry);
	}

	startEdit(ancestry: Ancestry): void {
		this.title_edit_ancestry = ancestry;
		this.title_edit_state    = T_Edit.active;
	}

	confirmEdit(): void {
		const thing = this.title_edit_ancestry?.thing;
		if (thing) {
			thing.set_isDirty();
		}
		this.title_edit_state    = T_Edit.idle;
		this.title_edit_ancestry = null;
		this.selection_range     = null;
	}

	cancelEdit(): void {
		this.title_edit_state    = T_Edit.idle;
		this.title_edit_ancestry = null;
		this.selection_range     = null;
	}

	// ————————————————————————————————————————— Recents navigation

	recents_go(next: boolean): boolean {
		const length = this.recents.length;
		if (length === 0) return false;
		const delta    = next ? 1 : -1;
		const newIndex = this.recents_index + delta;
		if (newIndex < 0 || newIndex >= length) return false;
		this.recents_index = newIndex;
		const recent = this.current_recent;
		if (recent) {
			this.expand(recent.focus);
			this.global_depth_limit = recent.depth;
		}
		return true;
	}
}

export const ux = new S_UX();
