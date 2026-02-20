import { T_Unit } from '../types/Enumerations';
import { units } from '../types/Units';

// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — TOKENIZER
// String → token stream for the recursive descent parser.
// ═══════════════════════════════════════════════════════════════════

export type Token =
	| { type: 'reference'; object: string; attribute: string }
	| { type: 'operator'; value: '+' | '-' | '*' | '/' }
	| { type: 'bare_number'; value: number; source: string }
	| { type: 'paren'; value: '(' | ')' }
	| { type: 'number'; value: number; source: string }
	| { type: 'end' };

class Tokenizer {

	// Unit suffixes sorted longest-first so "mm" matches before "m"
	private readonly unit_suffixes: { suffix: string; unit: T_Unit }[] = this.build_suffix_table();

	private build_suffix_table(): { suffix: string; unit: T_Unit }[] {
		const entries: { suffix: string; unit: T_Unit }[] = [];
		for (const unit of Object.values(T_Unit)) {
			const sym = units.symbol_for(unit).trim();
			if (sym) entries.push({ suffix: sym, unit });
		}
		// longest first — so "mm" matches before "m"
		entries.sort((a, b) => b.suffix.length - a.suffix.length);
		return entries;
	}

	tokenize(input: string): Token[] {
		const tokens: Token[] = [];
		let pos = 0;
		const src = input;

		function peek(): string { return src[pos] ?? ''; }
		function at_end(): boolean { return pos >= src.length; }

		function skip_whitespace(): void {
			while (pos < src.length && src[pos] === ' ') pos++;
		}

		function read_number(): number {
			const start = pos;
			while (pos < src.length && (src[pos] >= '0' && src[pos] <= '9')) pos++;
			if (pos < src.length && src[pos] === '.') {
				pos++;
				while (pos < src.length && (src[pos] >= '0' && src[pos] <= '9')) pos++;
			}
			return parseFloat(src.slice(start, pos));
		}

		const suffixes = this.unit_suffixes;
		function try_unit_suffix(): T_Unit | null {
			// check for ' and " first (no space before them)
			if (peek() === '"') { pos++; return T_Unit.inch; }
			if (peek() === "'") { pos++; return T_Unit.foot; }
			// other suffixes may have a space before them
			const remaining = src.slice(pos);
			for (const { suffix, unit } of suffixes) {
				if (suffix === '"' || suffix === "'") continue; // already handled
				const to_match = ' ' + suffix;
				if (remaining.startsWith(to_match)) {
					// make sure suffix isn't followed by a letter (avoid "mm" matching in "mmap")
					const after = pos + to_match.length;
					if (after < src.length && is_alpha(src[after])) continue;
					pos += to_match.length;
					return unit;
				}
			}
			return null;
		}

		function is_alpha(ch: string): boolean {
			return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
		}

		function is_alnum(ch: string): boolean {
			return is_alpha(ch) || (ch >= '0' && ch <= '9');
		}

		function read_identifier(): string {
			const start = pos;
			while (pos < src.length && is_alnum(src[pos])) pos++;
			return src.slice(start, pos);
		}

		// Try compound imperial: after reading N', look for inches part ending with "
		// Matches: 5' 3", 5' 3 1/2", 5' 1/2"
		function try_compound_feet(feet: number): number | null {
			const save = pos;
			// expect optional space then digits or fraction then "
			const remaining = src.slice(pos);
			const m = remaining.match(/^\s+(\d+(?:\s+\d+\/\d+)?|\d+\/\d+)"/);
			if (!m) return null;
			pos += m[0].length;
			const inches = units.parse_fraction(m[1]);
			if (inches === null) { pos = save; return null; }
			return units.to_mm(feet, T_Unit.foot) + units.to_mm(inches, T_Unit.inch);
		}

		// Try compound inches: after reading N (no suffix), look for space + fraction + "
		// Matches: 1 1/2" (whole + fraction inches)
		function try_compound_inches(whole: number): number | null {
			const save = pos;
			const remaining = src.slice(pos);
			const m = remaining.match(/^\s+(\d+\/\d+)"/);
			if (!m) return null;
			pos += m[0].length;
			const frac = units.parse_fraction(m[1]);
			if (frac === null) { pos = save; return null; }
			return units.to_mm(whole + frac, T_Unit.inch);
		}

		// Try bare fractional inches: N/D" (e.g. 3/4")
		// Called after reading the numerator as a bare number
		function try_fractional_inches(numerator: number): number | null {
			const save = pos;
			const remaining = src.slice(pos);
			const m = remaining.match(/^\/(\d+)"/);
			if (!m) return null;
			const denominator = parseFloat(m[1]);
			if (denominator === 0) { pos = save; return null; }
			pos += m[0].length;
			return units.to_mm(numerator / denominator, T_Unit.inch);
		}

		while (true) {
			skip_whitespace();
			if (at_end()) break;

			const ch = peek();

			// operators
			if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
				tokens.push({ type: 'operator', value: ch as '+' | '-' | '*' | '/' });
				pos++;
				continue;
			}

			// parens
			if (ch === '(' || ch === ')') {
				tokens.push({ type: 'paren', value: ch });
				pos++;
				continue;
			}

			// .x = parent reference (dot with no name = parent SO)
			// Must come before number check so ".x" isn't parsed as decimal
			if (ch === '.' && pos + 1 < src.length && is_alpha(src[pos + 1])) {
				pos++; // skip dot
				const attribute = read_identifier();
				// object '' means "parent" (resolved by Constraints.bind_refs)
				tokens.push({ type: 'reference', object: '', attribute });
				continue;
			}

			// number (possibly with unit suffix or compound imperial)
			if ((ch >= '0' && ch <= '9') || ch === '.') {
				const span_start = pos;
				const value = read_number();
				if (isNaN(value)) throw new Error(`Invalid number at position ${pos}`);
				const unit = try_unit_suffix();
				if (unit === T_Unit.foot) {
					// Try compound: N' [inches part]"
					const compound_mm = try_compound_feet(value);
					if (compound_mm !== null) {
						tokens.push({ type: 'number', value: compound_mm, source: src.slice(span_start, pos) });
					} else {
						tokens.push({ type: 'number', value: units.to_mm(value, T_Unit.foot), source: src.slice(span_start, pos) });
					}
				} else if (unit) {
					tokens.push({ type: 'number', value: units.to_mm(value, unit), source: src.slice(span_start, pos) });
				} else {
					// No unit — try compound inches: N N/D" (e.g. "1 1/2")
					const compound_mm = try_compound_inches(value);
					if (compound_mm !== null) {
						tokens.push({ type: 'number', value: compound_mm, source: src.slice(span_start, pos) });
					} else {
						// Try bare fractional inches: N/D" (e.g. "3/4")
						const frac_mm = try_fractional_inches(value);
						if (frac_mm !== null) {
							tokens.push({ type: 'number', value: frac_mm, source: src.slice(span_start, pos) });
						} else {
							tokens.push({ type: 'bare_number', value, source: src.slice(span_start, pos) });
						}
					}
				}
				continue;
			}

			// reference: A.x (explicit SO), bare attribute: x (self SO)
			if (is_alpha(ch)) {
				const name = read_identifier();
				if (peek() === '.') {
					pos++; // skip dot
					const attribute = read_identifier();
					if (!attribute) throw new Error(`Expected attribute name after '${name}.' at position ${pos}`);
					tokens.push({ type: 'reference', object: name, attribute });
				} else {
					// bare attribute — object 'self' means "this SO" (resolved by Constraints)
					tokens.push({ type: 'reference', object: 'self', attribute: name });
				}
				continue;
			}

			throw new Error(`Unexpected character '${ch}' at position ${pos}`);
		}

		tokens.push({ type: 'end' });
		return tokens;
	}

	/** Rename a reference attribute in a token array. Returns true if any token was changed. */
	rename_reference(tokens: Token[], object: string, old_attr: string, new_attr: string): boolean {
		let changed = false;
		for (const token of tokens) {
			if (token.type === 'reference' && token.object === object && token.attribute === old_attr) {
				token.attribute = new_attr;
				changed = true;
			}
		}
		return changed;
	}

	/** Reconstruct a formula string from tokens.
	 *  No spaces between tokens except compound imperial (preserved in source). */
	untokenize(tokens: Token[]): string {
		let result = '';
		for (const token of tokens) {
			switch (token.type) {
				case 'number':
					result += token.source;
					break;
				case 'bare_number':
					result += token.source;
					break;
				case 'operator':
					result += token.value;
					break;
				case 'paren':
					result += token.value;
					break;
				case 'reference':
					if (token.object === '' ) result += '.' + token.attribute;
					else if (token.object === 'self') result += token.attribute;
					else result += token.object + '.' + token.attribute;
					break;
				case 'end':
					break;
			}
		}
		return result;
	}
}

export const tokenizer = new Tokenizer();
