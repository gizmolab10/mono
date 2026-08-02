import { T_Bundle } from '../types/Guide';

// Writing a changed guide back to the file it came from.
//
// The app can only read files; writing needs the small server already running on this
// machine — the one the diagnostic lines go to. It is handed the file's place in the repo,
// the whole new text, and the text as it was when the guide was opened. It re-reads the
// file itself and refuses to write if it no longer matches, so a file changed by anything
// else is never quietly overwritten.

export type Saved = { ok: boolean; why: string };

// Where a guide sits, counting from the top of the repo. The shared collection is the repo
// itself, so its guides have no project folder above them; every other collection does.
export function file_path_of(bundle: T_Bundle, path: string): string {
	const ending = path.endsWith('.md') ? path : `${path}.md`;
	const under  = `notes/guides/${ending}`;
	return bundle === T_Bundle.mono ? under : `${bundle}/${under}`;
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
