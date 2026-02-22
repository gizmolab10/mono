import { S_Hit_Target }              from '../state/S_Hit_Target';
import { S_Mouse }                   from '../state/S_Mouse';
import { T_Drag }                    from '../common/Enumerations';
import { Mouse_Timer, T_Timer }      from '../signals/Mouse_Timer';
import { Point }                     from '../types/Coordinates';
import RBush                         from 'rbush';

type Target_RBRect = {
	minX:   number;
	minY:   number;
	maxX:   number;
	maxY:   number;
	target: S_Hit_Target;
}

class S_Hits {
	disable_hover          = false;
	longClick_fired        = false;
	doubleClick_fired      = false;
	rbush                  = new RBush<Target_RBRect>();
	targets_byID:   Record<string, S_Hit_Target> = {};
	targets_byType: Record<string, S_Hit_Target[]> = {};

	pending_singleClick_event:  MouseEvent | null    = null;
	pending_singleClick_target: S_Hit_Target | null  = null;
	click_timer      = new Mouse_Timer();
	autorepeat_timer = new Mouse_Timer();

	hovering:     S_Hit_Target | null = $state(null);
	longClicking: S_Hit_Target | null = $state(null);
	autorepeating: S_Hit_Target | null = $state(null);
	dragging:     T_Drag              = $state(T_Drag.none);

	// ————————————————————————————————————————— Hover

	private detect_hovering_at(point: Point): boolean {
		if (this.disable_hover) return false;
		const matches = this.targets_atPoint(point);
		const match   = this.targetOf_highest_precedence(matches);
		this.set_asHovering(match);
		return !!match;
	}

	// ————————————————————————————————————————— Click state machine

