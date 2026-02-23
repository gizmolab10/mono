import type Smart_Object from '../runtime/Smart_Object';
import type { Bound } from '../types/Types';
import type { FormulaMap } from './Evaluator';

import { constants, CONSTANTS_ID } from './User_Constants';
import { tokenizer } from './Tokenizer';
import { evaluator } from './Evaluator';
import { scene } from '../render/Scene';
import { compiler } from './Compiler';
import type { Node } from './Nodes';
import { nodes } from './Nodes';

// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — CONSTRAINTS
// Glue between the algebra engine and the scene.
// Holds formulas, resolves references, triggers propagation.
// ═══════════════════════════════════════════════════════════════════

// ── alias map ──
// Customer-facing names → internal bounds.
// Simple aliases map 1:1. Derived aliases (w, h, d) compute from two bounds.

type AliasEntry =
	| { kind: 'simple'; bound: Bound }
	| { kind: 'derived'; length: Bound; max: Bound; min: Bound };

const alias_map: Record<string, AliasEntry> = {
	x:   { kind: 'simple',  bound: 'x_min' },
	y:   { kind: 'simple',  bound: 'y_min' },
	z:   { kind: 'simple',  bound: 'z_min' },
	X:   { kind: 'simple',  bound: 'x_max' },
	Y:   { kind: 'simple',  bound: 'y_max' },
	Z:   { kind: 'simple',  bound: 'z_max' },
	w:   { kind: 'derived', length: 'width',  max: 'x_max', min: 'x_min' },
	d:   { kind: 'derived', length: 'depth',  max: 'y_max', min: 'y_min' },
	h:   { kind: 'derived', length: 'height', max: 'z_max', min: 'z_min' },
};

// Invariant derivation formulas — when an attribute is invariant,
// its value comes from the other two in its axis.
// Length attribute names → alias letters (for syncing formula results to geometry)
const length_to_alias: Record<string, string> = { width: 'w', depth: 'd', height: 'h' };

// Alias → [axis_index, attr_index] for invariant checks
// attr_index: 0=start, 1=end, 2=length
const alias_axis_attr: Record<string, [number, number]> = {
	x: [0, 0], X: [0, 1], w: [0, 2],
	y: [1, 0], Y: [1, 1], d: [1, 2],
	z: [2, 0], Z: [2, 1], h: [2, 2],
};

const invariant_formulas: Record<string, string> = {
	x: 'X - w',
	y: 'Y - d',
	z: 'Z - h',
	w: 'X - x',
	d: 'Y - y',
	h: 'Z - z',
	X: 'x + w',
	Y: 'y + d',
	Z: 'z + h',
};

class Constraints {

	referenced_constants = new Set<string>();
	private post_propagate_hook: (() => void) | null = null;

	/** Register a callback invoked after every propagate / propagate_all.
	 *  Used by Engine to sync repeater SOs without creating a circular dependency. */
	register_post_propagate(fn: () => void): void {
		this.post_propagate_hook = fn;
	}

	// ── resolve / write ──

	/** Resolve a reference to its current mm value.
	 *  Handles both internal names (x_min) and customer aliases (x, w, etc).
	 *  Always reads stored value — invariance of the referenced SO is irrelevant. */
	resolve(id: string, attribute: string): number {
		if (id === CONSTANTS_ID) {
			this.referenced_constants.add(attribute);
			return constants.get(attribute);
		}

		const so = this.find_so(id);
		if (!so) return 0;

		const aa = alias_axis_attr[attribute];
		if (aa) {
			const [axis_idx, attr_idx] = aa;
			const attr = so.axes[axis_idx].attributes[attr_idx];
			// Length attributes (index 2) are dimensions, not positions — raw value is absolute
			if (attr_idx === 2) return attr.value;
			// Position attributes need parent offset
			return so.get_bound(attr.name as Bound);
		}

		return so.get_bound(attribute as Bound);
	}

	/** Write a value to an SO attribute.
	 *  Handles aliases: writing w = 300 sets x_max = x_min + 300. */
	write(id: string, attribute: string, value: number): void {
		const so = this.find_so(id);
		if (!so) return;

		const entry = alias_map[attribute];
		if (!entry) { so.set_bound(attribute as Bound, value); return; }

		if (entry.kind === 'simple') { so.set_bound(entry.bound, value); return; }

		// derived: set max = min + value
		so.set_bound(entry.max, so.get_bound(entry.min) + value);
	}

	// ── formula expansion ──

	/** Resolve placeholder references in the AST:
	 *  '' (dot-prefix .x) → parent_id, 'self' (bare x) → self_id or $std. */
	private bind_refs(node: Node, self_id: string, parent_id?: string): Node {
		switch (node.type) {
			case 'literal': return node;
			case 'reference':
				if (node.object === 'self') {
					if (constants.has(node.attribute)) return nodes.reference(CONSTANTS_ID, node.attribute);
					return nodes.reference(self_id, node.attribute);
				}
				if (node.object === '' && parent_id) return nodes.reference(parent_id, node.attribute);
				return node;
			case 'unary':
				return nodes.unary(this.bind_refs(node.operand, self_id, parent_id));
			case 'binary':
				return nodes.binary(node.operator, this.bind_refs(node.left, self_id, parent_id), this.bind_refs(node.right, self_id, parent_id));
		}
	}

