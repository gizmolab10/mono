import { customizations } from '../common/Customizations';
import { T_Bundle } from '../types/File';
import { k } from '../common/Core';

// Writing a changed guide back to the file it came from.
//
// The app can only read files; writing needs the dispatcher already running on this
// machine — the one the diagnostic lines go to. It is handed the file's path in the repo,
// the whole new text, and the text as it was when the guide was opened. It re-reads the
// file itself and refuses to write if it no longer matches, so a file changed by anything
// else is never quietly overwritten.

export type Saved = { ok: boolean; why: string };

/**
 * The memory system, at the top of the repo. A file in it is the memory collection's, and its
 * path is the whole way there below memory.
 */
const MEMORY = 'memory/';

/**
 * A collection's own folder, counting from the top of the repo: the repo itself for mono, and
 * the project's folder for every other collection. Its CLAUDE file sits there. The notes layout,
 * a notes folder under memory for every collection, left here 14 September 2026: no file has sat
 * in one since the memory system took the guides in.
 */
function top_of(bundle: T_Bundle): string {
	return bundle === T_Bundle.mono ? '' : bundle;
}

// The endings a listed file may have: markdown, and svg since 18 September 2026, a drawing.
export const LISTED_ENDINGS = /\.(md|svg)$/i;

// Where a file sits, counting from the top of the repo: its path below its collection's own
// folder. The ending is added where the path has none, and kept as spelled where it has one, so
// CLAUDE.MD stays CLAUDE.MD and a drawing stays .svg.
export function file_path_of(bundle: T_Bundle, path: string): string {
	const ending = LISTED_ENDINGS.test(path) ? path : `${path}.md`;
	if (bundle === T_Bundle.memory) { return `${MEMORY}${ending}`; }
	const top = top_of(bundle);
	return top === '' ? ending : `${top}/${ending}`;
}

/**
 * The other way round: which collection a file belongs to, and where it sits inside that
 * collection, read off where it stands in the repo. Which files exist is the dispatcher's
 * plugin's rule since step 6 of the plan, so a path here is one the listing gave. Anything that
 * is neither markdown nor svg reads as nothing.
 */
export type File_Site = { bundle: T_Bundle; path: string; is_design: boolean };

export function site_of_file(where: string): File_Site | null {
	// A collection's CLAUDE file sits at its very top, spelled CLAUDE.MD or CLAUDE.md — so
	// this stands before the lowercase .md gate, which would turn the uppercase spelling away.
	const steps = where.split('/');
	if (steps[steps.length - 1].toLowerCase() === 'claude.md') {
		if (steps.length === 1) { return { bundle: T_Bundle.mono, path: steps[0], is_design: false }; }
		const owner = Object.values(T_Bundle).find((one) => one === steps[0]);
		if (steps.length === 2 && !!owner) { return { bundle: owner, path: steps[1], is_design: false }; }
		return null;
	}
	if (!LISTED_ENDINGS.test(where)) { return null; }
	if (where.startsWith(MEMORY)) { return { bundle: T_Bundle.memory, path: where.slice(MEMORY.length), is_design: false }; }
	// Below a project's own folder, the project's; at the top of the repo, mono's.
	const owner = steps.length > 1 ? Object.values(T_Bundle).find((one) => one === steps[0]) : undefined;
	if (owner) { return { bundle: owner, path: steps.slice(1).join('/'), is_design: false }; }
	return { bundle: T_Bundle.mono, path: where, is_design: false };
}

// The folder a file sits in, counting from the top of the repo: the collection's own folder,
// then the folder's path inside it. mono's own folder is the repo, which has no name here.
export function folder_path_of(bundle: T_Bundle, folder_path: string): string {
	const top = bundle === T_Bundle.memory ? 'memory' : top_of(bundle);
	return [top, folder_path].filter((part) => part !== '').join('/');
}

// Nothing restarts this app any more. Moving or renaming a guide used to, because the list of
// which files exist was settled when the app's code was prepared; now the app asks the disk,
// and a file that moved is read from where it now sits.

/**
 * Every guide and design on disk right now — the app's whole list of files, and the one place
 * it comes from. Each is named by its path counting from the top of the repo, and the repo's
 * own path on this machine comes with them, since the files are read by their full path.
 *
 * An empty answer means the dispatcher is not running, and the app has no guides to
 * show at all. It says so rather than showing nothing and leaving you to wonder.
 */
