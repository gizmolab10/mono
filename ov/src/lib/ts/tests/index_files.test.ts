import { file_named_by, fresh_index, line_for, relative_address, repaired_index, with_line_added, without_line_for } from '../utilities/Index_Files';
import { describe, expect, it } from 'vitest';

// Mending the two index files a move leaves lying. Nothing on screen shows these files, so
// the only proof they come out right is here.

const one_run = [
	'# Pre Flight',
	'',
	'## Contents',
	'',
	'- [Always](./always.md)',
	'- [Gotchas](./gotchas.md)',
	'- [Working](./working.md)',
	'',
].join('\n');

const two_runs = [
	'# Ux',
	'',
	'## Components',
	'',
	'- [Buttons](./buttons.md) - Button components',
	'- [Search](./search.md) - Search functionality',
	'',
	'## See also',
	'',
	'- [UX Manager](../core/ux.md) - Overall coordination',
	'',
].join('\n');

describe('reading the file a line names', () => {
	it('reads it off a plain link', () => {
		expect(file_named_by('- [Always](./always.md)')).toBe('always.md');
	});

	it('reads it off a link with a description', () => {
		expect(file_named_by('- [Buttons](./buttons.md) - Button components')).toBe('buttons.md');
	});

	it('reads it off an indented link', () => {
		expect(file_named_by('    - [Units](./core/units.md) — millimetres')).toBe('units.md');
	});

	it('puts a spelled-out space back', () => {
		expect(file_named_by('- [Adding a Guide](./adding%20a%20guide.md)')).toBe('adding a guide.md');
	});

	it('says nothing for a line that is not a bulleted link', () => {
		expect(file_named_by('## Contents')).toBe('');
		expect(file_named_by('some words about [a link](./a.md)')).toBe('');
	});
});

describe('making a line for a file that had none', () => {
	it('names it after itself, without its ending', () => {
		expect(line_for('always.md')).toBe('- [Always](./always.md)');
	});

	it('spells out a space in the address but not in the name', () => {
		expect(line_for('adding a guide.md')).toBe('- [Adding a guide](./adding%20a%20guide.md)');
	});
});

describe('taking a line out of an index', () => {
	it('takes the line and hands it back', () => {
		const { text, line } = without_line_for(one_run, 'gotchas.md');
		expect(line).toBe('- [Gotchas](./gotchas.md)');
		expect(text).not.toContain('gotchas');
		expect(text).toContain('- [Always](./always.md)');
		expect(text).toContain('- [Working](./working.md)');
	});

	it('takes the whole line, description and all', () => {
		const { line } = without_line_for(two_runs, 'buttons.md');
		expect(line).toBe('- [Buttons](./buttons.md) - Button components');
	});

	it('leaves the index alone when the file is not named in it', () => {
		const { text, line } = without_line_for(one_run, 'nowhere.md');
		expect(text).toBe(one_run);
		expect(line).toBe('');
	});
});

describe('putting a line into an index', () => {
	it('puts it in its alphabetical place in the one run', () => {
		const { text, into_more } = with_line_added(one_run, '- [Gates](./gates.md)');
		const lines = text.split('\n').filter((l) => l.startsWith('- ['));
		expect(lines).toEqual([
			'- [Always](./always.md)',
			'- [Gates](./gates.md)',
			'- [Gotchas](./gotchas.md)',
			'- [Working](./working.md)',
		]);
		expect(into_more).toBe(false);
	});

	it('puts it first when it sorts before everything', () => {
		const { text } = with_line_added(one_run, '- [Aardvark](./aardvark.md)');
		const lines = text.split('\n').filter((l) => l.startsWith('- ['));
		expect(lines[0]).toBe('- [Aardvark](./aardvark.md)');
	});

	it('puts it last when it sorts after everything', () => {
		const { text } = with_line_added(one_run, '- [Zebra](./zebra.md)');
		const lines = text.split('\n').filter((l) => l.startsWith('- ['));
		expect(lines[lines.length - 1]).toBe('- [Zebra](./zebra.md)');
	});

	it('leaves every other line of the file exactly as it was', () => {
		const { text } = with_line_added(one_run, '- [Gates](./gates.md)');
		expect(text.startsWith('# Pre Flight\n\n## Contents\n')).toBe(true);
		expect(text.endsWith('\n')).toBe(true);
	});

	it('makes a More run at the end when there is more than one run', () => {
		const { text, into_more } = with_line_added(two_runs, '- [Titles](./titles.md)');
		expect(into_more).toBe(true);
		expect(text).toContain('## More');
		expect(text.trimEnd().endsWith('- [Titles](./titles.md)')).toBe(true);
		// the runs that were there are untouched
		expect(text).toContain('- [Buttons](./buttons.md) - Button components');
		expect(text).toContain('- [UX Manager](../core/ux.md) - Overall coordination');
	});

	it('uses a More run that is already there, in alphabetical place', () => {
		const already = `${two_runs}\n## More\n\n- [Aaa](./aaa.md)\n- [Zzz](./zzz.md)\n`;
		const { text, into_more } = with_line_added(already, '- [Mmm](./mmm.md)');
		expect(into_more).toBe(true);
		expect(text).not.toContain('## More\n\n## More');
		const after_more = text.slice(text.indexOf('## More'));
		const lines = after_more.split('\n').filter((l) => l.startsWith('- ['));
		expect(lines).toEqual(['- [Aaa](./aaa.md)', '- [Mmm](./mmm.md)', '- [Zzz](./zzz.md)']);
	});

	it('puts a line into a file that has no links at all', () => {
		const bare = '# Empty\n\nnothing here yet\n';
		const { text, into_more } = with_line_added(bare, '- [First](./first.md)');
		expect(into_more).toBe(false);
		expect(text).toContain('- [First](./first.md)');
		expect(text.startsWith('# Empty')).toBe(true);
	});
});

