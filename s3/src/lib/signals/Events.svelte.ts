import { T_Action }     from '../common/Enumerations';
import { hits }         from '../managers/Hits.svelte';
import { S_Mouse }      from '../state/S_Mouse';
import { ux }           from '../state/ux.svelte';
import { Point }        from '../types/Coordinates';
import type { Ancestry } from '../nav/Ancestry';

// ————————————————————————————————————————— Key binding

interface Key_Binding {
	action:            (ancestry: Ancestry | null, event: KeyboardEvent) => void;
	require_ancestry?: boolean;
	disabled?:         (ancestry: Ancestry | null) => boolean;
	skip_during_edit?: boolean;  // default true — most keys skip when editing
}

type Key_Map = Record<string, Key_Binding>;

// ————————————————————————————————————————— Action column lookup (for Phase 9+ action buttons)

const actions: Record<string, Record<string, number>> = {
	browse: { left: 0, up: 1, down: 2, right: 3 },
	focus:  { selection: 0, parent: 1 },
	show:   { selection: 0, list: 1, graph: 2 },
	center: { focus: 0, selection: 1, graph: 2 },
	add:    { child: 0, sibling: 1, line: 2, parent: 3, related: 4 },
	delete: { selection: 0, parent: 1, related: 2 },
	move:   { left: 0, up: 1, down: 2, right: 3 },
};

// ————————————————————————————————————————— Key dispatch table

function build_key_map(): Key_Map {
	return {

		// ——————————————— Browse (non-persistent navigation)

		'arrowup': {
			require_ancestry: true,
			action(grabbed, event) {
				if (!grabbed) return;
				const SHIFT = event.shiftKey;
				const OPTION = event.altKey;
				if (SHIFT || OPTION) {
					// Phase 8: persistent move up (reorder among siblings)
					// For now, fall through to browse
				}
				const siblings = grabbed.sibling_ancestries;
				const index    = grabbed.siblingIndex;
				ux.grabOnly(siblings[index > 0 ? index - 1 : siblings.length - 1]);
			},
		},
		'arrowdown': {
			require_ancestry: true,
			action(grabbed, event) {
				if (!grabbed) return;
				const SHIFT = event.shiftKey;
				const OPTION = event.altKey;
				if (SHIFT || OPTION) {
					// Phase 8: persistent move down (reorder among siblings)
					// For now, fall through to browse
				}
				const siblings = grabbed.sibling_ancestries;
				const index    = grabbed.siblingIndex;
				ux.grabOnly(siblings[index < siblings.length - 1 ? index + 1 : 0]);
			},
		},
		'arrowleft': {
			require_ancestry: true,
			action(grabbed, event) {
				if (!grabbed) return;
				const SHIFT = event.shiftKey;
				const OPTION = event.altKey;
				if (SHIFT || OPTION) {
					// Phase 8: persistent move left (change parent)
					// For now, fall through to browse
				}
				if (grabbed.isExpanded && !grabbed.isRoot) {
					ux.collapse(grabbed);
				} else if (!grabbed.isRoot) {
					ux.grabOnly(grabbed.parentAncestry);
				}
			},
		},
		'arrowright': {
			require_ancestry: true,
			action(grabbed, event) {
				if (!grabbed) return;
				const SHIFT = event.shiftKey;
				const OPTION = event.altKey;
				if (SHIFT || OPTION) {
					// Phase 8: persistent move right (make child of sibling)
					// For now, fall through to browse
				}
				const branches = grabbed.branchAncestries;
				if (branches.length > 0) {
					if (!grabbed.isExpanded) {
						ux.expand(grabbed);
					} else {
						ux.grabOnly(branches[0]);
					}
				}
			},
		},

		// ——————————————— Focus

		'/': {
			require_ancestry: true,
			action(grabbed) {
				if (grabbed) ux.becomeFocus(grabbed);
			},
		},

		// ——————————————— Global navigation

		'escape': {
			action() { ux.grab_none(); },
		},
		'[': {
			action() { ux.recents_go(false); },
		},
		']': {
			action() { ux.recents_go(true); },
		},
		'>': {
			action() { ux.global_depth_limit = Math.min(ux.global_depth_limit + 1, 20); },
		},
		'<': {
			action() { ux.global_depth_limit = Math.max(ux.global_depth_limit - 1, 1); },
		},
		'c': {
			action() { ux.user_graph_offset = Point.zero; ux.scale = 1; },
		},

		// ——————————————— Edit actions (stubs — Phase 8)

		'enter': {
			require_ancestry: true,
			disabled: (a) => !a || a.isRoot,
			action(grabbed) {
				if (grabbed) ux.startEdit(grabbed);
			},
		},
		' ': {  // space
			require_ancestry: true,
			action(_grabbed) {
				// Phase 8: create child
			},
		},
		'tab': {
			require_ancestry: true,
			disabled: (a) => !a || a.isRoot,
			action(_grabbed) {
				// Phase 8: create sibling
			},
		},
		'd': {
			require_ancestry: true,
			disabled: (a) => !a || a.isRoot,
			action(_grabbed) {
				// Phase 8: duplicate
			},
		},
		'-': {
			require_ancestry: true,
			disabled: (a) => !a || a.isRoot,
			action(_grabbed, event) {
				if (event.metaKey) return;  // don't capture cmd+-
				// Phase 8: add line separator
			},
		},
		'delete': {
			require_ancestry: true,
			disabled: (a) => !a || a.isRoot,
			action(_grabbed) {
				// Phase 8: delete selection
			},
		},
		'backspace': {
			require_ancestry: true,
			disabled: (a) => !a || a.isRoot,
			action(_grabbed) {
				// Phase 8: delete selection
			},
		},
	};
}

