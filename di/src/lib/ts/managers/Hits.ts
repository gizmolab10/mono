import S_Hit_Target, { setHitsManager } from '../state/S_Hit_Target';
import Mouse_Timer, { T_Timer } from '../signals/Mouse_Timer';
import { T_Drag, T_Hit_Target } from '../types/Enumerations';
import type { Dictionary } from '../types/Types';
import { Point } from '../types/Coordinates';
import { writable, get } from 'svelte/store';
import S_Mouse from '../state/S_Mouse';
import RBush from 'rbush';

type Target_RBRect = {
	minX: number;
	minY: number;
	maxX: number;	
	maxY: number;	
	target: S_Hit_Target;
}

export default class Hits {
	disable_hover = false;
	longClick_fired: boolean = false;
	doubleClick_fired: boolean = false;
	rbush = new RBush<Target_RBRect>();
	targets_dict_byID: Dictionary<S_Hit_Target> = {};
	pending_singleClick_event: MouseEvent | null = null;
	pending_singleClick_target: S_Hit_Target | null = null;
	click_timer: Mouse_Timer = new Mouse_Timer('hits-click');
	targets_dict_byType: Dictionary<Array<S_Hit_Target>> = {};
	autorepeat_timer: Mouse_Timer = new Mouse_Timer('hits-autorepeat');
	
	w_s_hover	 = writable<S_Hit_Target | null>(null);
	w_longClick	 = writable<S_Hit_Target | null>(null);
	w_autorepeat = writable<S_Hit_Target | null>(null);
	w_dragging	 = writable<T_Drag>(T_Drag.none);

	constructor() {
		// Wire up the circular dependency
		setHitsManager(this);
	}

	get isHovering(): boolean { return get(this.w_s_hover) != null; }
	get hovering_type(): T_Hit_Target | null { return get(this.w_s_hover)?.type ?? null; }

	// ===== HOVER =====

	private detect_hovering_at(point: Point) {
		if (this.disable_hover) {
			return false;
		}
		const matches = this.targets_atPoint(point);
		const match = this.targetOf_highest_precedence(matches);
		this.set_asHovering(match);
		return !!match;
	}

	// ===== CLICKS =====

	handle_s_mouse_at(point: Point, s_mouse: S_Mouse): boolean {
		const matches = this.targets_atPoint(point);
		const target = this.targetOf_highest_precedence(matches) ?? matches[0];
		if (!!s_mouse.event && !!target) {
			if (s_mouse.isDown && s_mouse.event) {
				target.clicks += 1;
				if (target.respondsTo_autorepeat) {
					target.handle_s_mouse?.(s_mouse);
					this.start_autorepeat(target);
				} else if (target.respondsTo_longClick) {
					this.start_longClick(target, s_mouse.event);
				} else if (target.respondsTo_doubleClick) {
					if (target.clicks == 2) {
						target.clicks = 0;
						this.click_timer.reset();
						this.doubleClick_fired = true;
						this.pending_singleClick_event = null;
						this.pending_singleClick_target = null;
						target.doubleClick_callback!(S_Mouse.double(s_mouse.event, target.html_element));
					} else if (target.clicks == 1) {
						this.start_doubleClick_timer(target, s_mouse.event);
					}
				} else {
					target.handle_s_mouse?.(s_mouse);
				}
			} else if (s_mouse.isUp) {
				this.cancel_longClick();
				this.stop_autorepeat();
				if (this.longClick_fired || this.doubleClick_fired) {
					this.doubleClick_fired = false;
					this.longClick_fired = false;
					target.clicks = 0;
				} else {
					const waitingForDoubleClick = target.respondsTo_doubleClick && 
						this.click_timer.hasTimer_forID(T_Timer.double) && 
						this.pending_singleClick_target === target;
					if (!waitingForDoubleClick) {
						target.clicks = 0;
						return target.handle_s_mouse?.(s_mouse) ?? false;
					}
				}
			}
		}
		return true;
	}

	// ===== MOVEMENT =====

	handle_mouse_movement_at(point: Point) {
		if (get(this.w_dragging) === T_Drag.none) {
			this.detect_hovering_at(point);
		}
	}

	clear_hover() {
		this.w_s_hover.set(null);
	}

	// ===== GENERAL =====

	reset() {
		this.rbush.clear();
		this.stop_autorepeat();
		this.cancel_longClick();
		this.w_s_hover.set(null);
		this.cancel_doubleClick();
		this.targets_dict_byID = {};
		this.longClick_fired = false;
		this.targets_dict_byType = {};
	}

	recalibrate() {
		const bush = new RBush<Target_RBRect>();
		for (const target of [...this.targets]) {
			target.update_rect();
			const rect = target.rect;
			if (!!rect) {
				this.insert_into_rbush(target, bush);
			}
		}
		this.rbush = bush;
	}

	// ===== ADD AND REMOVE =====

