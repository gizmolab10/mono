import { code_link_of, is_code_link } from '../utilities/Opening_Code';
import { describe, expect, it } from 'vitest';

// A guide can name a piece of the code it describes. Those files are not guides, so nothing in
// the collection answers for them — they are handed to the editor on this machine instead.

describe('which links are code', () => {
	it('takes a file of code, whatever folders it climbs through', () => {
		expect(is_code_link('../../src/lib/ts/managers/Files.ts')).toBe(true);
		expect(is_code_link('../../src/lib/svelte/support/Section.svelte')).toBe(true);
		expect(is_code_link('./Files.ts')).toBe(true);
	});

	it('leaves the line off the reckoning', () => {
		expect(is_code_link('../../src/lib/ts/managers/Files.ts#L42')).toBe(true);
		expect(is_code_link('Section.svelte#L46-L52')).toBe(true);
	});

	it('takes nothing else', () => {
		expect(is_code_link('always.md')).toBe(false);
		expect(is_code_link('always.md#naming')).toBe(false);
		expect(is_code_link('#a-heading-here')).toBe(false);
		expect(is_code_link('')).toBe(false);
		expect(is_code_link('notes/tools/hub/dispatcher.py')).toBe(false);
	});

	it('is not fooled by a name that merely holds the ending', () => {
		expect(is_code_link('typescript.md')).toBe(false);
		expect(is_code_link('about.svelte.md')).toBe(false);
	});
});

// Where the file sits is worked out from the guide naming it: the link climbs out of the guide's
// own folder, exactly as it reads.

const FROM = '/Users/sand/GitHub/mono/ov/notes/work/action type.md';

describe('where the code sits, and which line', () => {
	it('climbs out of the guide\'s folder', () => {
		expect(code_link_of(FROM, '../../src/lib/ts/managers/Files.ts'))
			.toBe('vscode://file/Users/sand/GitHub/mono/ov/src/lib/ts/managers/Files.ts');
	});

	it('stays in the folder when the link says to', () => {
		expect(code_link_of(FROM, './beside.ts')).toBe('vscode://file/Users/sand/GitHub/mono/ov/notes/work/beside.ts');
		expect(code_link_of(FROM, 'beside.ts')).toBe('vscode://file/Users/sand/GitHub/mono/ov/notes/work/beside.ts');
	});

	it('puts the line after the path', () => {
		expect(code_link_of(FROM, '../../src/lib/svelte/support/Section.svelte#L46'))
			.toBe('vscode://file/Users/sand/GitHub/mono/ov/src/lib/svelte/support/Section.svelte:46');
	});

	it('takes the first line of a run', () => {
		expect(code_link_of(FROM, './one.ts#L46-L52')).toBe('vscode://file/Users/sand/GitHub/mono/ov/notes/work/one.ts:46');
	});

	it('leaves the line off when the link names none', () => {
		expect(code_link_of(FROM, './one.ts#somewhere')).toBe('vscode://file/Users/sand/GitHub/mono/ov/notes/work/one.ts');
	});

	it('reads a name written with stand-in codes', () => {
		expect(code_link_of(FROM, '../guides/my%20file.ts')).toBe('vscode://file/Users/sand/GitHub/mono/ov/notes/guides/my file.ts');
	});

	it('hands back nothing when the link is not code', () => {
		expect(code_link_of(FROM, 'always.md')).toBe('');
	});
});
