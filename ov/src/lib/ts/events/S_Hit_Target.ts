import { T_Hit_Target, T_Mouse_Detection } from '../types/Hit_Targets';
import type { Writable } from 'svelte/store';
import { Rect, Point } from '../types/Coordinates';
import { k } from '../common/Constants';
import { get } from 'svelte/store';
import S_Mouse from './S_Mouse';

// One thing the mouse can reach. ⟵di
//
// It holds the rectangle it stands in, what kind of thing it is, which kinds of press it watches
// for, and what to do about each. Nothing here watches the mouse: the one manager asks every
// target where it is, works out which is under the cursor, and hands the press to it.

// Set by the manager as it is made — each needs the other, and this is the half that can wait.
let hits: { w_s_hover: Writable<S_Hit_Target | null>; add_hit_target: (target: S_Hit_Target) => void } | null = null;

export default class S_Hit_Target {

	static setHitsManager(h: typeof hits) {
		hits = h;
	}

	mouse_detection: T_Mouse_Detection = T_Mouse_Detection.none;
	containedIn_rect?: (rect: Rect | null) => boolean;
	contains_point?: (point: Point | null) => boolean;
	doubleClick_callback?: (s_mouse: S_Mouse) => void;
	longClick_callback?: (s_mouse: S_Mouse) => void;
	handle_s_mouse?: (s_mouse: S_Mouse) => boolean;
	html_element: HTMLElement | null = null;
	element_rect: Rect | null = null;
	autorepeat_callback?: () => void;
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	autorepeat_event?: MouseEvent;
	tip: string | null = null;         // the words shown while the cursor is on it
	autorepeat_isFirstCall = true;
	autorepeat_id?: number;
	type: T_Hit_Target;
	clicks: number = 0;
	hid: number | null;
	id: string;

	constructor(type: T_Hit_Target, id: string) {
		const n = Number(id);
		this.hid = Number.isFinite(n) ? n : null;
		this.id = type + '-' + id;
		this.type = type;
	}

	get rect(): Rect | null { return this.element_rect; }
	get isHovering(): boolean { return hits ? this.hasSameID_as(get(hits.w_s_hover)) : false; }
	set isHovering(isHovering: boolean) { if (hits) { hits.w_s_hover.set(isHovering ? this : null); } }

	get detects_longClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.long) !== 0; }
	get detects_autorepeat(): boolean { return this.mouse_detection === T_Mouse_Detection.autorepeat; }
	get respondsTo_longClick(): boolean { return this.detects_longClick && !!this.longClick_callback; }
	get detects_doubleClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.double) !== 0; }
	get respondsTo_autorepeat(): boolean { return this.detects_autorepeat && !!this.autorepeat_callback; }
	get respondsTo_doubleClick(): boolean { return this.detects_doubleClick && !!this.doubleClick_callback; }

	set rect(value: Rect | null) {
		this.element_rect = value;
		if (hits) { hits.add_hit_target(this); }
	}

	hasSameID_as(other: S_Hit_Target | null): boolean { return !!other && this.id == other.id; }

	set_html_element(html_element: HTMLElement | null) {
		if (!!html_element) {
			this.html_element = html_element;
			this.update_rect();
		}
	}

	update_rect() {
		if (!!this.html_element) {
			this.rect = Rect.rect_forElement(this.html_element);
		}
	}

}
