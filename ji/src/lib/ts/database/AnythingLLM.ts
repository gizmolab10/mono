import { preferences, T_Preference } from '../managers/Preferences';
import { Exchange, EmbeddedDoc } from '../types/DB_Records';
import { debug } from '../common/Debug';
import { writable, get } from 'svelte/store';

// True while AnythingLLM answers, false the moment a call can't reach it (the address is
// dead, e.g. while the tunnel is being restarted). Set here, in the one place every call
// goes through: reaching the server (any status) means reachable; a network failure (the
// fetch itself throwing) means not. Views read it to show a "reconnecting" note.
export const w_llm_reachable = writable<boolean>(true);

// The transport to a locally-running AnythingLLM. The connection — base URL, API key,
// workspace — lives in local preferences only, never in a build. When it isn't set,
// every call is a safe no-op that returns false, so the LLM store still works locally.
//
// NOTE: the REST shapes below match AnythingLLM's developer API as understood at build
// time. If your instance differs, this one file is the only place to adjust them.

type Config = { base: string; key: string; workspace: string };

// When the proxy is reached through a free tunnel, its address changes on each restart,
// so ji doesn't store the address itself — it stores a fixed "pointer" link (a gist)
// that always holds the current address. On the first call, ji reads that pointer once
// and remembers the address it found; every call after uses it. If there's no pointer,
// or reading it fails, ji falls back to the stored URL (or localhost).
let discovered_base: string | null = null;   // the address read from the pointer
let discovered_for:  string | null = null;   // which pointer link it was read from

