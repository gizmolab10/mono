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
import { full_name, dimensional_name } from '../common/Names';

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
	private listener_keydown:    ((e: KeyboardEvent) => void) | null = null;
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
		if (this.listener_keydown) window.removeEventListener('keydown', this.listener_keydown);
		if (this.listener_mouseup) document.removeEventListener('mouseup', this.listener_mouseup);

		this.canvas = canvas;
		this.prev_canvas = canvas;

		if ('ontouchstart' in window) return;

		this.listener_mouseenter = () => { this.mouse_in_canvas = true; };
		this.listener_mouseleave = () => {
			this.mouse_in_canvas = false;
			// Cursor left the drawing — stop lighting up whatever it last pointed
			// at. Skip mid-drag: a drag that wanders off the canvas keeps going,
			// and hover is already cleared during a drag. The hover signal marks
			// the canvas out of date, so the highlight redraws away on its own.
			if (this.is_dragging) return;
			const had_hover = hits_3d.hover !== null || hits_3d.hovered_dimension !== null;
			hits_3d.hover = null;
			hits_3d.hovered_dimension = null;
			hits_3d.hovered_uniface_placement = null;
			hits_3d.hovered_dim_target = null;
			canvas.style.cursor = '';
			if (had_hover) console.log('cursor left the canvas — cleared the hover highlight.');
		};
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
				// Remember where the cursor is over the drawing, so a COMMAND-C key
				// press knows what it is pointing at. Track it ONLY while not
				// dragging — during a drag, continue_drag owns this value (it reads
				// the PREVIOUS point to measure the move), so writing it here would
				// zero every move and kill tumble.
				this.last_canvas_position = point;
				if (!stores.allow_editing) {
					// Locked: still light up the part under the cursor so you can
					// see what you'd pick, but keep the tumble hand and arm no edit
					// affordance (no dimension bolding, no text cursor).
					const hit = hits_3d.hit_test(point, e.altKey);
					hits_3d.hover = hit ? hits_3d.hit_to_face(hit) : null;
					hits_3d.hovered_dimension = null;
					hits_3d.hovered_uniface_placement = null;
					hits_3d.hovered_dim_target = null;
					canvas.style.cursor = 'grab';
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

					// What within a dimensional is under the cursor: its label, one
					// of its lines, or neither — drives the state-dependent hover rule.
					hits_3d.hovered_dim_target =
						hit?.type === T_Hit_3D.dimension ? 'label'
						: hit?.type === T_Hit_3D.uniface_line ? 'line'
						: null;

					// Track the dimension under the cursor so the renderer can
					// bold its text and thicken its dimension and witness lines.
					// Uniface-line hits set this store themselves inside the
					// hits system, so do not clear it here on that branch.
					if (hit?.type === T_Hit_3D.dimension) {
						const dim_rect = dimensions.hit_test(point.x, point.y);
						hits_3d.hovered_dimension = dim_rect ? { so: dim_rect.so, axis: dim_rect.axis, witness_index: dim_rect.witness_index } : null;
					} else if (hit?.type !== T_Hit_3D.uniface_line) {
						hits_3d.hovered_dimension = null;
					}
				}
			} else if (this.on_drag) {
				this.continue_drag(canvas, e.clientX, e.clientY, e.altKey);
			}
		};
		canvas.addEventListener('mousemove', this.listener_mousemove);

		// COMMAND-C, while the cursor is over the drawing, puts the full name of
		// the thing under it on the clipboard: a part's root-to-part name, or a
		// dimensional's name plus its measurement word. It steps aside whenever a
		// text field is focused or page text is selected, so ordinary copy still
		// works everywhere else. Works whether or not the edit lock is on.
		this.listener_keydown = (e: KeyboardEvent) => {
			if (!e.metaKey || (e.key !== 'c' && e.code !== 'KeyC')) return;
			const el = document.activeElement as HTMLElement | null;
			const in_field = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
			const text_selected = (window.getSelection?.()?.toString().length ?? 0) > 0;
			if (in_field || text_selected || !this.mouse_in_canvas) return;

			const p = this.last_canvas_position;
			// A dimensional under the cursor wins over its part.
			const dim_rect = dimensions.hit_test(p.x, p.y);
			let name: string | null = null;
			let what = 'nothing';
			if (dim_rect) {
				name = dimensional_name(dim_rect.so, dim_rect.axis);
				what = 'dimensional';
			} else {
				const hit = hits_3d.hit_test(p, false);
				const is_part = hit?.type === T_Hit_3D.corner || hit?.type === T_Hit_3D.edge || hit?.type === T_Hit_3D.face;
				if (hit && is_part) {
					name = full_name(hit.so);
					what = 'part';
				}
			}

			if (!name) {
				console.log('COMMAND-C over the drawing: nothing under the cursor — clipboard left alone.');
				return;
			}
			e.preventDefault();
			const text = name;
			if (navigator.clipboard?.writeText) {
				navigator.clipboard.writeText(text).then(
					() => console.log(`COMMAND-C: ${what} under the cursor. Put on the clipboard: "${text}".`),
					(err) => console.log(`COMMAND-C: could not reach the clipboard for "${text}".`, err),
				);
			} else {
				console.log(`COMMAND-C: this browser context has no clipboard; "${text}" was not put.`);
			}
		};
		window.addEventListener('keydown', this.listener_keydown);

	}

	// ── Shared drag logic ──

	begin_drag(canvas: HTMLCanvasElement, clientX: number, clientY: number, e?: MouseEvent): void {
		this.is_dragging = true;
		this.did_drag = false;

		const rect = canvas.getBoundingClientRect();
		const point = new Point(clientX - rect.left, clientY - rect.top);
		this.last_canvas_position = point;

		// Locked: tumble only — no edit target. Keep the hover highlight on press
		// so a click does not flash it off; selection happens on release in
		// end_drag, hover keeps tracking the cursor in the mouse-move handler.
		if (!stores.allow_editing) {
			drag.set_target(null);
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
			hits_3d.hovered_dim_target = null;
			return;
		} else if (hit?.type === T_Hit_3D.angle) {
			e?.preventDefault();
			const ang = angulars.hit_test(point.x, point.y);
			if (ang) angulars.begin(ang);
			drag.set_target(null);
			hits_3d.hover = null;
			hits_3d.hovered_dimension = null;
			hits_3d.hovered_dim_target = null;
			return;
		}

		// Snapshot for undo before any drag mutation
		if (hit) history.snapshot();

		// Store what we're actually dragging (corner/edge/face)
		drag.set_target(hit);

		// Clear hover during drag (especially rotation)
		hits_3d.hover = null;
		hits_3d.hovered_dimension = null;
		hits_3d.hovered_dim_target = null;

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
			if (!stores.allow_editing) {
				// Locked, and the mouse did not move — a look-and-pick click.
				// Selects the part under the cursor. Clicking that part's dimension
				// label (or any measurement) selects the part that owns it, since
				// the hit-to-face map resolves a measurement to its owner's face.
				// The background clears the selection (to root, then to none). A
				// press-and-drag never reaches here (did_drag is true), so a tumble
				// selects nothing. Editing stays locked throughout.
				const point = this.last_canvas_position;
				const hit = hits_3d.hit_test(point, false);
				const face_hit = hit ? hits_3d.hit_to_face(hit) : null;
				if (face_hit) {
					selection.current = face_hit;
				} else {
					const root = scenes.root_so;
					if (root && selection.current?.so !== root) {
						selection.current = { so: root, type: T_Hit_3D.face, index: 0 };
					} else {
						selection.current = null;
					}
				}
				console.log(`Locked click — moved: no. Under cursor: ${hit ? T_Hit_3D[hit.type] : 'background'}. Owner selected: ${selection.current?.so?.name ?? 'none'}.`);
			} else if (!drag.has_target && stores.editing === T_Editing.none) {
				// Editing mode: click on background → deselect (part-select happens
				// on press, in begin_drag).
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
