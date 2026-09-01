import { readFileSync, readdirSync, statSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

// Two doors reach through the "core" alias, and only two: common/Core.ts for everything
// with exports, and main.ts for the stylesheet alone. A stylesheet has no exports to
// re-export, and where it loads decides which rule wins between two that match equally —
// through Core.ts it would arrive with whichever file was pulled in first.
//
// A rule with an exception already in it invites a second one, and the plain search that
// found this exception now returns a hit that belongs there. So the search is written down
// here instead, where a third door fails it.

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../../..');

/** Every module a file reaches for through the alias. A path inside ordinary words is not one. */
function alias_reaches_in(text: string): string[] {
	return [...text.matchAll(/(?:from|import)\s+'(core\/[^']+)'/g)].map((one) => one[1]);
}

function source_files(folder: string): string[] {
	const found: string[] = [];
	for (const name of readdirSync(folder)) {
		const path = join(folder, name);
		if (statSync(path).isDirectory()) { found.push(...source_files(path)); }
		else if (name.endsWith('.ts') || name.endsWith('.svelte')) { found.push(path); }
	}
	return found;
}

describe('the doors through the core alias', () => {
	const doors = new Map<string, string[]>();
	for (const path of source_files(SRC)) {
		const reaches = alias_reaches_in(readFileSync(path, 'utf8'));
		if (reaches.length > 0) { doors.set(relative(SRC, path), reaches); }
	}

	it('are exactly two files', () => {
		expect([...doors.keys()].sort()).toEqual(['src/lib/ts/common/Core.ts', 'src/lib/ts/main.ts']);
	});

	it('let main.ts reach for the stylesheet and nothing else', () => {
		expect(doors.get('src/lib/ts/main.ts')).toEqual(['core/main.css']);
	});

	it('let Core.ts reach for code, never the stylesheet', () => {
		const reaches = doors.get('src/lib/ts/common/Core.ts') ?? [];
		expect(reaches.length).toBeGreaterThan(0);
		expect(reaches.filter((one) => one.endsWith('.css'))).toEqual([]);
	});
});
