import { T_Bundle } from '../types/Guide';

// Writing a changed guide back to the file it came from.
//
// The app can only read files; writing needs the dispatcher already running on this
// machine — the one the diagnostic lines go to. It is handed the file's place in the repo,
// the whole new text, and the text as it was when the guide was opened. It re-reads the
// file itself and refuses to write if it no longer matches, so a file changed by anything
// else is never quietly overwritten.

export type Saved = { ok: boolean; why: string };

// A collection's notes folder, counting from the top of the repo. The shared collection is
// the repo itself, so its notes have no project folder above them; every other one does.
function notes_of(bundle: T_Bundle): string {
	return bundle === T_Bundle.mono ? 'notes' : `${bundle}/notes`;
}

// Where a file sits, counting from the top of the repo. A design's place already begins with
// "designs", so it hangs straight off the notes folder; everything else is under guides.
export function file_path_of(bundle: T_Bundle, path: string): string {
	const ending = path.endsWith('.md') ? path : `${path}.md`;
	const inside = ending.startsWith('designs/') ? ending : `guides/${ending}`;
	return `${notes_of(bundle)}/${inside}`;
}

/**
 * The other way round: which collection a file belongs to, and where it sits inside that
 * collection, read off its place in the repo. Anything that is not a guide or a design reads
 * as nothing at all.
 */
export type Guide_Place = { bundle: T_Bundle; path: string; is_design: boolean };

export function place_of_file(where: string): Guide_Place | null {
	if (!where.endsWith('.md')) { return null; }
	for (const bundle of Object.values(T_Bundle)) {
		const notes = `${notes_of(bundle)}/`;
		if (!where.startsWith(notes)) { continue; }
		const inside = where.slice(notes.length);
		if (inside.startsWith('guides/'))  { return { bundle, path: inside.slice('guides/'.length), is_design: false }; }
		if (inside.startsWith('designs/')) { return { bundle, path: inside, is_design: true }; }
		return null;
	}
	return null;
}

// The folder a file sits in, counting from the top of the repo. A collection's own top folder
// has no place inside it, so the guides folder itself is the answer.
export function folder_path_of(bundle: T_Bundle, folder_path: string): string {
	const notes = notes_of(bundle);
	if (folder_path === '') { return `${notes}/guides`; }
	return folder_path.startsWith('designs') ? `${notes}/${folder_path}` : `${notes}/guides/${folder_path}`;
}

// Nothing restarts this app any more. Moving or renaming a guide used to, because the list of
// which files exist was settled when the app's code was prepared; now the app asks the disk,
// and a file that moved is read from where it now sits.

/**
 * Every guide and design on disk right now — the app's whole list of files, and the one place
 * it comes from. Each is named by its place counting from the top of the repo, and the repo's
 * own place on this machine comes with them, since the files are read by their full place.
 *
 * An empty answer means the dispatcher is not running, and the app has no guides to
 * show at all. It says so rather than showing nothing and leaving you to wonder.
 */
export type On_Disk = { root: string; paths: string[] };

export async function guides_on_disk(): Promise<On_Disk> {
	try {
		const answer = await fetch('http://localhost:5171/list-guides');
		const said = await answer.json().catch(() => ({}));
		if (answer.ok && said.success && Array.isArray(said.paths) && typeof said.root === 'string') {
			return { root: said.root.endsWith('/') ? said.root : `${said.root}/`, paths: said.paths as string[] };
		}
		return { root: '', paths: [] };
	} catch {
		return { root: '', paths: [] };
	}
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

// Where a guide would sit if it were dropped into this folder: the folder's own place inside
// its collection, with the file's name after it. A folder at the top of a collection has no
// place of its own, so the name stands alone.
export function moved_into(folder_path: string, file_name: string): string {
	return folder_path === '' ? file_name : `${folder_path}/${file_name}`;
}

// Move a guide's file from one place in the repo to another. Says whether it moved, and if
// not, why in plain words. On success it also says where the file now is on this machine, so
// the app can read it again without waiting for a restart.
export async function move_guide(from: string, to: string): Promise<Moved> {
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
export async function delete_guide(where: string): Promise<Saved> {
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

// The repo is itself an Obsidian vault, named for the folder it sits in.
export const VAULT = 'mono';

// The address that hands a file to Obsidian. The repo is itself a vault, so a guide's place
// counting from the top of the repo is also its place inside the vault.
export function obsidian_link(vault: string, where: string): string {
	return `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(where)}`;
}

// Write a changed guide. Says whether it was written, and if not, why in plain words.
export async function save_guide(where: string, whole: string, as_opened: string): Promise<Saved> {
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
