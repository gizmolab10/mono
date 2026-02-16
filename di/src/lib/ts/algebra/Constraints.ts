import type Smart_Object from '../runtime/Smart_Object';
import type { Bound } from '../types/Types';
import type { FormulaMap } from './Evaluator';
import { orientation } from './Orientation';
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
	| { kind: 'derived'; max: Bound; min: Bound };

const alias_map: Record<string, AliasEntry> = {
	x:   { kind: 'simple',  bound: 'x_min' },
	y:   { kind: 'simple',  bound: 'y_min' },
	z:   { kind: 'simple',  bound: 'z_min' },
	X:   { kind: 'simple',  bound: 'x_max' },
	Y:   { kind: 'simple',  bound: 'y_max' },
	Z:   { kind: 'simple',  bound: 'z_max' },
	w:   { kind: 'derived', max: 'x_max', min: 'x_min' },
	h:   { kind: 'derived', max: 'y_max', min: 'y_min' },
	d:   { kind: 'derived', max: 'z_max', min: 'z_min' },
};

// Invariant derivation formulas — when an attribute is invariant,
// its value comes from the other two in its axis.
const invariant_formulas: Record<string, string> = {
	x: 'X - w',
	y: 'Y - h',
	z: 'Z - d',
	w: 'X - x',
	h: 'Y - y',
	d: 'Z - z',
	X: 'x + w',
	Y: 'y + h',
	Z: 'z + d',
};

class Constraints {

	// ── resolve / write ──

	/** Resolve a reference to its current mm value.
	 *  Handles both internal names (x_min) and customer aliases (x, w, etc). */
	resolve(id: string, attribute: string): number {
		const so = this.find_so(id);
		if (!so) return 0;

		const entry = alias_map[attribute];
		if (!entry) return so.get_bound(attribute as Bound);

		if (entry.kind === 'simple') return so.get_bound(entry.bound);

		// derived: max - min
		return so.get_bound(entry.max) - so.get_bound(entry.min);
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

	/** Resolve bare references (object === '') to a concrete parent id in the AST. */
	private bind_parent(node: Node, parent_id: string): Node {
		switch (node.type) {
			case 'literal': return node;
			case 'reference':
				return node.object === '' ? nodes.reference(parent_id, node.attribute) : node;
			case 'unary':
				return nodes.unary(this.bind_parent(node.operand, parent_id));
			case 'binary':
				return nodes.binary(node.operator, this.bind_parent(node.left, parent_id), this.bind_parent(node.right, parent_id));
		}
	}

	/** Get the invariant derivation formula for an alias (e.g. 'x' → 'X - w'). */
	invariant_formula_for(alias: string): string | null {
		return invariant_formulas[alias] ?? null;
	}

	// ── formula management ──

	/** Set a formula on an SO attribute. Compiles and caches. Returns error string or null.
	 *  parent_id: if provided, bare attributes (x, w, etc.) resolve to this SO. */
	set_formula(so: Smart_Object, bound: Bound, formula: string, parent_id?: string): string | null {
		const attr = so.attributes_dict_byName[bound];
		if (!attr) return `Unknown attribute: ${bound}`;

		let compiled: Node;
		try {
			compiled = compiler.compile(formula);
		} catch (e: any) {
			return `Compile error: ${e.message}`;
		}

		// Bind bare references to parent
		if (parent_id) compiled = this.bind_parent(compiled, parent_id);

		// Check for cycles before accepting
		const formulas = this.build_formula_map();
		const key = nodes.ref_key(so.id, bound);
		formulas.set(key, compiled);
		const cycle = evaluator.detect_cycle(formulas);
		if (cycle) {
			return `Cycle detected: ${cycle.join(' → ')}`;
		}

		attr.formula = formula;
		attr.compiled = compiled;

		// Evaluate immediately
		attr.value = evaluator.evaluate(compiled, (o, a) => this.resolve(o, a));
		return null;
	}

	/** Remove a formula from an SO attribute (keeps current value) */
	clear_formula(so: Smart_Object, bound: Bound): void {
		const attr = so.attributes_dict_byName[bound];
		if (!attr) return;
		attr.formula = null;
		attr.compiled = null;
	}

	// ── propagation ──

	/**
	 * After an SO's bounds change, re-evaluate all formulas that
	 * reference that SO. Single synchronous pass.
	 */
	propagate(changed_so: Smart_Object): void {
		const all_objects = scene.get_all();
		for (const o of all_objects) {
			const so = o.so;
			let updated = false;
			for (const attr of Object.values(so.attributes_dict_byName)) {
				if (!attr.compiled) continue;
				// Does this formula reference the changed SO?
				if (!this.formula_references(attr.compiled, changed_so.id)) continue;
				attr.value = evaluator.evaluate(attr.compiled, (obj, a) => this.resolve(obj, a));
				updated = true;
			}
			// Recompute orientation for variable children whose bounds changed
			if (updated) orientation.recompute(so);
		}
	}

	/** Re-evaluate all formulas across all SOs. Used after bulk changes like precision snapping. */
	propagate_all(): void {
		const all_objects = scene.get_all();
		for (const o of all_objects) {
			const so = o.so;
			let updated = false;
			for (const attr of Object.values(so.attributes_dict_byName)) {
				if (!attr.compiled) continue;
				attr.value = evaluator.evaluate(attr.compiled, (obj, a) => this.resolve(obj, a));
				updated = true;
			}
			if (updated) orientation.recompute(so);
		}
	}

	// ── helpers ──

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
}

export const constraints = new Constraints();
