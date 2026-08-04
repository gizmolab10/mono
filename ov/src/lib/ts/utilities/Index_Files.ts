// The index file each folder of guides keeps: a list of bulleted links naming what sits
// beside it. Moving a guide leaves two of them lying — the old folder still names a file that
// is gone, the new folder doesn't name the file that arrived — so both are mended here.
//
// These files are left out of the app's own list on purpose, so nothing on screen would ever
// show the damage. That is exactly why it has to be put right at the moment of the move.

// A bulleted link, however far it is indented and whatever follows it.
const LINK = /^\s*- \[[^\]]*\]\(([^)]+)\)/;

// The heading a moved file lands under when the index has more than one run of links.
const MORE = '## More';

// The file a bulleted link names, or nothing if the line names none. The address is spelled
// for the web, so "%20" is put back to a space before the name is read off the end.
export function file_named_by(line: string): string {
	const hit = LINK.exec(line);
	if (!hit) { return ''; }
	const address = hit[1].split('#')[0];
	const name = address.split('/').pop() ?? '';
	try { return decodeURIComponent(name); } catch { return name; }
}

// A line for a file that had none: just a link, no description. The shown name is the file's
// own name without its ending, first letter capitalized, the way the others read.
export function line_for(file_name: string): string {
	const bare = file_name.replace(/\.md$/, '');
	const shown = bare.charAt(0).toUpperCase() + bare.slice(1);
	return `- [${shown}](./${encodeURIComponent(file_name)})`;
}

// The index without the line naming this file, and the line that was taken out. Nothing
// found means the text comes back untouched and the line is empty.
export function without_line_for(text: string, file_name: string): { text: string; line: string } {
	const lines = text.split('\n');
	const at = lines.findIndex((line) => file_named_by(line) === file_name);
	if (at < 0) { return { text, line: '' }; }
	const line = lines[at];
	lines.splice(at, 1);
	return { text: lines.join('\n'), line };
}

// One guide's words with a section put in at the top, under its own heading if it has one,
// otherwise before everything. A guide that already carries this section is left alone, so
// pressing the button twice changes nothing the second time.
export function with_section_at_top(text: string, heading: string, words: string): { text: string; added: boolean } {
	if (text.includes(heading)) { return { text, added: false }; }
	const lines = text.split('\n');
	// Past the labels, if it carries any, then past its own first heading.
	let at = 0;
	if (lines[0]?.trim() === '---') {
		const ends = lines.findIndex((line, n) => n > 0 && line.trim() === '---');
		if (ends > 0) { at = ends + 1; }
	}
	while (at < lines.length && lines[at].trim() === '') { at += 1; }
	if (lines[at]?.startsWith('#')) { at += 1; }
	while (at < lines.length && lines[at].trim() === '') { at += 1; }
	const put = [heading, '', words, ''];
	return { text: [...lines.slice(0, at), ...put, ...lines.slice(at)].join('\n'), added: true };
}

// The same address, with the file it names given a different name. The folders before it,
// the heading after it, and whether the ending was written at all are all left as they were.
export function renamed_address(address: string, new_name: string): string {
	const [before, ...rest] = address.split('#');
	const heading = rest.length > 0 ? `#${rest.join('#')}` : '';
	const parts = before.split('/');
	const had_ending = /\.md$/i.test(parts[parts.length - 1]);
	parts[parts.length - 1] = encodeURIComponent(new_name) + (had_ending ? '.md' : '');
	return `${parts.join('/')}${heading}`;
}

// How one file is named from inside a folder: "./" and down for something below, "../" for
// each folder that has to be climbed first. Both places are named from the top of the repo.
export function relative_address(from_folder: string, to_file: string): string {
	const here = from_folder.split('/').filter((p) => p !== '');
	const there = to_file.split('/');
	let same = 0;
	while (same < here.length && same < there.length - 1 && here[same] === there[same]) { same += 1; }
	const up = here.length - same;
	const down = there.slice(same).map(encodeURIComponent).join('/');
	return up === 0 ? `./${down}` : `${'../'.repeat(up)}${down}`;
}

// A whole index file for a folder that had none: a heading named after the folder, and a
// link to every file beside it, in alphabetical order.
export function fresh_index(folder_name: string, names_beside: string[]): string {
	const shown = folder_name.charAt(0).toUpperCase() + folder_name.slice(1);
	const head = `# ${shown}\n\n## Contents\n`;
	if (names_beside.length === 0) { return head; }
	const lines = [...names_beside].sort((a, b) => a.localeCompare(b)).map(line_for);
	return `${head}\n${lines.join('\n')}\n`;
}

