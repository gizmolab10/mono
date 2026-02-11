import { dimensions } from '../editors/Dimension';
import { engine } from '../render/Engine';
import { Point } from '../types/Coordinates';
import S_Mouse from '../state/S_Mouse';
import { hits } from '../managers/Hits';
import type { Dictionary } from '../types/Types';
import { writable, get } from 'svelte/store';
import Mouse_Timer from './Mouse_Timer';

export class Events {
	throttle_timers: Dictionary<ReturnType<typeof setTimeout> | null> = {};
	mouse_timer_dict_byName: Dictionary<Mouse_Timer> = {};

	w_count_mouse_down		= writable<number>(0);
	w_count_mouse_up		= writable<number>(0);
	w_mouse_button_down		= writable<boolean>(false);
	w_scaled_movement		= writable<Point | null>(null);
	w_mouse_location		= writable<Point>();

	// ===== UTILITIES =====

	mouse_timer_forName(name: string): Mouse_Timer {
		if (!this.mouse_timer_dict_byName[name]) {
			this.mouse_timer_dict_byName[name] = new Mouse_Timer(name);
		}
		return this.mouse_timer_dict_byName[name];
	}

	throttle(key: string, defer_for: number = 50, callback: () => void): void {
		if (!this.throttle_timers[key]) {
			callback();
			this.throttle_timers[key] = setTimeout(() => {
				this.throttle_timers[key] = null;
			}, defer_for);
		}
	}

	// ===== SETUP =====

	setup() {
		this.subscribeTo_events();
	}

	private subscribeTo_events() {
		document.addEventListener('mouseup', this.handle_mouse_up, { passive: false });
		document.addEventListener('mousedown', this.handle_mouse_down, { passive: false });
		document.addEventListener('mousemove', this.handle_mouse_move, { passive: false });
		document.addEventListener('mouseleave', this.handle_mouse_leave, { passive: false });
		document.addEventListener('keydown', this.handle_key_down);
	}

	// ===== EVENT HANDLERS =====

	private handle_mouse_down = (event: MouseEvent) => {
		const location = new Point(event.clientX, event.clientY);
		hits.handle_s_mouse_at(location, S_Mouse.down(event, null));
		hits.disable_hover = true;
		this.w_count_mouse_down.update(n => n + 1);
		this.w_scaled_movement.set(Point.zero);
		this.w_mouse_button_down.set(true);
	}

	private handle_mouse_up = (event: MouseEvent) => {
		const location = new Point(event.clientX, event.clientY);
		hits.handle_s_mouse_at(location, S_Mouse.up(event, null));
		hits.disable_hover = false;
		this.w_scaled_movement.set(null);
		this.w_count_mouse_up.update(n => n + 1);
		this.w_mouse_button_down.set(false);
	}

	private handle_mouse_move = (event: MouseEvent) => {
		const location = new Point(event.clientX, event.clientY);
		const prior = get(this.w_mouse_location);
		const delta = prior?.vector_to(location) ?? null;
		if (!!delta && delta.magnitude > 1) {
			this.w_scaled_movement.set(delta);
		}
		this.w_mouse_location.set(location);
		hits.handle_mouse_movement_at(location);
	}

	private handle_mouse_leave = (_event: MouseEvent) => {
		// Clear hover when mouse leaves the document
		hits.clear_hover();
	}

	private handle_key_down = (event: KeyboardEvent) => {
		if (dimensions.editing) return;  // typing in dimension input
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			engine.delete_selected_so();
		}
	}

}

export const e = new Events();