	handle_s_mouse_at(point: Point, s_mouse: S_Mouse): boolean {
		const matches = this.targets_atPoint(point);
		const target  = this.targetOf_highest_precedence(matches) ?? matches[0];
		if (!s_mouse.event || !target) return true;

		if (s_mouse.isDown && s_mouse.event) {
			target.clicks += 1;

			if (target.respondsTo_autorepeat) {
				target.handle_s_mouse?.(s_mouse);
				this.start_autorepeat(target);

			} else if (target.respondsTo_longClick) {
				this.start_longClick(target, s_mouse.event);

			} else if (target.respondsTo_doubleClick) {
				if (target.clicks === 2) {
					target.clicks = 0;
					this.click_timer.reset();
					this.doubleClick_fired = true;
					this.pending_singleClick_event  = null;
					this.pending_singleClick_target = null;
					target.doubleClick_callback!(S_Mouse.double(s_mouse.event, target.html_element));
				} else if (target.clicks === 1) {
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
				this.longClick_fired   = false;
				target.clicks = 0;
			} else {
				const waitingForDoubleClick =
					target.respondsTo_doubleClick &&
					this.click_timer.hasTimer_forID(T_Timer.double) &&
					this.pending_singleClick_target === target;
				if (!waitingForDoubleClick) {
					target.clicks = 0;
					return target.handle_s_mouse?.(s_mouse) ?? false;
				}
			}
		}
		return true;
	}

	// ————————————————————————————————————————— Movement

	handle_mouse_movement_at(point: Point) {
		if (this.dragging === T_Drag.none) {
			this.detect_hovering_at(point);
		}
	}

	// ————————————————————————————————————————— Add / Remove

	add_hit_target(target: S_Hit_Target) {
		const id   = target.id;
		const type = target.type;
		if (!this.targets_byType[type]) {
			this.targets_byType[type] = [];
		} else {
			const existing = this.targets_byType[type].find(t => t.id === id);
			if (existing) this.delete_hit_target(existing);
		}
		this.targets_byID[id] = target;
		this.targets_byType[type].push(target);
		this.insert_into_rbush(target);
	}

	delete_hit_target(target: S_Hit_Target) {
		if (!target || !target.rect) return;
		delete this.targets_byID[target.id];
		const byType = this.targets_byType[target.type];
		if (byType) {
			const index = byType.indexOf(target);
			if (index !== -1) byType.splice(index, 1);
		}
		this.remove_from_rbush(target);
	}

	reset() {
		this.rbush.clear();
		this.stop_autorepeat();
		this.cancel_longClick();
		this.cancel_doubleClick();
		this.hovering          = null;
		this.targets_byID      = {};
		this.targets_byType    = {};
		this.longClick_fired   = false;
	}

	recalibrate() {
		const all_targets = this.rbush.all().map(r => r.target);
		const bush = new RBush<Target_RBRect>();
		for (const target of all_targets) {
			target.update_rect();
			if (target.rect) {
				bush.insert({
					minX: target.rect.x,
					minY: target.rect.y,
					maxX: target.rect.right,
					maxY: target.rect.bottom,
					target,
				});
			}
		}
		this.rbush = bush;
	}

	// ————————————————————————————————————————— Internals

	private targets_atPoint(point: Point): S_Hit_Target[] {
		const targets = this.rbush.search(point.asBBox).map(r => r.target);
		return targets.filter(t => (t.contains_point?.(point) ?? true));
	}

	private targetOf_highest_precedence(matches: S_Hit_Target[]): S_Hit_Target | null {
		return matches.find(s => s.isADot)
			?? matches.find(s => s.isAWidget)
			?? matches.find(s => s.isAControl)
			?? matches[0]
			?? null;
	}

	private insert_into_rbush(target: S_Hit_Target) {
		const rect = target.rect;
		if (rect) {
			this.rbush.insert({
				minX: rect.x,
				minY: rect.y,
				maxX: rect.right,
				maxY: rect.bottom,
				target,
			});
		}
	}

	private remove_from_rbush(target: S_Hit_Target) {
		if (target?.rect) {
			this.rbush.remove({
				minX: target.rect.x,
				minY: target.rect.y,
				maxX: target.rect.right,
				maxY: target.rect.bottom,
				target,
			}, (a, b) => a.target === b.target);
		}
	}

	private set_asHovering(match: S_Hit_Target | null) {
		this.hovering = match ?? null;

		if (this.autorepeating && (!match || !match.hasSameID_as(this.autorepeating))) {
			this.stop_autorepeat();
		}
		if (this.longClicking && (!match || !match.hasSameID_as(this.longClicking))) {
			this.cancel_longClick();
		}
		if (this.pending_singleClick_target && (!match || !match.hasSameID_as(this.pending_singleClick_target))) {
			this.cancel_doubleClick();
		}
	}

	// ————————————————————————————————————————— Autorepeat

	private start_autorepeat(target: S_Hit_Target) {
		if (target?.autorepeat_callback) {
			this.stop_autorepeat();
			const id = target.autorepeat_id ?? 0;
			this.autorepeating = target;
			this.autorepeat_timer.autorepeat_start(id, () => {
				target.autorepeat_callback?.();
			});
		}
	}

	private stop_autorepeat() {
		if (this.autorepeating) {
			this.autorepeat_timer.autorepeat_stop();
			this.autorepeating = null;
		}
	}

	// ————————————————————————————————————————— Long-click

	private start_longClick(target: S_Hit_Target, event: MouseEvent) {
		if (target?.longClick_callback) {
			this.cancel_longClick();
			this.longClicking = target;
			this.click_timer.timeout_start(T_Timer.long, () => {
				this.longClick_fired = true;
				target.clicks = 0;
				target.longClick_callback?.(S_Mouse.long(event, target.html_element));
				this.longClicking = null;
			});
		}
	}

	private cancel_longClick() {
		if (this.longClicking) {
			this.click_timer.reset();
			this.longClicking = null;
		}
	}

	// ————————————————————————————————————————— Double-click

	private start_doubleClick_timer(target: S_Hit_Target, event: MouseEvent) {
		this.pending_singleClick_target = target;
		this.pending_singleClick_event  = event;
		this.click_timer.timeout_start(T_Timer.double, () => {
			if (this.pending_singleClick_target && this.pending_singleClick_event) {
				this.pending_singleClick_target.handle_s_mouse?.(
					S_Mouse.down(this.pending_singleClick_event, this.pending_singleClick_target.html_element)
				);
				this.pending_singleClick_target.clicks = 0;
				this.doubleClick_fired = true;
			}
			this.pending_singleClick_target = null;
			this.pending_singleClick_event  = null;
		});
	}

	private cancel_doubleClick() {
		if (this.pending_singleClick_target) {
			this.click_timer.reset();
			this.pending_singleClick_target = null;
			this.pending_singleClick_event  = null;
		}
	}
}

export const hits = new S_Hits();
