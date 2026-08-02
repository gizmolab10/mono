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
