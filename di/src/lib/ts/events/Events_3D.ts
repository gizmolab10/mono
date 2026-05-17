import { T_Hit_3D, T_Editing } from '../types/Enumerations';
import { dimensions } from '../editors/Dimension';
import { selection } from '../managers/Selection';
import { angulars } from '../editors/Angular';
import { history } from '../managers/History';
import { Point } from '../types/Coordinates';
import { stores } from '../managers/Stores';
import { scenes } from '../managers/Scenes';
import { drag } from '../editors/Drag';
import { hits_3d } from './Hits_3D';

type T_Handle_Drag = (prev_mouse: Point, curr_mouse: Point, alt_key: boolean) => void;
class Events_3D {
	mouse_in_canvas = false;
	private did_drag = false;  // true if mouse moved while dragging
	private is_dragging = false;
	private on_drag: T_Handle_Drag | null = null;
	private on_drag_end: (() => void) | null = null;
	private last_canvas_position: Point = Point.zero;  // canvas-relative position

	canvas: HTMLCanvasElement | null = null;

	// Listener references kept so a re-init (from hot reload or scene switch)
	// can remove the old ones before attaching new ones. Without this, every
	// hot reload during development piles up another set of listeners, and
	// mouseup runs end_drag once per attached listener. The first end_drag
	// run clears the drag target; the second run then sees no target and
	// deselects through the click-on-background branch.
	private listener_mouseenter: ((e: MouseEvent) => void) | null = null;
	private listener_mouseleave: ((e: MouseEvent) => void) | null = null;
	private listener_mousedown:  ((e: MouseEvent) => void) | null = null;
	private listener_mouseup:    (() => void) | null = null;
	private listener_mousemove:  ((e: MouseEvent) => void) | null = null;
	private prev_canvas: HTMLCanvasElement | null = null;

