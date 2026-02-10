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
import { Identifiable } from '../runtime';
import { camera } from '../render/Camera';
import { scene } from '../render/Scene';
import { hits_3d } from './Hits_3D';

export interface Portable_SO {
	id: string;
	name: string;
	bounds: Record<Bound, number>;
	orientation: number[];
	scale?: number;
	fixed?: boolean;
	position?: number[];		// O_Scene.position (defaults to [0,0,0])
	parent_id?: string;
	parent_name?: string;		// kept for backwards-compatible export
	formulas?: Record<string, string>;
}

export interface Portable_Scene {
	smart_objects: Portable_SO[];
	camera: { eye: number[]; center: number[]; up: number[] };
	root_id?: string;
	root_name?: string;			// v1 compat
	selected_id?: string;
	selected_name?: string;		// v1 compat
	selected_face?: number;
}

interface Exported_File {
	version: string;
	scene: Portable_Scene;
}

const CURRENT_VERSION = '2';

class Scenes {
	root_id: string = '';
	root_name: string = '';

	clear(): void {
		preferences.remove(T_Preference.scene);
	}

	load(): Portable_Scene | null {
		const saved = preferences.read<Portable_Scene>(T_Preference.scene);
		if (saved) return this.ensure_v2(saved);
		// Fall back to bundled default scene
		try {
			const parsed = JSON.parse(default_scene);
			const validated = this.validate_import(parsed);
			if (!validated) return null;
			return this.ensure_v2(validated.scene);
		} catch {
			return null;
		}
	}

	save(): void {
		const objects: Portable_SO[] = scene.get_all().map(o => {
			const serialized = o.so.serialize();
			const pos = o.position;
			const has_position = pos[0] !== 0 || pos[1] !== 0 || pos[2] !== 0;
			const with_position = has_position ? { ...serialized, position: Array.from(pos) } : serialized;
			if (o.parent) return { ...with_position, parent_id: o.parent.so.id, parent_name: o.parent.so.name };
			return with_position;
		});
		const sel = hits_3d.selection;
		const data: Portable_Scene = {
			smart_objects: objects,
			camera: camera.serialize(),
			root_id: this.root_id,
			root_name: this.root_name,
			selected_id: sel?.so.id,
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
					preferences.write(T_Preference.scene, this.ensure_v2(imported.scene));
					location.reload();
				} catch (error) {
					console.error('Import failed:', error);
					alert('Could not read file — invalid format.');
				}
			});
		};
		input.click();
	}

	// ── v1 → v2 migration ──
	// v1 files have no id — everything keyed by name.
	// Mint a stable id for each SO, rewrite formulas and parent refs.

	private ensure_v2(saved: Portable_Scene): Portable_Scene {
		const needs_migration = saved.smart_objects.some(so => !so.id);
		if (!needs_migration) return saved;

		// Build name → minted id map
		const name_to_id = new Map<string, string>();
		for (const so of saved.smart_objects) {
			if (!so.id) so.id = Identifiable.newID();
			name_to_id.set(so.name, so.id);
		}

		for (const so of saved.smart_objects) {
			// Rewrite parent_name → parent_id
			if (so.parent_name && !so.parent_id) {
				so.parent_id = name_to_id.get(so.parent_name);
			}

			// Rewrite formulas: replace name.bound with id.bound
			if (so.formulas) {
				for (const [bound, formula] of Object.entries(so.formulas)) {
					let rewritten = formula;
					for (const [name, id] of name_to_id) {
						// Replace "name." with "id." — only at word boundaries
						rewritten = rewritten.replace(new RegExp(`\\b${this.escape_regex(name)}\\.`, 'g'), `${id}.`);
					}
					so.formulas[bound] = rewritten;
				}
			}
		}

		// Rewrite root and selection refs
		if (saved.root_name && !saved.root_id) {
			saved.root_id = name_to_id.get(saved.root_name);
		}
		if (saved.selected_name && !saved.selected_id) {
			saved.selected_id = name_to_id.get(saved.selected_name);
		}

		return saved;
	}

	private escape_regex(s: string): string {
		return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	private validate_import(data: unknown): Exported_File | null {
		if (!data || typeof data !== 'object') return null;
		const record = data as Record<string, unknown>;

		// Accept both wrapped (version + scene) and raw Portable_Scene
		if (record.version && record.scene) {
			const scene_data = record.scene as Portable_Scene;
			if (!Array.isArray(scene_data.smart_objects)) return null;
			return { version: String(record.version), scene: scene_data };
		}

		// Bare Portable_Scene (e.g., from localStorage copy)
		if (Array.isArray(record.smart_objects)) {
			return { version: CURRENT_VERSION, scene: record as unknown as Portable_Scene };
		}

		return null;
	}
}

export const scenes = new Scenes();
