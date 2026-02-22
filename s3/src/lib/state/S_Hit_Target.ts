import { T_Hit_Target, T_Mouse_Detection } from '../common/Enumerations';
import { S_Mouse }                         from './S_Mouse';
import { Rect, Point }                     from '../types/Coordinates';
import type { Ancestry }                   from '../nav/Ancestry';

export class S_Hit_Target {
	mouse_detection: T_Mouse_Detection = T_Mouse_Detection.none;
	contains_point?: (point: Point | null) => boolean;
	doubleClick_callback?: (s_mouse: S_Mouse) => void;
	longClick_callback?:   (s_mouse: S_Mouse) => void;
	handle_s_mouse?:       (s_mouse: S_Mouse) => boolean;
	autorepeat_callback?:  () => void;
	html_element: HTMLElement | null = null;
	element_rect: Rect | null       = null;
	autorepeat_id?: number;
	type:     T_Hit_Target;
	ancestry: Ancestry | null;
	clicks = 0;
	id:    string;

	constructor(type: T_Hit_Target, ancestry: Ancestry | null) {
		this.id       = type + '-' + (ancestry?.id ?? 'none');
		this.ancestry = ancestry;
		this.type     = type;
	}

	// ————————————————————————————————————————— Type queries

	get isADot():     boolean { return this.type === T_Hit_Target.drag || this.type === T_Hit_Target.reveal; }
	get isAWidget():  boolean { return this.type === T_Hit_Target.widget; }
	get isATitle():   boolean { return this.type === T_Hit_Target.title; }
	get isAControl(): boolean { return this.type === T_Hit_Target.control || this.type === T_Hit_Target.button; }

	// ————————————————————————————————————————— Detection queries

	get detects_longClick():   boolean { return (this.mouse_detection & T_Mouse_Detection.long) !== 0; }
	get detects_doubleClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.double) !== 0; }
	get detects_autorepeat():  boolean { return this.mouse_detection === T_Mouse_Detection.autorepeat; }

	get respondsTo_longClick():   boolean { return this.detects_longClick && !!this.longClick_callback; }
	get respondsTo_doubleClick(): boolean { return this.detects_doubleClick && !!this.doubleClick_callback; }
	get respondsTo_autorepeat():  boolean { return this.detects_autorepeat && !!this.autorepeat_callback; }

	// ————————————————————————————————————————— Rect

	get rect(): Rect | null { return this.element_rect; }

	set rect(value: Rect | null) {
		this.element_rect = value;
	}

	hasSameID_as(other: S_Hit_Target | null): boolean {
		return !!other && this.id === other.id;
	}

	update_rect() {
		if (this.html_element) {
			this.rect = Rect.rect_forElement(this.html_element);
		}
	}

	set_html_element(html_element: HTMLElement | null) {
		if (html_element) {
			this.html_element = html_element;
			this.update_rect();
		}
	}
}
