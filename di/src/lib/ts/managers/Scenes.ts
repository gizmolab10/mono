/**
 * Scenes — save/load scene state to localStorage
 *
 * Serializes SO bounds and camera position via the SOTs themselves.
 * Uses Preferences for the actual localStorage read/write.
 */

import { preferences, T_Preference } from './Preferences';
import { camera } from '../render/Camera';
import { scene } from '../render/Scene';
import { hits_3d } from './Hits_3D';
import { T_Hit_3D } from '../types/Enumerations';
import type { Bound } from '../runtime/Smart_Object';

export interface Saved_Scene {
	smart_objects: { name: string; bounds: Record<Bound, number>; orientation: number[]; scale?: number; fixed?: boolean; parent_name?: string; formulas?: Record<string, string> }[];
	camera: { eye: number[]; center: number[]; up: number[] };
	root_name?: string;
	selected_name?: string;
	selected_face?: number;
}

class Scenes {
	root_name: string = '';

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

	load(): Saved_Scene | null {
		return preferences.read<Saved_Scene>(T_Preference.scene);
	}

	clear(): void {
		preferences.remove(T_Preference.scene);
	}
}

export const scenes = new Scenes();
