import type { Portable_Scene, Portable_SO, Exported_File } from './Versions';
import default_scene from '../../../assets/cabinetry/drawer.di?raw';
import { preferences, T_Preference } from './Preferences';
import { CURRENT_VERSION, versions } from './Versions';
import { givens } from '../algebra/Givens';
import { constraints } from '../algebra/Constraints';
import Smart_Object from '../runtime/Smart_Object';
import { T_Hit_3D } from '../types/Enumerations';
import { Identifiable } from '../runtime';
import { camera } from '../render/Camera';
import { scene } from '../render/Scene';
import { hits_3d } from '../events/Hits_3D';
import { stores } from './Stores';

/**
 * Scenes — save/load scene state to localStorage and filesystem
 *
 * Serializes SO bounds and camera position via the SOTs themselves.
 * Uses Preferences for the actual localStorage read/write.
 */

class Scenes {
	root_so: Smart_Object | null = null;
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
			this.restore_givens(migrated);
			return migrated;
		}
		// Fall back to bundled default scene
		try {
			const parsed = JSON.parse(default_scene);
			const validated = this.validate_import(parsed);
			if (!validated) return null;
			const migrated = versions.migrate(validated.scene, validated.version);
			this.restore_givens(migrated);
			return migrated;
		} catch {
			return null;
		}
	}

	/** Restore givens from scene data into the global store.
	 *  Always clears first — no field means no givens. */
	private restore_givens(scene_data: Portable_Scene): void {
		givens.clear();
		if (!scene_data.givens?.length) return;
		for (const entry of scene_data.givens) {
			if (entry.name) { givens.set(entry.name, entry.value_mm); givens.set_locked(entry.name, entry.locked ?? true); }
		}
	}

	/** Capture current scene state as a Portable_Scene (no side effects). */
	capture(): Portable_Scene {
		const clone_ids = new Set<string>();
		for (const o of scene.get_all()) {
			if (!o.so.repeater?.is_repeating) continue;
			const children = scene.get_all().filter(c => c.parent === o.so.scene);
			for (const c of children.slice(1)) clone_ids.add(c.so.id);
		}
		const objects: Portable_SO[] = scene.get_all()
			.filter(o => !clone_ids.has(o.so.id))
			.map(o => {
				const serialized = o.so.serialize();
				return {
					...serialized,
					...(o.parent ? { parent_id: o.parent.so.id } : {}),
				};
			});
		const sel = hits_3d.selection;
		const user_givens = givens.get_all();
		return {
			smart_objects: objects,
			givens: user_givens.length ? user_givens : undefined,
			camera: camera.serialize(),
			root_id: this.root_id,
			selected_id: sel?.so.id,
			selected_face: sel?.type === T_Hit_3D.face ? sel.index : undefined,
		};
	}

	save(): void {
		preferences.write(T_Preference.scene, { version: CURRENT_VERSION, scene: this.capture() } as Exported_File);
	}

	// ── file export/import ──

	// ── IndexedDB library storage ──

	private static readonly IDB_NAME = 'di_library';
	private static readonly IDB_STORE = 'files';
	private static readonly IDB_META = 'meta';
	private idb_cache: IDBDatabase | null = null;
	private library_cache: string[] | null = null;
	private sizes_cache: Map<string, number> | null = null;

	private open_idb(): Promise<IDBDatabase> {
		if (this.idb_cache) return Promise.resolve(this.idb_cache);
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(Scenes.IDB_NAME, 3);
			request.onupgradeneeded = () => {
				const db = request.result;
				// Delete old 'handles' store from previous schema
				if (db.objectStoreNames.contains('handles')) db.deleteObjectStore('handles');
				if (!db.objectStoreNames.contains(Scenes.IDB_STORE)) db.createObjectStore(Scenes.IDB_STORE);
				if (!db.objectStoreNames.contains(Scenes.IDB_META)) db.createObjectStore(Scenes.IDB_META);
			};
			request.onsuccess = () => { this.idb_cache = request.result; resolve(request.result); };
			request.onerror = () => reject(request.error);
		});
	}

	/** Save a .di file's JSON into IndexedDB, keyed by name. Stores size in meta. */
	private async save_to_idb(name: string, json: string): Promise<void> {
		try {
			const database = await this.open_idb();
			const transaction = database.transaction([Scenes.IDB_STORE, Scenes.IDB_META], 'readwrite');
			transaction.objectStore(Scenes.IDB_STORE).put(json, name);
			transaction.objectStore(Scenes.IDB_META).put(json.length, name);
			this.library_cache = null;
			this.sizes_cache = null;
		} catch {
			// silent
		}
	}

	/** Clear all user-saved files from IndexedDB, restoring library to bundled defaults. */
	async clear_idb(): Promise<void> {
		try {
			const database = await this.open_idb();
			const transaction = database.transaction([Scenes.IDB_STORE, Scenes.IDB_META], 'readwrite');
			transaction.objectStore(Scenes.IDB_STORE).clear();
			transaction.objectStore(Scenes.IDB_META).clear();
			this.library_cache = null;
			this.sizes_cache = null;
		} catch {
			// silent
		}
	}

	/** List user-saved file names from IndexedDB (keys only, fast). */
	private async list_idb_names(): Promise<string[]> {
		try {
			const database = await this.open_idb();
			return new Promise((resolve) => {
				const transaction = database.transaction(Scenes.IDB_STORE, 'readonly');
				const req = transaction.objectStore(Scenes.IDB_STORE).getAllKeys();
				transaction.oncomplete = () => resolve(req.result as string[]);
				transaction.onerror = () => resolve([]);
			});
		} catch {
			return [];
		}
	}

	/** Load a single user-saved file from IndexedDB by name. */
	private async load_from_idb(name: string): Promise<string | null> {
		try {
			const database = await this.open_idb();
			return new Promise((resolve) => {
				const transaction = database.transaction(Scenes.IDB_STORE, 'readonly');
				const req = transaction.objectStore(Scenes.IDB_STORE).get(name);
				transaction.oncomplete = () => resolve(req.result as string ?? null);
				transaction.onerror = () => resolve(null);
			});
		} catch {
			return null;
		}
	}

	/** List bundled library names (sync, instant). */
	list_bundled(): string[] {
		return this.list_bundled_names();
	}

	/** List all library names: bundled + user-saved from IDB. */
	async list_library(): Promise<string[]> {
		if (this.library_cache) return this.library_cache;
		const bundled = this.list_bundled_names();
		const user_names = await this.list_idb_names();
		const names = new Set(bundled);
		for (const n of user_names) names.add(n);
		this.library_cache = [...names].sort((a, b) => a.localeCompare(b));
		return this.library_cache;
	}

	/** Load a single library file by name. Checks IDB first, then bundled. */
	async load_library_file(name: string): Promise<string | null> {
		const idb = await this.load_from_idb(name);
		if (idb) return idb;
		const loader = Scenes.bundled_loaders[Scenes.ASSETS_PREFIX + name + '.di'];
		if (loader) return loader();
		return null;
	}

	/** Return bundled defaults from src/assets. */
	private static readonly ASSETS_PREFIX = '../../../assets/';
	private static bundled_loaders = import.meta.glob('../../../assets/**/*.di', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
	private static bundled_eager = import.meta.glob('../../../assets/**/*.di', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

	private list_bundled_names(): string[] {
		return Object.keys(Scenes.bundled_loaders).map(path =>
			path.slice(Scenes.ASSETS_PREFIX.length).replace('.di', '')
		);
	}

	/** Get file sizes for all library entries (bundled + IDB meta). No file content is loaded. */
	async library_sizes(): Promise<Map<string, number>> {
		if (this.sizes_cache) return this.sizes_cache;
		const sizes = new Map<string, number>();
		for (const [path, content] of Object.entries(Scenes.bundled_eager)) {
			sizes.set(path.slice(Scenes.ASSETS_PREFIX.length).replace('.di', ''), content.length);
		}
		try {
			const database = await this.open_idb();
			await new Promise<void>((resolve) => {
				const transaction = database.transaction(Scenes.IDB_META, 'readonly');
				const req = transaction.objectStore(Scenes.IDB_META).getAll();
				const keys_req = transaction.objectStore(Scenes.IDB_META).getAllKeys();
				transaction.oncomplete = () => {
					const keys = keys_req.result as string[];
					const vals = req.result as number[];
					for (let i = 0; i < keys.length; i++) sizes.set(keys[i], vals[i]);
					resolve();
				};
				transaction.onerror = () => resolve();
			});
		} catch { /* silent */ }
		this.sizes_cache = sizes;
		return sizes;
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
		stores.w_library.update(n => n + 1);
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

	import_from_file(on_loaded: (scene: Portable_Scene) => void): void {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.di,.json';
		input.onchange = () => {
			const file = input.files?.[0];
			if (!file) return;
			file.text().then(text => {
				try {
					const scene = this.parse_text(text);
					if (scene) on_loaded(scene);
				} catch (error) {
					console.error('Import failed:', error);
					alert('Could not read file — invalid format.');
				}
			});
		};
		input.click();
	}

	/** Create a fresh empty scene. */
	new_scene(): Portable_Scene {
		const id = Identifiable.newID();
		return {
			smart_objects: [{
				id,
				name: 'new',
				x: { attributes: { origin: 0, extent: 609.6, length: 609.6, angle: 0 }, invariant: 1 },
				y: { attributes: { origin: 0, extent: 609.6, length: 609.6, angle: 0 }, invariant: 1 },
				z: { attributes: { origin: 0, extent: 609.6, length: 609.6, angle: 0 }, invariant: 1 },
				visible: false,
			}],
			camera: { eye: [0, 0, 2750], center: [0, 0, 0], up: [0, 1, 0] },
			root_id: id,
		};
	}

	/** Parse raw JSON text into a migrated Portable_Scene. */
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

	/** DEV MIGRATION: translate all library files to agnostic and download each. */
	async translate_library(): Promise<void> {
		const names = await this.list_library();
		for (const name of names) {
			const raw = await this.load_library_file(name);
			if (!raw) continue;
			const scene_data = this.parse_text(raw);
			if (!scene_data) continue;
			for (const so_data of scene_data.smart_objects) {
				const so = Smart_Object.deserialize(so_data);
				constraints.translate_formulas(so, 'agnostic');
				const re = so.serialize();
				so_data.x = re.x;
				so_data.y = re.y;
				so_data.z = re.z;
			}
			const exported: Exported_File = { version: CURRENT_VERSION, scene: scene_data };
			this.download_file(`${name}.di`, JSON.stringify(exported, null, 2));
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
scenes.list_library();
