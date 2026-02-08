import type { Dimension_Rect, S_Editing } from '../types/Interfaces';
import { units, current_unit_system } from '../types/Units';
import { current_precision } from '../render/Stores';
import { constraints } from '../algebra/Constraints';
import { writable, get } from 'svelte/store';
import { scenes } from './Scenes';
import { render } from '../render/Render';

class Editor {
	/** Reactive editing state — non-null when input is active */
	w_editing = writable<S_Editing | null>(null);

	get editing(): S_Editing | null { return get(this.w_editing); }

	// ── hit testing ──

	/** Test if a screen point lands on any dimension rect. */
	test(x: number, y: number): Dimension_Rect | null {
		const padding = 4;
		for (const rect of render.dimension_rects) {
			const half_w = rect.w / 2 + padding;
			const half_h = rect.h / 2 + padding;
			if (Math.abs(x - rect.x) <= half_w && Math.abs(y - rect.y) <= half_h) {
				return rect;
			}
		}
		return null;
	}

	// ── lifecycle ──

	/** Start editing a dimensional. Called on click when test() hits. */
	begin(rect: Dimension_Rect): void {
		const so = rect.so;
		const value_mm = rect.axis === 'x' ? so.width : rect.axis === 'y' ? so.height : so.depth;
		const system = current_unit_system();
		this.w_editing.set({
			so,
			axis: rect.axis,
			x: rect.x,
			y: rect.y,
			formatted: units.format_for_system(value_mm, system, current_precision()),
		});
	}

	/** Commit a new value from the input. Returns true if value changed. */
	commit(input: string): boolean {
		const state = this.editing;
		if (!state) return false;

		const system = current_unit_system();
		const new_mm = units.parse_for_system(input, system);
		if (new_mm === null || new_mm <= 0) {
			this.cancel();
			return false;
		}

		// Snap parsed value to precision grid, then symmetric resize from center
		const snapped_mm = units.snap_for_system(new_mm, system, current_precision());
		const half = snapped_mm / 2;
		const axis = state.axis;
		const min_bound = `${axis}_min` as const;
		const max_bound = `${axis}_max` as const;
		const center = (state.so.get_bound(min_bound) + state.so.get_bound(max_bound)) / 2;
		state.so.set_bound(min_bound, units.snap_for_system(center - half, system, current_precision()));
		state.so.set_bound(max_bound, units.snap_for_system(center + half, system, current_precision()));
		constraints.propagate(state.so);

		scenes.save();
		this.w_editing.set(null);
		return true;
	}

	/** Cancel editing without changing anything. */
	cancel(): void {
		this.w_editing.set(null);
	}
}

export const editor = new Editor();
