import { T_Bundle } from '../types/File';
import { k } from '../common/Constants';

// Writing a changed guide back to the file it came from.
//
// The app can only read files; writing needs the dispatcher already running on this
// machine — the one the diagnostic lines go to. It is handed the file's path in the repo,
// the whole new text, and the text as it was when the guide was opened. It re-reads the
// file itself and refuses to write if it no longer matches, so a file changed by anything
// else is never quietly overwritten.

export type Saved = { ok: boolean; why: string };

// A collection's notes folder, counting from the top of the repo. The shared collection is
// the repo itself, so its notes have no project folder above them; every other one does.
function notes_of(bundle: T_Bundle): string {
	return bundle === T_Bundle.mono ? 'notes' : `${bundle}/notes`;
}

/**
 * The memory system, at the top of the repo beside notes. It belongs to no collection, so the
 * shared one carries it, and its path is the whole way there — no notes folder above it.
 */
const MEMORY = 'memory/';

// Where a file sits, counting from the top of the repo. A design's path already begins with
// "designs" and a work note's with "work", so those two hang straight off the notes folder;
// everything else is under guides.
export function file_path_of(bundle: T_Bundle, path: string): string {
	if (path.split('/').pop()?.toLowerCase() === 'claude.md') {
		return bundle === T_Bundle.mono ? path : `${bundle}/${path}`;
	}
	const ending = path.endsWith('.md') ? path : `${path}.md`;
	if (bundle === T_Bundle.memory) { return `memory/${ending}`; }
	const beside = ending.startsWith('designs/') || ending.startsWith('work/');
	const inside = beside ? ending : `guides/${ending}`;
	return `${notes_of(bundle)}/${inside}`;
}

/**
 * The folders inside a work folder whose notes the app lists, beside the notes standing at that
 * folder's own top. Every other folder there holds work of a kind nothing links to.
 */
export const WORK_FOLDERS = ['next', 'milestones', 'now', 'soon', 'done', 'proposals'];

/** How far below a work folder a path sits: nothing at its top, one for a note inside a folder. */
function under_work(parts: string[], at: number): number {
	return parts.length - at - 2;
}

/**
 * The other way round: which collection a file belongs to, and where it sits inside that
 * collection, read off where it stands in the repo. A work note counts where it sits at the very
 * top of the work folder, and inside any of the folders named above — those are the ones a guide
 * links to, and the app shows each of them under its own project. Anything else reads as nothing.
 */
export type File_Site = { bundle: T_Bundle; path: string; is_design: boolean };

export function site_of_file(where: string): File_Site | null {
	// A collection's CLAUDE file sits at its very top, spelled CLAUDE.MD or CLAUDE.md — so
	// this stands before the lowercase .md gate, which would turn the uppercase spelling away.
	// It hangs off the collection's own top folder, beside guides, designs and work.
	const steps = where.split('/');
	if (steps[steps.length - 1].toLowerCase() === 'claude.md') {
		if (steps.length === 1) { return { bundle: T_Bundle.mono, path: steps[0], is_design: false }; }
		const owner = Object.values(T_Bundle).find((one) => one === steps[0]);
		if (steps.length === 2 && !!owner) { return { bundle: owner, path: steps[1], is_design: false }; }
		return null;
	}
	if (!where.endsWith('.md')) { return null; }
	if (where.startsWith(MEMORY)) { return { bundle: T_Bundle.memory, path: where.slice(MEMORY.length), is_design: false }; }
	for (const bundle of Object.values(T_Bundle)) {
		const notes = `${notes_of(bundle)}/`;
		if (!where.startsWith(notes)) { continue; }
		const inside = where.slice(notes.length);
		if (inside.startsWith('guides/'))  { return { bundle, path: inside.slice('guides/'.length), is_design: false }; }
		if (inside.startsWith('designs/')) { return { bundle, path: inside, is_design: true }; }
		if (inside.startsWith('work/')) {
			const parts = inside.split('/');
			const deep = under_work(parts, 0);
			const listed = deep === 0 || (deep === 1 && WORK_FOLDERS.includes(parts[1].toLowerCase()));
			return listed ? { bundle, path: inside, is_design: false } : null;
		}
		return null;
	}
	return null;
}

/**
 * Does a link reach into a work folder somewhere the app lists nothing? It lists the notes at that
 * folder's own top and the ones inside the named folders — the same line `site_of_file` draws — so
 * a link past those names something nothing here can answer for, and judging it would call every
 * one of them dead.
 *
 * Read off the address exactly as it is written. A link is relative to whoever wrote it and never
 * says where it sits in the repo, so the last `work` in it is the one it means.
 */
export function reaches_under_work(address: string): boolean {
	const parts = address.split('/');
	const at = parts.lastIndexOf('work');
	if (at < 0) { return false; }
	const deep = under_work(parts, at);
	if (deep <= 0) { return false; }
	return !(deep === 1 && WORK_FOLDERS.includes(parts[at + 1].toLowerCase()));
}

// The folder a file sits in, counting from the top of the repo. A collection's own top folder
// has no path inside it, so the guides folder itself is the answer. The designs folder and the
// work folder stand beside guides rather than inside it.
export function folder_path_of(bundle: T_Bundle, folder_path: string): string {
	if (bundle === T_Bundle.memory) { return folder_path === '' ? 'memory' : `memory/${folder_path}`; }
	const notes = notes_of(bundle);
	if (folder_path === '') { return `${notes}/guides`; }
	const beside = folder_path.startsWith('designs') || folder_path.startsWith('work');
	return beside ? `${notes}/${folder_path}` : `${notes}/guides/${folder_path}`;
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

export async function files_on_disk(): Promise<On_Disk> {
	try {
		const answer = await fetch('http://localhost:5171/list-files');
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
 * Ask the dispatcher to start itself over, so code changed on disk is the code answering.
 *
 * It never answers this one: it spawns a fresh copy of itself and exits, so the asking always
 * ends as a failed fetch. What proves the fresh copy is up is asking it for the guides — the
 * one question every route needs it awake for — every second and a half until it answers.
 */
export async function restart_dispatcher(tries = 10): Promise<Saved> {
	try {
		await fetch('http://localhost:5171/restart-dispatcher', { method: 'POST' });
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
	const url = `http://localhost:5171/show-folder?where=${encodeURIComponent(where)}`;
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
	const url = `http://localhost:5171/move-guide?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
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
	const url = `http://localhost:5171/delete-guide?where=${encodeURIComponent(where)}`;
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
	const url = `http://localhost:5171/read-guide?where=${encodeURIComponent(where)}`;
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
// counting from the top of the repo is also its path inside the vault.
export function obsidian_link(vault: string, where: string): string {
	return `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(where)}`;
}

// Write a changed guide. Says whether it was written, and if not, why in plain words.
export async function save_file(where: string, whole: string, as_opened: string): Promise<Saved> {
	const url = `http://localhost:5171/save-guide?where=${encodeURIComponent(where)}`;
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
