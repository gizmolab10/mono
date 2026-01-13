import { k } from '../../ts/common/Constants';

export enum T_Timer {
	repeat	= 'repeat',
	double	= 'double',
	alter	= 'alter',
	long	= 'long',
}

export default class Mouse_Timer {
	autorepeat_start_timer: null | number | NodeJS.Timeout = null;
	doubleClick_timer: null | number | NodeJS.Timeout = null;
	autorepeat_timer: null | number | NodeJS.Timeout = null;
	alteration_timer: null | number | NodeJS.Timeout = null;
	longClick_timer: null | number | NodeJS.Timeout = null;
	timer_ID: number = Mouse_Timer.get_next_ID();
	static debug_ID: number = 0;
	autorepeat_ID: number = -1;
	name = k.empty;

	constructor(name: string = k.empty) { this.name = name; }
	static get_next_ID(): number { return Mouse_Timer.debug_ID++; }
	isAutorepeating_forID(id: number): boolean { return this.autorepeat_ID === id; }

	hasTimer_forID(type: T_Timer): boolean {
		switch (type) {
			case T_Timer.double: return !!this.doubleClick_timer;
			case T_Timer.repeat: return !!this.autorepeat_timer;
			case T_Timer.alter: return !!this.alteration_timer;
			case T_Timer.long: return !!this.longClick_timer;
		}
	}

	autorepeat_start(id: number, callback: () => void) {
		this.autorepeat_stop();
		this.autorepeat_ID = id;
		callback();
		this.autorepeat_start_timer = setTimeout(() => {
			this.autorepeat_timer = setInterval(callback, k.threshold.autorepeat);
			this.autorepeat_start_timer = null;
		}, k.threshold.long_click);
	}

	autorepeat_stop() {
		if (this.autorepeat_start_timer) {
			clearTimeout(this.autorepeat_start_timer);
			this.autorepeat_start_timer = null;
		}
		if (this.autorepeat_timer) {
			clearInterval(this.autorepeat_timer);
			this.autorepeat_timer = null;
		}
		this.autorepeat_ID = -1;
	}

	alteration_start(callback: (invert: boolean) => void) {
		this.alteration_stop();
		let invert = true;
		this.alteration_timer = setInterval(() => {
			callback(invert);
			invert = !invert;
		}, k.threshold.alteration);
	}

	alteration_stop() {
		if (this.alteration_timer) {
			clearInterval(this.alteration_timer);
			this.alteration_timer = null;
		}
	}
	
	timeout_start(type: T_Timer, callback: (args: void) => void, force_reset: boolean = false) {
		if (type == T_Timer.long) {
			if (force_reset && !!this.longClick_timer) {
				clearTimeout(this.longClick_timer);
				this.longClick_timer = null;
			}
			if (!this.longClick_timer) {
				this.longClick_timer = setTimeout(() => {
					this.longClick_timer = null;
					callback();
				}, k.threshold.long_click);
			}
		} else if (type == T_Timer.double) {
			if (force_reset && !!this.doubleClick_timer) {
				clearTimeout(this.doubleClick_timer);
				this.doubleClick_timer = null;
			}
			if (!this.doubleClick_timer) {
				this.doubleClick_timer = setTimeout(() => {
					this.doubleClick_timer = null;
					callback();
				}, k.threshold.double_click);
			}
		}
	}

	reset() {	// tear down
		if (!!this.doubleClick_timer) {
			clearTimeout(this.doubleClick_timer);
			this.doubleClick_timer = null;
		}
		if (!!this.longClick_timer)  {
			clearTimeout(this.longClick_timer);
			this.longClick_timer = null;
		}
		this.alteration_stop();
		this.autorepeat_stop();
	}

}