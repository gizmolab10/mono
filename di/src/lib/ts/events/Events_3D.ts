import { T_Hit_3D, T_Editing } from '../types/Enumerations';
import { face_label } from '../editors/Face_Label';
import { dimensions } from '../editors/Dimension';
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

	init(canvas: HTMLCanvasElement): void {
		this.canvas = canvas;

		if ('ontouchstart' in window) return;

		canvas.addEventListener('mouseenter', () => { this.mouse_in_canvas = true; });
		canvas.addEventListener('mouseleave', () => { this.mouse_in_canvas = false; });

		canvas.addEventListener('mousedown', (e) => {
			this.begin_drag(canvas, e.clientX, e.clientY, e);
		});

		document.addEventListener('mouseup', () => {
			this.end_drag();
		});

		canvas.addEventListener('mousemove', (e) => {
			const rect = canvas.getBoundingClientRect();
			const point = new Point(e.clientX - rect.left, e.clientY - rect.top);

			if (!this.is_dragging) {
				if (!stores.allow_editing()) {
					canvas.style.cursor = 'grab';
					hits_3d.set_hover(null);
				} else {
					const hit = hits_3d.hit_test(point);

					// Cursor: text for labels/dimensions, grab for everything else
					const is_text = hit?.type === T_Hit_3D.dimension || hit?.type === T_Hit_3D.angle || hit?.type === T_Hit_3D.face_label;
					canvas.style.cursor = is_text ? 'text' : 'grab';

					// Hover shows face — convert corner/edge hits to best face
					// But don't hover on already-selected face
					const face_hit = hit ? hits_3d.hit_to_face(hit) : null;
					const sel = hits_3d.selection;
					const is_selected = face_hit && sel &&
						face_hit.so === sel.so && face_hit.index === sel.index;
					hits_3d.set_hover(is_selected ? null : face_hit);
				}
			} else if (this.on_drag) {
				this.continue_drag(canvas, e.clientX, e.clientY, e.altKey);
			}
		});

	}

	// ── Shared drag logic ──

	begin_drag(canvas: HTMLCanvasElement, clientX: number, clientY: number, e?: MouseEvent): void {
		this.is_dragging = true;
		this.did_drag = false;

		const rect = canvas.getBoundingClientRect();
		const point = new Point(clientX - rect.left, clientY - rect.top);
		this.last_canvas_position = point;

		// Read-only mode: only allow tumble (no editing, no drag, no selection)
		if (!stores.allow_editing()) {
			drag.set_target(null);
			hits_3d.set_hover(null);
			return;
		}

		const hit = hits_3d.hit_test(point);

		// Dimension or face label hit — begin editing immediately
		if (hit?.type === T_Hit_3D.dimension) {
			e?.preventDefault();
			const dim = dimensions.hit_test(point.x, point.y);
			if (dim) dimensions.begin(dim);
			drag.set_target(null);
			hits_3d.set_hover(null);
			return;
		} else if (hit?.type === T_Hit_3D.angle) {
			e?.preventDefault();
			const ang = angulars.hit_test(point.x, point.y);
			if (ang) angulars.begin(ang);
			drag.set_target(null);
			hits_3d.set_hover(null);
			return;
		} else if (hit?.type === T_Hit_3D.face_label) {
			e?.preventDefault();
			const label = face_label.hit_test(point.x, point.y);
			if (label) face_label.begin(label);
			drag.set_target(null);
			hits_3d.set_hover(null);
			return;
		}

		// Snapshot for undo before any drag mutation
		if (hit) history.snapshot();

		// Store what we're actually dragging (corner/edge/face)
		drag.set_target(hit);

		// Clear hover during drag (especially rotation)
		hits_3d.set_hover(null);

		// Face click → select that face
		// Corner/edge click → select best face (only if nothing selected yet)
		if (hit) {
			if (hit.type === T_Hit_3D.face) {
				hits_3d.set_selection(hit);
			} else if (!hits_3d.selection) {
				const face_hit = hits_3d.hit_to_face(hit);
				if (face_hit) hits_3d.set_selection(face_hit);
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
			if (!drag.has_target && stores.editing() === T_Editing.none) {
				const root = scenes.root_so;
				if (root && stores.selection()?.so !== root) {
					hits_3d.set_selection({ so: root, type: T_Hit_3D.face, index: 0 });
				} else {
					hits_3d.set_selection(null);
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
