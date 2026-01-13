import { k } from '../../ts/common/Global_Imports';

export enum Timer_Type {
	double	= 'double',
	long	= 'long',
}

export default class Timer_State {
	mouse_longClick_timer!: null | number | NodeJS.Timeout;
	mouse_doubleClick_timer!: null | number | NodeJS.Timeout;

	get hasTimer(): boolean { return !!this.mouse_doubleClick_timer || !!this.mouse_longClick_timer; }

	reset() {	// tear down
		if (!!this.mouse_doubleClick_timer) {
			clearTimeout(this.mouse_doubleClick_timer);
			this.mouse_doubleClick_timer = null;
		}
		if (!!this.mouse_longClick_timer)  {
			clearTimeout(this.mouse_longClick_timer);
			this.mouse_longClick_timer = null;
		}
	}
	
	setTimeout(type: Timer_Type, callback: (args: void) => void, ms?: number) {
		if (type == Timer_Type.long && !this.mouse_longClick_timer) {
			setTimeout(() => {
				callback();
			}, k.threshold_longClick);
		} else if (type == Timer_Type.double && !this.mouse_doubleClick_timer) {
			setTimeout(() => {
				callback();
			}, k.threshold_doubleClick);
		}

	}
}