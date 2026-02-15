import type { Dimension_Rect, S_SO } from '../types/Interfaces';
import type { Axis_Name } from '../runtime/Axis';

interface S_Dimensions extends S_SO {
	axis: Axis_Name;
	formatted: string;
}
import { constraints, compiler, evaluator } from '../algebra';
import { units, Units } from '../types/Units';
import { T_Units, T_Editing } from '../types/Enumerations';
import { writable, get } from 'svelte/store';
import { stores } from '../managers/Stores';
import { scenes } from '../managers/Scenes';
import { render } from '../render/Render';

class Dimensions {
	w_s_dimensions = writable<S_Dimensions | null>(null);

	get state(): S_Dimensions | null { return get(this.w_s_dimensions); }

	// ── hit testing ──

	/** Test if a screen point lands on any dimension rect. */
	hit_test(x: number, y: number): Dimension_Rect | null {
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

	/** Start editing a dimensional. Called on click when hit_test() hits. */
	begin(rect: Dimension_Rect): void {
		const so = rect.so;
		const value_mm = rect.axis === 'x' ? so.width : rect.axis === 'y' ? so.height : so.depth;
		const system = Units.current_unit_system();
		this.w_s_dimensions.set({
			so,
			axis: rect.axis,
			x: rect.x,
			y: rect.y,
			formatted: units.format_for_system(value_mm, system, stores.current_precision()),
		});
		stores.w_editing.set(T_Editing.dimension);
	}

	/** Commit a new value from the input. Returns true if value changed. */
	commit(input: string): boolean {
		const state = this.state;
		if (!state) return false;

		const system = Units.current_unit_system();
		const new_mm = this.parse_input(input, system);
		if (new_mm === null || new_mm <= 0) {
			this.cancel();
			return false;
		}

		// Snap the dimension once, then place bounds symmetrically around center.
		// (Snapping each bound individually caused asymmetric rounding — Math.round
		// rounds half-values toward +∞, so center−half and center+half could
		// snap unevenly, shrinking the dimension.)
		const precision = stores.current_precision();
		const snapped_mm = units.snap_for_system(new_mm, system, precision);
		const half = snapped_mm / 2;
		const axis = state.axis;
		const min_bound = `${axis}_min` as const;
		const max_bound = `${axis}_max` as const;
		const center = (state.so.get_bound(min_bound) + state.so.get_bound(max_bound)) / 2;
		state.so.set_bound(min_bound, center - half);
		state.so.set_bound(max_bound, center + half);
		constraints.propagate(state.so);

		stores.tick();
		scenes.save();
		this.w_s_dimensions.set(null);
		stores.w_editing.set(T_Editing.none);
		return true;
	}

	/** Parse input: try unit parser, then algebra compiler for expressions (1" + 2"). */
	private parse_input(input: string, system: T_Units): number | null {
		const simple = units.parse_for_system(input, system);
		if (simple !== null) return simple;
		try {
			const node = compiler.compile(input);
			const mm = evaluator.evaluate(node, (o, a) => constraints.resolve(o, a));
			if (isFinite(mm)) return mm;
		} catch { /* not a valid expression either */ }
		return null;
	}

	/** Cancel editing without changing anything. */
	cancel(): void {
		this.w_s_dimensions.set(null);
		stores.w_editing.set(T_Editing.none);
	}
}

export const dimensions = new Dimensions();
