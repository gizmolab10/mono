import { readFileSync, readdirSync, statSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

// Two libraries reach lv through an alias, core and gallery, and each has its bridges:
// common/Core.ts for core, common/Gallery.ts for gallery, and Main.ts for gallery's
// stylesheet alone. A stylesheet has no exports to re-export, and where it loads decides
// which rule wins between two that match equally — through a bridge it would arrive with
// whichever file was pulled in first. Every other file of lv's imports from a bridge.
//
// A rule with an exception already in it invites a second one, so the search that finds
// every reach is written down here, where a new bridge fails it.

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const BRIDGES: Record<string, string[]> = {
	core    : ['lib/ts/common/Core.ts'],
	gallery : ['lib/ts/common/Gallery.ts', 'lib/ts/Main.ts'],
};

/** Every module a file reaches for through an alias. A path inside ordinary words is not one. */
function alias_reaches_in(text: string): string[] {
	return [...text.matchAll(/(?:from|import)\s+'((?:core|gallery)\/[^']+)'/g)].map((one) => one[1]);
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

	it('let Main.ts reach for the stylesheets and nothing else', () => {
		expect(reaches.get('lib/ts/Main.ts')).toEqual(['gallery/css/Main.css', 'gallery/css/Gallery.css']);
	});

	it('let every other bridge reach for code, never a stylesheet', () => {
		for (const [file, found] of reaches) {
			if (file === 'lib/ts/Main.ts') { continue; }
			expect(found.length).toBeGreaterThan(0);
			expect(found.filter((one) => one.endsWith('.css'))).toEqual([]);
		}
	});
});
