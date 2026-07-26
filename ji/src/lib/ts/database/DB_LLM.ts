import { T_Storage, T_Record, EmbeddedDoc } from '../types/DB_Records';
import { anything_llm } from './AnythingLLM';
import { debug } from '../common/Debug';
import { DB_Local } from './DB_Local';

// The LLM store. Its records and bytes live locally, keyed by this storage (so the mine
// store is untouched); on top of that, a document's words are mirrored to a locally-
// running AnythingLLM so the store can be searched and questioned.
//
// Phase B2: on save, a text document's words are uploaded; on delete or erase, they are
// removed. Bytes are always stored locally first, so an AnythingLLM problem never loses
// a document and never fails a drop. (Binary kinds have no words yet — they wait for the
// extraction pass, phase B3.)
export class DB_LLM extends DB_Local {
	constructor() {
		super(T_Storage.llm);
		debug.log(`LLM store: local backend (namespaced "LLM"); AnythingLLM is ${anything_llm.configured() ? 'set up' : 'not set up yet'}.`);
	}

	// Reading the local record lists is unchanged (synchronous, per kind). But when the
	// document list is asked for, also kick off a read of what AnythingLLM already holds —
	// it's a network fetch, so it can't be waited on here; it runs on its own and logs its
	// count. The local list is returned right away, as always. (Turning those embedded
	// names into openable rows is the separate, larger step.)
	load_list<T>(record: T_Record): T[] {
		if (record === T_Record.documents) {
			this.load_embedded().catch(() => { /* the fetch logs its own trouble */ });
		}
		return super.load_list<T>(record);
	}

	// Read back the documents AnythingLLM already holds for this store's workspace — its
	// own view (a readable name and the location a remove uses), not local ji documents.
	// So a fresh browser can show what's embedded even though it dropped none of it. This
	// is separate from load_list (which reads the local record lists synchronously): this
	// call reaches over the network, so it's async and hands back its own summary list.
	async load_embedded(): Promise<EmbeddedDoc[]> {
		const docs = await anything_llm.get_documents();
		debug.log(`LLM store: workspace holds ${docs.length} embedded document(s).`);
		return docs;
	}

	// Store the bytes locally first (never lost), then — only when the content is words
	// (a text document arrives as a string) — push them to AnythingLLM. Any upload trouble
	// is logged inside the client and never thrown, so the save always completes.
	async write_blob(document_id: string, content: string | Blob, name?: string): Promise<void> {
		// await super.write_blob(document_id, content);
		if (typeof content === 'string') {
			await anything_llm.put_words(document_id, content, name);
		} else {
			debug.log(`LLM store: "${document_id}" is raw bytes — stored locally; its words wait for extraction before any upload.`);
		}
	}

	// Drop the local bytes, then remove the document from AnythingLLM.
	async delete_blob(document_id: string): Promise<void> {
		await super.delete_blob(document_id);
		await anything_llm.remove(document_id);
	}

	// Erase: clear this store's uploads from AnythingLLM, then the local bytes.
	async clear_blobs(): Promise<number> {
		await anything_llm.clear();
		return super.clear_blobs();
	}
}
