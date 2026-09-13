import { readFileSync, readdirSync, statSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

// Two libraries reach ai through an alias, core and kb, and each has its bridges: common/Core.ts
// for core, with main.ts for core's stylesheet alone, and common/Kb.ts for kb. A stylesheet has
// no exports to re-export, and where it loads decides which rule wins between two that match
// equally — through a bridge it would arrive with whichever file was pulled in first. Every
// other file of ai's imports from a bridge. A third alias, panel, is carried for the build,
// since kb draws panel; no file of ai's reaches through it.
//
// A rule with an exception already in it invites a second one, so the search that finds
// every reach is written down here, where a new bridge fails it.

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const BRIDGES: Record<string, string[]> = {
	core  : ['lib/ts/common/Core.ts', 'lib/ts/main.ts'],
	kb    : ['lib/ts/common/Kb.ts'],
	panel : [],
};

/** Every module a file reaches for through an alias. A path inside ordinary words is not one. */
function alias_reaches_in(text: string): string[] {
	return [...text.matchAll(/(?:from|import)\s+'((?:core|kb|panel)\/[^']+)'/g)].map((one) => one[1]);
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
		it(`let only ${bridges.join(' and ') || 'nothing'} reach through ${alias}`, () => {
			const files = [...reaches.entries()]
				.filter(([, found]) => found.some((one) => one.startsWith(alias + '/')))
				.map(([file]) => file)
				.sort();
			expect(files).toEqual([...bridges].sort());
		});
	}

	it('let main.ts reach for the stylesheet and nothing else', () => {
		expect(reaches.get('lib/ts/main.ts')).toEqual(['core/main.css']);
	});

	it('let every other bridge reach for code, never a stylesheet', () => {
		for (const [file, found] of reaches) {
			if (file === 'lib/ts/main.ts') { continue; }
			expect(found.length).toBeGreaterThan(0);
			expect(found.filter((one) => one.endsWith('.css'))).toEqual([]);
		}
	});
});
