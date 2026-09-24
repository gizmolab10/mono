import { readFileSync, readdirSync, statSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

// Two libraries reach kb through an alias, core and panel, and each has one bridge: common/Core.ts
// for core and common/Panel.ts for panel, each for everything with exports. A library has no entry
// file, so core's stylesheet is the host's to import, in its own main.ts, as libraries.md says.
//
// A rule with an exception already in it invites a second one, so the plain search that finds
// every reach is written down here instead, where a third bridge fails it.

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const BRIDGES: Record<string, string[]> = {
	core  : ['lib/ts/common/Core.ts'],
	panel : ['lib/ts/common/Panel.ts'],
};

/** Every module a file reaches for through an alias. A path inside ordinary words is not one. */
function alias_reaches_in(text: string): string[] {
	return [...text.matchAll(/(?:from|import)\s+'((?:core|panel)\/[^']+)'/g)].map((one) => one[1]);
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

describe('the bridges through the aliases', () => {
	const reaches = new Map<string, string[]>();   // file -> what it reaches for
	for (const path of source_files(SRC)) {
		const found = alias_reaches_in(readFileSync(path, 'utf8'));
		if (found.length > 0) { reaches.set(relative(SRC, path), found); }
	}

	for (const [alias, bridges] of Object.entries(BRIDGES)) {
		it(`let only ${bridges.join(' and ')} reach through ${alias}`, () => {
			const files = [...reaches.entries()]
				.filter(([, found]) => found.some((one) => one.startsWith(alias + '/')))
				.map(([file]) => file)
				.sort();
			expect(files).toEqual([...bridges].sort());
		});
	}

	it('let every bridge reach for code, never a stylesheet', () => {
		for (const [, found] of reaches) {
			expect(found.length).toBeGreaterThan(0);
			expect(found.filter((one) => one.endsWith('.css'))).toEqual([]);
		}
	});
});