export type On_Disk = { root: string; paths: string[] };

/**
 * The address a file's own words are read from, built from where the file sits on this machine.
 *
 * A file name is free to hold a question mark, a hash or a percent sign, and every one of those
 * means something else in an address — a question mark starts the part after the name, so a file
 * called "worth it?.md" would be asked for as "worth it" and the server would hand back the app's
 * own page instead. Each is written as a stand-in code so it reads as part of the name. The
 * slashes between folders are left alone, since they are doing their own job.
 */
export function address_of_file(full_path: string): string {
	const safe = full_path.split('/').map((part) => encodeURIComponent(part)).join('/');
	return `/@fs${safe}`;
}

/** The full path on this machine, back from an address — the other way round. */
export function path_of_address(address: string): string {
	return decodeURIComponent(address.replace(/^\/@fs/, '').split('?')[0]);
}

// Where the dispatcher answers, and the host every ask names, so the dispatcher answers from that
// host's db: the configured host, or none, which is ov's db.
const DISPATCHER = 'http://localhost:5171';

function route(path: string, params: Record<string, string> = {}): string {
	const query = new URLSearchParams(params);
	if (customizations.host !== '') { query.set('host', customizations.host); }
	const asked = query.toString();
	return `${DISPATCHER}${path}${asked === '' ? '' : `?${asked}`}`;
}

export async function files_on_disk(): Promise<On_Disk> {
	try {
		const answer = await fetch(route('/list-files'));
		const said = await answer.json().catch(() => ({}));
		if (answer.ok && said.success && Array.isArray(said.paths) && typeof said.root === 'string') {
			return { root: said.root.endsWith('/') ? said.root : `${said.root}/`, paths: said.paths as string[] };
		}
		return { root: '', paths: [] };
	} catch {
		return { root: '', paths: [] };
	}
}

/**
 * One label the db holds on a file: a name, kind or tag, a value, and who made it — hand, rule or
 * ai. The db keeps them; the file's own block is on its way out.
 */
export type Label = { name: string; value: string; made_by: string };

/**
 * The four fields on a file's row in the db: the labels its block used to carry besides the
 * kind and the tags. use_when travels as a list, kept as one csv field there. With them,
 * whether the file is missing from the disk: its row is kept, labels and all, until it is
 * found again by its bytes at some other path. And, since step 6 of the plan, the file's
 * collection, its project, which the db answers and the page never sends.
 */
export type Fields = { collection?: string; title: string; description: string; use_when: string[]; date: string; missing?: boolean };

/**
 * Everything the db holds on every file, keyed by the file's path counting from the top of the
 * repo: its labels, and its four fields. A path among the fields is a file the db holds a row
 * for, labels or not. One ask at launch, in place of a label block read off every file. Empty
 * maps mean the dispatcher is not running.
 */
export type In_Db = { labels: Map<string, Label[]>; fields: Map<string, Fields>; sources: Map<string, Source[]> };

/**
 * One source of a file, a row in the db: an author, where the file came from — a url or a
 * person — and a date. A file has one row per author, each saying where it came from, or one
 * row with no author where only that is said. Markdown files carry neither, so both are typed
 * into the editor.
 */
export type Source = { author: string; came_from: string; date: string };

export async function labels_on_disk(): Promise<In_Db> {
	const nothing: In_Db = { labels: new Map(), fields: new Map(), sources: new Map() };
	try {
		const answer = await fetch(route('/all-labels'));
		const said = await answer.json().catch(() => ({}));
		const holds = (name: string) => said[name] && typeof said[name] === 'object';
		if (answer.ok && said.success && holds('labels') && holds('fields') && holds('sources')) {
			return {
				labels  : new Map(Object.entries(said.labels as Record<string, Label[]>)),
				fields  : new Map(Object.entries(said.fields as Record<string, Fields>)),
				sources : new Map(Object.entries(said.sources as Record<string, Source[]>)),
			};
		}
		return nothing;
	} catch {
		return nothing;
	}
}

/**
 * One rule the dispatcher runs on every file added or changed: what it reads — the file's name,
 * its location or its content — the regex it matches, and the label it gives, a kind or a tag.
 * A rule never changes or removes a label a person put on.
 */
export type Rule = { id: number; reads: 'name' | 'location' | 'content'; pattern: string; name: 'kind' | 'tag'; value: string };

