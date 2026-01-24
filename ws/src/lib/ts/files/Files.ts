import { T_File_Extension, T_Text_Extension, T_Image_Extension, T_Control } from '../common/Enumerations';
import { tu } from '../utilities/Testworthy_Utilities';
import DB_Filesystem from '../database/DB_Filesystem';
import { T_Preview_Type } from '../types/Types';
import { show } from '../managers/Visibility';
import { h } from '../managers/Hierarchy';
import { writable } from 'svelte/store';

interface File_System_Directory_Handle {
	name: string;
	requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
}

export default class Files {
	format_preference: T_File_Extension = T_File_Extension.json;

	w_preview_filename	= writable<string>('');
	w_preview_content	= writable<string | null>(null);
	w_preview_type		= writable<T_Preview_Type>('text');

	
	static readonly _____WRITE: unique symbol;

	persist_json_object_toFile(object: Object, fileName: string): void {
		const content = tu.stringify_object(object);
		const blob = new Blob([content], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(link.href);
	}
	
	static readonly _____READ: unique symbol;

	async fetch_fromFile(file: File): Promise<any> {
		const format = this.format_preference;
		switch (format) {
			case T_File_Extension.seriously: return await this.extract_json_object_fromFile(file);
			case T_File_Extension.json:	  return await this.extract_json_object_fromFile(file);
			case T_File_Extension.csv:		  return await this.extract_csv_records_fromFile(file);
			default:					  throw new Error(`Unsupported format: ${format}`);
		}
	}

	private async extract_json_object_fromFile(file: File): Promise<any> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = function (e) {
				const result = (e.target?.result as string);
				if (!result || result.length == 0) {
					reject('Empty file.');
				} else {
					try {
						const object = JSON.parse(result);
						resolve(object);
					} catch (error) {
						reject(`Error parsing JSON: '${result}' ${(error as Error).message}`);
					}
				}
			};
			reader.onerror = function () {
				reject('Error reading file.');
			};
			reader.readAsText(file);
		});
	}

	private async extract_csv_records_fromFile(file: File): Promise<any> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = function (e) {
				const result = (e.target?.result as string);
				if (!result || result.length == 0) {
					reject('Empty file.');
					return;
				}
				try {
					// Replace commas inside quotes with a temporary marker
					let inQuotes = false;
					let processed = '';
					for (let i = 0; i < result.length; i++) {
						const character = result[i];
						if (character === '"') inQuotes = !inQuotes;
						else if (character === ',' && inQuotes) processed += '$$$$$$';
						else processed += character;
					}
					
					const lines = processed.split('\n').filter(line => line.trim().length > 0);
					if (lines.length === 0) {
						reject('No data found in CSV file.');
						return;
					}
					const headers = lines[0].split(',').map(header => header.trim());
					const records = lines.slice(1).map(line => {
						const values = line.split(',').map(value => value.trim().replace(/\$\$\$\$\$\$/g, ','));
						const record: Record<string, string> = {};
						headers.forEach((header, index) => {
							record[header] = values[index] || '';
						});
						return record;
					});
					resolve(records);
				} catch (error) {
					reject(`Error parsing CSV: ${(error as Error).message}`);
				}
			};
			reader.onerror = function () {
				reject('Error reading file.');
			};
			reader.readAsText(file);
		});
	}
	
	static readonly _____PREVIEW: unique symbol;

	preview_type_forFilename(filename: string): T_Preview_Type {
		const ext = filename.split('.').pop()?.toLowerCase() || '';
		if (Object.values(T_Image_Extension).includes(ext as T_Image_Extension)) return 'image';
		if (Object.values(T_Text_Extension).includes(ext as T_Text_Extension)) return 'text';
		return null;
	}

	async show_previewOf_file(fileId: string): Promise<boolean> {
		let success = false;
		if (h.db instanceof DB_Filesystem) {
			const entry = h.db.get_file_information(fileId);
			if (!!entry && !entry.isDirectory) {
				const preview_type = this.preview_type_forFilename(entry.name);
				if (!!preview_type) {
					if (preview_type === 'image') {
						this.w_preview_content.set(await h.db.readFileAsDataURL(fileId));
					} else {
						this.w_preview_content.set(await h.db.readFileAsText(fileId));
					}
					this.w_preview_type.set(preview_type);
					this.w_preview_filename.set(entry.name);
					show.w_id_popupView.set(T_Control.preview);
					success = true;
				}
			}
		}
		return success;
	}

	static readonly _____DIRECTORY_HANDLE: unique symbol;

	private readonly DB_NAME = 'webseriously-files';
	private readonly STORE_NAME = 'directory-handles';
	private readonly HANDLE_KEY = 'last-folder';

	private async openDatabase(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.DB_NAME, 1);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.STORE_NAME)) {
					db.createObjectStore(this.STORE_NAME);
				}
			};
		});
	}

	async save_directoryHandle(handle: File_System_Directory_Handle): Promise<boolean> {
		let success = false;
		try {
			const db = await this.openDatabase();
			const tx = db.transaction(this.STORE_NAME, 'readwrite');
			const store = tx.objectStore(this.STORE_NAME);
			store.put(handle, this.HANDLE_KEY);
			await new Promise<void>((resolve, reject) => {
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
			});
			db.close();
			success = true;
		} catch (error) {
			console.warn('Failed to save directory handle:', error);
		}
		return success;
	}

	async restore_directoryHandle(): Promise<File_System_Directory_Handle | null> {
		let handle: File_System_Directory_Handle | null = null;
		try {
			const db = await this.openDatabase();
			const tx = db.transaction(this.STORE_NAME, 'readonly');
			const store = tx.objectStore(this.STORE_NAME);
			const request = store.get(this.HANDLE_KEY);
			handle = await new Promise<File_System_Directory_Handle | null>((resolve, reject) => {
				request.onsuccess = () => resolve(request.result || null);
				request.onerror = () => reject(request.error);
			});
			db.close();
			if (!!handle) {
				const permission = await handle.requestPermission({ mode: 'read' });
				if (permission !== 'granted') {
					handle = null;
				}
			}
		} catch (error) {
			console.warn('Failed to restore directory handle:', error);
		}
		return handle;
	}

	async clear_directoryHandle(): Promise<void> {
		try {
			const db = await this.openDatabase();
			const tx = db.transaction(this.STORE_NAME, 'readwrite');
			const store = tx.objectStore(this.STORE_NAME);
			store.delete(this.HANDLE_KEY);
			await new Promise<void>((resolve, reject) => {
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
			});
			db.close();
		} catch (error) {
			console.warn('Failed to clear directory handle:', error);
		}
	}

}

export const files = new Files();