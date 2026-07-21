import { preferences, T_Preference } from '../managers/Preferences';
import { stale_writable, make_stale } from '../common/Dirty';
import { parseToRgba, transparentize } from 'color2k';
import { get } from 'svelte/store';

// ─── Color source of truth ────────────────────────────────────────────────────
//
// Colors owns two tiers of color:
//
//   Static properties  — fixed design values (the ink black, gray, white).
//                        Read directly where a JS color value is needed.
//
//   Reactive stores    — user-editable / theme-derived values -> accent, its
//                        derived background, hover, and text. Watched in
//                        App.svelte via $effect; each change calls
//                        root.setProperty('--accent', …) so components only
//                        ever see CSS vars, never JS values.
//
// Rule: components must not import `colors` for CSS values — use var(--x).
//       Valid JS consumers: App.svelte (injection) and canvas drawing code
//       (CanvasRenderingContext2D cannot use CSS vars).
//
// ─────────────────────────────────────────────────────────────────────────────

export class Colors {
	gray			  = '#888';
	lightgray         = '#ccc';
	banner			  = '#f8f8f8';
	black			  = '#1a1a1a';				// the one ink black — never #000
	white			  = '#ffffff';

	// Reactive colors (stores). Wrapped so every write marks the canvas out
	// of date — color changes are canvas-visible.
	w_background_color  = stale_writable<string>('rgb(135, 135, 135)');
	w_hover_color       = stale_writable<string>('rgb(220, 220, 220)');
	w_text_color	    = make_stale(preferences.persistent<string>(T_Preference.textColor, 'black'));
	w_accent_color	    = make_stale(preferences.persistent<string>(T_Preference.accentColor, 'rgb(200, 200, 200)'));

	constructor() {
		this.subscribe_to_changes();
	}

	/**
	 * Derive a darker, more vivid accent: same hue, 30% less true luminance, 30%
	 * more saturation. Used where the accent needs to read stronger than on its
	 * own background — e.g. the delete-bin outline.
	 */
	private accent_to_accentDark(accent : string) : string {
		const hsba = this.color_toHSBA(accent);
		if (!hsba) return accent;
		hsba.s = Math.min(100, hsba.s * 1.4);   // 30% more saturated
		const saturated = this.color_toRGBA(this.RGBA_toHex(this.HSBA_toRGBA(hsba)));
		if (!saturated) return accent;
		const target = this.luminance_ofColor(accent) * 0.6;   // 30% less luminous
		return this.set_darkness_toRGBA(saturated, 1 - target);
	}

	/**
	 * Derive background from accent: same hue, much less saturation, lighter.
	 */
	private accent_to_background(accent : string) : string {
		const hsba = this.color_toHSBA(accent);
		if (!hsba) return '#F9E4BE';
		hsba.s = hsba.s * 0.1;   // much less saturation
		hsba.b = Math.min(95, hsba.b * 1.3 + 20);  // push toward bright
		const rgba = this.HSBA_toRGBA(hsba);
		return this.RGBA_toHex(rgba);
	}

	/**
	 * Subscribe to store changes and persist them
	 */
	private subscribe_to_changes() : void {
		this.w_text_color.subscribe((color : string) => {
			preferences.write(T_Preference.textColor, color);
		});

		this.w_accent_color.subscribe((color : string) => {
			preferences.write(T_Preference.accentColor, color);
			const bg = this.accent_to_background(color);
			this.w_background_color.set(bg);
			this.banner = this.ofBannerFor(bg);
			// Hover color: a lighter version of the accent (ratio 2 yields
			// roughly halfway between accent and white). The pitch-black
			// guardrail catches the case where lighterBy returns the literal
			// string 'null' for a zero-luminance input.
			const hover = this.lighterBy(color, 2);
			this.w_hover_color.set((hover === 'null' || !hover) ? 'rgb(220, 220, 220)' : hover);

			// Text flips to white on a dark background so it stays readable. There
			// are two backgrounds: the content region sits on --bg, the details
			// region sits on the accent itself, so each gets its own text color.
			// Threshold 0.5 is the readable midpoint (0 = black … 1 = white).
			const accent_lume = this.luminance_ofColor(color);
			const bg_lume = this.luminance_ofColor(bg);
			const text_on_bg = bg_lume < 0.5 ? 'white' : 'black';
			const text_on_accent = accent_lume < 0.3 ? 'white' : 'black';
			this.w_text_color.set(text_on_bg);
			if (typeof document !== 'undefined') {
				document.documentElement.style.setProperty('--text-on-accent', text_on_accent);
				document.documentElement.style.setProperty('--accent-dark', this.accent_to_accentDark(color));
			}
		});
	}