	init(canvas: HTMLCanvasElement): void {
		// Detach any previously attached listeners before adding the new set
		// so re-init (from hot reload or a fresh scene) doesn't accumulate
		// duplicates. Each duplicate makes mouseup fire end_drag again,
		// which clears the drag target the previous run set up and triggers
		// the click-on-background deselect branch.
		if (this.listener_mouseenter && this.prev_canvas) this.prev_canvas.removeEventListener('mouseenter', this.listener_mouseenter);
		if (this.listener_mouseleave && this.prev_canvas) this.prev_canvas.removeEventListener('mouseleave', this.listener_mouseleave);
		if (this.listener_mousedown  && this.prev_canvas) this.prev_canvas.removeEventListener('mousedown',  this.listener_mousedown);
		if (this.listener_mousemove  && this.prev_canvas) this.prev_canvas.removeEventListener('mousemove',  this.listener_mousemove);
		if (this.listener_mouseup) document.removeEventListener('mouseup', this.listener_mouseup);

		this.canvas = canvas;
		this.prev_canvas = canvas;

		if ('ontouchstart' in window) return;

		this.listener_mouseenter = () => { this.mouse_in_canvas = true; };
		this.listener_mouseleave = () => { this.mouse_in_canvas = false; };
		canvas.addEventListener('mouseenter', this.listener_mouseenter);
		canvas.addEventListener('mouseleave', this.listener_mouseleave);

		this.listener_mousedown = (e: MouseEvent) => {
			this.begin_drag(canvas, e.clientX, e.clientY, e);
		};
		canvas.addEventListener('mousedown', this.listener_mousedown);

		this.listener_mouseup = () => {
			this.end_drag();
		};
		document.addEventListener('mouseup', this.listener_mouseup);

		this.listener_mousemove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const point = new Point(e.clientX - rect.left, e.clientY - rect.top);

			if (!this.is_dragging) {
				if (!stores.allow_editing) {
					canvas.style.cursor = 'grab';
					hits_3d.hover = null;
					hits_3d.hovered_dimension = null;
				} else {
					const hit = hits_3d.hit_test(point, e.altKey);

					// Cursor: text for labels/dimensions, grab for everything else
					const is_text = hit?.type === T_Hit_3D.dimension || hit?.type === T_Hit_3D.angle || hit?.type === T_Hit_3D.face_label;
					canvas.style.cursor = is_text ? 'text' : 'grab';

					// Hover shows face — convert corner/edge hits to best face.
					// The renderer skips drawing hover dots and the hover edge-color
					// when the hovered face is also the selected face, so setting
					// the hover store on the selected face does not cause a visual
					// regression. The name-popup overlay in the drawing-area uses
					// this store and now appears for the selected part too.
					const face_hit = hit ? hits_3d.hit_to_face(hit) : null;
					hits_3d.hover = face_hit;

					// Track the dimension under the cursor so the renderer can
					// bold its text and thicken its dimension and witness lines.
					if (hit?.type === T_Hit_3D.dimension) {
						const dim_rect = dimensions.hit_test(point.x, point.y);
						hits_3d.hovered_dimension = dim_rect ? { so: dim_rect.so, axis: dim_rect.axis } : null;
					} else {
						hits_3d.hovered_dimension = null;
					}
				}
			} else if (this.on_drag) {
				this.continue_drag(canvas, e.clientX, e.clientY, e.altKey);
			}
		};
		canvas.addEventListener('mousemove', this.listener_mousemove);

	}

	// ── Shared drag logic ──

	begin_drag(canvas: HTMLCanvasElement, clientX: number, clientY: number, e?: MouseEvent): void {
		this.is_dragging = true;
		this.did_drag = false;

		const rect = canvas.getBoundingClientRect();
		const point = new Point(clientX - rect.left, clientY - rect.top);
		this.last_canvas_position = point;

		// Read-only mode: only allow tumble (no editing, no drag, no selection)
		if (!stores.allow_editing) {
			drag.set_target(null);
			hits_3d.hover = null;
			hits_3d.hovered_dimension = null;
			return;
		}

		const hit = hits_3d.hit_test(point, e?.altKey ?? false);

		// Dimension or face label hit — begin editing immediately
		if (hit?.type === T_Hit_3D.dimension) {
			e?.preventDefault();
			const dim = dimensions.hit_test(point.x, point.y);
			if (dim) dimensions.begin(dim);
			drag.set_target(null);
			hits_3d.hover = null;
			hits_3d.hovered_dimension = null;
			return;
		} else if (hit?.type === T_Hit_3D.angle) {
			e?.preventDefault();
			const ang = angulars.hit_test(point.x, point.y);
			if (ang) angulars.begin(ang);
			drag.set_target(null);
			hits_3d.hover = null;
			hits_3d.hovered_dimension = null;
			return;
		}

		// Snapshot for undo before any drag mutation
		if (hit) history.snapshot();

		// Store what we're actually dragging (corner/edge/face)
		drag.set_target(hit);

		// Clear hover during drag (especially rotation)
		hits_3d.hover = null;
		hits_3d.hovered_dimension = null;

		// Face click → select that face. Command-click on a face toggles the
		// face's part in the multi-selection list instead of replacing the
		// selection.
		// Corner/edge click → select best face (only if nothing selected yet).
		if (hit) {
			if (hit.type === T_Hit_3D.face) {
				if (e?.metaKey) {
					selection.toggle(hit);
				} else {
					selection.current = hit;
				}
			} else if (!selection.current) {
				const face_hit = hits_3d.hit_to_face(hit);
				if (face_hit) selection.current = face_hit;
			}
		}
	}

	continue_drag(canvas: HTMLCanvasElement, clientX: number, clientY: number, altKey: boolean): void {
		const rect = canvas.getBoundingClientRect();
		const prev = this.last_canvas_position;
		const curr = new Point(clientX - rect.left, clientY - rect.top);
		if (prev.x !== curr.x || prev.y !== curr.y) {
			this.did_drag = true;
		}
		this.last_canvas_position = curr;
		if (this.on_drag) this.on_drag(prev, curr, altKey);
	}

	end_drag(): void {
		if (this.is_dragging && !this.did_drag && this.mouse_in_canvas) {
			// Click/tap on background → deselect (but not if editing just started)
			if (!drag.has_target && stores.editing === T_Editing.none) {
				const root = scenes.root_so;
				if (root && selection.current?.so !== root) {
					selection.current = { so: root, type: T_Hit_3D.face, index: 0 };
				} else {
					selection.current = null;
				}
			}
		}
		if (this.did_drag && this.on_drag_end) this.on_drag_end();
		this.is_dragging = false;
		this.did_drag = false;
		drag.clear();
	}

	set_drag_handler(callback: T_Handle_Drag): void {
		this.on_drag = callback;
	}

	set_drag_end_handler(callback: () => void): void {
		this.on_drag_end = callback;
	}

}

export const e3 = new Events_3D();
