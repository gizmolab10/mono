import { is_drawing, with_view_box } from '../utilities/Drawings';
import { describe, expect, it } from 'vitest';

// A drawing, ai's since 18 September 2026: an svg file shown as the picture it is, fitted to the
// width of the view.

describe('knowing a drawing', () => {
	it('is any file whose name ends in svg, either case', () => {
		expect(is_drawing('cadence.svg')).toBe(true);
		expect(is_drawing('APP.SVG')).toBe(true);
		expect(is_drawing('cadence.md')).toBe(false);
		expect(is_drawing('svg')).toBe(false);
	});
});

describe('fitting a drawing to the view', () => {
	it('keeps a viewBox the svg already has', () => {
		const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="5" viewBox="0 0 10 5"><rect/></svg>';
		expect(with_view_box(svg)).toBe(svg);
	});

	it('makes a viewBox from the width and the height when there is none', () => {
		const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="680" height="600"><rect/></svg>';
		expect(with_view_box(svg)).toBe('<svg viewBox="0 0 680 600" xmlns="http://www.w3.org/2000/svg" width="680" height="600"><rect/></svg>');
	});

	it('reads a width written with units or without quotes', () => {
		expect(with_view_box('<svg width="12.5px" height=\'4\'><g/></svg>')).toBe('<svg viewBox="0 0 12.5 4" width="12.5px" height=\'4\'><g/></svg>');
	});

	it('leaves an svg alone that names neither its width nor its height', () => {
		const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
		expect(with_view_box(svg)).toBe(svg);
		expect(with_view_box('<svg width="3"><rect/></svg>')).toBe('<svg width="3"><rect/></svg>');
	});

	it('leaves text that is not an svg alone', () => {
		expect(with_view_box('# a heading\n\nwords.')).toBe('# a heading\n\nwords.');
	});
});