	/** Get the invariant derivation formula for an alias (e.g. 'x' → 'X - w'). */
	invariant_formula_for(alias: string): string | null {
		return invariant_formulas[alias] ?? null;
	}

	/** For derived aliases (w, h, d), return the max bound they map to.
	 *  For simple aliases, return the bound directly. Returns null if unknown. */
	bound_for_alias(alias: string): Bound | null {
		const entry = alias_map[alias];
		if (!entry) return null;
		return entry.kind === 'simple' ? entry.bound : entry.max;
	}

	/** After deserialization, rebind bare/self refs in all formulas of an SO. */
	rebind_formulas(so: Smart_Object, parent_id: string): void {
		// Clear formulas on invariant attributes — invariants are computed, not user-driven
		for (const axis of so.axes) {
			const inv = axis.invariant;
			if (inv < 0 || inv > 2) continue;
			const attr = axis.attributes[inv];
			if (attr.compiled) {
				attr.formula = null;
				attr.compiled = null;
			}
		}
		for (const attr of Object.values(so.attributes_dict_byName)) {
			if (!attr.compiled) continue;
			attr.compiled = this.bind_refs(attr.compiled, so.id, parent_id);
			attr.value = evaluator.evaluate(attr.compiled, (o, a) => this.resolve(o, a));
			this.sync_length(so, attr.name, attr.value);
		}
		this.enforce_invariants(so);
	}

	/** Compile and evaluate a formula string, returning the mm value (or null on error).
	 *  self_id: the SO that owns the formula (for bare attributes like x).
	 *  parent_id: the parent SO (for dot-prefixed attributes like .x). */
	evaluate_formula(formula: string, self_id?: string, parent_id?: string): number | null {
		try {
			let compiled = compiler.compile(formula);
			if (self_id) compiled = this.bind_refs(compiled, self_id, parent_id);
			return evaluator.evaluate(compiled, (o, a) => this.resolve(o, a));
		} catch {
			return null;
		}
	}

	// ── formula management ──

	/** Set a formula on an SO attribute. Compiles and caches. Returns error string or null.
	 *  parent_id: if provided, dot-prefixed attributes (.x, .w, etc.) resolve to this SO. */
	set_formula(so: Smart_Object, attr_name: string, formula: string, parent_id?: string): string | null {
		const attr = so.attributes_dict_byName[attr_name];
		if (!attr) return `Unknown attribute: ${attr_name}`;

		let compiled: Node;
		try {
			compiled = compiler.compile(formula);
		} catch (e: any) {
			return `Compile error: ${e.message}`;
		}

		// Bind placeholder references: 'self' (bare x) → this SO, '' (.x) → parent SO
		compiled = this.bind_refs(compiled, so.id, parent_id);

		// Check for cycles before accepting
		const formulas = this.build_formula_map();
		const key = nodes.ref_key(so.id, attr_name);
		formulas.set(key, compiled);
		const cycle = evaluator.detect_cycle(formulas);
		if (cycle) {
			return `Cycle detected: ${cycle.join(' → ')}`;
		}

		attr.formula = tokenizer.tokenize(formula);
		attr.compiled = compiled;

		// Evaluate immediately
		attr.value = evaluator.evaluate(compiled, (o, a) => this.resolve(o, a));
		this.sync_length(so, attr_name, attr.value);
		this.enforce_invariants(so);
		return null;
	}

	/** Remove a formula from an SO attribute (keeps current value) */
	clear_formula(so: Smart_Object, attr_name: string): void {
		const attr = so.attributes_dict_byName[attr_name];
		if (!attr) return;
		attr.formula = null;
		attr.compiled = null;
	}

	// ── propagation ──

	/**
	 * After an SO's bounds change, re-evaluate all formulas that
	 * reference that SO.  Cascades through the scene hierarchy:
	 * children whose parent changed get enforce_invariants (their
	 * stored offsets are relative to parent bounds), and any SO
	 * with formulas referencing a changed SO gets re-evaluated.
	 */
	propagate(changed_so: Smart_Object): void {
		this.enforce_invariants(changed_so);
		const all_objects = scene.get_all();
		const changed = new Set<string>([changed_so.id]);

		for (const o of all_objects) {
			const so = o.so;
			if (changed.has(so.id)) continue;

			let dominated = false;

			// Parent offset cascade: parent changed → child offsets stale
			if (o.parent && changed.has(o.parent.so.id)) {
				dominated = true;
			}

			// Explicit formulas referencing any changed SO
			for (const attr of Object.values(so.attributes_dict_byName)) {
				if (!attr.compiled) continue;
				let refs_changed = false;
				for (const cid of changed) {
					if (this.formula_references(attr.compiled, cid)) { refs_changed = true; break; }
				}
				if (refs_changed) {
					attr.value = evaluator.evaluate(attr.compiled, (obj, a) => this.resolve(obj, a));
					this.sync_length(so, attr.name, attr.value);
					dominated = true;
				}
			}

			if (dominated) {
				this.enforce_invariants(so);
				changed.add(so.id);
			}
		}
		this.post_propagate_hook?.();
	}

