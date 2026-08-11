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
