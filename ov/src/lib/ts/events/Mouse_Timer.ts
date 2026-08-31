import { k } from '../common/Core';
import { debug } from '../common/Debug';

// The clocks a press runs against. ⟵di
//
// Telling one press from two, a press from a press held down, a hold from a hold that repeats —
// every one of those is a question about time, and each needs a clock of its own that can be
// started, asked about and stopped. One of these is made per thing that needs its own beat, so
// two of them running at once never share a clock.

export enum T_Timer {
	repeat	= 'repeat',
	double	= 'double',
	alter	= 'alter',
	long	= 'long',
}

export default class Mouse_Timer {
	autorepeat_start_timer: ReturnType<typeof setTimeout> | null = null;
	doubleClick_timer: ReturnType<typeof setTimeout> | null = null;
	autorepeat_timer: ReturnType<typeof setTimeout> | null = null;
	alteration_timer: ReturnType<typeof setTimeout> | null = null;
	longClick_timer: ReturnType<typeof setTimeout> | null = null;
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
			case T_Timer.alter:  return !!this.alteration_timer;
			case T_Timer.long:   return !!this.longClick_timer;
		}
	}

	/** One step at once, then a wait, then a steady patter until it is stopped. */
	autorepeat_start(id: number, callback: () => void) {
		this.autorepeat_stop();
		this.autorepeat_ID = id;
		callback();
		debug.log(`Repeating "${this.name}": one beat at once, then waiting ${k.threshold.long_click}ms before the patter begins.`);
		this.autorepeat_start_timer = setTimeout(() => {
			this.autorepeat_timer = setInterval(callback, k.threshold.autorepeat);
			this.autorepeat_start_timer = null;
			debug.log(`Repeating "${this.name}": the wait is over, so the patter begins, one beat every ${k.threshold.autorepeat}ms.`);
		}, k.threshold.long_click);
	}

	autorepeat_stop() {
		const waiting = !!this.autorepeat_start_timer;
		const pattering = !!this.autorepeat_timer;
		if (this.autorepeat_start_timer) {
			clearTimeout(this.autorepeat_start_timer);
			this.autorepeat_start_timer = null;
		}
		if (this.autorepeat_timer) {
			clearInterval(this.autorepeat_timer);
			this.autorepeat_timer = null;
		}
		this.autorepeat_ID = -1;
		if (waiting || pattering) {
			debug.log(`Repeating "${this.name}": stopped while ${waiting ? 'still waiting for the patter to begin' : 'pattering'}.`);
		}
	}

	/** Something that flips back and forth until it is stopped, told which way it is each time. */
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

	reset() {
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