	ofBackgroundFor(color : string) : string { return this.lighterBy(color, 10); }
	ofBannerFor(background : string) : string { return this.blend('white', background, 4); }
	opacitize(color : string, amount : number) : string { return color == '' ? '' : transparentize(color, 1 - amount); }
	background_special_blend(color : string, opacity : number) : string { return this.special_blend(color, get(this.w_background_color), opacity) ?? color; }

	blend(color : string, background : string, saturation : number = 7) : string {
		let blended : string | null = 'lightgray';
		if (!this.colors_areIdentical(background, get(this.w_background_color))) {
			if (this.isGray(background)) {
				blended = this.darkerBy(background, 1 / saturation);
			} else {
				blended = this.multiply_saturationOf_by(background, saturation);
			}
		}
		if (!!blended) {
			color = blended;
		}
		return color;
	}

	special_blend(color : string, background : string, ratio : number) : string | null {
		const rgbaA = this.color_toRGBA(color);
		const rgbaB = this.color_toRGBA(background);
		if (!rgbaA || !rgbaB) return null;
		const alpha = rgbaA.a * ratio;
		const r     = Math.round((rgbaA.r * alpha) + (rgbaB.r * (1 - alpha)));
		const g     = Math.round((rgbaA.g * alpha) + (rgbaB.g * (1 - alpha)));
		const b     = Math.round((rgbaA.b * alpha) + (rgbaB.b * (1 - alpha)));
		const blendedHex = this.RGBA_toHex(new RGBA(r, g, b, 1));
		return this.multiply_saturationOf_by(blendedHex, 1 + ratio);
	}

