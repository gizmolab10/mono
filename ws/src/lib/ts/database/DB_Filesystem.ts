import { g, h, core, files, T_Thing, T_Trait, T_Predicate, T_Persistence } from '../common/Global_Imports';
import { DB_Name, T_Database } from './DB_Common';
import DB_Common from './DB_Common';

// File System Access API types
interface File_System_Handle {
	kind: 'file' | 'directory';
	name: string;
}

interface File_System_File_Handle extends File_System_Handle {
	kind: 'file';
	getFile(): Promise<File>;
}

interface File_System_Directory_Handle extends File_System_Handle {
	kind: 'directory';
	values(): AsyncIterableIterator<File_System_Handle>;
	requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
}

interface File_Picker_Options {
	mode?: 'read' | 'readwrite';
}

declare global {
	interface Window {
		showDirectoryPicker(options?: File_Picker_Options): Promise<File_System_Directory_Handle>;
	}
}

interface File_Entry {
	id: string;
	name: string;
	path: string;
	isDirectory: boolean;
	handle: File_System_Handle;
	parentId: string | null;
}

export default class DB_Filesystem extends DB_Common {
	t_persistence = T_Persistence.none;
	t_database = T_Database.filesystem;
	idBase = DB_Name.filesystem;
	
	private rootHandle: File_System_Directory_Handle | null = null;
	private file_information: Map<string, File_Entry> = new Map();
	
	get details_forStorage(): Object { 
		const folderName = this.rootHandle?.name ?? 'none';
		return ['folder', folderName]; 
	}
	
	get hasFolder(): boolean { return this.rootHandle !== null; }
	
	static isSupported(): boolean {
		return 'showDirectoryPicker' in window;
	}

	// Called during db switch - NO picker (no user gesture)
	async fetch_all(): Promise<boolean> {
		if (!DB_Filesystem.isSupported()) {
			console.warn('File System Access API not supported in this browser');
			return false;
		}
		
		// Try to restore previously selected folder
		if (!this.rootHandle) {
			const restored = await files.restore_directoryHandle();
			if (!!restored) {
				this.rootHandle = restored as File_System_Directory_Handle;
			}
		}
		
		// If folder available, scan it
		if (this.rootHandle) {
			return await this.scanFromRoot();
		}
		
		// No folder yet - create empty placeholder state
		h.predicate_defaults_remember_runtimeCreate();
		h.thing_remember_runtimeCreateUnique(
			this.idBase,
			'empty',
			'Click here to browse a folder',
			'blue',
			T_Thing.root
		);
		return true;
	}

