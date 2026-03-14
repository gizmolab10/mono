import { scene } from '../render/Scene';

// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — ERRORS
// Single owner of S_Error: type, factory, message intelligence,
// suggestion generation, and per-attribute storage.
// All error sites route through Errors — no one else constructs S_Error.
// ═══════════════════════════════════════════════════════════════════

export type S_Error = {
	input:       string;           // full formula text
	error:       Error;            // originating error
	span:        [number, number]; // start, length of bad portion
	message:     string;           // human explanation
	suggestions: string[];         // actionable fixes
};

const valid_attrs = ['s', 'e', 'l', 'x', 'y', 'z', 'X', 'Y', 'Z', 'w', 'd', 'h'];

class Errors {

	/** Current errors keyed by "so_id:attr_name" */
	private store = new Map<string, S_Error>();

	// ── factory methods ──

	bad_syntax(input: string, span: [number, number], error: Error): S_Error {
		const bad = input.slice(span[0], span[0] + span[1]);
		const message = bad
			? `Unexpected '${bad}'.`
			: error.message;
		const suggestions = ['Operators: + - * /  Parens: ( )'];
		return this.make(input, span, error, message, suggestions);
	}

	unknown_so(input: string, span: [number, number], name: string, self_id: string): S_Error {
		const nearby = this.nearby_names(self_id);
		const fuzzy = this.fuzzy_match(name, nearby);
		const message = fuzzy.length
			? `No object named '${name}'. Nearby: ${fuzzy.join(', ')}`
			: `No object named '${name}'.`;
		const suggestions = fuzzy.map(n => input.slice(0, span[0]) + n + input.slice(span[0] + span[1]));
		return this.make(input, span, new Error(message), message, suggestions);
	}

	unknown_attr(input: string, span: [number, number], attr: string, _object: string): S_Error {
		const message = `Unknown attribute '${attr}'.`;
		const suggestions = valid_attrs.map(a => input.slice(0, span[0]) + a + input.slice(span[0] + span[1]));
		return this.make(input, span, new Error(message), message, suggestions);
	}

	cycle(input: string, chain: string[]): S_Error {
		const message = `This formula creates a loop: ${chain.join(' \u2192 ')}`;
		return this.make(input, [0, input.length], new Error(message), message, []);
	}

	// ── storage ──

	private key(so_id: string, attr_name: string): string {
		return `${so_id}:${attr_name}`;
	}

	set(so_id: string, attr_name: string, error: S_Error): void {
		this.store.set(this.key(so_id, attr_name), error);
	}

	get(so_id: string, attr_name: string): S_Error | null {
		return this.store.get(this.key(so_id, attr_name)) ?? null;
	}

	clear(so_id: string, attr_name: string): void {
		this.store.delete(this.key(so_id, attr_name));
	}

	clear_all(): void {
		this.store.clear();
	}

	// ── intelligence ──

	/** List sibling SO names visible from self_id (walking parent chain). */
	private nearby_names(self_id: string): string[] {
		const all = scene.get_all();
		const self_scene = all.find(o => o.so.id === self_id);
		if (!self_scene) return [];

		const names: string[] = [];
		const seen = new Set<string>();

		let cursor = self_scene.parent;
		while (cursor) {
			for (const o of all) {
				if (o.parent === cursor && o.so.id !== self_id && !seen.has(o.so.name)) {
					names.push(o.so.name);
					seen.add(o.so.name);
				}
			}
			cursor = cursor.parent;
		}

		// Top-level siblings
		for (const o of all) {
			if (!o.parent && o.so.id !== self_id && !seen.has(o.so.name)) {
				names.push(o.so.name);
				seen.add(o.so.name);
			}
		}

		return names;
	}

	/** Simple fuzzy: names that share a prefix or contain the query as a substring. */
	private fuzzy_match(query: string, candidates: string[]): string[] {
		const q = query.toLowerCase();
		return candidates.filter(c => {
			const cl = c.toLowerCase();
			return cl.includes(q) || q.includes(cl) || this.edit_distance(q, cl) <= 2;
		});
	}

	private edit_distance(a: string, b: string): number {
		if (a.length > b.length) [a, b] = [b, a];
		let prev = Array.from({ length: a.length + 1 }, (_, i) => i);
		for (let j = 1; j <= b.length; j++) {
			const curr = [j];
			for (let i = 1; i <= a.length; i++) {
				curr[i] = a[i - 1] === b[j - 1]
					? prev[i - 1]
					: 1 + Math.min(prev[i - 1], prev[i], curr[i - 1]);
			}
			prev = curr;
		}
		return prev[a.length];
	}

	private make(input: string, span: [number, number], error: Error, message: string, suggestions: string[]): S_Error {
		return { input, error, span, message, suggestions };
	}
}

export class FormulaError extends Error {
	s_error: S_Error;
	constructor(s_error: S_Error) {
		super(s_error.message);
		this.s_error = s_error;
	}
}

export const errors = new Errors();
