import { refresh_llm_docs } from './LLM_Docs';
import { anything_llm } from './AnythingLLM';
import { T_Storage, T_Record } from '../types/DB_Records';
import { debug } from '../common/Debug';
import { DB_Local } from './DB_Local';

// The AI store. Nothing of it lives on this browser: its records are one JSON index kept in
// AnythingLLM (a side document), and each document's content is another side document there;
// a text document's words are also embedded so the store can be searched and questioned. So the
// hierarchy is filled from AnythingLLM on launch and never cares where the records came from.
export class DB_LLM extends DB_Local {
	// The record lists, held in memory. Filled from the AnythingLLM index by `prime`, read by
	// `load_list`, and written straight back to the index by `save_list`.
	private records: Partial<Record<T_Record, unknown[]>> = {};
	private dirty   = false;
	private writing: Promise<void> | null = null;

	constructor() {
		super(T_Storage.llm);
		debug.log(`AI store: records and content live in AnythingLLM; ${anything_llm.configured() ? 'set up' : 'not set up yet'}.`);
	}

	// Fetch the whole record index from AnythingLLM into memory before the hierarchy loads it.
	async prime(): Promise<void> {
		const data = await anything_llm.get_index();
		this.records = {};
		for (const kind of Object.values(T_Record)) {
			const list = data?.[kind];
			this.records[kind] = Array.isArray(list) ? list : [];
		}
		debug.log(`AI store: primed the record index — ${Object.values(T_Record).map((k) => `${k} ${(this.records[k]?.length ?? 0)}`).join(', ')}.`);
	}

	// The hierarchy reads records from the primed memory copy — never from browser storage.
	load_list<T>(record: T_Record): T[] { return (this.records[record] as T[]) ?? []; }

	// A change to a record list updates the memory copy and writes the whole index back.
	save_list<T>(record: T_Record, list: T[]): void {
		this.records[record] = list as unknown[];
		this.schedule_write();
	}

	// Write the index back, one at a time: if a write is already running, note that another is
	// owed and start it when the current one finishes. So rapid edits collapse into few writes.
	private schedule_write(): void {
		this.dirty = true;
		if (this.writing) { return; }
		this.writing = this.write_index().finally(() => {
			this.writing = null;
			if (this.dirty) { this.schedule_write(); }
		});
	}
	private async write_index(): Promise<void> {
		this.dirty = false;
		const snapshot: Record<string, unknown[]> = {};
		for (const kind of Object.values(T_Record)) { snapshot[kind] = this.records[kind] ?? []; }
		await anything_llm.put_index(snapshot);
	}

	// Store a document's content in AnythingLLM (openable from any browser), and — for text — also
	// embed its words for search. The record itself reaches the index through the normal save path.
	async write_blob(document_id: string, content: string | Blob, name?: string): Promise<void> {
		await anything_llm.put_blob(document_id, content);
		if (typeof content === 'string') {
			await anything_llm.put_words(document_id, content, name);
		} else {
			debug.log(`AI store: "${document_id}" is raw bytes — content stored for opening; its words wait for extraction before any upload.`);
		}
		refresh_llm_docs();
	}

	// Read a document's content back from AnythingLLM — never from browser storage.
	async read_blob(document_id: string): Promise<string | Blob | null> {
		return anything_llm.get_blob(document_id);
	}

	// Remove the stored content and the embedded words; the record leaves the index through save.
	async delete_blob(document_id: string): Promise<void> {
		await anything_llm.remove_blob(document_id);
		await anything_llm.remove(document_id);
		refresh_llm_docs();
	}

	// Erase: clear the embedded uploads, every content side document, and the record index.
	async clear_blobs(): Promise<number> {
		await anything_llm.clear();
		const removed = await anything_llm.clear_blobs();
		await anything_llm.remove_index();
		this.records = {};
		refresh_llm_docs();
		return removed;
	}
}