	// Called from UI button - HAS user gesture
	async selectFolder(): Promise<boolean> {
		if (!DB_Filesystem.isSupported()) {
			console.warn('File System Access API not supported');
			return false;
		}
		
		try {
			this.rootHandle = await window.showDirectoryPicker({ mode: 'read' });
			await files.save_directoryHandle(this.rootHandle);
			h.forget_all();
			h.rootAncestry = null as any;
			h.root = null as any;
			(h as any).thing_dict_byAncestryHID = {};  // clear cached thing lookups
			const success = await this.scanFromRoot();
			if (success) {
				await h.wrapUp_data_forUX();
				core.w_hierarchy.set(h);
				g.grand_build();
			}
			return success;
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				console.log('User cancelled folder selection');
			} else {
				console.error('Error selecting folder:', error);
			}
			return false;
		}
	}
	
	private async scanFromRoot(): Promise<boolean> {
		if (!this.rootHandle) return false;
		
		// Clear previous entries
		this.file_information.clear();
		
		// Create predicates
		h.predicate_defaults_remember_runtimeCreate();
		
		// Create root thing for the selected folder
		const rootId = this.generateId(this.rootHandle.name, '');
		h.thing_remember_runtimeCreateUnique(
			this.idBase,
			rootId,
			this.rootHandle.name,
			'limegreen',
			T_Thing.root
		);
		
		this.file_information.set(rootId, {
			id: rootId,
			name: this.rootHandle.name,
			path: '',
			isDirectory: true,
			handle: this.rootHandle,
			parentId: null
		});
		
		// Recursively scan the folder
		await this.scanDirectory(this.rootHandle, rootId, '');
		
		return true;
	}
	
	private async scanDirectory(
		dirHandle: File_System_Directory_Handle,
		parentId: string,
		parentPath: string,
		depth: number = 0
	): Promise<void> {
		if (depth >= 5) return;
		
		let order = 0;
		
		for await (const handle of dirHandle.values()) {
			const path = parentPath ? `${parentPath}/${handle.name}` : handle.name;
			const id = this.generateId(handle.name, path);
			const isDirectory = handle.kind === 'directory';
			
			// Store entry for later access
			this.file_information.set(id, {
				id,
				name: handle.name,
				path,
				isDirectory,
				handle,
				parentId
			});
			
			// Determine color based on type
			const color = isDirectory ? 'steelblue' : this.colorForFile(handle.name);
			const t_thing = isDirectory ? T_Thing.folder : T_Thing.generic;
			
			// Create thing
			h.thing_remember_runtimeCreateUnique(
				this.idBase,
				id,
				handle.name,
				color,
				t_thing
			);
			
			// Create relationship to parent
			const relationshipId = `c_${parentId}_${id}`;
			h.relationship_remember_runtimeCreateUnique(
				this.idBase,
				relationshipId,
				T_Predicate.contains,
				parentId,
				id,
				[order, 0]
			);
			
			// Add link trait only for previewable files
			if (!isDirectory && this.isPreviewable(handle.name)) {
				const traitId = `link_${id}`;
				h.trait_remember_runtimeCreateUnique(
					this.idBase,
					traitId,
					id,
					T_Trait.link,
					path
				);
			}
			
			order++;
			
			// Recurse into directories
			if (isDirectory) {
				await this.scanDirectory(
					handle as File_System_Directory_Handle,
					id,
					path,
					depth + 1
				);
			}
		}
	}
	
	private generateId(name: string, path: string): string {
		// Create a stable ID from the path
		const combined = path || name;
		return combined.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
	}
	
	private colorForFile(filename: string): string {
		const ext = filename.split('.').pop()?.toLowerCase() || '';
		
		// Color by file type
		const colorMap: Record<string, string> = {
			// Documents
			'pdf': '#e74c3c',
			'doc': '#2980b9', 'docx': '#2980b9',
			'txt': '#7f8c8d', 'md': '#7f8c8d',
			// Spreadsheets
			'xls': '#27ae60', 'xlsx': '#27ae60', 'csv': '#27ae60',
			// Images
			'jpg': '#9b59b6', 'jpeg': '#9b59b6', 'png': '#9b59b6', 
			'gif': '#9b59b6', 'svg': '#9b59b6', 'webp': '#9b59b6',
			// Code
			'js': '#f1c40f', 'ts': '#3498db', 'svelte': '#ff3e00',
			'html': '#e67e22', 'css': '#1abc9c', 'json': '#95a5a6',
			// Media
			'mp3': '#e91e63', 'mp4': '#e91e63', 'wav': '#e91e63',
			'mov': '#e91e63', 'avi': '#e91e63',
		};
		
		return colorMap[ext] || 'grey';
	}
	
	// Check if file extension supports preview
	isPreviewable(filename: string): boolean {
		return files.preview_type_forFilename(filename) !== null;
	}
	
	// Get file handle for preview/download
	get_file_handle(thingId: string): File_System_Handle | null {
		return this.file_information.get(thingId)?.handle || null;
	}
	
	// Get file entry info
	get_file_information(thingId: string): File_Entry | null {
		return this.file_information.get(thingId) || null;
	}
	
	// Read file contents (for preview)
	async readFileAsText(thingId: string): Promise<string | null> {
		const entry = this.file_information.get(thingId);
		if (!entry || entry.isDirectory) return null;
		
		try {
			const fileHandle = entry.handle as File_System_File_Handle;
			const file = await fileHandle.getFile();
			return await file.text();
		} catch (error) {
			console.error('Error reading file:', error);
			return null;
		}
	}
	
	// Read file as data URL (for images/media preview)
	async readFileAsDataURL(thingId: string): Promise<string | null> {
		const entry = this.file_information.get(thingId);
		if (!entry || entry.isDirectory) return null;
		
		try {
			const fileHandle = entry.handle as File_System_File_Handle;
			const file = await fileHandle.getFile();
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = reject;
				reader.readAsDataURL(file);
			});
		} catch (error) {
			console.error('Error reading file:', error);
			return null;
		}
	}
	
	// Download file
	async downloadFile(thingId: string): Promise<void> {
		const entry = this.file_information.get(thingId);
		if (!entry || entry.isDirectory) return;
		
		try {
			const fileHandle = entry.handle as File_System_File_Handle;
			const file = await fileHandle.getFile();
			
			// Create download link
			const url = URL.createObjectURL(file);
			const a = document.createElement('a');
			a.href = url;
			a.download = entry.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading file:', error);
		}
	}
	
	// Copy path to clipboard
	async copyPath(thingId: string): Promise<boolean> {
		const entry = this.file_information.get(thingId);
		if (!entry) return false;
		
		try {
			await navigator.clipboard.writeText(entry.path);
			return true;
		} catch (error) {
			console.error('Error copying path:', error);
			return false;
		}
	}
}
