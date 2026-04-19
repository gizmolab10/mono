import type { Hit_3D_Result } from '../events/Hits_3D';
import { stale_writable } from '../common/Stale_Writable';
import { get } from 'svelte/store';

class Selection {

	w_selection = stale_writable<Hit_3D_Result | null>(null);

	get current(): Hit_3D_Result | null { return get(this.w_selection); }
	set current(result: Hit_3D_Result | null) { this.w_selection.set(result); }

}

export const selection = new Selection();
