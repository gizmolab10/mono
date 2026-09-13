import { readFileSync, readdirSync, statSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

// One bridge reaches through the "core" alias, and only one: common/Core.ts, for everything
// with exports. A library has no entry file, so core's stylesheet is the host's to import, in
// its own main.ts, as libraries.md says: a stylesheet has no exports to re-export, and where it
// loads decides which rule wins between two that match equally.
//
// A rule with an exception already in it invites a second one, so the plain search that finds
// every reach is written down here instead, where a second bridge fails it.

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

describe('the bridge through the core alias', () => {
	const bridges = new Map<string, string[]>();
	for (const path of source_files(SRC)) {
		const reaches = alias_reaches_in(readFileSync(path, 'utf8'));
		if (reaches.length > 0) { bridges.set(relative(SRC, path), reaches); }
	}

	it('is exactly one file', () => {
		expect([...bridges.keys()]).toEqual(['src/lib/ts/common/Core.ts']);
	});

	it('reaches for code, never the stylesheet', () => {
		const reaches = bridges.get('src/lib/ts/common/Core.ts') ?? [];
		expect(reaches.length).toBeGreaterThan(0);
		expect(reaches.filter((one) => one.endsWith('.css'))).toEqual([]);
	});
});
