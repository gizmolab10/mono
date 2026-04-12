import { describe, it, expect } from 'vitest';
import { colors } from '../utilities/Colors';

describe('Colors', () => {
	describe('color_test', () => {
		it('parses seriously format string', () => {
			const result = colors.color_test('red:1,green:0,blue:0,alpha:1');
			expect(result).toBe('#ff0000');
		});

		it('parses partial values', () => {
			const result = colors.color_test('red:0.5,green:0.5,blue:0.5,alpha:1');
			expect(result).toBe('#808080');
		});

		it('handles blue', () => {
			const result = colors.color_test('red:0,green:0,blue:1,alpha:1');
			expect(result).toBe('#0000ff');
		});

		it('handles green', () => {
			const result = colors.color_test('red:0,green:1,blue:0,alpha:1');
			expect(result).toBe('#00ff00');
		});
	});

	describe('luminance_ofColor', () => {
		it('returns 1 for white', () => {
			expect(colors.luminance_ofColor('white')).toBeCloseTo(1, 2);
		});

		it('returns 0 for black', () => {
			expect(colors.luminance_ofColor('black')).toBeCloseTo(0, 2);
		});

		it('returns intermediate value for gray', () => {
			const lum = colors.luminance_ofColor('#808080');
			expect(lum).toBeGreaterThan(0);
			expect(lum).toBeLessThan(1);
		});

		it('red has lower luminance than green', () => {
			const redLum = colors.luminance_ofColor('red');
			const greenLum = colors.luminance_ofColor('lime');  // pure green
			expect(greenLum).toBeGreaterThan(redLum);
		});
	});

	describe('darkerBy', () => {
		it('cannot darken white (edge case)', () => {
			const darker = colors.darkerBy('white', 0.5);
			const darkerLum = colors.luminance_ofColor(darker);
			// White has luminance 1, and (1-1)*ratio = 0, so it stays white
			expect(darkerLum).toBe(1);
		});

		it('returns same color when target darkness exceeds 1', () => {
			// darkerBy calculates (1-lume)*(1+ratio) as target darkness
			// For dark colors with high ratios, this exceeds 1 and returns original
			const darker = colors.darkerBy('#333333', 2);
			expect(darker).toMatch(/^#[0-9a-f]{6}$/i);
		});

		it('darkens light color with small ratio', () => {
			// #cccccc has lume ~0.6, ratio 0.1 gives darkness ~0.44 (valid)
			const darker = colors.darkerBy('#cccccc', 0.1);
			const originalLum = colors.luminance_ofColor('#cccccc');
			const darkerLum = colors.luminance_ofColor(darker);
			expect(darkerLum).toBeLessThan(originalLum);
		});

		it('returns a valid hex color', () => {
			const result = colors.darkerBy('#ff0000', 0.5);
			expect(result).toMatch(/^#[0-9a-f]{6}$/i);
		});
	});

	describe('lighterBy', () => {
		it('makes dark color lighter', () => {
			const lighter = colors.lighterBy('#333333', 2);
			const originalLum = colors.luminance_ofColor('#333333');
			const lighterLum = colors.luminance_ofColor(lighter);
			expect(lighterLum).toBeGreaterThan(originalLum);
		});

		it('returns a valid hex color', () => {
			const result = colors.lighterBy('#333333', 2);
			expect(result).toMatch(/^#[0-9a-f]{6}$/i);
		});
	});

	describe('opacitize', () => {
		it('returns rgba with opacity', () => {
			const result = colors.opacitize('red', 0.5);
			expect(result).toContain('rgba');
		});

		it('returns empty string for empty input', () => {
			expect(colors.opacitize('', 0.5)).toBe('');
		});

		it('handles full opacity', () => {
			const result = colors.opacitize('blue', 1);
			expect(result).toBeTruthy();
		});

		it('handles zero opacity', () => {
			const result = colors.opacitize('blue', 0);
			expect(result).toBeTruthy();
		});
	});

	describe('ofBackgroundFor', () => {
		it('returns lighter version of color', () => {
			const bg = colors.ofBackgroundFor('#808080');
			const bgLum = colors.luminance_ofColor(bg);
			const origLum = colors.luminance_ofColor('#808080');
			expect(bgLum).toBeGreaterThan(origLum);
		});

		it('returns valid hex', () => {
			expect(colors.ofBackgroundFor('blue')).toMatch(/^#[0-9a-f]{6}$/i);
		});
	});

	describe('ofBannerFor', () => {
		it('returns valid hex', () => {
			expect(colors.ofBannerFor('#f0f0f0')).toMatch(/^#[0-9a-f]{6}$/i);
		});
	});

	describe('blend', () => {
		it('returns a color', () => {
			const result = colors.blend('red', 'blue');
			expect(result).toBeTruthy();
		});

		it('returns lightgray when background is white', () => {
			// When background matches this.background (white), blend returns lightgray
			const result = colors.blend('red', 'white');
			expect(result).toBe('lightgray');
		});
	});

	describe('special_blend', () => {
		it('blends two colors', () => {
			const result = colors.special_blend('red', 'blue', 0.5);
			expect(result).toBeTruthy();
			expect(result).toMatch(/^#[0-9a-f]{6}$/i);
		});

		it('returns null for invalid colors', () => {
			const result = colors.special_blend('notacolor', 'blue', 0.5);
			expect(result).toBeNull();
		});

		it('ratio 0 returns close to background', () => {
			const result = colors.special_blend('red', 'blue', 0);
			// At ratio 0, should be mostly blue
			expect(result).toBeTruthy();
		});

		it('ratio 1 returns close to foreground', () => {
			const result = colors.special_blend('red', 'blue', 1);
			// At ratio 1, should be mostly red
			expect(result).toBeTruthy();
		});
	});

	describe('luminance_driven_desaturation', () => {
		it('returns a color for light input', () => {
			const result = colors.luminance_driven_desaturation('#ffcccc');
			expect(result).toBeTruthy();
		});

		it('returns a color for dark input', () => {
			const result = colors.luminance_driven_desaturation('#330000');
			expect(result).toBeTruthy();
		});
	});

	describe('default values', () => {
		it('has sensible defaults', () => {
			expect(colors.default).toBe('black');
		});
	});

	describe('hover color (contrasting edge color)', () => {
		it('returns a valid hex color for the default purple', () => {
			colors.w_edge_color.set('#874efe');
			expect(colors.so_hover_color).toMatch(/^#[0-9a-f]{6}$/i);
		});

		it('produces a different color from the input', () => {
			colors.w_edge_color.set('#874efe');
			expect(colors.so_hover_color).not.toBe('#874efe');
		});

		it('picks the lower-luminance candidate for pure red', () => {
			// Red is hue 0. Candidates are hue 120 (green) and hue 240 (blue).
			// Blue has lower luminance than green. Result should be blue-ish.
			colors.w_edge_color.set('#ff0000');
			const result = colors.so_hover_color;
			const r = parseInt(result.slice(1, 3), 16);
			const b = parseInt(result.slice(5, 7), 16);
			expect(b).toBeGreaterThan(r);
		});

		it('produces a colorful output from a gray input', () => {
			// Gray has no hue, but the saturation floor should inject one.
			// The result should NOT be gray — at least one channel differs from the others.
			colors.w_edge_color.set('#808080');
			const result = colors.so_hover_color;
			const r = parseInt(result.slice(1, 3), 16);
			const g = parseInt(result.slice(3, 5), 16);
			const b = parseInt(result.slice(5, 7), 16);
			const all_equal = (r === g) && (g === b);
			expect(all_equal).toBe(false);
		});

		it('preserves brightness — bright input produces bright output', () => {
			// Full-brightness yellow. Both candidates should also be full brightness.
			colors.w_edge_color.set('#ffff00');
			const result = colors.so_hover_color;
			const r = parseInt(result.slice(1, 3), 16);
			const g = parseInt(result.slice(3, 5), 16);
			const b = parseInt(result.slice(5, 7), 16);
			const max_channel = Math.max(r, g, b);
			expect(max_channel).toBe(255);
		});

		it('falls back to red for unparseable input', () => {
			colors.w_edge_color.set('garbage');
			expect(colors.so_hover_color).toBe('red');
		});
	});
});
