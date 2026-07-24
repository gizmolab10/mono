import { T_Storage } from '../types/DB_Records';
import { anything_llm } from './AnythingLLM';
import { DB_Local } from './DB_Local';
import { debug } from '../common/Debug';

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

	// Store the bytes locally first (never lost), then — only when the content is words
	// (a text document arrives as a string) — push them to AnythingLLM. Any upload trouble
	// is logged inside the client and never thrown, so the save always completes.
	async write_blob(document_id: string, content: string | Blob, name?: string): Promise<void> {
		await super.write_blob(document_id, content);
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
