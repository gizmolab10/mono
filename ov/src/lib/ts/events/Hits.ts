import { T_Drag, T_Hit_Target } from '../types/Hit_Targets';
import Mouse_Timer, { T_Timer } from './Mouse_Timer';
import type { Dictionary } from '../types/Types';
import { Point, Rect } from '../types/Coordinates';
import { k } from '../common/Constants';
import { writable, get } from 'svelte/store';
import S_Hit_Target from './S_Hit_Target';
import { debug } from '../common/Debug';
import S_Mouse from './S_Mouse';
import { tick } from 'svelte';
import RBush from 'rbush';

// Who is under the cursor, and what a press on them means. ⟵di
//
// Every part of the app the mouse can reach registers one hit target holding the rectangle it
// stands in. They are kept in a structure that answers "what is at this point" without asking
// each in turn, so the question costs the same with four hundred of them as with four.
//
// One place answering it is the whole point: nothing watches its own hover, nothing has to be
// told when the cursor leaves, and two things overlapping cannot both believe they are pointed
// at. Which of them wins is one rule, written once, in targetOf_highest_precedence.
//
// It also holds the three questions about time — is this a second press, is this press being
// held, is a held press repeating — so no element has to keep a clock of its own.

type Target_RBRect = {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	target: S_Hit_Target;
}

export default class Hits {
	disable_hover = false;
	rebuild_is_waiting = false;      // a rebuild is already queued for the next drawing
	rebuild_is_drawing = false;      // a rebuild is already queued for the next frame
	drift_check: ReturnType<typeof setInterval> | null = null;   // the beat that asks whether the hovered target has gone stale
	longClick_fired: boolean = false;
	doubleClick_fired: boolean = false;
	rbush = new RBush<Target_RBRect>();
	targets_dict_byID: Dictionary<S_Hit_Target> = {};
	pending_singleClick_event: MouseEvent | null = null;
	pending_singleClick_target: S_Hit_Target | null = null;
	click_timer: Mouse_Timer = new Mouse_Timer('hits-click');
	targets_dict_byType: Dictionary<Array<S_Hit_Target>> = {};
	autorepeat_timer: Mouse_Timer = new Mouse_Timer('hits-autorepeat');
	// What the cursor was on when the button went down. A press is two facts — the thing pressed
	// and the place it was let go — and each is wanted by something different: a button asks
	// whether they agree, a drag asks only where it ended. Held by name rather than by the target
	// itself, since a drawing between the two can replace the very element that was pressed.
	pressed_id: string | null = null;

	w_s_hover	 = writable<S_Hit_Target | null>(null);
	w_longClick	 = writable<S_Hit_Target | null>(null);
	w_autorepeat = writable<S_Hit_Target | null>(null);
	w_dragging	 = writable<T_Drag>(T_Drag.none);

