import { g, k, hits, Rect, Point, debug, colors, Ancestry, S_Mouse, T_Hit_Target, T_Mouse_Detection } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

export default class S_Hit_Target {

	// supports hit testing for all user-interactables in the DOM
	// S_Element, S_Widget, S_Component, S_Rotation, S_Resizing

	mouse_detection: T_Mouse_Detection = T_Mouse_Detection.none;
    containedIn_rect?: (rect: Rect | null) => boolean;
    contains_point?: (point: Point | null) => boolean;
	doubleClick_callback?: (s_mouse: S_Mouse) => void;
	longClick_callback?: (s_mouse: S_Mouse) => void;
	handle_s_mouse?: (s_mouse: S_Mouse) => boolean;
	identifiable: Identifiable | null = null;
	html_element: HTMLElement | null = null;
	element_rect: Rect | null = null;							// for use in Hits index
	autorepeat_callback?: () => void;
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	autorepeat_event?: MouseEvent;		// stored here to survive component recreation
	autorepeat_isFirstCall = true;		// stored here to survive component recreation
	private _hoverColor_override?: string;	// Cached hoverColor when element_color is explicitly set
	private _element_color_override?: string;	// Explicit override for buttons/controls (dots use thing_color automatically)
	autorepeat_id?: number;
	type: T_Hit_Target;
	clicks: number = 0;
	id: string;
	
	static empty() { return {}; }
	constructor(type: T_Hit_Target, identifiable: Identifiable | null) {
		this.id = type + '-' + (identifiable?.id ?? 'unknown identifiable');
		this.identifiable = identifiable;
		this.type = type;
		if (this.isADot) {
			this.hoverCursor = 'pointer';
		}
	}

	get stroke(): string { return 'red'; }				// override in subclasses
	get rect(): Rect | null { return this.element_rect; }
	get ancestry(): Ancestry { return this.identifiable as Ancestry; }
	get isATitle(): boolean { return this.type == T_Hit_Target.title; }
	get isAWidget(): boolean { return this.type == T_Hit_Target.widget; }
	get isHovering(): boolean { return this.hasSameID_as(get(hits.w_s_hover)); }
	get inAWidget(): boolean { return this.isAWidget || this.isADot || this.isATitle; }
	set isHovering(isHovering: boolean) { hits.w_s_hover.set(isHovering ? this : null); }
	get svg_hover_color(): string { return this.isHovering ? colors.background : this.stroke; }
	get isADot(): boolean { return [T_Hit_Target.drag, T_Hit_Target.reveal].includes(this.type); }
	get detects_longClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.long) !== 0; }
	get detects_autorepeat(): boolean { return this.mouse_detection === T_Mouse_Detection.autorepeat; }
	get respondsTo_longClick(): boolean { return this.detects_longClick && !!this.longClick_callback; }
	get detects_doubleClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.double) !== 0; }
	get respondsTo_autorepeat(): boolean { return this.detects_autorepeat && !!this.autorepeat_callback; }
	get respondsTo_doubleClick(): boolean { return this.detects_doubleClick && !!this.doubleClick_callback; }
	get isAControl(): boolean { return [T_Hit_Target.control, T_Hit_Target.button, T_Hit_Target.glow].includes(this.type); }
	get isRing(): boolean { return [T_Hit_Target.rotation, T_Hit_Target.resizing, T_Hit_Target.paging].includes(this.type); }

	set rect(value: Rect | null) {
		this.element_rect = value;
		hits.add_hit_target(this);
	}

	set element_color(value: string) {
		this._element_color_override = value;
		// Cache hoverColor when element_color is explicitly set
		this._hoverColor_override = colors.background_special_blend(value, k.opacity.medium);
	}

	get element_color(): string {
		// For dots: use thing_color if no override is set
		if (this.isADot && !this._element_color_override) {
			return this.ancestry?.thing?.color ?? 'black';
		}
		// For buttons/controls: use explicit override or default
		return this._element_color_override ?? 'black';
	}

	get hoverColor(): string {
		// If hoverColor was explicitly computed from a set element_color, use cached value
		if (this._hoverColor_override !== undefined) {
			return this._hoverColor_override;
		}
		// Otherwise compute from current element_color (which may be reactive for dots)
		return colors.background_special_blend(this.element_color, k.opacity.medium);
	}

	hasSameID_as(other: S_Hit_Target | null): boolean { return !!other && this.id == other.id; }

	set_forHovering(element_color: string, hoverCursor: string) {
		// Use setter which auto-computes hoverColor
		this.element_color = element_color;
		this.hoverCursor = hoverCursor;
	}

	set_html_element(html_element: HTMLElement | null) {
		if (!!html_element) {
			this.html_element = html_element;
			this.update_rect();
		} else {
			debug.log_hits(`no element for "${this.id}"`);
		}
	}

	update_rect() {
		if (!!this.html_element) {
			let rect = g.scaled_rect_forElement(this.html_element);
			if (rect && (this.isADot || this.isAWidget || this.isRing)) {
				const graph_bounds = get(g.w_rect_ofGraphView);
				if (graph_bounds) {
					rect = rect.clippedTo(graph_bounds);
				}
			}
			this.rect = rect;
		}
	}

}