// One index put right against the files that actually sit beside it.
//
//   - a line naming a file that is beside it is left exactly as it is
//   - a line whose address points at nothing, where a file of that name is known somewhere
//     else, has its address rewritten and keeps every other word
//   - a line whose address points at nothing, and whose name is known nowhere, is taken out
//   - a file beside it that no line names is added, under "More" when the index lists files
//     in more than one place
//
// Anything not a bulleted link — headings, prose, links to folders or to the web — is left
// alone. What was rewritten, taken out and added comes back, so it can all be said plainly.
export function repaired_index(
	text: string,
	names_beside: string[],
	known_elsewhere: Map<string, string>,
): { text: string; rewritten: string[]; removed: string[]; added: string[] } {
	const beside = new Set(names_beside);
	const rewritten: string[] = [];
	const removed: string[] = [];
	const added: string[] = [];
	const seen = new Set<string>();
	const kept: string[] = [];

	for (const line of text.split('\n')) {
		const hit = LINK.exec(line);
		const name = file_named_by(line);
		// Not a bulleted link to a markdown file — a heading, prose, a folder, the web. Left be.
		// An index file of its own is left be too: the app never lists those, so it cannot judge them.
		if (!hit || !name.endsWith('.md') || name === 'index.md') { kept.push(line); continue; }

		const address = hit[1];
		const here = !address.replace(/^\.\//, '').includes('/');   // names a file in this folder
		if (here && beside.has(name)) { seen.add(name); kept.push(line); continue; }

		const elsewhere = known_elsewhere.get(name);
		if (here) {
			// It says the file is beside it, and it isn't.
			if (elsewhere) { kept.push(line.replace(address, elsewhere)); rewritten.push(name); }
			else { removed.push(line); }
			continue;
		}
		// It points somewhere else. Only a name the app knows, at a different place, is put right;
		// anything it doesn't know about is left exactly as it is.
		if (elsewhere && elsewhere !== address) { kept.push(line.replace(address, elsewhere)); rewritten.push(name); }
		else { kept.push(line); }
	}

	let out = kept.join('\n');
	for (const name of [...beside].filter((n) => !seen.has(n)).sort((a, b) => a.localeCompare(b))) {
		out = with_line_added(out, line_for(name)).text;
		added.push(name);
	}
	return { text: out, rewritten, removed, added };
}

// Where each run of bulleted links begins and ends. A run is a stretch of link lines with
// nothing but blank lines and more links in between; anything else ends it.
function runs_in(lines: string[]): Array<[number, number]> {
	const runs: Array<[number, number]> = [];
	let start = -1, last = -1;
	lines.forEach((line, n) => {
		if (LINK.test(line)) {
			if (start < 0) { start = n; }
			last = n;
		} else if (line.trim() !== '' && start >= 0) {
			runs.push([start, last]);
			start = -1;
		}
	});
	if (start >= 0) { runs.push([start, last]); }
	return runs;
}

/** The place inside this run where the line belongs, going by file name. */
function place_in_run(lines: string[], run: [number, number], file_name: string): number {
	for (let n = run[0]; n <= run[1]; n++) {
		const named = file_named_by(lines[n]);
		if (named !== '' && named.localeCompare(file_name) > 0) { return n; }
	}
	return run[1] + 1;
}

// The index with this line put in. One run of links takes it in its alphabetical place by
// file name. More than one run, and it goes to a run headed "More" — made at the end if it
// isn't there — since nothing in the file says which of the others it would belong to.
export function with_line_added(text: string, line: string): { text: string; into_more: boolean } {
	const file_name = file_named_by(line);
	const lines = text.split('\n');
	const runs = runs_in(lines);

	// Nothing listed yet, or one list: it simply joins that list.
	if (runs.length <= 1) {
		if (runs.length === 0) {
			const tail = text.endsWith('\n') ? '' : '\n';
			return { text: `${text}${tail}\n${line}\n`, into_more: false };
		}
		lines.splice(place_in_run(lines, runs[0], file_name), 0, line);
		return { text: lines.join('\n'), into_more: false };
	}

	// More than one list. The "More" one takes it — the last run under that heading, or a
	// fresh heading and run at the end of the file.
	const heading_at = lines.findIndex((l) => l.trim() === MORE);
	if (heading_at < 0) {
		const tail = text.endsWith('\n') ? '' : '\n';
		return { text: `${text}${tail}\n${MORE}\n\n${line}\n`, into_more: true };
	}
	const run = runs.find((r) => r[0] > heading_at);
	if (!run) {
		lines.splice(heading_at + 1, 0, '', line);
		return { text: lines.join('\n'), into_more: true };
	}
	lines.splice(place_in_run(lines, run, file_name), 0, line);
	return { text: lines.join('\n'), into_more: true };
}
