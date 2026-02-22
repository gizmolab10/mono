// ————————————————————————————————————————— Types

class RGBA {
	r: number;
	g: number;
	b: number;
	a: number;
	constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 1) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}
}

class HSBA {
	h: number;
	s: number;
	b: number;
	a: number;
	constructor(h: number = 0, s: number = 0, b: number = 0, a: number = 1) {
		this.h = h;
		this.s = s;
		this.b = b;
		this.a = a;
	}
}

// ————————————————————————————————————————— Parsing (replaces color2k)

const named_colors: Record<string, string> = {
	black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000',
	blue: '#0000ff', yellow: '#ffff00', cyan: '#00ffff', magenta: '#ff00ff',
	gray: '#808080', grey: '#808080', darkgray: '#a9a9a9', darkgrey: '#a9a9a9',
	lightgray: '#d3d3d3', lightgrey: '#d3d3d3', orange: '#ffa500', purple: '#800080',
};

function parse_toRGBA(color: string): RGBA | null {
	if (!color) return null;
	const trimmed = color.trim().toLowerCase();

	// named color
	const named = named_colors[trimmed];
	if (named) return parse_toRGBA(named);

	// hex: #rgb, #rgba, #rrggbb, #rrggbbaa
	if (trimmed.startsWith('#')) {
		const hex = trimmed.slice(1);
		if (hex.length === 3 || hex.length === 4) {
			const r = parseInt(hex[0] + hex[0], 16);
			const g = parseInt(hex[1] + hex[1], 16);
			const b = parseInt(hex[2] + hex[2], 16);
			const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
			return new RGBA(r, g, b, a);
		}
		if (hex.length === 6 || hex.length === 8) {
			const r = parseInt(hex.slice(0, 2), 16);
			const g = parseInt(hex.slice(2, 4), 16);
			const b = parseInt(hex.slice(4, 6), 16);
			const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
			return new RGBA(r, g, b, a);
		}
	}

	// rgb(r, g, b) or rgba(r, g, b, a)
	const rgb_match = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
	if (rgb_match) {
		return new RGBA(
			parseInt(rgb_match[1]),
			parseInt(rgb_match[2]),
			parseInt(rgb_match[3]),
			rgb_match[4] !== undefined ? parseFloat(rgb_match[4]) : 1,
		);
	}

	return null;
}

// ————————————————————————————————————————— Conversions

function RGBA_toHex(rgba: RGBA, omitAlpha: boolean = true): string {
	const r = Math.min(255, Math.max(0, rgba.r));
	const g = Math.min(255, Math.max(0, rgba.g));
	const b = Math.min(255, Math.max(0, rgba.b));
	const a = Math.min(1, Math.max(0, rgba.a));
	const rHex = r.toString(16).padStart(2, '0');
	const gHex = g.toString(16).padStart(2, '0');
	const bHex = b.toString(16).padStart(2, '0');
	const hex  = `#${rHex}${gHex}${bHex}`;
	if (omitAlpha) return hex;
	const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
	return `${hex}${aHex}`;
}

function RGBA_toHSBA(rgba: RGBA): HSBA {
	const r     = rgba.r / 255;
	const g     = rgba.g / 255;
	const b     = rgba.b / 255;
	const max   = Math.max(r, g, b);
	const min   = Math.min(r, g, b);
	const delta = max - min;
	let h = 0;
	if (delta !== 0) {
		if (max === r)      h = (g - b) / delta;
		else if (max === g) h = (b - r) / delta + 2;
		else                h = (r - g) / delta + 4;
		h = (h * 60 + 360) % 360;
	}
	const s = max === 0 ? 0 : (delta / max) * 100;
	const bValue = max * 100;
	return new HSBA(h, s, bValue, rgba.a);
}

function HSBA_toRGBA(hsba: HSBA): RGBA {
	const h  = hsba.h;
	const s  = hsba.s / 100;
	const bv = hsba.b / 100;
	const c  = bv * s;
	const x  = c * (1 - Math.abs((h / 60) % 2 - 1));
	const m  = bv - c;
	let r = 0, g = 0, b = 0;
	if      (h < 60)  { r = c; g = x; }
	else if (h < 120) { r = x; g = c; }
	else if (h < 180) { g = c; b = x; }
	else if (h < 240) { g = x; b = c; }
	else if (h < 300) { r = x; b = c; }
	else              { r = c; b = x; }
	return new RGBA(
		Math.round((r + m) * 255),
		Math.round((g + m) * 255),
		Math.round((b + m) * 255),
		hsba.a,
	);
}

// ————————————————————————————————————————— Luminance (WCAG)

