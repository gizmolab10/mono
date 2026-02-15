import type { Angle_Rect, S_SO } from '../types/Interfaces';
import { constraints, orientation } from '../algebra';
import type { Axis } from '../runtime/Smart_Object';
import { T_Editing } from '../types/Enumerations';
import { writable, get } from 'svelte/store';
import { stores } from '../managers/Stores';
import { scenes } from '../managers/Scenes';
import { render } from '../render/Render';

interface S_Angular extends S_SO {
	rotation_axis: Axis;
	formatted: string;
}

class Angulars {
	w_s_angular = writable<S_Angular | null>(null);

	get state(): S_Angular | null { return get(this.w_s_angular); }

	// ── hit testing ──

	/** Test if a screen point lands on any angular rect. */
	hit_test(x: number, y: number): Angle_Rect | null {
		const padding = 4;
		for (const rect of render.angular_rects) {
			const half_w = rect.w / 2 + padding;
			const half_h = rect.h / 2 + padding;
			if (Math.abs(x - rect.x) <= half_w && Math.abs(y - rect.y) <= half_h) {
				return rect;
			}
		}
		return null;
	}

	// ── lifecycle ──

	/** Start editing an angular. Called on click when hit_test() hits. */
	begin(rect: Angle_Rect): void {
		const degrees = rect.angle_degrees;
		this.w_s_angular.set({
			so: rect.so,
			rotation_axis: rect.rotation_axis,
			x: rect.x,
			y: rect.y,
			formatted: degrees.toFixed(1) + '°',
		});
		stores.w_editing.set(T_Editing.angles);
	}

	/** Commit a new angle value from the input. Returns true if value changed. */
	commit(input: string): boolean {
		const state = this.state;
		if (!state) return false;

		const degrees = this.parse_input(input);
		if (degrees === null || degrees <= 0 || degrees >= 90) {
			this.cancel();
			return false;
		}

		const radians = degrees * Math.PI / 180;
		const so = state.so;
		const axis = state.rotation_axis;

		// Set the rotation via the 2-tuple SOT — recomputes quat internally
		so.set_rotation(axis, radians);

		// Redistribute bounds to match the new angle
		orientation.recompute_max_bounds(so);
		constraints.propagate(so);

		stores.tick();
		scenes.save();
		this.w_s_angular.set(null);
		stores.w_editing.set(T_Editing.none);
		return true;
	}

	/** Parse angle input: accepts "35", "35°", "35.5°", "35.5 deg" */
	private parse_input(input: string): number | null {
		const cleaned = input.trim().replace(/[°\s]*(deg(rees?)?)?$/i, '').trim();
		const value = parseFloat(cleaned);
		if (!isFinite(value)) return null;
		return value;
	}

	/** Cancel editing without changing anything. */
	cancel(): void {
		this.w_s_angular.set(null);
		stores.w_editing.set(T_Editing.none);
	}
}

export const angulars = new Angulars();
