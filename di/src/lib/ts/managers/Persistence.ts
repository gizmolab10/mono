/**
 * Persistence — save/load scene state to localStorage
 *
 * Serializes SO bounds and camera position via the SOTs themselves.
 * Uses Preferences for the actual localStorage read/write.
 */

import { preferences, T_Preference } from './Preferences';
import { camera } from '../render/Camera';
import { scene } from '../render/Scene';
import type { Bound } from '../runtime/Smart_Object';

export interface Saved_Scene {
	smart_objects: { name: string; bounds: Record<Bound, number>; orientation: number[]; scale?: number }[];
	camera: { eye: number[]; center: number[]; up: number[] };
}

class Persistence {

	save(): void {
		const objects = scene.get_all().map(o => o.so.serialize());
		const data: Saved_Scene = {
			smart_objects: objects,
			camera: camera.serialize(),
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

export const persistence = new Persistence();
