import { databases } from '../database/Databases';

export class S_Busy {
	isPersisting = false;
	isFetching = false;
	isFocusEventDisabled = false;

	get isFocusEventEnabled(): boolean { return !this.isFocusEventDisabled; }
	get isDatabaseBusy(): boolean { return this.isPersisting || this.isFetching; }

	async temporarily_set_isPersisting_while(closure: () => Promise<void>) {
		const wasPersisting = this.isPersisting;
		this.isPersisting = true;
		this.signal_data_redraw();
		await closure();
		this.isPersisting = wasPersisting;
		this.signal_data_redraw();
	}

	async temporarily_set_isFetching_while(closure: () => Promise<void>) {
		const wasFetching = this.isFetching;
		this.isFetching = true;
		this.signal_data_redraw();
		await closure();
		this.isFetching = wasFetching;
		this.signal_data_redraw();
	}

	async temporarily_disable_focus_event_while(closure: () => void) {
		const wasFocusEventDisabled = this.isFocusEventDisabled;
		this.isFocusEventDisabled = true;
		closure();
		this.isFocusEventDisabled = wasFocusEventDisabled;
	}

	signal_data_redraw(after: number = 0) {
		setTimeout(() => {
			databases.w_data_updated.set(new Date().getTime());
		}, after);
	}

}

export const busy = new S_Busy();