	constructor() {
		// Each needs the other; this is the half that can be told afterwards.
		S_Hit_Target.setHitsManager(this);
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
		const under = this.targetOf_highest_precedence(matches) ?? matches[0];

		// Letting go somewhere other than the thing pressed does nothing at all — the same as every
		// other app on the machine. The thing pressed is remembered on the way down and asked for
		// here; a drag never comes through this at all, so it still ends where the cursor is.
		if (s_mouse.isUp) {
			const pressed = this.pressed_id;
			this.pressed_id = null;
			this.cancel_longClick();
			this.stop_autorepeat();
			if (pressed === null) { return false; }
			if (!under || under.id !== pressed) {
				debug.log(`Press let go on "${under?.id ?? 'nothing'}" while "${pressed}" was pressed — they differ, so nothing happens.`);
				this.longClick_fired = false;
				this.doubleClick_fired = false;
				return false;
			}
			return this.finish_press(under, s_mouse);
		}

		if (!under) {
			if (s_mouse.isDown) { debug.log(`Press at ${Math.round(point.x)},${Math.round(point.y)} found nothing at all among ${matches.length} overlapping target(s).`); }
			this.pressed_id = null;
			return false;
		}
		const target = under;

		if (s_mouse.isDown) {
			this.pressed_id = target.id;
			target.clicks += 1;
			if (target.respondsTo_autorepeat) {
				// The repeating begins with one beat at once, and that beat is the press. Saying
				// the press here as well acted on a single click twice — a step mark went back
				// two files, and where the second step arrived back at the first it read as
				// doing nothing at all.
				this.start_autorepeat(target);
			} else if (s_mouse.event && target.respondsTo_longClick) {
				this.start_longClick(target, s_mouse.event);
			} else if (s_mouse.event && target.respondsTo_doubleClick) {
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
		}
		return true;
	}

	/**
	 * The press let go on the very thing it began on. Whatever a long press or a double press
	 * already did stands, and is not done again; anything else hears its release.
	 */
	private finish_press(target: S_Hit_Target, s_mouse: S_Mouse): boolean {
		if (this.longClick_fired || this.doubleClick_fired) {
			this.doubleClick_fired = false;
			this.longClick_fired = false;
			target.clicks = 0;
			return true;
		}
		const waiting_for_a_second = target.respondsTo_doubleClick &&
			this.click_timer.hasTimer_forID(T_Timer.double) &&
			this.pending_singleClick_target === target;
		if (waiting_for_a_second) { return true; }
		target.clicks = 0;
		return target.handle_s_mouse?.(s_mouse) ?? false;
	}

	// ===== MOVEMENT =====

	handle_mouse_movement_at(point: Point) {
		if (get(this.w_dragging) === T_Drag.none) {
			this.detect_hovering_at(point);
		}
	}

	clear_hover() {
		this.set_asHovering(null);
	}

	// ===== GENERAL =====

	reset() {
		this.rbush.clear();
		this.pressed_id = null;
		this.stop_autorepeat();
		this.cancel_longClick();
		this.set_asHovering(null);
		this.cancel_doubleClick();
		this.targets_dict_byID = {};
		this.longClick_fired = false;
		this.targets_dict_byType = {};
	}

	/**
	 * Every target asked again, once the browser has drawn. A run of things arriving together each
	 * asks for this, so the second and every one after it join the one already waiting — forty rows
	 * arriving cost one rebuild rather than forty.
	 */
	async defer_recalibrate() {
		if (this.rebuild_is_waiting) { return; }
		this.rebuild_is_waiting = true;
		// The waiting is what clears the flag, so it is cleared whatever the waiting does. Left set
		// by a wait that never came back, every later request would see one already queued and turn
		// away — and since a target asks for this the moment it arrives, nothing would ever be
		// measured again and no press would reach anything.
		try {
			await tick();
		} finally {
			this.rebuild_is_waiting = false;
		}
		this.recalibrate();
	}

	/**
	 * Every target asked again where it stands, at the next drawing. Scrolling says this on every
	 * one of its events, and each rectangle read makes the browser settle its layout — so the
	 * asking is held until the drawing, and a fast scroll costs one rebuild rather than a hundred.
	 */
	recalibrate_when_drawn() {
		if (this.rebuild_is_drawing) { return; }
		this.rebuild_is_drawing = true;
		requestAnimationFrame(() => {
			// Cleared whatever the rebuild does, for the same reason the deferred one is.
			try {
				this.recalibrate();
			} finally {
				this.rebuild_is_drawing = false;
			}
		});
	}

	/**
	 * Everything inside one scrolling box moved by exactly this much. Nothing is read from the
	 * browser: a scroll moves every rectangle in the box by the distance scrolled and leaves every
	 * other rectangle where it was, so the distance is applied and the structure rebuilt from what
	 * is already held.
	 *
	 * Asking which targets are inside the box walks up from each element, which costs nothing —
	 * unlike reading a rectangle, which makes the browser settle its layout first.
	 */
	shift_inside(box: HTMLElement, by: Point) {
		const bush = new RBush<Target_RBRect>();
		for (const target of [...this.targets]) {
			if (!target.rect) { continue; }
			const element = target.html_element;
			if (!!element && element !== box && box.contains(element)) {
				target.shift_by(by);
			}
			this.insert_into_rbush(target, bush);
		}
		this.rbush = bush;
	}

	/** Every target asked again where it stands. Said after anything that moves things about. */
	recalibrate() {
		const bush = new RBush<Target_RBRect>();
		const flat: string[] = [];
		const gone: string[] = [];
		for (const target of [...this.targets]) {
			// A target whose element has left the page answers for nothing and can never be asked
			// again, so it goes here. Whatever drew it may be long finished by now; this is the one
			// place that looks at every one of them.
			const element = target.html_element;
			if (!!element && !element.isConnected) {
				gone.push(target.id);
				this.delete_hit_target(target);
				continue;
			}
			target.update_rect();
			const rect = target.rect;
			if (!!rect) {
				// A rectangle of no size at the very corner of the page is what an element that is
				// not drawn measures at. It answers for nowhere, which is worth saying by name: a run
				// of them means everything was asked where it stood before the browser put it there.
				if (rect.width === 0 && rect.height === 0) { flat.push(target.id); }
				this.insert_into_rbush(target, bush);
			}
		}
		this.rbush = bush;
		if (gone.length > 0) {
			debug.log(`Hits: ${gone.length} target(s) whose element had left the page were let go: ${gone.join(', ')}.`);
		}
		if (flat.length > 0) {
			debug.log(`Hits: asked all ${this.targets.length} target(s) again — ${flat.length} measured no size at all, so a press there reaches nothing: ${flat.join(', ')}.`);
		}
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
				// Two things claiming one name: the older goes, and whatever it answered for
				// answers nothing from here on. Said out loud, since nothing on screen shows it.
				if (existing.html_element !== target.html_element) {
					debug.log(`Hits: two targets are called "${id}" — the older one is gone, and whatever it answered for now answers nothing.`);
				}
				this.delete_hit_target(existing);
			}
		}
		this.targets_dict_byID[id] = target;
		this.targets_dict_byType[type].push(target);
		this.insert_into_rbush(target, this.rbush);
	}

	delete_hit_target(target: S_Hit_Target) {
		if (!!target && !!target.rect) {
			// Going while the cursor is on it would leave its stamp standing.
			if (get(this.w_s_hover) === target) { this.set_asHovering(null); }
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

	/**
	 * Where two overlap, the smaller thing wins: a control, then a section, then the page — and
	 * within one kind, the one standing in the smaller area. Sections sit inside sections, so
	 * without that last part the tags row inside the whole filter form would be answered for by
	 * the form, whichever of the two the tree happened to hand over first.
	 */
	private targetOf_highest_precedence(matches: Array<S_Hit_Target>): S_Hit_Target | null {
		return this.smallest_of(matches, T_Hit_Target.control)
			?? this.smallest_of(matches, T_Hit_Target.section)
			?? this.smallest_of(matches, T_Hit_Target.page)
			?? matches[0];
	}

	/** The one of this kind standing in the smallest area, or nothing where none is of this kind. */
	private smallest_of(matches: Array<S_Hit_Target>, type: T_Hit_Target): S_Hit_Target | null {
		let smallest: S_Hit_Target | null = null;
		let least = Infinity;
		for (const one of matches) {
			if (one.type !== type) { continue; }
			const rect = one.rect;
			const area = !rect ? Infinity : rect.size.width * rect.size.height;
			if (area < least) {
				smallest = one;
				least = area;
			}
		}
		return smallest;
	}

	/**
	 * The one guard against the whole design's one weakness: every rectangle is held rather than
	 * read, so anything that moves without saying so leaves a target answering for a strip of the
	 * page it no longer occupies — and nothing on screen shows it.
	 *
	 * While the cursor rests on a target, its rectangle is read afresh once a second and compared
	 * with what is held. A difference is somebody's missing word, and it is said in the log with
	 * both readings. One read a second, and only while something is hovered.
	 */
	private watch_for_drift(target: S_Hit_Target | null) {
		if (this.drift_check !== null) {
			clearInterval(this.drift_check);
			this.drift_check = null;
		}
		if (!target) { return; }
		this.drift_check = setInterval(() => {
			const held = target.rect;
			const drawn = Rect.rect_forElement(target.html_element);
			if (!held || !drawn || !held.differs_from(drawn, k.thickness.faint)) { return; }
			this.say_it_drifted(target, held, drawn);
		}, k.timeout.drift);
	}

	/**
	 * Said in a box the reader cannot miss, since this is a fault nothing on screen shows and the
	 * app goes on working. It carries everything needed to mend it: which target, what kind it is,
	 * where it is held, where it is drawn, how far off that is, and what the element is called on
	 * the page. Said once — the check stops rather than saying the same thing every second.
	 */
	private say_it_drifted(target: S_Hit_Target, held: Rect, drawn: Rect) {
		if (this.drift_check !== null) {
			clearInterval(this.drift_check);
			this.drift_check = null;
		}
		const element = target.html_element;
		const named = !element ? 'nothing' : `<${element.tagName.toLowerCase()} class="${element.className}">`;
		const words = [
			`A hit target has gone stale — it answers for a strip of the page it no longer stands on.`,
			``,
			`    what     ${target.id}`,
			`    kind     ${T_Hit_Target[target.type]}`,
			`    element  ${named}`,
			`    held at  ${held.description}`,
			`    drawn at ${drawn.description}`,
			`    off by   ${Math.round(drawn.x - held.x)} across, ${Math.round(drawn.y - held.y)} down,`
				+ ` ${Math.round(drawn.width - held.width)} wider, ${Math.round(drawn.height - held.height)} taller`,
			``,
			`Something moved it and nothing told the hits manager. Whatever does the moving must say`,
			`so — hits.recalibrate() for a change of shape, hits.shift_inside() for a scroll, or`,
			`hits.defer_recalibrate() to wait for the drawing first.`,
		].join('\n');
		debug.log(words);
		alert(words);
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
		// Said only when the answer changes: the cursor crossing one control would otherwise say
		// the same thing on every move of the mouse.
		const held = get(this.w_s_hover);
		if (held === match) { return; }
		// The one the cursor left and the one it reached are the only two elements that change, so
		// they are the only two touched. Nothing else is told.
		held?.html_element?.removeAttribute('data-hit');
		match?.html_element?.setAttribute('data-hit', '');
		this.w_s_hover.set(!match ? null : match);
		this.watch_for_drift(match);
		// The repeating is left alone here. It runs only while a press is held, and letting that
		// press go always stops it — so nothing else needs to. Stopping it on a change of hover
		// killed every patter before it began: stepping to another file draws the mark afresh, the
		// old element leaves the page, the manager lets its target go and says nothing is hovered,
		// and that arrived long before the 800ms wait was over.
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