	/** Re-evaluate all formulas across all SOs. Used after bulk changes like precision snapping.
	 *  Enforces invariants on every SO (not just those with formulas) so parent offsets stay correct. */
	propagate_all(): void {
		const all_objects = scene.get_all();
		for (const o of all_objects) {
			const so = o.so;

			for (const attr of Object.values(so.attributes_dict_byName)) {
				if (!attr.compiled) continue;
				attr.value = evaluator.evaluate(attr.compiled, (obj, a) => this.resolve(obj, a));
				this.sync_length(so, attr.name, attr.value);
			}

			this.enforce_invariants(so);
		}
		this.post_propagate_hook?.();
	}

	// ── invariant enforcement ──

	/** After any formula evaluation or bound change, recompute the invariant
	 *  attribute on each axis from the other two.
	 *  Invariant relationship: length = end - start.
	 *    invariant=0 (start): end and length are sources of truth. start = end - length.
	 *    invariant=1 (end):   start and length are sources of truth. end = start + length.
	 *    invariant=2 (length): start and end are sources of truth. length = end - start.
	 *  For invariant=0 or 1, the length attribute is the preserved quantity.
	 *  If the length was never initialized (still 0 while geometry says otherwise),
	 *  we sync it from geometry first — this makes the enforcement a no-op for that
	 *  axis, which is correct: nothing meaningful changed.
	 *  Skips axes where the invariant attribute has an explicit user formula. */
	enforce_invariants(so: Smart_Object): void {
		for (const axis of so.axes) {
			const inv = axis.invariant;
			if (inv < 0 || inv > 2) continue;
			const attr = axis.attributes[inv];
			// Don't override explicit user formulas
			if (attr.compiled) continue;
			// Use absolute values via get_bound/set_bound — child offsets are relative
			// to different parent bounds (origin from parent origin, extent from parent extent),
			// so raw .value subtraction doesn't give the right dimension.
			const start_abs = so.get_bound(axis.start.name as Bound);
			const end_abs = so.get_bound(axis.end.name as Bound);
			switch (inv) {
				case 0: // start = end - length
					so.set_bound(axis.start.name as Bound, end_abs - axis.length.value);
					break;
				case 1: // end = start + length
					so.set_bound(axis.end.name as Bound, start_abs + axis.length.value);
					break;
				case 2: // length = end - start
					axis.length.value = end_abs - start_abs;
					break;
			}
		}
		// Root: start is always 0, length always equals end
		if (so.scene && !so.scene.parent) {
			for (const axis of so.axes) {
				axis.start.value = 0;
				axis.length.value = axis.end.value;
			}
		}
	}

	// ── helpers ──

	/** If attr is a length attribute (width/depth/height), sync its value to geometry. */
	private sync_length(so: Smart_Object, attr_name: string, value: number): void {
		const alias = length_to_alias[attr_name];
		if (alias) this.write(so.id, alias, value);
	}

	private find_so(id: string): Smart_Object | null {
		const all = scene.get_all();
		const match = all.find(o => o.so.id === id);
		return match?.so ?? null;
	}

	private build_formula_map(): FormulaMap {
		const map: FormulaMap = new Map();
		const all = scene.get_all();
		for (const o of all) {
			for (const attr of Object.values(o.so.attributes_dict_byName)) {
				if (attr.compiled) {
					map.set(nodes.ref_key(o.so.id, attr.name), attr.compiled);
				}
			}
		}
		return map;
	}

	private formula_references(node: Node, so_id: string): boolean {
		switch (node.type) {
			case 'literal': return false;
			case 'reference': return node.object === so_id;
			case 'unary': return this.formula_references(node.operand, so_id);
			case 'binary': return this.formula_references(node.left, so_id) || this.formula_references(node.right, so_id);
		}
	}

	/** Rename a standard dimension across all formulas in the scene.
	 *  Updates both stored tokens and compiled AST nodes. */
	rename_sd_in_formulas(old_name: string, new_name: string): void {
		const all_objects = scene.get_all();
		for (const o of all_objects) {
			for (const attr of Object.values(o.so.attributes_dict_byName)) {
				if (!attr.formula) continue;
				// Rename in stored tokens (bare references: object = 'self')
				const changed = tokenizer.rename_reference(attr.formula, 'self', old_name, new_name);
				if (changed) {
					// Recompile from updated tokens
					const source = tokenizer.untokenize(attr.formula);
					try {
						let compiled = compiler.compile(source);
						const parent_id = o.parent?.so.id;
						compiled = this.bind_refs(compiled, o.so.id, parent_id);
						attr.compiled = compiled;
					} catch { /* skip — formula might be temporarily invalid */ }
				}
			}
		}
	}
}

export const constraints = new Constraints();
