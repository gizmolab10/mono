import type { Portable_Attribute, Portable_Axis } from '../types/Interfaces';
import default_scene from '../../../assets/American.di?raw';
import { preferences, T_Preference } from './Preferences';
import type { Axis_Name, Bound } from '../types/Types';
import { T_Hit_3D } from '../types/Enumerations';
import { Identifiable } from '../runtime';
import { camera } from '../render/Camera';
import { scene } from '../render/Scene';
import { hits_3d } from './Hits_3D';

/**
 * Scenes — save/load scene state to localStorage and filesystem
 *
 * Serializes SO bounds and camera position via the SOTs themselves.
 * Uses Preferences for the actual localStorage read/write.
 */

const CURRENT_VERSION = '3';

export interface Portable_SO {
	rotation_lock?: number;            // rotation axis: 0=x, 1=y, 2=z (default 0)
	parent_id?: string;
	x: Portable_Axis;
	y: Portable_Axis;
	z: Portable_Axis;
	name: string;
	id: string;
}

export interface Portable_Scene {
  camera: { eye: number[]; center: number[]; up: number[] };
  smart_objects: Portable_SO[];
  selected_face?: number;
  selected_id?: string;
  root_id: string;
}

export interface Exported_File {
  scene: Portable_Scene;
  version: string;
}

// Legacy v2 shape (flat bounds, orientation) — used only by migration code.
export interface Portable_SO_v2 {
  rotations?: { axis: Axis_Name; angle: number }[];
  formulas?: Record<string, string>;
  bounds: Record<Bound, number>;
  orientation?: number[];     // kept for backwards-compatible import
  invariants?: number[];
  parent_name?: string;       // kept for backwards-compatible import
  position?: number[];        // O_Scene.position (defaults to [0,0,0])
  parent_id?: string;
  name: string;
  id: string;
}

class Scenes {
	root_name: string = '';
	root_id: string = '';

	clear(): void {
		preferences.remove(T_Preference.scene);
	}

	load(): Portable_Scene | null {
		const saved = preferences.read<Portable_Scene>(T_Preference.scene);
		if (saved) return this.migrate(saved);
		// Fall back to bundled default scene
		try {
			const parsed = JSON.parse(default_scene);
			const validated = this.validate_import(parsed);
			if (!validated) return null;
			return this.migrate(validated.scene);
		} catch {
			return null;
		}
	}

	save(): void {
		const objects: Portable_SO[] = scene.get_all().map(o => {
			const serialized = o.so.serialize();
			return {
				...serialized,
				...(o.parent ? { parent_id: o.parent.so.id } : {}),
			};
		});
		const sel = hits_3d.selection;
		const data: Portable_Scene = {
			smart_objects: objects,
			camera: camera.serialize(),
			root_id: this.root_id,
			selected_id: sel?.so.id,
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
					preferences.write(T_Preference.scene, this.migrate(imported.scene));
					location.reload();
				} catch (error) {
					console.error('Import failed:', error);
					alert('Could not read file — invalid format.');
				}
			});
		};
		input.click();
	}

	// ── migration ──
	// Detect shape and convert to current Portable_Scene.
	// Legacy: SO has `bounds` field.  Current: SO has `x`, `y`, `z` fields.

	private migrate(raw: unknown): Portable_Scene {
		const data = raw as Record<string, unknown>;
		const sos = data.smart_objects as Record<string, unknown>[];
		if (!sos?.length) return raw as Portable_Scene;

		// Already current shape?
		if ('x' in sos[0] && 'y' in sos[0] && 'z' in sos[0]) {
			return raw as Portable_Scene;
		}

		// Legacy shape — has `bounds`
		if ('bounds' in sos[0]) {
			return this.migrate_legacy(data, sos as unknown as Portable_SO_v2[]);
		}

		return raw as Portable_Scene;
	}

	private migrate_legacy(data: Record<string, unknown>, legacy_sos: Portable_SO_v2[]): Portable_Scene {
		// v1 → v2: mint ids if missing
		const needs_ids = legacy_sos.some(so => !so.id);
		const name_to_id = new Map<string, string>();

		if (needs_ids) {
			for (const so of legacy_sos) {
				if (!so.id) so.id = Identifiable.newID();
				name_to_id.set(so.name, so.id);
			}
			for (const so of legacy_sos) {
				if (so.parent_name && !so.parent_id) {
					so.parent_id = name_to_id.get(so.parent_name);
				}
				if (so.formulas) {
					for (const [bound, formula] of Object.entries(so.formulas)) {
						let rewritten = formula;
						for (const [name, id] of name_to_id) {
							rewritten = rewritten.replace(new RegExp(`\\b${this.escape_regex(name)}\\.`, 'g'), `${id}.`);
						}
						so.formulas[bound] = rewritten;
					}
				}
			}
		}

		// v2 → current: convert each SO
		const migrated: Portable_SO[] = legacy_sos.map(old => this.migrate_so(old));

		// Resolve root_id and selected_id from legacy name fields if needed
		let root_id = (data.root_id as string) ?? '';
		let selected_id = data.selected_id as string | undefined;
		if (!root_id && data.root_name) {
			root_id = name_to_id.get(data.root_name as string) ?? migrated[0]?.id ?? '';
		}
		if (!selected_id && data.selected_name) {
			selected_id = name_to_id.get(data.selected_name as string);
		}
		if (!root_id && migrated.length > 0) {
			root_id = migrated[0].id;
		}

		return {
			smart_objects: migrated,
			camera: data.camera as Portable_Scene['camera'],
			root_id,
			selected_id,
			selected_face: data.selected_face as number | undefined,
		};
	}

	/** Convert a single legacy Portable_SO_v2 → Portable_SO */
	private migrate_so(old: Portable_SO_v2): Portable_SO {
		const bounds = old.bounds;
		const axis_names: Axis_Name[] = ['x', 'y', 'z'];
		const axes: Record<string, Portable_Axis> = {};

		for (let i = 0; i < 3; i++) {
			const name = axis_names[i];
			const min_key = `${name}_min` as Bound;
			const max_key = `${name}_max` as Bound;
			const start: Portable_Attribute = { value: bounds[min_key] };
			const end: Portable_Attribute = { value: bounds[max_key] };
			if (old.formulas?.[min_key]) start.formula = old.formulas[min_key];
			if (old.formulas?.[max_key]) end.formula = old.formulas[max_key];
			const length: Portable_Attribute = { value: bounds[max_key] - bounds[min_key] };
			let angle: Portable_Attribute = { value: 0 };
			if (old.rotations) {
				const rot = old.rotations.find(r => r.axis === name);
				if (rot && Math.abs(rot.angle) > 1e-10) angle = { value: rot.angle };
			}
			const pa: Portable_Axis = { attributes: [start, end, length, angle] };
			if (old.invariants && old.invariants[i] !== 2) pa.invariant = old.invariants[i];
			axes[name] = pa;
		}

		const result: Portable_SO = {
			id: old.id,
			name: old.name,
			x: axes.x,
			y: axes.y,
			z: axes.z,
		};

		if (old.parent_id) result.parent_id = old.parent_id;

		return result;
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
