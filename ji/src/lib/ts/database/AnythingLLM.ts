import { preferences, T_Preference } from '../managers/Preferences';
import { Exchange } from '../types/DB_Records';
import { debug } from '../common/Debug';

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
	const pointer = preferences.read<string>(T_Preference.llmPointer)?.trim();
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

function config(): Config | null {
	const base      = discovered_base || (preferences.read<string>(T_Preference.llmUrl)?.replace(/\/+$/, '') || 'http://localhost:3001');
	const key       = preferences.read<string>(T_Preference.llmKey) ?? '';   // never hardcode a real key — it would ship in a build
	const workspace = preferences.read<string>(T_Preference.llmWorkspace) ?? 'intersection';
	if (!base || !key || !workspace) { return null; }
	return { base, key, workspace };
}

// A small map from a ji document id to the document location AnythingLLM assigned it,
// so a later remove knows what to take out. Kept in local preferences.
function doc_map(): Record<string, string> {
	return preferences.read<Record<string, string>>(T_Preference.llmDocMap) ?? {};
}
function set_doc_map(map: Record<string, string>): void {
	preferences.write(T_Preference.llmDocMap, map);
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
	const response = await fetch(`${cfg.base}/api/v1${path}`, {
		method,
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
		body: body == null ? undefined : JSON.stringify(body),
	});
	if (!response.ok) { throw new Error(`${method} ${path} -> ${response.status} ${response.statusText}`); }
	return response.status === 204 ? null : response.json();
}

// Upload a real file (multipart), so it shows in AnythingLLM's own document picker.
// No Content-Type header — the browser sets the multipart boundary itself.
async function upload_file(cfg: Config, path: string, form: FormData): Promise<any> {
	const response = await fetch(`${cfg.base}/api/v1${path}`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${cfg.key}` },
		body: form,
	});
	if (!response.ok) { throw new Error(`POST ${path} -> ${response.status} ${response.statusText}`); }
	return response.json();
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

};