// ————————————————————————————————————————— Events singleton

class S_Events {
	private key_map: Key_Map = build_key_map();
	mouse_location_scaled = $state(Point.zero);

	// Touch state
	private initial_touch:          Point | null = null;
	private initial_offset:         Point = Point.zero;
	private initial_pinch_distance: number = 0;
	private initial_scale:          number = 1;

	// ————————————————————————————————————————— Setup

	setup() {
		document.addEventListener('keydown',    this.handle_key_down, { passive: false });
		document.addEventListener('mousedown',  this.handle_mouse_down, { passive: false });
		document.addEventListener('mouseup',    this.handle_mouse_up, { passive: false });
		document.addEventListener('mousemove',  this.handle_mouse_move, { passive: false });
		document.addEventListener('wheel',      this.handle_wheel, { passive: false });
		document.addEventListener('touchstart', this.handle_touch_start, { passive: false });
		document.addEventListener('touchmove',  this.handle_touch_move, { passive: false });
		document.addEventListener('touchend',   this.handle_touch_end, { passive: false });
	}

	teardown() {
		document.removeEventListener('keydown',    this.handle_key_down);
		document.removeEventListener('mousedown',  this.handle_mouse_down);
		document.removeEventListener('mouseup',    this.handle_mouse_up);
		document.removeEventListener('mousemove',  this.handle_mouse_move);
		document.removeEventListener('wheel',      this.handle_wheel);
		document.removeEventListener('touchstart', this.handle_touch_start);
		document.removeEventListener('touchmove',  this.handle_touch_move);
		document.removeEventListener('touchend',   this.handle_touch_end);
	}

	// ————————————————————————————————————————— Keyboard

	private handle_key_down = (event: KeyboardEvent) => {
		const key = event.key.toLowerCase();

		// Skip standalone modifier keys
		if (key === 'alt' || key === 'meta' || key === 'shift' || key === 'control') return;

		if (ux.is_editing) return;

		const binding = this.key_map[key];
		if (!binding) return;

		const grabbed = ux.grabs[ux.grabs.length - 1] ?? ux.ancestry_focus;
		if (binding.require_ancestry && !grabbed) return;
		if (binding.disabled?.(grabbed)) return;

		event.preventDefault();
		binding.action(grabbed, event);
	};

	// ————————————————————————————————————————— Mouse

	private handle_mouse_down = (event: MouseEvent) => {
		const point = new Point(event.clientX, event.clientY);
		hits.handle_s_mouse_at(point, S_Mouse.down(event, null));
		hits.disable_hover = true;
	};

	private handle_mouse_up = (event: MouseEvent) => {
		const point = new Point(event.clientX, event.clientY);
		hits.handle_s_mouse_at(point, S_Mouse.up(event, null));
		hits.disable_hover = false;
	};

	private handle_mouse_move = (event: MouseEvent) => {
		const point = new Point(event.clientX, event.clientY);
		this.mouse_location_scaled = point;
		hits.handle_mouse_movement_at(point);
	};

	// ————————————————————————————————————————— Wheel

	private handle_wheel = (event: WheelEvent) => {
		event.preventDefault();
		const factor = event.deltaY > 0 ? 0.9 : 1.1;
		ux.scale = Math.min(Math.max(ux.scale * factor, 0.2), 5);
	};

	// ————————————————————————————————————————— Touch

	private pinch_distance(touches: TouchList): number {
		const dx = touches[1].clientX - touches[0].clientX;
		const dy = touches[1].clientY - touches[0].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	private handle_touch_start = (event: TouchEvent) => {
		if (event.touches.length === 2) {
			event.preventDefault();
			this.initial_touch          = new Point(event.touches[0].clientX, event.touches[0].clientY);
			this.initial_offset         = ux.user_graph_offset;
			this.initial_pinch_distance = this.pinch_distance(event.touches);
			this.initial_scale          = ux.scale;
		}
	};

	private handle_touch_move = (event: TouchEvent) => {
		if (event.touches.length === 2 && this.initial_touch) {
			event.preventDefault();
			const current = new Point(event.touches[0].clientX, event.touches[0].clientY);
			const delta   = new Point(current.x - this.initial_touch.x, current.y - this.initial_touch.y);
			ux.user_graph_offset = this.initial_offset.offsetBy(delta);

			const distance = this.pinch_distance(event.touches);
			if (this.initial_pinch_distance > 0) {
				const ratio = distance / this.initial_pinch_distance;
				ux.scale = Math.min(Math.max(this.initial_scale * ratio, 0.2), 5);
			}
		}
	};

	private handle_touch_end = (_event: TouchEvent) => {
		this.initial_touch = null;
	};

	// ————————————————————————————————————————— Action lookup (for future action buttons)

	name_ofActionAt(t_action: number, column: number): string {
		return Object.keys(actions[T_Action[t_action]])[column];
	}
}

export const events = new S_Events();
