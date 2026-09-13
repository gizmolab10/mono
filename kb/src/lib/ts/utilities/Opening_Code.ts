// Handing a piece of the code to the editor on this machine.
//
// A guide often names the very code it describes. Those files are not guides — nothing in the
// collection answers for them — so a press on such a link goes to VSCode rather than to the
// list. Where the file sits is worked out from the guide naming it, so nothing has to be
// stored: the link climbs out of that guide's own folder exactly as it reads.

/** The endings that mean a file of code — anything a guide names that this app cannot open itself. */
const CODE_ENDINGS = ['.ts', '.mts', '.mjs', '.js', '.svelte', '.css', '.html', '.json', '.toml', '.sh', '.py'];

/** The part of a link before the hash: the file it names, with any line left off. */
function file_named_by(link: string): string {
	return link.split('#')[0];
}

/** Does this link name a file of code? */
export function is_code_link(link: string): boolean {
	const file = file_named_by(link);
	if (file === '') { return false; }
	return CODE_ENDINGS.some((ending) => file.toLowerCase().endsWith(ending));
}

/**
 * The line a link asks for, counted from one. Only the `#L42` form says a line; a run says
 * its first. Anything else — a heading's name, or no hash at all — says none, and zero means
 * the file opens at the top.
 */
function line_named_by(link: string): number {
	const hash = link.split('#')[1] ?? '';
	const found = /^L(\d+)/.exec(hash);
	return found ? Number(found[1]) : 0;
}

/**
 * The full path a link points at, from the file doing the pointing. Every step of the link is
 * walked: two dots climb out of a folder, one dot or nothing stays in it. Stand-in codes in a
 * name (a space written as %20) are read back to the character they stand for.
 */
export function full_path_of(from_file: string, link: string): string {
	const folders = from_file.split('/').slice(0, -1);
	for (const step of file_named_by(link).split('/')) {
		if (step === '' || step === '.') { continue; }
		if (step === '..') { folders.pop(); continue; }
		folders.push(decodeURIComponent(step));
	}
	return folders.join('/');
}

/**
 * What to hand the machine so VSCode opens this piece of code, or nothing at all when the link
 * names something else. The line comes after the path, which is how VSCode is told where to
 * put the cursor; a link naming no line opens the file at the top.
 */
export function code_link_of(from_file: string, link: string): string {
	if (!is_code_link(link)) { return ''; }
	const at = line_named_by(link);
	return `vscode://file${full_path_of(from_file, link)}${at > 0 ? `:${at}` : ''}`;
}