async function ensure_base(): Promise<void> {
	const pointer = preferences.read<string>(T_Preference.ai_pointer)?.trim();
	if (!pointer) { discovered_base = null; discovered_for = null; return; }
	if (discovered_base && discovered_for === pointer) { return; }   // already read this pointer
	try {
		// A cache-buster, because the pointer host serves the link through a short cache.
		const url = `${pointer}${pointer.includes('?') ? '&' : '?'}t=${Date.now()}`;
		const response = await fetch(url, { cache: 'no-store' });
		if (!response.ok) { throw new Error(`${response.status} ${response.statusText}`); }
		const found = (await response.text()).trim().replace(/\/+$/, '');
		if (!/^https?:\/\//.test(found)) { throw new Error('the pointer did not hold a web address'); }
		discovered_base = found; discovered_for = pointer;
		debug.log(`AnythingLLM: read the current address "${found}" from the pointer.`);
	} catch (e) {
		discovered_base = null; discovered_for = null;
		debug.log(`AnythingLLM: could not read the address pointer — ${(e as Error).message}; using the stored URL instead.`);
	}
}

// A call couldn't reach the server at all — the address is dead (the tunnel churned). Mark
// the connection lost AND forget the cached address, so the next call re-reads the pointer
// for a fresh one; without this ji would stay stuck on the dead address until a reload. The
// log is only written on the drop, not on every retry while it's down.
function on_unreachable(): void {
	discovered_base = null; discovered_for = null;
	if (get(w_llm_reachable)) { debug.log('AnythingLLM: connection lost — forgetting the address, will re-read the pointer for a fresh one.'); }
	w_llm_reachable.set(false);
}

function config(): Config | null {
	const base      = discovered_base || (preferences.read<string>(T_Preference.ai_url)?.replace(/\/+$/, '') || 'http://localhost:3001');
	const key       = preferences.read<string>(T_Preference.ai_key) ?? '';   // never hardcode a real key — it would ship in a build
	const workspace = preferences.read<string>(T_Preference.ai_workspace) ?? 'intersection';
	if (!base || !key || !workspace) { return null; }
	return { base, key, workspace };
}

// A small map from a ji document id to the document location AnythingLLM assigned it,
// so a later remove knows what to take out. Kept in local preferences.
function doc_map(): Record<string, string> {
	return preferences.read<Record<string, string>>(T_Preference.ai_docs_map) ?? {};
}
function set_doc_map(map: Record<string, string>): void {
	preferences.write(T_Preference.ai_docs_map, map);
}

// The workspace slug that the configured workspace *name* resolves to, cached so we
// don't look it up on every call. Cleared implicitly when the name changes.
let workspace_slug: string | null = null;
let resolved_for:   string | null = null;

// Find the workspace by the name in the settings, creating it if it isn't there, and
// cache the slug it resolves to. Returns the slug, or null on failure (logged). So the
// settings "workspace" is a plain name you type — ji makes or finds it.
async function resolve_workspace(cfg: Config): Promise<string | null> {
	if (workspace_slug && resolved_for === cfg.workspace) { return workspace_slug; }
	try {
		const listed = await call(cfg, '/workspaces', null, 'GET');
		const found  = (listed?.workspaces ?? []).find((w: any) => w.name === cfg.workspace || w.slug === cfg.workspace);
		if (found?.slug) {
			workspace_slug = found.slug; resolved_for = cfg.workspace;
			debug.log(`AnythingLLM: using existing workspace "${cfg.workspace}" (slug "${found.slug}").`);
			return found.slug;
		}
		const made = await call(cfg, '/workspace/new', { name: cfg.workspace });
		const slug = made?.workspace?.slug;
		if (!slug) { throw new Error('create returned no workspace slug'); }
		workspace_slug = slug; resolved_for = cfg.workspace;
		debug.log(`AnythingLLM: created workspace "${cfg.workspace}" (slug "${slug}").`);
		return slug;
	} catch (e) {
		debug.log(`AnythingLLM: could not find or create workspace "${cfg.workspace}" — ${(e as Error).message}.`);
		return null;
	}
}

// One REST call to AnythingLLM, with the key attached. Throws on a non-ok status so the
// callers below can log and return false without ever throwing themselves.
async function call(cfg: Config, path: string, body: unknown, method = 'POST'): Promise<any> {
	let response: Response;
	try {
		response = await fetch(`${cfg.base}/api/v1${path}`, {
			method,
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
			body: body == null ? undefined : JSON.stringify(body),
		});
	} catch (e) {
		on_unreachable();   // couldn't reach the server — mark lost and forget the dead address
		throw e;
	}
	w_llm_reachable.set(true);        // the server answered (whatever the status)
	if (!response.ok) { throw new Error(`${method} ${path} -> ${response.status} ${response.statusText}`); }
	return response.status === 204 ? null : response.json();
}

// Upload a real file (multipart), so it shows in AnythingLLM's own document picker.
// No Content-Type header — the browser sets the multipart boundary itself.
async function upload_file(cfg: Config, path: string, form: FormData): Promise<any> {
	let response: Response;
	try {
		response = await fetch(`${cfg.base}/api/v1${path}`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${cfg.key}` },
			body: form,
		});
	} catch (e) {
		on_unreachable();
		throw e;
	}
	w_llm_reachable.set(true);
	if (!response.ok) { throw new Error(`POST ${path} -> ${response.status} ${response.statusText}`); }
	return response.json();
}

// --- content side-store -----------------------------------------------------------------
//
// AnythingLLM's API never hands a document's body back (only its details and, through search,
// a few chunks). So the AI store keeps no local bytes and instead stashes each document's real
// content in AnythingLLM itself — as a small *un-embedded* side document (so it never enters
// search or answers), named by the ji id, with the content living in the side document's
// `description` (the one detail field that reads back byte-for-byte). A fresh browser then opens
// the document by fetching that content back. Bound by the details field's size (a few MB).

const blob_title = (id: string) => `ji-blob-${id}`;   // one document's content side document
const INDEX_TITLE = 'ji-index';                       // the whole record index side document

// A Blob's bytes as base64 (chunked, so a big file doesn't overflow the argument list).
async function blob_to_base64(blob: Blob): Promise<string> {
	const bytes = new Uint8Array(await blob.arrayBuffer());
	let binary = '';
	for (let i = 0; i < bytes.length; i += 0x8000) { binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); }
	return btoa(binary);
}
function base64_to_blob(base64: string, type: string): Blob {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) { bytes[i] = binary.charCodeAt(i); }
	return new Blob([bytes], { type });
}

// Find a side document by its marker title: list every stored document and match. Returns the
// file name (to read it) and its location (to remove it), or null. AnythingLLM lower-cases a
// title, so match without regard to case.
async function find_side_doc(cfg: Config, title: string): Promise<{ name: string; location: string } | null> {
	const listed = await call(cfg, '/documents', null, 'GET');
	const want = title.toLowerCase();
	const files: any[] = [];
	const walk = (node: any) => { if (!node) { return; } if (node.type === 'file') { files.push(node); } (node.items ?? []).forEach(walk); };
	walk(listed?.localFiles);
	const hit = files.find((f) => { const t = String(f.title ?? '').toLowerCase(); return t === want || t === `${want}.txt`; });
	if (!hit) { return null; }
	const name = String(hit.name);
	return { name, location: `custom-documents/${name}` };   // raw-text side docs always live here
}

// Store a JSON blob in a side document's details, replacing any earlier one under this title. Not
// embedded, so it never enters search. Used for the content side docs and the record index.
async function write_side_doc(cfg: Config, title: string, description: string, textContent: string): Promise<void> {
	const existing = await find_side_doc(cfg, title);
	if (existing) { await call(cfg, '/system/remove-documents', { names: [existing.location] }, 'DELETE'); }
	await call(cfg, '/document/raw-text', { textContent, metadata: { title, description } });
}

// Read a side document's details string by title, or null.
async function read_side_doc(cfg: Config, title: string): Promise<string | null> {
	const found = await find_side_doc(cfg, title);
	if (!found) { return null; }
	const doc = await call(cfg, `/document/${found.name}`, null, 'GET');
	const detail = doc?.document ?? doc;
	return detail?.description ?? null;
}

export const anything_llm = {
	// Is the connection set up? Used by the store to decide whether to even try.
	configured(): boolean { return config() != null; },

	// Upload one document's words as a file (so it shows in AnythingLLM's own document
	// picker) and embed it into the workspace, named by the ji id so a citation maps back.
	// Remembers the location it was given, for a later remove. Returns true on success; on
	// any failure it logs and returns false — never throws, so a save is never lost.
	async put_words(id: string, words: string, name?: string): Promise<boolean> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { debug.log(`AnythingLLM not set up — "${id}" stored locally only, not uploaded.`); return false; }
		const slug = await resolve_workspace(cfg);
		if (!slug) { return false; }
		// Replace, don't pile up: if this document already has an upload, take the old one
		// out first so a re-drop of the same document leaves exactly one copy.
		if (doc_map()[id]) { debug.log(`AnythingLLM: "${id}" already uploaded — removing the old copy before re-uploading.`); await this.remove(id); }
		try {
			// Name the uploaded file by the document's own name so AnythingLLM shows something
			// readable; fall back to the id when there is no name.
			const filename = (name?.trim() || `${id}.txt`);
			const form = new FormData();
			form.append('file', new File([words], filename, { type: 'text/plain' }));
			const uploaded = await upload_file(cfg, '/document/upload', form);
			const location: string | undefined = uploaded?.documents?.[0]?.location;
			if (!location) { throw new Error('upload returned no document location'); }
			await call(cfg, `/workspace/${slug}/update-embeddings`, { adds: [location] });
			const map = doc_map(); map[id] = location; set_doc_map(map);
			debug.log(`AnythingLLM: uploaded and embedded "${id}" (${words.length} char(s)) as "${location}".`);
			return true;
		} catch (e) {
			debug.log(`AnythingLLM: upload of "${id}" failed — ${(e as Error).message}. Stored locally; still owes an upload.`);
			return false;
		}
	},

	// Ask the workspace a question and get the answer plus the names of the documents it
	// drew from. "query" mode keeps the answer grounded in the embedded documents. Each
	// source is the uploaded file's name (the ji document name). Returns null on any failure.
	async ask(question: string): Promise<{ answer: string; sources: string[] } | null> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { debug.log('AnythingLLM not set up — cannot ask.'); return null; }
		const slug = await resolve_workspace(cfg);
		if (!slug) { return null; }
		try {
			const result = await call(cfg, `/workspace/${slug}/chat`, { message: question, mode: 'query' });
			const answer: string = result?.textResponse ?? '';
			const seen = new Set<string>();
			const sources = (result?.sources ?? [])
				.map((s: any) => String(s.title ?? s.name ?? '').trim())
				.filter((title: string) => title && !seen.has(title) && seen.add(title));
			debug.log(`AnythingLLM: asked "${question.slice(0, 60)}" — ${answer.length} char(s) of answer, ${sources.length} source(s).`);
			return { answer, sources };
		} catch (e) {
			debug.log(`AnythingLLM: ask failed — ${(e as Error).message}.`);
			return null;
		}
	},

	// Ask the workspace a question and receive the answer live — each piece is handed to
	// `on_word` the instant it arrives (the server pushes; ji never polls), and the finished
	// answer plus the documents it drew from come back when the stream closes. Returns null
	// on any failure (logged), so the caller can fall back to the all-at-once ask. "query"
	// mode keeps the answer grounded in the embedded documents.
	async ask_stream(question: string, on_word: (word: string) => void): Promise<{ answer: string; sources: string[] } | null> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { debug.log('AnythingLLM not set up — cannot ask.'); return null; }
		const slug = await resolve_workspace(cfg);
		if (!slug) { return null; }
		let response: Response;
		try {
			response = await fetch(`${cfg.base}/api/v1/workspace/${slug}/stream-chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
				body: JSON.stringify({ message: question, mode: 'query' }),
			});
		} catch (e) {
			on_unreachable();   // couldn't reach the server — mark lost and forget the dead address
			debug.log(`AnythingLLM: streaming ask couldn't reach the server — ${(e as Error).message}.`);
			return null;
		}
		w_llm_reachable.set(true);
		if (!response.ok || !response.body) {
			debug.log(`AnythingLLM: streaming ask -> ${response.status} ${response.statusText} (no live body).`);
			return null;
		}
		// Read the stream piece by piece. Each "data:" line is one JSON packet carrying a bit
		// of the answer (or the closing packet with the sources). A packet can split across
		// reads, so hold the leftover text and only act on whole lines.
		const reader  = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let answer = '';
		let pieces = 0;
		const seen = new Set<string>();
		const sources: string[] = [];
		try {
			for (;;) {
				const { value, done } = await reader.read();
				if (done) { break; }
				buffer += decoder.decode(value, { stream: true });
				let nl: number;
				while ((nl = buffer.indexOf('\n')) >= 0) {
					const line = buffer.slice(0, nl).trim();
					buffer = buffer.slice(nl + 1);
					if (!line.startsWith('data:')) { continue; }
					const payload = line.slice(5).trim();
					if (!payload || payload === '[DONE]') { continue; }
					let packet: any;
					try { packet = JSON.parse(payload); } catch { continue; }
					const piece = String(packet.textResponse ?? '');
					if (piece) { answer += piece; pieces += 1; on_word(piece); }
					for (const s of packet.sources ?? []) {
						const title = String(s.title ?? s.name ?? '').trim();
						if (title && !seen.has(title)) { seen.add(title); sources.push(title); }
					}
				}
			}
		} catch (e) {
			debug.log(`AnythingLLM: streaming ask broke mid-answer after ${pieces} piece(s) — ${(e as Error).message}. Keeping what arrived.`);
		}
		debug.log(`AnythingLLM: streamed answer to "${question.slice(0, 60)}" — ${pieces} piece(s), ${answer.length} char(s), ${sources.length} source(s).`);
		return { answer, sources };
	},

	// Remove one document from the workspace and delete it, by its remembered location.
	// A document that was never uploaded is a quiet success (nothing to remove).
	async remove(id: string): Promise<boolean> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { return false; }
		const map = doc_map();
		const location = map[id];
		if (!location) { return true; }
		const slug = await resolve_workspace(cfg);
		if (!slug) { return false; }
		try {
			await call(cfg, `/workspace/${slug}/update-embeddings`, { deletes: [location] });
			await call(cfg, '/system/remove-documents', { names: [location] }, 'DELETE');
			delete map[id]; set_doc_map(map);
			debug.log(`AnythingLLM: removed "${id}" ("${location}") from the workspace.`);
			return true;
		} catch (e) {
			debug.log(`AnythingLLM: removing "${id}" failed — ${(e as Error).message}.`);
			return false;
		}
	},

	// Remove every document this store uploaded — used by erase.
	async clear(): Promise<void> {
		await ensure_base();
		const ids = Object.keys(doc_map());
		if (config() == null || ids.length === 0) { set_doc_map({}); return; }
		for (const id of ids) { await this.remove(id); }
		set_doc_map({});
		debug.log(`AnythingLLM: cleared ${ids.length} uploaded document(s) from the workspace.`);
	},

	// Fetch the workspace's saved exchanges, newest first. AnythingLLM keeps the chat
	// history itself, so this pairs each stored question with the reply that follows it
	// and the documents that reply drew from. "limit" is a count of exchanges (each is
	// two stored messages). Cannot fetch in pages, does not support 'offset'. 
	// Returns [] on any failure (logged).
	async get_exchanges(limit = 20): Promise<Exchange[]> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { debug.log('AnythingLLM not set up — no exchanges to read.'); return []; }
		const slug = await resolve_workspace(cfg);
		if (!slug) { return []; }
		try {
			const result = await call(cfg, `/workspace/${slug}/chats?orderBy=desc&limit=${limit}`, null, 'GET');
			const history: any[] = result?.history ?? [];
			// Walk the flat message list: a "user" line opens an exchange, the "assistant"
			// line that follows fills its reply, sources, and time.
			const exchanges: Exchange[] = [];
			let current: Exchange | null = null;
			for (const message of history) {
				if (message.role === 'user') {
					current = { question: String(message.content ?? ''), reply: '', sources: [], time: Number(message.sentAt ?? 0) };
					exchanges.push(current);
				} else if (message.role === 'assistant' && current) {
					current.reply = String(message.content ?? '');
					current.time  = Number(message.sentAt ?? current.time);
					const seen = new Set<string>();
					current.sources = (message.sources ?? [])
						.map((s: any) => String(s.title ?? s.name ?? '').trim())
						.filter((title: string) => title && !seen.has(title) && seen.add(title));
					current = null;
				}
			}
			debug.log(`AnythingLLM: read ${exchanges.length} exchange(s) from ${history.length} stored message(s) (newest first, limit ${limit}).`);
			return exchanges;
		} catch (e) {
			debug.log(`AnythingLLM: reading exchanges failed — ${(e as Error).message}.`);
			return [];
		}
	},

	// Read back the documents the workspace already holds — AnythingLLM's own view, not
	// ji's local list — so a fresh browser can show what's embedded. Each document's
	// readable name comes from its stored details (its title), falling back to the raw
	// filename; its location is the same string a remove uses. Returns [] on any failure
	// (logged). NOTE: read-only — these are not openable ji documents (their bytes live in
	// whatever browser first dropped them).
	// `quiet` (used by the every-few-seconds heartbeat) skips the logging, so the log isn't
	// flooded with an identical line on every idle tick.
	async get_documents(quiet = false): Promise<EmbeddedDoc[]> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { debug.log('AnythingLLM not set up — no documents to read.'); return []; }
		const slug = await resolve_workspace(cfg);
		if (!slug) { return []; }
		try {
			const result = await call(cfg, `/workspace/${slug}`, null, 'GET');
			// The detail read answers with the workspace wrapped in a one-item list.
			const workspace = Array.isArray(result?.workspace) ? result.workspace[0] : result?.workspace;
			const held: any[] = workspace?.documents ?? [];
			const docs: EmbeddedDoc[] = held.map((d: any) => {
				let name = String(d.filename ?? '');
				try {
					// The readable title lives inside a details string on each document.
					const meta = JSON.parse(d.metadata ?? '{}');
					if (meta?.title) { name = String(meta.title); }
				} catch { /* keep the raw filename when the details won't parse */ }
				return { name, location: String(d.docpath ?? '') };
			});
			if (!quiet) { debug.log(`AnythingLLM: read ${docs.length} embedded document(s) from the workspace.`); }
			return docs;
		} catch (e) {
			if (!quiet) { debug.log(`AnythingLLM: reading documents failed — ${(e as Error).message}.`); }
			return [];
		}
	},

	// Stash a document's real content in AnythingLLM (un-embedded), so any browser can open it
	// later. Text goes in as-is; raw bytes go in as base64 with their type. Replaces any earlier
	// copy for this id. Never throws — a failure just means the content can't be opened elsewhere.
	async put_blob(id: string, content: string | Blob): Promise<boolean> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { return false; }
		try {
			const payload = (typeof content === 'string')
				? { id, kind: 't', data: content }
				: { id, kind: 'b', type: content.type, data: await blob_to_base64(content) };
			await write_side_doc(cfg, blob_title(id), JSON.stringify(payload), `ji content store for ${id}`);
			debug.log(`AnythingLLM: stored the content for "${id}" (${payload.kind === 't' ? `${payload.data.length} char(s) of text` : `${payload.data.length} base64 char(s)`}) in a side document — not embedded.`);
			return true;
		} catch (e) {
			debug.log(`AnythingLLM: storing the content for "${id}" failed — ${(e as Error).message}.`);
			return false;
		}
	},

	// Fetch a document's content back from its side document. Text comes back as a string, raw
	// bytes as a Blob (with their type). Null if there's no stored content or the read fails.
	async get_blob(id: string): Promise<string | Blob | null> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { return null; }
		try {
			const raw = await read_side_doc(cfg, blob_title(id));
			if (!raw) { debug.log(`AnythingLLM: no stored content found for "${id}".`); return null; }
			const payload = JSON.parse(raw);
			if (payload.kind === 'b') {
				debug.log(`AnythingLLM: fetched ${String(payload.data).length} base64 char(s) of content for "${id}".`);
				return base64_to_blob(String(payload.data), String(payload.type ?? ''));
			}
			debug.log(`AnythingLLM: fetched ${String(payload.data).length} char(s) of text for "${id}".`);
			return String(payload.data);
		} catch (e) {
			debug.log(`AnythingLLM: fetching the content for "${id}" failed — ${(e as Error).message}.`);
			return null;
		}
	},

	// Remove a document's stored content (its side document). A missing one is a quiet success.
	async remove_blob(id: string): Promise<void> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { return; }
		try {
			const found = await find_side_doc(cfg, blob_title(id));
			if (!found) { return; }
			await call(cfg, '/system/remove-documents', { names: [found.location] }, 'DELETE');
			debug.log(`AnythingLLM: removed the stored content for "${id}".`);
		} catch (e) {
			debug.log(`AnythingLLM: removing the stored content for "${id}" failed — ${(e as Error).message}.`);
		}
	},

	// The record index — the AI store's whole record list (documents, folders, tags, links) as
	// one JSON blob in a side document, so every browser reads the same records. Read on launch.
	async get_index(): Promise<Record<string, unknown[]> | null> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { return null; }
		try {
			const raw = await read_side_doc(cfg, INDEX_TITLE);
			if (!raw) { debug.log('AnythingLLM: no record index yet.'); return null; }
			const data = JSON.parse(raw);
			debug.log(`AnythingLLM: read the record index (${Object.keys(data).map((k) => `${k} ${(data[k]?.length ?? 0)}`).join(', ')}).`);
			return data;
		} catch (e) {
			debug.log(`AnythingLLM: reading the record index failed — ${(e as Error).message}.`);
			return null;
		}
	},

	// Replace the record index with a fresh one.
	async put_index(data: Record<string, unknown[]>): Promise<boolean> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { return false; }
		try {
			const body = JSON.stringify(data);
			await write_side_doc(cfg, INDEX_TITLE, body, 'ji record index');
			debug.log(`AnythingLLM: wrote the record index (${body.length} char(s); ${Object.keys(data).map((k) => `${k} ${(data[k]?.length ?? 0)}`).join(', ')}).`);
			return true;
		} catch (e) {
			debug.log(`AnythingLLM: writing the record index failed — ${(e as Error).message}.`);
			return false;
		}
	},

	// Remove the record index (used by erase).
	async remove_index(): Promise<void> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { return; }
		try {
			const found = await find_side_doc(cfg, INDEX_TITLE);
			if (!found) { return; }
			await call(cfg, '/system/remove-documents', { names: [found.location] }, 'DELETE');
			debug.log('AnythingLLM: removed the record index.');
		} catch (e) {
			debug.log(`AnythingLLM: removing the record index failed — ${(e as Error).message}.`);
		}
	},

	// Remove every stored-content side document (used by erase). Returns how many were cleared.
	async clear_blobs(): Promise<number> {
		await ensure_base();
		const cfg = config();
		if (!cfg) { return 0; }
		try {
			const listed = await call(cfg, '/documents', null, 'GET');
			const files: any[] = [];
			const walk = (node: any) => { if (!node) { return; } if (node.type === 'file') { files.push(node); } (node.items ?? []).forEach(walk); };
			walk(listed?.localFiles);
			const ours = files.filter((f) => String(f.title ?? '').startsWith('ji-blob-'));
			for (const f of ours) { await call(cfg, '/system/remove-documents', { names: [`custom-documents/${String(f.name)}`] }, 'DELETE'); }
			debug.log(`AnythingLLM: cleared ${ours.length} stored-content side document(s).`);
			return ours.length;
		} catch (e) {
			debug.log(`AnythingLLM: clearing stored content failed — ${(e as Error).message}.`);
			return 0;
		}
	},

};