describe('naming a file from inside a folder', () => {
	it('names one sitting right there', () => {
		expect(relative_address('notes/guides/setup', 'notes/guides/setup/access.md')).toBe('./access.md');
	});

	it('names one further down', () => {
		expect(relative_address('di/notes/guides/architecture', 'di/notes/guides/architecture/core/units.md')).toBe('./core/units.md');
	});

	it('climbs to name one in a folder alongside', () => {
		expect(relative_address('ws/notes/guides/architecture/ux', 'ws/notes/guides/architecture/core/ux.md')).toBe('../core/ux.md');
	});

	it('climbs as far as it must', () => {
		expect(relative_address('di/notes/guides/architecture/graph', 'notes/guides/setup/access.md'))
			.toBe('../../../../../notes/guides/setup/access.md');
	});

	it('spells out a space', () => {
		expect(relative_address('notes/guides/setup', 'notes/guides/setup/add a guide.md')).toBe('./add%20a%20guide.md');
	});
});

describe('a whole index for a folder that had none', () => {
	it('names the folder and links every file beside it, in order', () => {
		expect(fresh_index('pre-flight', ['working.md', 'always.md', 'adding a guide.md'])).toBe([
			'# Pre-flight',
			'',
			'## Contents',
			'',
			'- [Adding a guide](./adding%20a%20guide.md)',
			'- [Always](./always.md)',
			'- [Working](./working.md)',
			'',
		].join('\n'));
	});

	it('makes one even for a folder holding nothing', () => {
		expect(fresh_index('empty', [])).toBe('# Empty\n\n## Contents\n');
	});
});

describe('putting a whole index right', () => {
	const beside = ['always.md', 'working.md'];

	it('leaves a good index exactly as it was', () => {
		const good = '# X\n\n## Contents\n\n- [Always](./always.md)\n- [Working](./working.md)\n';
		const out = repaired_index(good, beside, new Map());
		expect(out.text).toBe(good);
		expect(out.rewritten).toEqual([]);
		expect(out.removed).toEqual([]);
		expect(out.added).toEqual([]);
	});

	it('rewrites the address of a line naming a file that lives elsewhere, keeping its words', () => {
		const text = '# X\n\n- [Algebra](./algebra.md) — constraints\n';
		const out = repaired_index(text, [], new Map([['algebra.md', './core/algebra.md']]));
		expect(out.text).toContain('- [Algebra](./core/algebra.md) — constraints');
		expect(out.rewritten).toEqual(['algebra.md']);
		expect(out.removed).toEqual([]);
	});

	it('takes out a line naming a file that is nowhere', () => {
		const text = '# X\n\n- [Always](./always.md)\n- [Gone](./gone.md) — was here once\n- [Working](./working.md)\n';
		const out = repaired_index(text, beside, new Map());
		expect(out.text).not.toContain('gone.md');
		expect(out.removed).toEqual(['- [Gone](./gone.md) — was here once']);
		expect(out.text).toContain('- [Always](./always.md)');
	});

	it('adds a file beside it that no line names', () => {
		const text = '# X\n\n## Contents\n\n- [Always](./always.md)\n';
		const out = repaired_index(text, beside, new Map());
		expect(out.added).toEqual(['working.md']);
		expect(out.text).toContain('- [Working](./working.md)');
	});

	it('puts an addition under More when the index lists files in more than one place', () => {
		const text = '# X\n\n## One\n\n- [Always](./always.md)\n\n## Two\n\n- [Other](../other/other.md)\n';
		const out = repaired_index(text, beside, new Map([['other.md', '../other/other.md']]));
		expect(out.added).toEqual(['working.md']);
		expect(out.text).toContain('## More');
		expect(out.text.trimEnd().endsWith('- [Working](./working.md)')).toBe(true);
	});

	it('leaves headings, prose, folder links and web links alone', () => {
		const text = [
			'# X',
			'',
			'Some words about this folder.',
			'',
			'- [Core](./core/) — a folder, not a file',
			'- [Somewhere](https://example.com) — the web',
			'- [Always](./always.md)',
			'- [Working](./working.md)',
			'',
		].join('\n');
		const out = repaired_index(text, beside, new Map());
		expect(out.text).toBe(text);
		expect(out.removed).toEqual([]);
	});
});
