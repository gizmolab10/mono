import type { Portable_Scene, Portable_SO, Exported_File } from './Versions';
import default_scene from '../../../assets/drawer.di?raw';
import { preferences, T_Preference } from './Preferences';
import { CURRENT_VERSION, versions } from './Versions';
import { constants } from '../algebra/User_Constants';
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

class Scenes {
	root_name: string = '';
	root_id: string = '';

	clear(): void {
		preferences.remove(T_Preference.scene);
	}

	load(): Portable_Scene | null {
		const saved = preferences.read<unknown>(T_Preference.scene);
		if (saved) {
			const validated = this.validate_import(saved);
			if (!validated) return null;
			const migrated = versions.migrate(validated.scene, validated.version);
			this.restore_constants(migrated);
			return migrated;
		}
		// Fall back to bundled default scene
		try {
			const parsed = JSON.parse(default_scene);
			const validated = this.validate_import(parsed);
			if (!validated) return null;
			const migrated = versions.migrate(validated.scene, validated.version);
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
		preferences.write(T_Preference.scene, { version: CURRENT_VERSION, scene: data } as Exported_File);
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
					const migrated = versions.migrate(imported.scene, imported.version);
					preferences.write(T_Preference.scene, { version: CURRENT_VERSION, scene: migrated } as Exported_File);
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
			const migrated = versions.migrate(imported.scene, imported.version);
			preferences.write(T_Preference.scene, { version: CURRENT_VERSION, scene: migrated } as Exported_File);
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
			return versions.migrate(imported.scene, imported.version);
		} catch {
			return null;
		}
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
