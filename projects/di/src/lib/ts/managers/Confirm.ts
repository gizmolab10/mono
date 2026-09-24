/*
 * Confirm — shared "are you sure" gate for destructive actions.
 *
 * Any caller that wants to ask the user before doing something destructive
 * calls confirm.ask(message, on_confirm). If the user has previously chosen
 * "don't ask again", the callback runs immediately. Otherwise the dialog
 * opens; "yes" runs the callback (and, if the checkbox is on, flips the
 * persistent preference so future asks are skipped). "no" or Escape cancels.
 */

import { get, writable } from 'svelte/store';
import { preferences, T_Preference } from './Preferences';

export interface Confirm_Request {
	message: string;
	on_confirm: () => void;
}

class Confirm {
	w_request = writable<Confirm_Request | null>(null);
	w_skip = preferences.persistent<boolean>(T_Preference.skipDeleteConfirm, false);

	/** Open the dialog. If the user has previously checked "don't ask again",
	 *  run the callback immediately and skip the dialog. */
	ask(message: string, on_confirm: () => void): void {
		if (get(this.w_skip)) {
			on_confirm();
			return;
		}
		this.w_request.set({ message, on_confirm });
	}

	/** Confirm — run the saved callback, optionally remember the choice, close. */
	commit(remember: boolean): void {
		const req = get(this.w_request);
		this.w_request.set(null);
		if (remember) this.w_skip.set(true);
		req?.on_confirm();
	}

	/** Cancel — close the dialog without running the callback. */
	cancel(): void {
		this.w_request.set(null);
	}
}

export const confirm = new Confirm();
