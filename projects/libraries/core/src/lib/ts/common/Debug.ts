// The log server lives on this machine only, so a logged line is worth sending only
// while the page is served from here. The three names below are the ways a browser
// says "this machine".
const HERE = ['localhost', '127.0.0.1', '[::1]', '::1'];

// Worked out once, as this file is read: is the page being served from this machine?
// Anywhere else — another computer, a phone — the answer is no and every logged line
// gives up before it builds anything. (Off this machine nothing could be written
// anyway: the address points at a machine with no log server, and a page served over
// https can't make a plain http request at all.) No browser at all counts as not here.
const served_from_here = (typeof location !== 'undefined') && HERE.includes(location.hostname);

// How long lines are gathered before they are sent, in one request per log file. Sending each
// line as it came made thousands of requests in a burst, when a page judged every link it holds:
// the browser refuses requests past its own cap, and fails whatever else the page asks for in the
// meantime, a write among them. No rung of core's is this short.
const GATHERING = 50;

export class Debug {

	// The log file a line goes to when the caller names none: the host sets its own, ai.debug
	// for ai, before its first line, so its page log sits in its own memory folder; the
	// dispatcher puts a name that is no memory project's under mono/logs.
	file = 'debug';

	// Per log file: true once we've sent its first (erasing) line this session.
	logs_erased = new Map<string, boolean>();

	// The lines waiting to be sent, per log file, and whether their request erases the file, with
	// the one timer that sends them all.
	private waiting = new Map<string, { lines: string[]; erase: boolean }>();
	private sending: ReturnType<typeof setTimeout> | null = null;

	// A line worth having only while something is being worked on: written the same way
	// as any other, but says nothing for now. Change this one body to `this.log(...)`
	// and every such line speaks again.
	log_soon(_text: string, _filename: string = this.file, _erases: boolean = true): void {
	}

	// Append one extra line to the stated log file. `erases` (the default) lets the
	// first line for that file this session overwrite; pass false to always append,
	// even on the first line. A non-erasing call never marks the file, so it can't
	// eat a later erasing call's one-shot overwrite. Says nothing at all away from
	// this machine — nothing built, nothing sent, nothing to fail. The line waits a
	// few milliseconds for company and goes with every other line for its file in one
	// request.
	log(text: string, filename: string = this.file, erases: boolean = true): void {
		if (!served_from_here) { return; }
		const erasing = erases && !this.logs_erased.get(filename);
		if (erases) { this.logs_erased.set(filename, true); }
		const queue = this.waiting.get(filename) ?? { lines: [], erase: false };
		queue.lines.push(text);
		queue.erase = queue.erase || erasing;
		this.waiting.set(filename, queue);
		if (this.sending === null) {
			this.sending = setTimeout(() => this.send(), GATHERING);
		}
	}

	// Every waiting line goes now, one request per log file, the lines in the order they came.
	private send(): void {
		this.sending = null;
		const batches = [...this.waiting.entries()];
		this.waiting.clear();
		for (const [filename, { lines, erase }] of batches) {
			const url = `http://localhost:5171/log?where=${filename}${erase ? '&erase=1' : ''}`;
			try {
				fetch(url, { method: 'POST', body: lines.join('\n') + '\n' }).catch(() => { /* silent */ });
			} catch {
				// silent
			}
		}
	}

}

export const debug = new Debug();
