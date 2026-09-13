import { customizations } from '../common/Customizations';
import { describe, expect, it } from 'vitest';

// A library names nothing of any host's, libraries.md's rule, so every default here is kb's own or
// empty: the host's main.ts fills them before anything mounts.

describe('the configuration\'s defaults', () => {
	it('name no host', () => {
		expect(JSON.stringify(customizations)).not.toMatch(/\b(ai|mu|ov)\b/);
	});

	it('name kb itself, and an empty host, so the dispatcher answers ov\'s db', () => {
		expect(customizations.name).toBe('kb');
		expect(customizations.prefix).toBe('kb_');
		expect(customizations.host).toBe('');
	});

	it('hold no keys, which step 7 fills, and no build notes', () => {
		expect(customizations.kinds).toEqual([]);
		expect(customizations.tags).toEqual([]);
		expect(customizations.tag_areas).toEqual([]);
		expect(customizations.builds).toBe('');
	});

	it('offer the folder hierarchy alone, ordered by name', () => {
		expect(customizations.hierarchies).toEqual([{ label: 'folder', order: 'name' }]);
	});
});