	color_test(color : string | undefined) : string {
		if (!!color) {
			const parts = color.split(',');				// 'red:0.7,green:0,blue:0,alpha:1'
			const rgba  = new RGBA();
			for (const part of parts) {
				const [key, value] = part.split(':');
				const numValue     = parseFloat(value);
				switch (key) {
					case 'red':   rgba.r = Math.round(numValue * 255); break;
					case 'blue':  rgba.b = Math.round(numValue * 255); break;
					case 'green': rgba.g = Math.round(numValue * 255); break;
					case 'alpha': rgba.a = numValue;                   break;
				}
			}
			return this.RGBA_toHex(rgba);
		}
		return this.black;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// SATURATION
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Multiplies the saturation of a color by the given ratio.
	 */
	private multiply_saturationOf_by(color : string, ratio : number) : string {
		const hsba = this.color_toHSBA(color);
		if (!!hsba) {
			hsba.s     = Math.min(255, hsba.s * ratio);
			const rgba = this.HSBA_toRGBA(hsba);
			return this.RGBA_toHex(rgba);
		}
		return color;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// LUMINANCE
	// ═══════════════════════════════════════════════════════════════════════════

	darkerBy(color : string, ratio : number) : string {
		return this.adjust_luminance_byApplying(color, (lume => {
			return (1 - lume) * (1 + ratio);
		}));
	}

	lighterBy(color : string, ratio : number) : string {
		return this.adjust_luminance_byApplying(color, (lume => {
			return Math.max(0, (1 - lume) / ratio);
		}));
	}

	clamp_luminance(color : string, min : number) : string {
		const lume = this.luminance_ofColor(color);
		if (lume >= min) return color;
		if (lume === 0) {
			const gray = Math.round(Math.pow(min, 1 / 2.4) * 1.055 * 255 - 0.055 * 255);
			const g = Math.max(0, Math.min(255, gray));
			return this.RGBA_toHex(new RGBA(g, g, g, 1));
		}
		const target_darkness = 1 - min;
		const rgba = this.color_toRGBA(color);
		if (!!rgba) {
			return this.set_darkness_toRGBA(rgba, target_darkness);
		}
		return color;
	}

	luminance_driven_desaturation(color : string) : string {
		const lume = this.luminance_ofColor(color);
		if (lume > 0.5) {
			color = this.blend(color, 'black') ?? color;
		} else {
			color = this.blend(color, color) ?? color;
		}
		return color;
	}

	luminance_ofColor(color : string) : number {
		const rgba = this.color_toRGBA(color);
		if (!!rgba) {
			return this.luminance_ofRGBA(rgba);
		}
		return 0;
	}

	private luminance_ofRGBA(rgba : RGBA) : number {
		if (!!rgba) {
			const linearize = (c : number) => {
				const s = c / 255;
				return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
			};
			const R        = linearize(rgba.r);
			const G        = linearize(rgba.g);
			const B        = linearize(rgba.b);
			const relative = 0.2126 * R + 0.7152 * G + 0.0722 * B;
			return rgba.a * relative + (1 - rgba.a) * 1;
		}
		return 0;
	}

	private adjust_luminance_byApplying(color : string, closure : (lume : number) => number) : string {
		let result = 'null';
		const rgba = this.color_toRGBA(color);
		if (!!rgba) {
			const lume = this.luminance_ofRGBA(rgba);
			if (!!lume) {
				const dark     = closure(lume);
				const adjusted = this.set_darkness_toRGBA(rgba, dark);
				result = adjusted ?? result;
			}
		}
		return result;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// DARKNESS
	// ═══════════════════════════════════════════════════════════════════════════

	private set_darkness_toRGBA(rgba : RGBA, darkness : number) : string {
		const adjusted = this.adjust_RGBA_forDarkness(rgba, darkness);
		const rgba_new = adjusted.result;
		if (!adjusted.error && !!rgba_new) {
			return this.RGBA_toHex(rgba_new);
		}
		return this.RGBA_toHex(rgba);
	}

	private adjust_RGBA_forDarkness(rgba : RGBA, targetDarkness : number) : { result : RGBA | null; error : Error | null } {
		const r = rgba.r;
		const g = rgba.g;
		const b = rgba.b;
		const a = rgba.a;

		if (a == 0) {
			if (targetDarkness != 0) {
				return { result: rgba, error: new Error('With zero alpha, only target darkness 0 is possible.') };
			}
		}
		if (targetDarkness > a) {
			return { result: rgba, error: new Error('Target darkness must be <= alpha.') };
		}

		const srgbToLinear = (c : number) : number => {
			const s = c / 255;
			return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
		};
		const linearToSrgb = (c : number) : number => {
			return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
		};

		const R_lin = srgbToLinear(r);
		const G_lin = srgbToLinear(g);
		const B_lin = srgbToLinear(b);
		const Y     = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin;

		if (Y == 0) {
			if (targetDarkness != 1) {
				return { result: null, error: new Error('Cannot adjust a black color to be lighter while preserving hue.') };
			}
			return { result: rgba, error: null };
		}

		const Y_new = (a - targetDarkness) / a;
		if (Y_new < 0 || Y_new > 1) {
			return { result: null, error: new Error('Computed target luminance out of range.') };
		}

		const k         = Y_new / Y;
		const R_new_lin = Math.min(R_lin * k, 1);
		const G_new_lin = Math.min(G_lin * k, 1);
		const B_new_lin = Math.min(B_lin * k, 1);
		const R_new     = Math.round(linearToSrgb(R_new_lin) * 255);
		const G_new     = Math.round(linearToSrgb(G_new_lin) * 255);
		const B_new     = Math.round(linearToSrgb(B_new_lin) * 255);

		return { result: new RGBA(R_new, G_new, B_new, a), error: null };
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// CONVERSIONS
	// ═══════════════════════════════════════════════════════════════════════════

	private colors_areIdentical(a : string, b : string) : boolean {
		const aHex = this.color_toHex(a);
		const bHex = this.color_toHex(b);
		if (!!aHex && !!bHex) {
			return aHex == bHex;
		}
		return false;
	}

	private color_toHex(color : string) : string {
		const rgba = this.color_toRGBA(color);
		if (!!rgba) {
			return this.RGBA_toHex(rgba);
		}
		return color;
	}

	private color_toHSBA(color : string) : HSBA | null {
		const rgba = this.color_toRGBA(color);
		if (!!rgba) {
			return this.RBGA_toHSBA(rgba);
		}
		return null;
	}

	private color_toRGBA(color : string) : RGBA | null {
		try {
			const [r, g, b, a] = parseToRgba(color);
			return new RGBA(r, g, b, a);
		} catch {
			return null;
		}
	}

	private isGray(color : string) : boolean {
		const rgba = this.color_toRGBA(color);
		if (!!rgba) {
			return rgba.r == rgba.g && rgba.g == rgba.b;
		}
		return false;
	}

	private RGBA_toHex(rgba : RGBA, omitAlpha : boolean = true) : string {
		const r    = Math.min(255, Math.max(0, rgba.r));
		const g    = Math.min(255, Math.max(0, rgba.g));
		const b    = Math.min(255, Math.max(0, rgba.b));
		const a    = Math.min(1, Math.max(0, rgba.a));
		const rHex = r.toString(16).padStart(2, '0');
		const gHex = g.toString(16).padStart(2, '0');
		const bHex = b.toString(16).padStart(2, '0');
		const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
		const withoutAlpha = `#${rHex}${gHex}${bHex}`;
		if (omitAlpha) {
			return withoutAlpha;
		} else {
			return `${withoutAlpha}${aHex}`;
		}
	}

	private HSBA_toRGBA(hsba : HSBA) : RGBA {
		const h = hsba.h;
		const s = hsba.s / 100;
		const b = hsba.b / 100;
		const a = hsba.a;
		const c = b * s;
		const x = c * (1 - Math.abs((h / 60) % 2 - 1));
		const m = b - c;
		let r = 0, g = 0, b2 = 0;

		if (h >= 0 && h < 60)         { r = c; g = x; b2 = 0; }
		else if (h >= 60 && h < 120)  { r = x; g = c; b2 = 0; }
		else if (h >= 120 && h < 180) { r = 0; g = c; b2 = x; }
		else if (h >= 180 && h < 240) { r = 0; g = x; b2 = c; }
		else if (h >= 240 && h < 300) { r = x; g = 0; b2 = c; }
		else if (h >= 300 && h < 360) { r = c; g = 0; b2 = x; }

		r  = Math.round((r + m) * 255);
		g  = Math.round((g + m) * 255);
		b2 = Math.round((b2 + m) * 255);
		return new RGBA(r, g, b2, a);
	}

	private RBGA_toHSBA(rgba : RGBA) : HSBA {
		const r     = rgba.r / 255;
		const g     = rgba.g / 255;
		const b     = rgba.b / 255;
		const max   = Math.max(r, g, b);
		const min   = Math.min(r, g, b);
		const delta = max - min;
		let h = 0;

		if (delta != 0) {
			if (max == r)      { h = (g - b) / delta; }
			else if (max == g) { h = (b - r) / delta + 2; }
			else               { h = (r - g) / delta + 4; }
			h = (h * 60 + 360) % 360;
		}

		const s      = max == 0 ? 0 : (delta / max) * 100;
		const bValue = max * 100;
		return new HSBA(h, s, bValue, rgba.a);
	}
}

class RGBA {
	r : number;
	g : number;
	b : number;
	a : number;

	constructor(r : number = 0, g : number = 0, b : number = 0, a : number = 0) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}
}

class HSBA {
	h : number;
	s : number;
	b : number;
	a : number;

	constructor(h : number = 0, s : number = 0, b : number = 0, a : number = 0) {
		this.h = h;
		this.s = s;
		this.b = b;
		this.a = a;
	}
}

export const colors = new Colors();
