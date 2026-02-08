import type { Dimension_Rect, S_Editing } from '../types/Interfaces';
import { units, current_unit_system } from '../types/Units';
import { T_Units } from '../types/Enumerations';
import { current_precision } from './Stores';
import { constraints } from '../algebra/Constraints';
import { compile } from '../algebra/Compiler';
import { evaluate } from '../algebra/Evaluate';
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
		const new_mm = this.parse_input(input, system);
		if (new_mm === null || new_mm <= 0) {
			this.cancel();
			return false;
		}

		// Snap the dimension once, then place bounds symmetrically around center.
		// (Snapping each bound individually caused asymmetric rounding — Math.round
		// rounds half-values toward +∞, so center−half and center+half could
		// snap unevenly, shrinking the dimension.)
		const precision = current_precision();
		const snapped_mm = units.snap_for_system(new_mm, system, precision);
		const half = snapped_mm / 2;
		const axis = state.axis;
		const min_bound = `${axis}_min` as const;
		const max_bound = `${axis}_max` as const;
		const center = (state.so.get_bound(min_bound) + state.so.get_bound(max_bound)) / 2;
		state.so.set_bound(min_bound, center - half);
		state.so.set_bound(max_bound, center + half);
		constraints.propagate(state.so);

		scenes.save();
		this.w_editing.set(null);
		return true;
	}

	/** Parse input: try unit parser, then algebra compiler for expressions (1" + 2"). */
	private parse_input(input: string, system: T_Units): number | null {
		const simple = units.parse_for_system(input, system);
		if (simple !== null) return simple;
		try {
			const node = compile(input);
			const mm = evaluate(node, (o, a) => constraints.resolve(o, a));
			if (isFinite(mm)) return mm;
		} catch { /* not a valid expression either */ }
		return null;
	}

	/** Cancel editing without changing anything. */
	cancel(): void {
		this.w_editing.set(null);
	}
}

export const editor = new Editor();