function linearize(channel: number): number {
	const s = channel / 255;
	return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function delinearize(linear: number): number {
	return linear <= 0.0031308 ? linear * 12.92 : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
}

function luminance_ofRGBA(rgba: RGBA): number {
	const R = linearize(rgba.r);
	const G = linearize(rgba.g);
	const B = linearize(rgba.b);
	const relative = 0.2126 * R + 0.7152 * G + 0.0722 * B;
	return rgba.a * relative + (1 - rgba.a) * 1;		// assume white background
}

// ————————————————————————————————————————— Darkness adjustment

function adjust_RGBA_forDarkness(rgba: RGBA, targetDarkness: number): RGBA | null {
	const { r, g, b, a } = rgba;
	if (a === 0 && targetDarkness !== 0) return null;
	if (targetDarkness > a) return null;

	const R_lin = linearize(r);
	const G_lin = linearize(g);
	const B_lin = linearize(b);
	const Y     = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin;

	if (Y === 0) return targetDarkness === 1 ? rgba : null;

	const Y_new = (a - targetDarkness) / a;
	if (Y_new < 0 || Y_new > 1) return null;

	const scale = Y_new / Y;
	return new RGBA(
		Math.round(delinearize(Math.min(R_lin * scale, 1)) * 255),
		Math.round(delinearize(Math.min(G_lin * scale, 1)) * 255),
		Math.round(delinearize(Math.min(B_lin * scale, 1)) * 255),
		a,
	);
}

// ————————————————————————————————————————— Color operations

function set_darkness(rgba: RGBA, darkness: number): string {
	const adjusted = adjust_RGBA_forDarkness(rgba, darkness);
	return RGBA_toHex(adjusted ?? rgba);
}

function adjust_luminance(color: string, closure: (lume: number) => number): string {
	const rgba = parse_toRGBA(color);
	if (!rgba) return color;
	const lume = luminance_ofRGBA(rgba);
	if (!lume) return color;
	return set_darkness(rgba, closure(lume));
}

function multiply_saturation(color: string, ratio: number): string {
	const rgba = parse_toRGBA(color);
	if (!rgba) return color;
	const hsba = RGBA_toHSBA(rgba);
	hsba.s = Math.min(100, hsba.s * ratio);
	return RGBA_toHex(HSBA_toRGBA(hsba));
}

function is_gray(color: string): boolean {
	const rgba = parse_toRGBA(color);
	return !!rgba && rgba.r === rgba.g && rgba.g === rgba.b;
}

function colors_areIdentical(a: string, b: string): boolean {
	const ra = parse_toRGBA(a);
	const rb = parse_toRGBA(b);
	return !!ra && !!rb && RGBA_toHex(ra) === RGBA_toHex(rb);
}

// ————————————————————————————————————————— S_Colors

class S_Colors {
	separator = $state('#505050');
	thing     = $state('#333333');

	get background(): string {
		return this.lighterBy(this.separator, 10);
	}

	get banner(): string {
		return this.blend('white', this.background, 4);
	}

	// ————————————————————————————————————————— Public API

	darkerBy(color: string, ratio: number): string {
		return adjust_luminance(color, lume => (1 - lume) * (1 + ratio));
	}

	lighterBy(color: string, ratio: number): string {
		return adjust_luminance(color, lume => Math.max(0, (1 - lume) / ratio));
	}

	blend(color: string, background: string, saturation: number = 7): string {
		let blended: string | null = 'lightgray';
		if (!colors_areIdentical(background, 'white')) {
			if (is_gray(background)) {
				blended = this.darkerBy(background, 1 / saturation);
			} else {
				blended = multiply_saturation(background, saturation);
			}
		}
		return blended ?? color;
	}

	special_blend(color: string, background: string, ratio: number): string | null {
		const rgbaA = parse_toRGBA(color);
		const rgbaB = parse_toRGBA(background);
		if (!rgbaA || !rgbaB) return null;
		const alpha = rgbaA.a * ratio;
		const r = Math.round((rgbaA.r * alpha) + (rgbaB.r * (1 - alpha)));
		const g = Math.round((rgbaA.g * alpha) + (rgbaB.g * (1 - alpha)));
		const b = Math.round((rgbaA.b * alpha) + (rgbaB.b * (1 - alpha)));
		const blended = RGBA_toHex(new RGBA(r, g, b, 1));
		return multiply_saturation(blended, 1 + ratio);
	}

	background_special_blend(color: string, opacity: number): string {
		return this.special_blend(color, this.background, opacity) ?? color;
	}

	luminance_ofColor(color: string): number {
		const rgba = parse_toRGBA(color);
		return rgba ? luminance_ofRGBA(rgba) : 0;
	}

	luminance_driven_desaturation(color: string): string {
		const lume = this.luminance_ofColor(color);
		return lume > 0.5
			? this.blend(color, 'black')
			: this.blend(color, color);
	}

	opacitize(color: string, amount: number): string {
		if (!color) return '';
		const rgba = parse_toRGBA(color);
		if (!rgba) return color;
		rgba.a = amount;
		return RGBA_toHex(rgba, false);
	}

	color_fromSeriously(color: string | undefined): string {
		if (!color) return 'blue';
		const rgba = new RGBA();
		for (const part of color.split(',')) {
			const [key, value] = part.split(':');
			const n = parseFloat(value);
			switch (key) {
				case 'red':   rgba.r = Math.round(n * 255); break;
				case 'green': rgba.g = Math.round(n * 255); break;
				case 'blue':  rgba.b = Math.round(n * 255); break;
				case 'alpha': rgba.a = n;                    break;
			}
		}
		return RGBA_toHex(rgba);
	}
}

export const colors = new S_Colors();
