// The log server lives on this machine only, so a logged line is worth sending only
// while the page is served from here. The three names below are the ways a browser
// says "this machine".
const HERE = ['localhost', '127.0.0.1', '[::1]', '::1'];

// Worked out once, as this file is read: is the page being served from this machine?
// Anywhere else — another computer, a phone, this mac by way of intersection.lol — the
// answer is no and every logged line gives up before it builds anything. (Off this
// machine nothing could be written anyway: the address points at a machine with no log
// server, and a page served over https can't make a plain http request at all.) No
// browser at all (the tests) counts as not here.
const served_from_here = (typeof location !== 'undefined') && HERE.includes(location.hostname);

export class Debug {

	// Per log file: true once we've sent its first (erasing) line this session.
	logs_erased = new Map<string, boolean>();

	// A line worth having only while something is being worked on: written the same way
	// as any other, but says nothing for now. Change this one body to `this.log(...)`
	// and every such line speaks again.
	log_soon(_text: string, _filename: string = 'intersection', _erases: boolean = true): void {
	}

	// Append one extra line to the stated log file. `erases` (the default) lets the
	// first line for that file this session overwrite; pass false to always append,
	// even on the first line. A non-erasing call never marks the file, so it can't
	// eat a later erasing call's one-shot overwrite. Says nothing at all away from
	// this machine — nothing built, nothing sent, nothing to fail.
	log(text: string, filename: string = 'intersection', erases: boolean = true): void {
		if (!served_from_here) { return; }
		const base = `http://localhost:5171/log?where=${filename}`;
		const erasing = erases && !this.logs_erased.get(filename);
		if (erases) { this.logs_erased.set(filename, true); }
		const url = erasing ? `${base}&erase=1` : base;
		try {
			fetch(url, { method: 'POST', body: text }).catch(() => { /* silent */ });
		} catch {
			// silent
		}
	}

}

export const debug = new Debug();

// Say once, at the top of the log, which way that decision went and what it was read
// from — so a session with no log lines can be told from a session that decided to stay
// quiet. Only sayable when logging is on; off this machine the silence is the answer.
if (served_from_here) {
	debug.log(`Diagnostic log: on — this page is served from "${location.hostname}", which is this machine. Anywhere else, every logged line gives up at once.`);
}
