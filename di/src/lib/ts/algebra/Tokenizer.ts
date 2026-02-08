import { T_Unit } from '../types/Enumerations';
import { units } from '../types/Units';

// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — TOKENIZER
// String → token stream for the recursive descent parser.
// ═══════════════════════════════════════════════════════════════════

export type Token =
	| { type: 'reference'; object: string; attribute: string }
	| { type: 'operator'; value: '+' | '-' | '*' | '/' }
	| { type: 'bare_number'; value: number }      // no unit suffix — raw numeric
	| { type: 'paren'; value: '(' | ')' }
	| { type: 'number'; value: number }          // already in mm
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

			// number (possibly with unit suffix)
			if ((ch >= '0' && ch <= '9') || ch === '.') {
				const value = read_number();
				if (isNaN(value)) throw new Error(`Invalid number at position ${pos}`);
				const unit = try_unit_suffix();
				if (unit) {
					tokens.push({ type: 'number', value: units.to_mm(value, unit) });
				} else {
					tokens.push({ type: 'bare_number', value });
				}
				continue;
			}

			// reference or identifier (wall.height)
			if (is_alpha(ch)) {
				const object = read_identifier();
				if (peek() === '.') {
					pos++; // skip dot
					const attribute = read_identifier();
					if (!attribute) throw new Error(`Expected attribute name after '${object}.' at position ${pos}`);
					tokens.push({ type: 'reference', object, attribute });
				} else {
					throw new Error(`Expected '.' after object name '${object}' at position ${pos}`);
				}
				continue;
			}

			throw new Error(`Unexpected character '${ch}' at position ${pos}`);
		}

		tokens.push({ type: 'end' });
		return tokens;
	}
}

export const tokenizer = new Tokenizer();
