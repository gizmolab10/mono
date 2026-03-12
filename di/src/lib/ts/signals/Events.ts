import { T_Details, T_Hit_3D } from '../types/Enumerations';
import type Smart_Object from '../runtime/Smart_Object';
import type { Dictionary } from '../types/Types';
import { writable, get } from 'svelte/store';
import { Point } from '../types/Coordinates';
import { engine } from '../render/Engine';
import { stores } from '../managers/Stores';
import { hits } from '../managers/Hits';
import Mouse_Timer from './Mouse_Timer';
import S_Mouse from '../state/S_Mouse';

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

	private wired = false;

	setup() {
		if (this.wired) return;
		this.wired = true;
		this.subscribeTo_events();
	}

	private subscribeTo_events() {
		document.addEventListener('mouseup', this.handle_mouse_up, { passive: false });
		document.addEventListener('mousedown', this.handle_mouse_down, { passive: false });
		document.addEventListener('mousemove', this.handle_mouse_move, { passive: false });
		document.addEventListener('mouseleave', this.handle_mouse_leave, { passive: false });
		document.addEventListener('keydown', this.handle_key_down);

		// Touch events for iPad/iPhone — mirror mouse events for UI controls
		document.addEventListener('touchstart', this.handle_touch_start, { passive: false });
		document.addEventListener('touchend', this.handle_touch_end, { passive: false });
		document.addEventListener('touchmove', this.handle_touch_move, { passive: false });
	}

	// ===== EVENT HANDLERS =====

	private handle_mouse_down = (event: MouseEvent) => {
		const target = event.target as HTMLElement;
		const in_graph = !!target.closest('.graph');
		const location = new Point(event.clientX, event.clientY);
		hits.handle_s_mouse_at(location, S_Mouse.down(event, null), in_graph);
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

	// ── Touch handlers (iPad/iPhone) ──

	private handle_touch_start = (event: TouchEvent) => {
		if (event.touches.length !== 1) return;
		const t = event.touches[0];
		const target = t.target as HTMLElement;
		// Only handle non-canvas touches (canvas has its own touch handling in Events_3D)
		if (target.closest('canvas')) return;
		const location = new Point(t.clientX, t.clientY);
		hits.handle_s_mouse_at(location, S_Mouse.down(null, null), false);
		hits.disable_hover = true;
		this.w_count_mouse_down.update(n => n + 1);
		this.w_scaled_movement.set(Point.zero);
		this.w_mouse_button_down.set(true);
	}

	private handle_touch_end = (_event: TouchEvent) => {
		const location = get(this.w_mouse_location) ?? new Point(0, 0);
		hits.handle_s_mouse_at(location, S_Mouse.up(null, null));
		hits.disable_hover = false;
		this.w_scaled_movement.set(null);
		this.w_count_mouse_up.update(n => n + 1);
		this.w_mouse_button_down.set(false);
	}

	private handle_touch_move = (event: TouchEvent) => {
		if (event.touches.length !== 1) return;
		const t = event.touches[0];
		const target = t.target as HTMLElement;
		if (target.closest('canvas')) return;
		const location = new Point(t.clientX, t.clientY);
		const prior = get(this.w_mouse_location);
		const delta = prior?.vector_to(location) ?? null;
		if (!!delta && delta.magnitude > 1) {
			this.w_scaled_movement.set(delta);
		}
		this.w_mouse_location.set(location);
		hits.handle_mouse_movement_at(location);
	}

	private handle_key_down = (event: KeyboardEvent) => {
		if (stores.is_editing()) {
			if (event.key === 'Enter' || event.key === 'Tab') {
				event.preventDefault();
				this.navigate_table_cell(event.key, event.shiftKey);
			}
			return;
		}
		if (event.key === 'z' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			if (event.shiftKey) engine.redo();
			else engine.undo();
			return;
		}
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			engine.delete_selected_so();
		}
		if (event.key === ',') {
			event.preventDefault();
			stores.toggle_details();
		}
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			if ((get(stores.w_t_details) & T_Details.parts) === 0) return;
			event.preventDefault();
			this.navigate_parts(event.key === 'ArrowUp' ? -1 : 1);
		}
		if (event.key === 'ArrowLeft') {
			if ((get(stores.w_t_details) & T_Details.parts) === 0) return;
			event.preventDefault();
			this.collapse_selected();
		}
		if (event.key === 'ArrowRight') {
			if ((get(stores.w_t_details) & T_Details.parts) === 0) return;
			event.preventDefault();
			this.expand_selected();
		}
		if (event.key === 'Tab') {
			if ((get(stores.w_t_details) & T_Details.parts) === 0) return;
			event.preventDefault();
			this.navigate_parts(event.shiftKey ? -1 : 1);
		}
	}

	private navigate_table_cell(key: 'Enter' | 'Tab', shift: boolean): void {
		const active = document.activeElement as HTMLInputElement;
		if (!active || active.tagName !== 'INPUT') return;

		const td = active.closest('td');
		const table = active.closest('table');
		if (!td || !table) return;

		const inputs = Array.from(table.querySelectorAll<HTMLInputElement>('input:not(:disabled)'));
		const idx = inputs.indexOf(active);
		if (idx === -1) return;

		let target: HTMLInputElement | null = null;

		if (key === 'Tab') {
			const next = idx + (shift ? -1 : 1);
			if (next >= 0 && next < inputs.length) target = inputs[next];
		} else {
			// Enter: same column, next/prev row
			const col_class = Array.from(td.classList).find(c => c.startsWith('attr-') || c.startsWith('std-'));
			if (col_class) {
				const step = shift ? -1 : 1;
				for (let i = idx + step; i >= 0 && i < inputs.length; i += step) {
					if (inputs[i].closest('td')?.classList.contains(col_class)) {
						target = inputs[i];
						break;
					}
				}
			}
		}

		active.blur();
		if (target) {
			target.focus();
			target.select();
		}
	}

	private visible_parts(): Smart_Object[] {
		const all_sos = stores.tree_order(get(stores.w_all_sos));
		return all_sos.filter(so => {
			if (stores.is_ancestor_collapsed(so)) return false;
			const parent = so.scene?.parent?.so;
			if (!parent?.repeater) return true;
			const siblings = all_sos.filter(s => s.scene?.parent?.so === parent);
			return siblings[0] === so;
		});
	}

	private navigate_parts(direction: number): void {
		const visible = this.visible_parts();
		if (visible.length === 0) return;
		const selected = stores.selection()?.so;
		const current_index = selected ? visible.indexOf(selected) : -1;
		let next_index = current_index + direction;
		if (next_index < 0) next_index = visible.length - 1;
		if (next_index >= visible.length) next_index = 0;
		const next_so = visible[next_index];
		stores.reveal_so(next_so);
		stores.set_selection({ so: next_so, type: T_Hit_3D.face, index: 0 });
	}

	private collapse_selected(): void {
		const so = stores.selection()?.so;
		if (!so) return;
		const ids = get(stores.w_collapsed_ids);
		const visible = this.visible_parts();
		const has_kids = visible.some(s => s.scene?.parent?.so === so);
		if (has_kids && !ids.has(so.id)) {
			ids.add(so.id);
			stores.w_collapsed_ids.set(new Set(ids));
		} else {
			const parent = so.scene?.parent?.so;
			if (parent) {
				ids.add(parent.id);
				stores.w_collapsed_ids.set(new Set(ids));
				stores.set_selection({ so: parent, type: T_Hit_3D.face, index: 0 });
			}
		}
	}

	private expand_selected(): void {
		const so = stores.selection()?.so;
		if (!so) return;
		const ids = get(stores.w_collapsed_ids);
		if (ids.has(so.id)) {
			ids.delete(so.id);
			stores.w_collapsed_ids.set(new Set(ids));
		} else {
			const visible = this.visible_parts();
			const first_child = visible.find(s => s.scene?.parent?.so === so);
			if (first_child) {
				stores.reveal_so(first_child);
				stores.set_selection({ so: first_child, type: T_Hit_3D.face, index: 0 });
			}
		}
	}

}

export const e = new Events();
