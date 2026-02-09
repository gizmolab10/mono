/**
 * Scenes — save/load scene state to localStorage and filesystem
 *
 * Serializes SO bounds and camera position via the SOTs themselves.
 * Uses Preferences for the actual localStorage read/write.
 */

import { preferences, T_Preference } from './Preferences';
import type { Bound } from '../runtime/Smart_Object';
import default_scene from '../../../assets/A.di?raw';
import { T_Hit_3D } from '../types/Enumerations';
import { camera } from '../render/Camera';
import { scene } from '../render/Scene';
import { hits_3d } from './Hits_3D';

export interface Saved_Scene {
	smart_objects: { name: string; bounds: Record<Bound, number>; orientation: number[]; scale?: number; fixed?: boolean; parent_name?: string; formulas?: Record<string, string> }[];
	camera: { eye: number[]; center: number[]; up: number[] };
	root_name?: string;
	selected_name?: string;
	selected_face?: number;
}

interface Exported_File {
	version: string;
	scene: Saved_Scene;
}

const CURRENT_VERSION = '1';

class Scenes {
	root_name: string = '';

	clear(): void {
		preferences.remove(T_Preference.scene);
	}

	load(): Saved_Scene | null {
		const saved = preferences.read<Saved_Scene>(T_Preference.scene);
		if (saved) return saved;
		// Fall back to bundled default scene
		try {
			const parsed = JSON.parse(default_scene);
			const validated = this.validate_import(parsed);
			return validated?.scene ?? null;
		} catch {
			return null;
		}
	}

	save(): void {
		const objects = scene.get_all().map(o => {
			const serialized = o.so.serialize();
			if (o.parent) return { ...serialized, parent_name: o.parent.so.name };
			return serialized;
		});
		const sel = hits_3d.selection;
		const data: Saved_Scene = {
			smart_objects: objects,
			camera: camera.serialize(),
			root_name: this.root_name,
			selected_name: sel?.so.name,
			selected_face: sel?.type === T_Hit_3D.face ? sel.index : undefined,
		};
		preferences.write(T_Preference.scene, data);
	}

	// ── file export/import ──

	export_to_file(): void {
		this.save();
		const saved = this.load();
		if (!saved) return;
		const exported: Exported_File = {
			version: CURRENT_VERSION,
			scene: saved,
		};
		const json = JSON.stringify(exported, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${this.root_name || 'scene'}.di`;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	import_from_file(): void {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.di,.json';
		input.onchange = () => {
			const file = input.files?.[0];
			if (!file) return;
			file.text().then(text => {
				try {
					const parsed = JSON.parse(text);
					const imported = this.validate_import(parsed);
					if (!imported) return;
					preferences.write(T_Preference.scene, imported.scene);
					location.reload();
				} catch (error) {
					console.error('Import failed:', error);
					alert('Could not read file — invalid format.');
				}
			});
		};
		input.click();
	}

	private validate_import(data: unknown): Exported_File | null {
		if (!data || typeof data !== 'object') return null;
		const record = data as Record<string, unknown>;

		// Accept both wrapped (version + scene) and raw Saved_Scene
		if (record.version && record.scene) {
			const scene_data = record.scene as Saved_Scene;
			if (!Array.isArray(scene_data.smart_objects)) return null;
			return { version: String(record.version), scene: scene_data };
		}

		// Bare Saved_Scene (e.g., from localStorage copy)
		if (Array.isArray(record.smart_objects)) {
			return { version: CURRENT_VERSION, scene: record as unknown as Saved_Scene };
		}

		return null;
	}
}

export const scenes = new Scenes();