/** Every rule in the db, oldest first. None when the dispatcher is not running. */
export async function rules_in_db(): Promise<Rule[]> {
	try {
		const answer = await fetch(route('/rules'));
		const said = await answer.json().catch(() => ({}));
		return answer.ok && said.success && Array.isArray(said.rules) ? said.rules as Rule[] : [];
	} catch {
		return [];
	}
}

/** One more rule. The dispatcher then runs every rule on every file. Says whether it was added, and if not, why. */
export async function add_rule(rule: Omit<Rule, 'id'>): Promise<Saved> {
	return tell(route('/add-rule'), rule);
}

/** One rule gone. The dispatcher then runs every rule left on every file. Says whether it went, and if not, why. */
export async function remove_rule(id: number): Promise<Saved> {
	return tell(route('/remove-rule'), { id });
}

/** Make a file's sources exactly these, in the db. Says whether they went, and if not, why. */
export async function set_sources(where: string, authors: string[], came_from: string, date: string): Promise<Saved> {
	return tell(route('/set-sources', { where }), { authors, came_from, date });
}

/** Write a file's four fields on its row in the db, never in the file. Says whether they went, and if not, why. */
export async function set_fields(where: string, fields: Fields): Promise<Saved> {
	const { title, description, use_when, date } = fields;
	return tell(route('/set-fields', { where }), { title, description, use_when, date });
}

/** Put one label on a file, in the db and never in the file. Says whether it went on, and if not, why. */
export async function add_label(where: string, name: string, value: string): Promise<Saved> {
	return tell(route('/add-label', { where }), { name, value });
}

/**
 * Forget every file the db holds a row for and the disk no longer does, labels and sources with
 * it. Answers the paths forgotten, counting from the top of the repo, and why when nothing could
 * be asked.
 */
export async function forget_missing(): Promise<{ ok: boolean; why: string; gone: string[] }> {
	try {
		const answer = await fetch(route('/forget-missing'), { method: 'POST' });
		const said = await answer.json().catch(() => ({}));
		if (answer.ok && said.success && Array.isArray(said.gone)) { return { ok: true, why: '', gone: said.gone as string[] }; }
		return { ok: false, why: said.error ?? `the server answered ${answer.status}`, gone: [] };
	} catch (e) {
		return { ok: false, why: e instanceof Error ? e.message : String(e), gone: [] };
	}
}

/** Take one label off a file, in the db. Says whether it came off, and if not, why. */
export async function remove_label(where: string, name: string, value: string): Promise<Saved> {
	return tell(route('/remove-label', { where }), { name, value });
}

// Tell the dispatcher to do one thing, with a JSON body, and read whether it did.
async function tell(url: string, body: object): Promise<Saved> {
	try {
		const answer = await fetch(url, {
			method  : 'POST',
			headers : { 'Content-Type': 'application/json' },
			body    : JSON.stringify(body),
		});
		const said = await answer.json().catch(() => ({}));
		if (answer.ok && said.success) { return { ok: true, why: '' }; }
		return { ok: false, why: said.error ?? `the server answered ${answer.status}` };
	} catch (e) {
		return { ok: false, why: e instanceof Error ? e.message : String(e) };
	}
}

/**
 * Ask the dispatcher to start itself over, so code changed on disk is the code answering.
 *
 * It never answers this one: it spawns a fresh copy of itself and exits, so the asking always
 * ends as a failed fetch. What proves the fresh copy is up is asking it for the guides — the
 * one question every route needs it awake for — every second and a half until it answers.
 */
export async function restart_dispatcher(tries = 10): Promise<Saved> {
	try {
		await fetch(route('/restart-dispatcher'), { method: 'POST' });
	} catch {
		// It exits part way through answering, so this always throws. Nothing is wrong.
	}
	for (let at = 0; at < tries; at++) {
		await new Promise((done) => setTimeout(done, k.timeout.asking));
		const on_disk = await files_on_disk();
		if (on_disk.paths.length > 0) { return { ok: true, why: '' }; }
	}
	return { ok: false, why: `it did not answer within ${Math.round((tries * k.timeout.asking) / 1000)} seconds` };
}

// Show one folder in the Finder. Only the dispatcher can do it, since a page served
// over the web cannot open anything on this machine itself.
export async function show_folder(where: string): Promise<Saved> {
	const url = route('/show-folder', { where });
	try {
		const answer = await fetch(url, { method: 'POST' });
		const said = await answer.json().catch(() => ({}));
		if (answer.ok && said.success) { return { ok: true, why: '' }; }
		return { ok: false, why: said.error ?? `the server answered ${answer.status}` };
	} catch (e) {
		return { ok: false, why: e instanceof Error ? e.message : String(e) };
	}
}

