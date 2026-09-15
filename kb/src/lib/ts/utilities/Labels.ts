// The labels as plain work on text, needing nothing on screen: what kb still does with them
// since step 12 of the plan, when composing labels went to ai. A new guide's name and empty
// text, a date written the way every guide writes it, a moment written out for reading, and the
// writes that take a file's kind and tags in the db from what they were to what they are. The
// kind and the tag a new guide starts with are the host's, kind_when_new and tag_when_new in
// the configuration. No file has carried a label block since 10 September 2026, and the code that
// read and wrote one went with step 12.

// --- a guide made from nothing ----------------------------------------------

/** The name a new guide is given until it is given a real one. */
export const NAME_UNTIL_TOLD = 'unnamed';

/**
 * The whole of a brand new guide: a heading holding its name, and nothing else. Its labels are
 * not written into the file — the caller puts them in the db, which is what the list filters
 * from and the editor reads — so it is labeled from the moment it exists, and nobody has to go
 * back and label it.
 */
export function blank_file(name: string): string {
	return `# ${name}\n`;
}

/**
 * A name no file in the folder answers to. The plain one when it is free, then the same name
 * with a number after it, counting up from two. Capitals are ignored, since two names that
 * differ only in case are one file on this machine.
 */
export function free_name(wanted: string, taken: string[]): string {
	const used = new Set(taken.map((one) => one.toLowerCase()));
	if (!used.has(wanted.toLowerCase())) { return wanted; }
	for (let next = 2; ; next += 1) {
		const tried = `${wanted} ${next}`;
		if (!used.has(tried.toLowerCase())) { return tried; }
	}
}

/** Today, written the way every guide writes its date. */
export function today(): string {
	const now = new Date();
	const two = (n: number) => String(n).padStart(2, '0');
	return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

// The months, spelled out, for a date a person reads rather than one a file carries.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * A moment written out for reading: the day, the month by name, the year, then the clock — twelve
 * hours with the half of the day said, since that is how it is read aloud.
 */
export function moment_written_out(when: Date): string {
	const hour = when.getHours();
	const shown = hour % 12 === 0 ? 12 : hour % 12;
	const minutes = String(when.getMinutes()).padStart(2, '0');
	return `${when.getDate()} ${MONTHS[when.getMonth()]}, ${when.getFullYear()} at ${shown}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`;
}

/**
 * The writes that take a file's kind and tags in the db from what they were to what they are
 * now: each label to put on, and each to take off. A kind that changed comes off and the new one
 * goes on; a kind that stayed is not touched, and neither is a tag worn before and after. Written
 * over plain words so it can be proved without a db.
 */
export function label_changes(was_kind: string, was_tags: string[], kind: string, tags: string[]): { on: [string, string][]; off: [string, string][] } {
	const on: [string, string][] = [];
	const off: [string, string][] = [];
	if (kind !== was_kind) {
		if (was_kind !== '') { off.push(['kind', was_kind]); }
		if (kind !== '') { on.push(['kind', kind]); }
	}
	for (const tag of was_tags) { if (!tags.includes(tag)) { off.push(['tag', tag]); } }
	for (const tag of tags) { if (!was_tags.includes(tag)) { on.push(['tag', tag]); } }
	return { on, off };
}
