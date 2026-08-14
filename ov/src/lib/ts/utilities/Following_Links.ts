/**
 * Whether a link inside a guide really names the guide that was found for it.
 *
 * A link is followed by climbing the folders above the guide it sits in and taking the first
 * guide of that name. That alone is too loose: a link naming a work note, or any file the app
 * never lists, still ends on a guide that happens to share its last word — so pressing it opens
 * the file already on screen and nothing seems to happen.
 *
 * So the rest of the link has to agree too. A link that names only a word is matched by name, as
 * before. A link that names folders must land on a guide sitting under exactly those folders.
 */

/** The parts of a link, with the ending, the leading dots and any empty pieces taken off. */
export function parts_of_link(link: string): string[] {
	const bare = link.trim().replace(/\.md$/i, '');
	return bare.split('/').filter((one) => one !== '' && one !== '.' && one !== '..');
}

/**
 * Does the guide found for this link really answer it? True when the link names only a word, or
 * when the guide sits under exactly the folders the link names.
 *
 * `where` is the guide's own place inside its collection, ending in its own name.
 */
export function link_agrees(link_parts: string[], where: string): boolean {
	if (link_parts.length <= 1) { return true; }
	const place = where.replace(/\.md$/i, '').split('/').filter((one) => one !== '');
	if (link_parts.length > place.length) { return false; }
	const from = place.length - link_parts.length;
	return link_parts.every((one, at) => one.toLowerCase() === place[from + at].toLowerCase());
}

/**
 * Which file a link most likely meant, where the exact rule above refuses every one of them.
 *
 * That rule answers a press, and a press must never open a file the link does not name — a wrong
 * guess opens the wrong words and nothing on screen says so. Naming a likely file in a report is a
 * different question: nothing is opened and nothing is written, so a good guess is the whole point.
 * These two answer that second question, and nothing else asks them.
 */

/** The folder words of a place, its own name left off. */
function folders_of(place: string): string[] {
	return place.split('/').filter((one) => one !== '').slice(0, -1);
}

/**
 * Where a link points, counting from the top of the repo. A link is written relative to the file it
 * sits in and never says where that file stands, so the two are put together here: the folders above
 * the file, then the link's own words, with each `..` climbing one folder and each `.` standing
 * still. Climbing past the top of the repo simply stops there.
 *
 * Without this a link is read as the words it happens to spell, and a link written from inside a
 * work folder — `proposals/one.md` — names no work folder at all.
 */
export function resolved_from(from_place: string, link: string): string {
	const at = folders_of(from_place);
	let where = link.split('#')[0].trim();
	try { where = decodeURIComponent(where); } catch { /* a stray percent sign; the words as written will do */ }
	for (const word of where.split('/')) {
		if (word === '' || word === '.') { continue; }
		if (word === '..') { at.pop(); continue; }
		at.push(word);
	}
	return at.join('/');
}

/** How many of the words a link names turn up in a file's place. */
export function words_shared(link_parts: string[], place: string): number {
	const words = place.replace(/\.md$/i, '').split('/').filter((one) => one !== '').map((one) => one.toLowerCase());
	return link_parts.filter((one) => words.includes(one.toLowerCase())).length;
}

/**
 * How far apart two files stand: the number of folder steps from the one holding the first to the
 * one holding the second. The folders they share at the front are dropped, then what is left on
 * each side is counted — up out of the one, down into the other.
 */
export function steps_between(from_place: string, to_place: string): number {
	const from = folders_of(from_place);
	const to   = folders_of(to_place);
	let same = 0;
	while (same < from.length && same < to.length && from[same].toLowerCase() === to[same].toLowerCase()) { same += 1; }
	return (from.length - same) + (to.length - same);
}

/**
 * The one file a dead link most likely meant, out of every file of that name.
 *
 * Most shared words first; where two share as many, the closer one wins. Where two are equal on
 * both, nothing comes back — naming one of them would be a coin toss said as an answer.
 */
export function likeliest(link_parts: string[], from_place: string, places: string[]): string | null {
	if (places.length === 0) { return null; }
	if (places.length === 1) { return places[0]; }
	const scored = places.map((place) => ({
		place,
		shared: words_shared(link_parts, place),
		steps: steps_between(from_place, place),
	}));
	scored.sort((a, b) => b.shared - a.shared || a.steps - b.steps);
	const [first, second] = scored;
	if (first.shared === second.shared && first.steps === second.steps) { return null; }
	return first.place;
}