// Where a file sits once it is given a different name: exactly where it sat, with the last part
// swapped. Built out of its own old path rather than the folder it hangs under, since a work
// note hangs straight off its project and the work folder would be lost.
export function renamed_path(path: string, new_name: string): string {
	return [...path.split('/').slice(0, -1), `${new_name}.md`].join('/');
}

// Where a guide would sit if it were dropped into this folder: the folder's own path inside
// its collection, with the file's name after it. A folder at the top of a collection has no
// path of its own, so the name stands alone.
export function moved_into(folder_path: string, file_name: string): string {
	return folder_path === '' ? file_name : `${folder_path}/${file_name}`;
}

// Move a guide's file from one path in the repo to another. Says whether it moved, and if
// not, why in plain words. On success it also says where the file now is on this machine, so
// the app can read it again without waiting for a restart.
export async function move_file(from: string, to: string): Promise<Moved> {
	const url = route('/move-guide', { from, to });
	try {
		const answer = await fetch(url, { method: 'POST' });
		const said = await answer.json().catch(() => ({}));
		if (answer.ok && said.success) { return { ok: true, why: '', full_path: said.path ?? '' }; }
		return { ok: false, why: said.error ?? `the server answered ${answer.status}`, full_path: '' };
	} catch (e) {
		return { ok: false, why: e instanceof Error ? e.message : String(e), full_path: '' };
	}
}

export type Moved = { ok: boolean; why: string; full_path: string };

// Throw one guide's file away. Says whether it went, and if not, why in plain words. The same
// two guards as everything else: it must be a guide, and it must sit inside the repo.
export async function delete_file(where: string): Promise<Saved> {
	const url = route('/delete-guide', { where });
	try {
		const answer = await fetch(url, { method: 'POST' });
		const said = await answer.json().catch(() => ({}));
		if (answer.ok && said.success) { return { ok: true, why: '' }; }
		return { ok: false, why: said.error ?? `the server answered ${answer.status}` };
	} catch (e) {
		return { ok: false, why: e instanceof Error ? e.message : String(e) };
	}
}

/**
 * One guide's own words, read through the dispatcher rather than through the dev server.
 *
 * The dev server can serve a guide too, but it will not accept a name holding a question mark
 * however that mark is written — it hands back the app's own page instead of the file, which
 * reads on screen as a guide full of markup. Here the name travels as a query value, which the
 * dispatcher unpacks before it touches disk, so every name works.
 *
 * Nothing at all comes back when the file cannot be read, and why is said in plain words.
 */
export async function read_file(where: string): Promise<{ text: string | null; why: string }> {
	const url = route('/read-guide', { where });
	try {
		const answer = await fetch(url);
		const said = await answer.json().catch(() => ({}));
		if (answer.ok && said.success && typeof said.text === 'string') { return { text: said.text, why: '' }; }
		return { text: null, why: said.error ?? `the server answered ${answer.status}` };
	} catch (e) {
		return { text: null, why: e instanceof Error ? e.message : String(e) };
	}
}

// The repo is itself an Obsidian vault, named for the folder it sits in.
export const VAULT = 'mono';

// The address that hands a file to Obsidian. The repo is itself a vault, so a guide's path
// counting from the top of the repo is also its path inside the vault. Asked for a new tab, the
// open action's paneType=tab says so; without it Obsidian replaces its last active tab.
export function obsidian_link(vault: string, where: string, new_tab: boolean = false): string {
	return `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(where)}${new_tab ? '&paneType=tab' : ''}`;
}

// Write a changed guide. Says whether it was written, and if not, why in plain words.
export async function save_file(where: string, whole: string, as_opened: string): Promise<Saved> {
	const url = route('/save-guide', { where });
	try {
		const answer = await fetch(url, {
			method  : 'POST',
			headers : { 'Content-Type': 'application/json' },
			body    : JSON.stringify({ text: whole, as_opened }),
		});
		const said = await answer.json().catch(() => ({}));
		if (answer.ok && said.success) { return { ok: true, why: '' }; }
		return { ok: false, why: said.error ?? `the server answered ${answer.status}` };
	} catch (e) {
		return { ok: false, why: e instanceof Error ? e.message : String(e) };
	}
}