	add_hit_target(target: S_Hit_Target) {
		const id = target.id;
		const type = target.type;
		if (!this.targets_dict_byType[type]) {
			this.targets_dict_byType[type] = [];
		} else {
			const existing = this.targets_dict_byType[type].find(t => t.id == id);
			if (!!existing) {
				this.delete_hit_target(existing);
			}
		}
		this.targets_dict_byID[id] = target;
		this.targets_dict_byType[type].push(target);
		this.insert_into_rbush(target, this.rbush);
	}

	delete_hit_target(target: S_Hit_Target) {
		if (!!target && !!target.rect) {
			const id = target.id;
			if (!!id) {
				delete this.targets_dict_byID[id];
			}
			const type = target.type;
			const byType = this.targets_dict_byType[type];
			if (byType) {
				const index = byType.indexOf(target);
				if (index !== -1) {
					byType.splice(index, 1);
				}
			}
			this.remove_from_rbush(target, this.rbush);
		}
	}

	// ===== INTERNALS =====

	private get targets(): Array<S_Hit_Target> {
		return this.rbush.all().map(rbRect => rbRect.target);
	}

	private targets_atPoint(point: Point): Array<S_Hit_Target> {
		const targets = this.rbush.search(point.asBBox).map(rbRect => rbRect.target);
		return targets.filter(target => (target.contains_point?.(point) ?? true));
	}

	private targetOf_highest_precedence(matches: Array<S_Hit_Target>): S_Hit_Target | null {
		return matches.find(s => s.isADot)
			?? matches.find(s => s.isAWidget)
			?? matches.find(s => s.isRing)
			?? matches.find(s => s.isAControl)
			?? matches[0];
	}

	private insert_into_rbush(target: S_Hit_Target, into_rbush: RBush<Target_RBRect>) {
		const rect = target.rect;
		if (!!rect) {
			into_rbush.insert({
				minX: rect.x,
				minY: rect.y,
				maxX: rect.right,
				maxY: rect.bottom,
				target: target
			});
		}
	}

	private remove_from_rbush(target: S_Hit_Target, from_rbush: RBush<Target_RBRect>) {
		if (!!target && !!target.rect) {
			from_rbush.remove({
				minX: target.rect.x,
				minY: target.rect.y,
				maxX: target.rect.right,
				maxY: target.rect.bottom,
				target: target
			}, (a, b) => a.target === b.target);
		}
	}

	private set_asHovering(match: S_Hit_Target | null) {
		this.w_s_hover.set(!match ? null : match);
		const autorepeating_target = get(this.w_autorepeat);
		if (!!autorepeating_target && (!match || !match.hasSameID_as(autorepeating_target))) {
			this.stop_autorepeat();
		}
		const longClick_target = get(this.w_longClick);
		if (!!longClick_target && (!match || !match.hasSameID_as(longClick_target))) {
			this.cancel_longClick();
		}
		if (!!this.pending_singleClick_target && (!match || !match.hasSameID_as(this.pending_singleClick_target))) {
			this.cancel_doubleClick();
		}
	}

	// ===== AUTOREPEAT =====

	start_autorepeat(target: S_Hit_Target) {
		if (!!target && target.autorepeat_callback) {
			this.stop_autorepeat();
			const id = target.autorepeat_id ?? 0;
			this.w_autorepeat.set(target);
			this.autorepeat_timer.autorepeat_start(id, () => {
				target.autorepeat_callback?.();
			});
		}
	}

	stop_autorepeat() {
		const autorepeating_target = get(this.w_autorepeat);
		if (!!autorepeating_target) {
			this.autorepeat_timer.autorepeat_stop();
			this.w_autorepeat.set(null);
		}
	}

	// ===== LONG CLICK =====

	start_longClick(target: S_Hit_Target, event: MouseEvent) {
		if (!!target && target.longClick_callback) {
			this.cancel_longClick();
			this.w_longClick.set(target);
			this.click_timer.timeout_start(T_Timer.long, () => {
				this.longClick_fired = true;
				target.clicks = 0;
				target.longClick_callback?.(S_Mouse.long(event, target.html_element));
				this.w_longClick.set(null);
			});
		}
	}

	cancel_longClick() {
		const longClick_target = get(this.w_longClick);
		if (!!longClick_target) {
			this.click_timer.reset();
			this.w_longClick.set(null);
		}
	}

	// ===== DOUBLE CLICK =====

	start_doubleClick_timer(target: S_Hit_Target, event: MouseEvent) {
		this.pending_singleClick_target = target;
		this.pending_singleClick_event = event;
		this.click_timer.timeout_start(T_Timer.double, () => {
			if (this.pending_singleClick_target && this.pending_singleClick_event) {
				this.pending_singleClick_target.handle_s_mouse?.(S_Mouse.down(this.pending_singleClick_event, this.pending_singleClick_target.html_element));
				this.pending_singleClick_target.clicks = 0;
				this.doubleClick_fired = true;
			}
			this.pending_singleClick_target = null;
			this.pending_singleClick_event = null;
		});
	}

	cancel_doubleClick() {
		if (this.pending_singleClick_target) {
			this.click_timer.reset();
			this.pending_singleClick_target = null;
			this.pending_singleClick_event = null;
		}
	}

}

export const hits = new Hits();
