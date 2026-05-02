import { selection } from '../managers/Selection';
import { stores } from '../managers/Stores';

export class Debug {

	/**
	 * Attach the read-only test hooks the browser-driven test suite needs.
	 * Only fires when the URL carries `?test=1`. A normal user session sees
	 * no extra surface on the page. The hooks expose internal state for
	 * test assertions; they do not write anything.
	 */
	apply_queryStrings(queryStrings: URLSearchParams): void {
		if (typeof window === 'undefined') return;
		if (queryStrings.get('test') !== '1') return;
		(window as unknown as { di_test: Record<string, () => unknown> }).di_test = {
			orientation: () => Array.from(stores.current_orientation()),
			selection: () => {
				const sel = selection.current;
				return sel ? { so_id: sel.so.id, type: sel.type, index: sel.index } : null;
			},
			view_mode: () => stores.current_view_mode,
			is_editing_allowed: () => stores.allow_editing,
		};
	}

}

export const debug = new Debug();

