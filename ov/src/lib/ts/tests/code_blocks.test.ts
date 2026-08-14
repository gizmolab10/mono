import { numbers_out_of_code, page_of, stamp_blocks } from '../utilities/Markdown_Blocks';
import { describe, expect, it } from 'vitest';
import MarkdownIt from 'markdown-it';

// A fenced chunk of code has to be one piece like any other: the lines it came from belong on
// the box around it, so a click anywhere in it opens the whole fence — both fence lines and all.

const reader = new MarkdownIt({ html: false });

describe('a chunk of code is one piece', () => {
	const drawn = stamp_blocks(reader, 'words\n\n```js\nlet a = 1;\n```\n', 0);

	it('carries its lines on the box, not on the words inside', () => {
		expect(drawn).toContain('<pre data-number="3" data-from="2" data-to="5" data-depth="2">');
		expect(drawn).not.toContain('<code data-from');
	});

	it('keeps what the reader said the code is written in', () => {
		expect(drawn).toContain('class="language-js"');
	});

	it('claims the fence lines as well as the code between them', () => {
		const lines = 'words\n\n```js\nlet a = 1;\n```\n'.split('\n');
		expect(lines[2]).toBe('```js');
		expect(lines[4]).toBe('```');
	});

	it('leaves a plain paragraph exactly as it was', () => {
		expect(numbers_out_of_code('<p data-from="0" data-to="1">words</p>')).toBe('<p data-from="0" data-to="1">words</p>');
	});

	it('does the same on a whole drawn guide', () => {
		const file = ['---', 'kind: rule', '---', '', '# a title', '', '```', 'code', '```'].join('\n');
		expect(page_of(reader, file)).toContain('<pre data-number="7" data-from="6" data-to="9" data-depth="2">');
	});
});
