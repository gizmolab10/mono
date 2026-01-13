import { e, Point, radial, controls } from '../common/Global_Imports';
import { S_Mouse, S_Hit_Target } from '../common/Global_Imports';
import { T_Drag, T_Hit_Target } from '../common/Global_Imports';
import Mouse_Timer, { T_Timer } from '../signals/Mouse_Timer';
import type { Dictionary } from '../types/Types';
import { get, writable } from 'svelte/store';
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

	static readonly _____HOVER: unique symbol;

	get isHovering(): boolean { return get(this.w_s_hover) != null; }
	get paging_types(): Array<T_Hit_Target> { return [T_Hit_Target.paging]; }
	get hovering_type(): T_Hit_Target | null { return get(this.w_s_hover)?.type ?? null; }
	get ring_types(): Array<T_Hit_Target> { return [T_Hit_Target.rotation, T_Hit_Target.resizing]; }
	get rbush_forRubberband(): RBush<Target_RBRect> { return this.rbush_forTypes(this.rubberband_types); }
	get isHovering_inRing(): boolean { return !!this.hovering_type && this.ring_types.includes(this.hovering_type); }
	get isHovering_inPaging(): boolean { return !!this.hovering_type && this.paging_types.includes(this.hovering_type); }
	get isHovering_inWidget(): boolean { return !!this.hovering_type && this.rubberband_types.includes(this.hovering_type); }
	get rubberband_types(): Array<T_Hit_Target> { return [T_Hit_Target.widget, T_Hit_Target.drag, T_Hit_Target.reveal, T_Hit_Target.title]; }

	private detect_hovering_at(point: Point) {
		// Skip hover detection when disabled
		if (this.disable_hover) {
			return false;
		}
		const matches = this.targets_atPoint(point);	// # should always be small (verify?)
		const match = this.targetOf_highest_precedence(matches);
		this.set_asHovering(match);
		return !!match;
	}

	static readonly _____CLICKS: unique symbol;

	handle_s_mouse_at(point: Point, s_mouse: S_Mouse): boolean {
		const matches = this.targets_atPoint(point);
		const target = this.targetOf_highest_precedence(matches) ?? matches[0];
		if (!!s_mouse.event) {
			if (s_mouse.event.metaKey) {												// If meta key is held, force rubberband target (for graph dragging)
				const rubberband_target = matches.find(s => s.type === T_Hit_Target.rubberband);
				if (rubberband_target) {
					return rubberband_target.handle_s_mouse?.(s_mouse) ?? false;
				}
			} else if (!!target) {
				if (s_mouse.isDown && s_mouse.event) {
					target.clicks += 1;
					if (target.respondsTo_autorepeat) {
						target.handle_s_mouse?.(s_mouse);
						this.start_autorepeat(target);
					} else if (target.respondsTo_longClick) {							// Long-click detection
						this.start_longClick(target, s_mouse.event);
					} else if (target.respondsTo_doubleClick) {
						if (target.clicks == 2) { // && this.click_timer.hasTimer_forID(T_Timer.double) && this.pending_singleClick_target === target) {
							target.clicks = 0;
							this.click_timer.reset();									// Second click within threshold — fire double-click
							this.doubleClick_fired = true;
							this.pending_singleClick_event = null;
							this.pending_singleClick_target = null;
							target.doubleClick_callback!(S_Mouse.double(s_mouse.event, target.html_element));
						} else if (target.clicks == 1) {								// First click — defer single-click, start timer
							this.start_doubleClick_timer(target, s_mouse.event);
						}
					} else {
						target.handle_s_mouse?.(s_mouse);
					}
				} else if (s_mouse.isUp) {
					this.cancel_longClick();
					this.stop_autorepeat();
					if (this.longClick_fired || this.doubleClick_fired) {				// Suppress mouse-up if long- or double-click already fired
						this.doubleClick_fired = false;
						this.longClick_fired = false;
						target.clicks = 0;
					} else {
						// If waiting for double-click, don't fire handle_s_mouse on mouse up
						// It will fire when the timer expires (if no second click happens)
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
		}
		return true;
	}

	static readonly _____MOVEMENT: unique symbol;

	handle_mouse_movement_at(point: Point) {
		if (!radial.isDragging) {
			e.throttle('hover_detection', 60, () => {
				if (get(this.w_dragging) === T_Drag.none) {
					this.detect_hovering_at(point);
				}
			});
		}
		if (controls.inRadialMode) {
			e.throttle('radial_drag', 80, () => {
				radial.handle_mouse_drag();
			});
		}
	}

	static readonly _____GENERAL: unique symbol;

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
		this.rbush = bush;  // atomic swap
	}

	static readonly _____ADD_AND_REMOVE: unique symbol;

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
	static readonly _____INTERNALS: unique symbol;

	private get targets(): Array<S_Hit_Target> {
		return this.rbush.all().map(rbRect => rbRect.target);
	}

	private targets_atPoint(point: Point): Array<S_Hit_Target> {
		const targets = this.rbush.search(point.asBBox).map(rbRect => rbRect.target);
		return targets.filter(target => (target.contains_point?.(point) ?? true));	// refine using shape of target
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

	private targets_forTypes(types: Array<T_Hit_Target>): Array<S_Hit_Target> {
		const targets: Array<S_Hit_Target> = [];
		for (const type of types) {
			const byType = this.targets_dict_byType[type];
			if (!!byType && byType.length > 0) {
				targets.push(...byType);
			}
		}
		return targets;
	}

	private rbush_forTypes(types: Array<T_Hit_Target>): RBush<Target_RBRect> {
		const targets = this.targets_forTypes(types);
		const bush = new RBush<Target_RBRect>();
		for (const target of targets) {
			if (!!target && !!target.rect) {
				const rect = target.rect;
				bush.insert({
					minX: rect.x,
					minY: rect.y,
					maxX: rect.right,
					maxY: rect.bottom,
					target: target
				});
			}
		}
		return bush;
	}

	private set_asHovering(match: S_Hit_Target | null) {
		this.w_s_hover.set(!match ? null : match);
		// Stop autorepeat if hover leaves the autorepeating target
		const autorepeating_target = get(this.w_autorepeat);
		if (!!autorepeating_target && (!match || !match.hasSameID_as(autorepeating_target))) {
			this.stop_autorepeat();
		}
		// Cancel long-click if hover leaves the long-click target
		const longClick_target = get(this.w_longClick);
		if (!!longClick_target && (!match || !match.hasSameID_as(longClick_target))) {
			this.cancel_longClick();
		}
		// Cancel pending double-click if hover leaves the pending target
		if (!!this.pending_singleClick_target && (!match || !match.hasSameID_as(this.pending_singleClick_target))) {
			this.cancel_doubleClick();
		}
	}

	static readonly _____AUTOREPEAT: unique symbol;

	start_autorepeat(target: S_Hit_Target) {
		// start the timer (Mouse_Timer.autorepeat_start calls callback immediately, then starts interval)
		if (!!target && target.autorepeat_callback) {
			this.stop_autorepeat();			// stop any existing autorepeat
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

	static readonly _____LONG_CLICK: unique symbol;

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

	static readonly _____DOUBLE_CLICK: unique symbol;

	start_doubleClick_timer(target: S_Hit_Target, event: MouseEvent) {
		this.pending_singleClick_target = target;
		this.pending_singleClick_event = event;
		this.click_timer.timeout_start(T_Timer.double, () => {
			if (this.pending_singleClick_target && this.pending_singleClick_event) {
				// Fire deferred single-click: only fire down event
				// The actual mouse up already happened and was suppressed
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
