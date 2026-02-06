import { T_Hit_Target, T_Mouse_Detection } from '../types/Enumerations';
import { Rect, Point } from '../types/Coordinates';
import S_Mouse from './S_Mouse';
import { k } from '../common/Constants';
import { get } from 'svelte/store';

// Forward declaration - will be set by Hits manager
let hits: { w_s_hover: any; add_hit_target: (target: S_Hit_Target) => void } | null = null;

export function setHitsManager(h: typeof hits) {
	hits = h;
}

export default class S_Hit_Target {

	// Supports hit testing for all user-interactables in the DOM

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
	autorepeat_isFirstCall = true;
	autorepeat_id?: number;
	type: T_Hit_Target;
	clicks: number = 0;
	id: string;
	
	constructor(type: T_Hit_Target, id: string) {
		this.id = type + '-' + id;
		this.type = type;
	}

	get rect(): Rect | null { return this.element_rect; }
	get isHovering(): boolean { return hits ? this.hasSameID_as(get(hits.w_s_hover)) : false; }
	set isHovering(isHovering: boolean) { if (hits) hits.w_s_hover.set(isHovering ? this : null); }

	get isADot(): boolean { return [T_Hit_Target.drag, T_Hit_Target.reveal].includes(this.type); }
	get isAWidget(): boolean { return this.type == T_Hit_Target.widget; }
	get isAControl(): boolean { return [T_Hit_Target.control, T_Hit_Target.button, T_Hit_Target.glow].includes(this.type); }
	get isRing(): boolean { return [T_Hit_Target.rotation, T_Hit_Target.resizing, T_Hit_Target.paging].includes(this.type); }

	get detects_longClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.long) !== 0; }
	get detects_autorepeat(): boolean { return this.mouse_detection === T_Mouse_Detection.autorepeat; }
	get respondsTo_longClick(): boolean { return this.detects_longClick && !!this.longClick_callback; }
	get detects_doubleClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.double) !== 0; }
	get respondsTo_autorepeat(): boolean { return this.detects_autorepeat && !!this.autorepeat_callback; }
	get respondsTo_doubleClick(): boolean { return this.detects_doubleClick && !!this.doubleClick_callback; }

	set rect(value: Rect | null) {
		this.element_rect = value;
		if (hits) hits.add_hit_target(this);
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
