export class Debug {

	// Per log file: true once we've sent its first (erasing) line this session.
	logs_erased = new Map<string, boolean>();

	// Append one extra line to the stated log file. `erases` (the default) lets the
	// first line for that file this session overwrite; pass false to always append,
	// even on the first line. A non-erasing call never marks the file, so it can't
	// eat a later erasing call's one-shot overwrite.
	log(text: string, filename: string = 'designintuition', erases: boolean = true): void {
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
