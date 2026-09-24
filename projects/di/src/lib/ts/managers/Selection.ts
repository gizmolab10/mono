import type { Hit_3D_Result } from '../events/Hits_3D';
import { stale_writable } from '../common/Dirty';
import type Smart_Object from '../runtime/Smart_Object';
import { derived, get } from 'svelte/store';

class Selection {

	// Primary store: the list of currently picked hits.
	// Empty list — nothing is selected.
	// One item — "the selected part" (identical to single-selection behavior).
	// More than one — multi-selection.
	w_selections = stale_writable<Hit_3D_Result[]>([]);

	// Backwards-compat single-selection view. Returns the only picked hit
	// when exactly one is selected; null when nothing or multiple are
	// selected. Existing subscribers that listened to the single-selection
	// store keep working — the trigger surface is the same.
	w_selection = derived(this.w_selections, list => list.length === 1 ? list[0] : null);

	w_selection_name = derived(this.w_selection, selection => selection?.so.name);

	get current(): Hit_3D_Result | null {
		const list = get(this.w_selections);
		return list.length === 1 ? list[0] : null;
	}

	set current(result: Hit_3D_Result | null) {
		this.w_selections.set(result ? [result] : []);
	}

	/** Read the full list of picked hits. */
	get all(): Hit_3D_Result[] {
		return get(this.w_selections);
	}

	/** Add a hit if its part is not already in the list, otherwise remove it. */
	toggle(hit: Hit_3D_Result): void {
		const list = get(this.w_selections);
		const idx = list.findIndex(h => h.so === hit.so);
		if (idx >= 0) {
			const next = list.slice();
			next.splice(idx, 1);
			this.w_selections.set(next);
		} else {
			this.w_selections.set([...list, hit]);
		}
	}

	/** True if the given part has any hit in the picked list. */
	contains(so: Smart_Object): boolean {
		return get(this.w_selections).some(h => h.so === so);
	}

}

export const selection = new Selection();
