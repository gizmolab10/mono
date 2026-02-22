import type { Compact_Attribute, Portable_Attribute, Portable_Axis, Repeater } from '../types/Interfaces';
import { constants, type ConstantEntry } from '../algebra/User_Constants';
import default_scene from '../../../assets/drawer.di?raw';
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

const CURRENT_VERSION = '7';

export interface Portable_SO {
	rotation_lock?: number;            // rotation axis: 0=x, 1=y, 2=z (default 0)
	parent_id?: string;
	x: Portable_Axis;
	y: Portable_Axis;
	z: Portable_Axis;
	name: string;
	id: string;
	repeater?: Repeater;
	is_template?: boolean;
}

export interface Portable_Scene {
	camera: { eye: number[]; center: number[]; up: number[] };
	smart_objects: Portable_SO[];
	constants?: ConstantEntry[];
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
		if (saved) {
			const migrated = this.migrate(saved);
			this.restore_constants(migrated);
			return migrated;
		}
		// Fall back to bundled default scene
		try {
			const parsed = JSON.parse(default_scene);
			const validated = this.validate_import(parsed);
			if (!validated) return null;
			const migrated = this.migrate(validated.scene);
			this.restore_constants(migrated);
			return migrated;
		} catch {
			return null;
		}
	}

	/** Restore constants from scene data into the global store.
	 *  Always clears first — no field means no constants. */
	private restore_constants(scene_data: Portable_Scene): void {
		constants.clear();
		if (!scene_data.constants?.length) return;
		for (const entry of scene_data.constants) {
			if (entry.name) constants.set(entry.name, entry.value_mm);
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
		const user_constants = constants.get_all();
		const data: Portable_Scene = {
			smart_objects: objects,
			constants: user_constants.length ? user_constants : undefined,
			camera: camera.serialize(),
			root_id: this.root_id,
			selected_id: sel?.so.id,
			selected_face: sel?.type === T_Hit_3D.face ? sel.index : undefined,
		};
		preferences.write(T_Preference.scene, data);
	}

	// ── file export/import ──

	// ── IndexedDB library storage ──

	private static readonly IDB_NAME = 'di_library';
	private static readonly IDB_STORE = 'files';

	private open_idb(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(Scenes.IDB_NAME, 2);
			request.onupgradeneeded = () => {
				const db = request.result;
				// Delete old 'handles' store from previous schema
				if (db.objectStoreNames.contains('handles')) db.deleteObjectStore('handles');
				if (!db.objectStoreNames.contains(Scenes.IDB_STORE)) db.createObjectStore(Scenes.IDB_STORE);
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	/** Save a .di file's JSON into IndexedDB, keyed by name. */
	private async save_to_idb(name: string, json: string): Promise<void> {
		try {
			const database = await this.open_idb();
			const transaction = database.transaction(Scenes.IDB_STORE, 'readwrite');
			transaction.objectStore(Scenes.IDB_STORE).put(json, name);
		} catch {
			// silent
		}
	}

	/** Load all user-saved .di files from IndexedDB. */
	private async load_all_from_idb(): Promise<{ name: string; raw: string }[]> {
		try {
			const database = await this.open_idb();
			return new Promise((resolve) => {
				const transaction = database.transaction(Scenes.IDB_STORE, 'readonly');
				const store = transaction.objectStore(Scenes.IDB_STORE);
				const keys_req = store.getAllKeys();
				const vals_req = store.getAll();
				transaction.oncomplete = () => {
					const keys = keys_req.result as string[];
					const vals = vals_req.result as string[];
					resolve(keys.map((name, i) => ({ name, raw: vals[i] })));
				};
				transaction.onerror = () => resolve([]);
			});
		} catch {
			return [];
		}
	}

	/** List library: bundled defaults + user-saved files from IDB. */
	async list_library(): Promise<{ name: string; raw: string }[]> {
		const bundled = this.list_bundled();
		const user_files = await this.load_all_from_idb();
		// Merge: user files override bundled defaults with same name
		const by_name = new Map(bundled.map(f => [f.name, f]));
		for (const f of user_files) by_name.set(f.name, f);
		return [...by_name.values()].sort((a, b) => a.name.localeCompare(b.name));
	}

	/** Return bundled defaults from src/assets. */
	private list_bundled(): { name: string; raw: string }[] {
		const modules = import.meta.glob('../../../assets/*.di', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
		return Object.entries(modules).map(([path, raw]) => ({
			name: path.split('/').pop()?.replace('.di', '') ?? path,
			raw,
		})).sort((a, b) => a.name.localeCompare(b.name));
	}

	/** Add current scene to library: save to IDB + download to disk. */
	async add_to_library(): Promise<void> {
		this.save();
		const saved = this.load();
		if (!saved) return;
		const exported: Exported_File = {
			version: CURRENT_VERSION,
			scene: saved,
		};
		const json = JSON.stringify(exported, null, 2);
		const root = saved.smart_objects.find(so => so.id === saved.root_id);
		const name = root?.name || 'scene';
		await this.save_to_idb(name, json);
		this.download_file(`${name}.di`, json);
	}

	/** Trigger a browser download via anchor tag. */
	private download_file(filename: string, content: string): void {
		const blob = new Blob([content], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = filename;
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

	/** Create a fresh empty scene with a single root SO. */
	new_scene(): void {
		const id = Identifiable.newID();
		const empty: Exported_File = {
			version: CURRENT_VERSION,
			scene: {
				smart_objects: [{
					id,
					name: 'new',
					x: { attributes: { origin: 0, extent: 609.6, length: 609.6, angle: 0 } },
					y: { attributes: { origin: 0, extent: 609.6, length: 609.6, angle: 0 } },
					z: { attributes: { origin: 0, extent: 609.6, length: 609.6, angle: 0 } },
					rotation_lock: 0,
				}],
				camera: { eye: [0, 0, 2750], center: [0, 0, 0], up: [0, 1, 0] },
				root_id: id,
			},
		};
		this.load_from_text(JSON.stringify(empty));
	}

	/** Load a scene from raw JSON text (used by library panel). */
	load_from_text(text: string): void {
		try {
			const parsed = JSON.parse(text);
			const imported = this.validate_import(parsed);
			if (!imported) return;
			preferences.write(T_Preference.scene, this.migrate(imported.scene));
			location.reload();
		} catch (error) {
			console.error('Load failed:', error);
		}
	}

	/** Parse raw JSON text into a migrated Portable_Scene (no save/reload). */
	parse_text(text: string): Portable_Scene | null {
		try {
			const parsed = JSON.parse(text);
			const imported = this.validate_import(parsed);
			if (!imported) return null;
			return this.migrate(imported.scene);
		} catch {
			return null;
		}
	}

	// ── migration ──
	// Detect shape and convert to current Portable_Scene.
	// Legacy: SO has `bounds` field.  Current: SO has `x`, `y`, `z` fields.

	private migrate(raw: unknown): Portable_Scene {
		const data = raw as Record<string, unknown>;
		const sos = data.smart_objects as Record<string, unknown>[];
		if (!sos?.length) return raw as Portable_Scene;

		// Legacy shape — has `bounds`
		if ('bounds' in sos[0]) {
			return this.migrate_to_offsets(this.migrate_legacy(data, sos as unknown as Portable_SO_v2[]));
		}

		// v3 shape — attributes is an array, convert to v4 keyed object
		if ('x' in sos[0] && 'y' in sos[0] && 'z' in sos[0]) {
			const first_axis = (sos[0] as Record<string, unknown>).x as Record<string, unknown>;
			if (Array.isArray(first_axis?.attributes)) {
				for (const so of sos) {
					for (const axis_name of ['x', 'y', 'z']) {
						const axis = (so as Record<string, Record<string, unknown>>)[axis_name];
						const arr = axis.attributes as Portable_Attribute[];
						axis.attributes = { origin: arr[0], extent: arr[1], length: arr[2], angle: arr[3] };
					}
				}
				// v4 → v5: convert absolute child values to offsets from parent
				return this.migrate_to_offsets(raw as Portable_Scene);
			}
		}

		// v5 → v6: rename standard_dimensions → constants
		if ('standard_dimensions' in data && !('constants' in data)) {
			data.constants = data.standard_dimensions;
			delete data.standard_dimensions;
		}

		return raw as Portable_Scene;
	}

	/** v4 → v5: child position values become offsets from parent.
	 *  Old format stored absolute values + optional offset field.
	 *  New format: value IS the offset. */
	private migrate_to_offsets(scene_data: Portable_Scene): Portable_Scene {
		const sos = scene_data.smart_objects;
		if (!sos?.length) return scene_data;

		const has_children = sos.some(so => so.parent_id);
		if (!has_children) return scene_data;

		const by_id = new Map(sos.map(so => [so.id, so]));

		const read_value = (attr: Compact_Attribute): number =>
			typeof attr === 'number' ? attr : (attr.value ?? 0);

		for (const so of sos) {
			if (!so.parent_id) continue;
			const parent = by_id.get(so.parent_id);
			if (!parent) continue;
			for (const axis_name of ['x', 'y', 'z'] as const) {
				const child_attrs = so[axis_name].attributes;
				const parent_attrs = parent[axis_name].attributes;
				for (const key of ['origin', 'extent'] as const) {
					const child_attr = child_attrs[key];
					// Skip formula attrs — they produce absolute values at runtime
					if (typeof child_attr === 'object' && child_attr.formula) continue;
					// Old data with explicit offset field (pre-v5): use the offset directly
					const legacy = child_attr as Record<string, unknown>;
					if (typeof child_attr === 'object' && legacy.offset !== undefined) {
						child_attrs[key] = legacy.offset as number;
						continue;
					}
					// Otherwise compute offset: child_absolute - parent_absolute
					child_attrs[key] = read_value(child_attr) - read_value(parent_attrs[key]);
				}
			}
		}
		return scene_data;
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
			const pa: Portable_Axis = { attributes: { origin: start, extent: end, length, angle } };
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
