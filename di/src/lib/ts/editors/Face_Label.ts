import type { Label_Rect, S_SO } from '../types/Interfaces';
import type { Hit_3D_Result } from '../managers/Hits_3D';

interface S_Name extends S_SO {
	current_name: string;
}
import { T_Editing, T_Hit_3D } from '../types/Enumerations';
import { writable, get } from 'svelte/store';
import { hits_3d } from '../managers/Hits_3D';
import { scenes } from '../managers/Scenes';
import { stores } from '../managers/Stores';
import { render } from '../render/Render';

class Face_Label {
	w_s_face_label = writable<S_Name | null>(null);
	private prev_selection: Hit_3D_Result | null = null;

	/** Cursor position to transfer between inputs. null = select all. */
	cursor: { start: number; end: number } | null = null;

	get state(): S_Name | null { return get(this.w_s_face_label); }

	// ── hit testing ──

	/** Test if a screen point lands on any face name rect. */
	hit_test(x: number, y: number): Label_Rect | null {
		const padding = 4;
		for (const rect of render.face_name_rects) {
			const half_w = rect.w / 2 + padding;
			const half_h = rect.h / 2 + padding;
			if (Math.abs(x - rect.x) <= half_w && Math.abs(y - rect.y) <= half_h) {
				return rect;
			}
		}
		return null;
	}

	// ── lifecycle ──

	/** Start editing a face label. Called on click when hit_test() hits. */
	begin(rect: Label_Rect): void {
		const already_editing = stores.editing() !== T_Editing.none;
		if (!already_editing) {
			this.prev_selection = stores.selection();
			this.cursor = null; // select all on fresh begin
		}
		const face = hits_3d.front_most_face(rect.so);
		if (face >= 0) hits_3d.set_selection({ so: rect.so, type: T_Hit_3D.face, index: face });
		this.w_s_face_label.set({
			so: rect.so,
			x: rect.x,
			y: rect.y,
			current_name: rect.so.name,
		});
		stores.w_editing.set(T_Editing.face_label);
	}

	/** Commit a new name from the input. Returns true if name changed. */
	commit(input: string): boolean {
		const state = this.state;
		if (!state) return false;

		const trimmed = input.trim();
		if (trimmed.length === 0) {
			this.cancel();
			return false;
		}

		state.so.name = trimmed;
		scenes.save();
		stores.w_all_sos.update(sos => sos);
		this.w_s_face_label.set(null);
		stores.w_editing.set(T_Editing.none);
		this.restore_selection();
		return true;
	}

	/** Live-sync from an external input (e.g., Details panel). Updates SO name + editing state without committing. */
	sync(value: string): void {
		const state = this.state;
		if (!state) return;
		state.so.name = value;
		this.w_s_face_label.update(s => s ? { ...s, current_name: value } : s);
		stores.w_all_sos.update(sos => sos);
		stores.w_selection.update(s => s ? { ...s } : s);
	}

	/** Cancel editing without changing anything. */
	cancel(): void {
		this.w_s_face_label.set(null);
		stores.w_editing.set(T_Editing.none);
		this.restore_selection();
	}

	private restore_selection(): void {
		stores.set_selection(this.prev_selection);
		this.prev_selection = null;
	}
}

export const face_label = new Face_Label();
