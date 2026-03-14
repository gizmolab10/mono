import { scene } from '../render/Scene';

// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — ERRORS
// Single owner of S_Error: type, factory, message intelligence,
// suggestion generation, and per-attribute storage.
// All error sites route through Errors — no one else constructs S_Error.
// ═══════════════════════════════════════════════════════════════════

export type Suggestion = { label: string; formula: string; commit?: boolean };

export type S_Error = {
	input:       string;           // full formula text
	error:       Error;            // originating error
	span:        [number, number]; // start, length of bad portion
	message:     string;           // human explanation
	suggestions: Suggestion[];     // actionable fixes
};

const valid_attrs = ['s', 'e', 'l', 'x', 'y', 'z', 'X', 'Y', 'Z', 'w', 'd', 'h'];

class Errors {

	/** Current errors keyed by "so_id:attr_name" */
	private store = new Map<string, S_Error>();

	// ── factory methods ──

	bad_syntax(input: string, span: [number, number], error: Error): S_Error {
		const bad = input.slice(span[0], span[0] + span[1]);
		const message = bad
			? `Unexpected '${bad}', did you mean:`
			: error.message;
		const before = input.slice(0, span[0]);
		const after = input.slice(span[0] + span[1]);
		const suggestions: Suggestion[] = [
			{ label: '+', formula: before + ' + ' + after },
			{ label: '-', formula: before + ' - ' + after },
			{ label: '*', formula: before + ' * ' + after },
			{ label: '/', formula: before + ' / ' + after },
			{ label: 'delete it', formula: (before + after).trim() },
		];
		return this.make(input, span, error, message, suggestions);
	}

	incomplete(input: string, span: [number, number]): S_Error {
		const bad = input.slice(span[0], span[0] + span[1]);
		const message = 'Formula is incomplete, did you want to:';
		const without = (input.slice(0, span[0]) + input.slice(span[0] + span[1])).trim();
		const suggestions: Suggestion[] = [
			{ label: `delete the '${bad}'`, formula: without },
			{ label: 'add more', formula: input, commit: false },
		];
		return this.make(input, span, new Error(message), message, suggestions);
	}

	unknown_so(input: string, span: [number, number], name: string, self_id: string, candidates?: string[]): S_Error {
		const nearby = candidates ?? this.nearby_names(self_id);
		const fuzzy = this.fuzzy_match(name, nearby);
		const matches = fuzzy.length > 0 ? fuzzy : nearby;
		const message = matches.length
			? `No object named '${name}', did you mean:`
			: `No object named '${name}'.`;
		const suggestions: Suggestion[] = matches.map(n => ({
			label: n,
			formula: input.slice(0, span[0]) + n + input.slice(span[0] + span[1]),
		}));
		// Offer delete: remove the highlighted span, collapse double-dot if surrounded by dots
		if (input[span[0] + span[1]] === '.') {
			const start = (span[0] > 0 && input[span[0] - 1] === '.') ? span[0] - 1 : span[0];
			suggestions.push({ label: 'delete it', formula: input.slice(0, start) + input.slice(span[0] + span[1]) });
		}
		return this.make(input, span, new Error(message), message, suggestions);
	}

	unknown_attr(input: string, span: [number, number], attr: string, _object: string): S_Error {
		const message = `Unknown attribute '${attr}', did you mean:`;
		const suggestions: Suggestion[] = valid_attrs.map(a => ({
			label: a,
			formula: input.slice(0, span[0]) + a + input.slice(span[0] + span[1]),
		}));
		return this.make(input, span, new Error(message), message, suggestions);
	}

	bare_so(input: string, name: string, name_span: [number, number]): S_Error {
		// Find the operator adjacent to the SO name — scan forward from end of name span
		const after = name_span[0] + name_span[1];
		const op_match = input.slice(after).match(/^(\s*([+\-*/])\s*)/);
		if (op_match) {
			const op_start = after;
			const op_len = op_match[1].length;
			const op_char = op_match[2];
			const without = input.slice(0, op_start) + input.slice(op_start + op_len);
			const message = `The operator '${op_char}' cannot be applied to an object.`;
			return this.make(input, [op_start, op_len], new Error(message), message, [
				{ label: 'delete it', formula: without },
			]);
		}
		// Operator before the name — scan backward
		const before = input.slice(0, name_span[0]);
		const pre_match = before.match(/(\s*([+\-*/])\s*)$/);
		if (pre_match) {
			const op_start = name_span[0] - pre_match[1].length;
			const op_len = pre_match[1].length;
			const op_char = pre_match[2];
			const without = input.slice(0, op_start) + input.slice(op_start + op_len);
			const message = `The operator '${op_char}' cannot be applied to an object.`;
			return this.make(input, [op_start, op_len], new Error(message), message, [
				{ label: 'delete it', formula: without },
			]);
		}
		// Fallback: highlight the name itself
		const message = `'${name}' is an object, not a value.`;
		return this.make(input, name_span, new Error(message), message, []);
	}

	leading_dot(input: string, dot_span: [number, number]): S_Error {
		const message = "Did you add '.' by mistake?";
		const without = input.slice(0, dot_span[0]) + input.slice(dot_span[0] + dot_span[1]);
		return this.make(input, dot_span, new Error(message), message, [
			{ label: 'delete it', formula: without.trim() },
		]);
	}

	unexpected_dot(input: string, dot_span: [number, number], _full_ref: string): S_Error {
		const message = "Unexpected '.' here.";
		const without = input.slice(0, dot_span[0]) + input.slice(dot_span[0] + dot_span[1]);
		return this.make(input, dot_span, new Error(message), message, [
			{ label: 'delete it', formula: without.trim() },
		]);
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
	nearby_names(self_id: string): string[] {
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

		// Top-level siblings (exclude root if self is a child of root)
		const parent_id = self_scene.parent?.so.id;
		for (const o of all) {
			if (!o.parent && o.so.id !== self_id && o.so.id !== parent_id && !seen.has(o.so.name)) {
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

	private make(input: string, span: [number, number], error: Error, message: string, suggestions: Suggestion[]): S_Error {
		return { input, error, span, message, suggestions };
	}
}

export class AlgebraError extends Error {
	s_error: S_Error;
	constructor(s_error: S_Error) {
		super(s_error.message);
		this.s_error = s_error;
	}
}

export const errors = new Errors();
