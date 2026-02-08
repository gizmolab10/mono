// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — EVALUATE
// Forward traversal (evaluate) and reverse traversal (propagate).
// ═══════════════════════════════════════════════════════════════════

import type { Node } from './Node';

// ── types ──

/** Resolves a reference to its current numeric value */
export type Resolver = (object: string, attribute: string) => number;

/** Writes a value back to a reference */
export type Writer = (object: string, attribute: string, value: number) => void;

// ═══════════════════════════════════════════════════════════════════
// FORWARD EVALUATION
// Walk the tree, resolve references, compute the result.
// ═══════════════════════════════════════════════════════════════════

export function evaluate(node: Node, resolve: Resolver): number {
	switch (node.type) {
		case 'literal':
			return node.value;
		case 'reference':
			return resolve(node.object, node.attribute);
		case 'unary':
			return -evaluate(node.operand, resolve);
		case 'binary': {
			const left = evaluate(node.left, resolve);
			const right = evaluate(node.right, resolve);
			switch (node.operator) {
				case '+': return left + right;
				case '-': return left - right;
				case '*': return left * right;
				case '/': return right === 0 ? 0 : left / right;
			}
		}
	}
}

// ═══════════════════════════════════════════════════════════════════
// REVERSE PROPAGATION
// Given a target value for the whole expression, solve for ONE
// reference and write it back. Only works for simple cases:
// one reference, linear relationship (add/sub/mul/div with literals).
// ═══════════════════════════════════════════════════════════════════

/**
 * Propagate a target value backward through the tree.
 * Finds the single reference in the expression and solves for it.
 * Throws if the expression has zero or multiple references,
 * or if the relationship isn't invertible.
 */
export function propagate(node: Node, target: number, resolve: Resolver, write: Writer): void {
	const refs = collect_references(node);
	if (refs.length === 0) throw new Error('No references in expression — nothing to propagate');
	if (refs.length > 1) throw new Error('Multiple references — cannot propagate (ambiguous)');
	const ref = refs[0];
	const solved = solve_for_reference(node, ref, target, resolve);
	write(ref.object, ref.attribute, solved);
}

type Ref = { object: string; attribute: string };

function collect_references(node: Node): Ref[] {
	switch (node.type) {
		case 'literal': return [];
		case 'reference': return [{ object: node.object, attribute: node.attribute }];
		case 'unary': return collect_references(node.operand);
		case 'binary': return [...collect_references(node.left), ...collect_references(node.right)];
	}
}

function refs_match(a: Ref, b: Ref): boolean {
	return a.object === b.object && a.attribute === b.attribute;
}

function contains_reference(node: Node, ref: Ref): boolean {
	switch (node.type) {
		case 'literal': return false;
		case 'reference': return refs_match(node, ref);
		case 'unary': return contains_reference(node.operand, ref);
		case 'binary': return contains_reference(node.left, ref) || contains_reference(node.right, ref);
	}
}

/**
 * Solve: given node == target, what value must `ref` have?
 * Recursively peels operators until we reach the reference.
 */
function solve_for_reference(node: Node, ref: Ref, target: number, resolve: Resolver): number {
	switch (node.type) {
		case 'literal':
			throw new Error('Reached literal while solving — reference not found');

		case 'reference':
			if (refs_match(node, ref)) return target;
			throw new Error(`Reached wrong reference ${node.object}.${node.attribute}`);

		case 'unary':
			// -operand == target  →  operand == -target
			return solve_for_reference(node.operand, ref, -target, resolve);

		case 'binary': {
			const ref_in_left = contains_reference(node.left, ref);
			const ref_in_right = contains_reference(node.right, ref);

			if (ref_in_left && ref_in_right) {
				throw new Error('Reference appears on both sides — cannot invert');
			}

			if (ref_in_left) {
				// left OP right == target, solve for left
				const right_val = evaluate(node.right, resolve);
				const left_target = invert_left(node.operator, target, right_val);
				return solve_for_reference(node.left, ref, left_target, resolve);
			} else {
				// left OP right == target, solve for right
				const left_val = evaluate(node.left, resolve);
				const right_target = invert_right(node.operator, target, left_val);
				return solve_for_reference(node.right, ref, right_target, resolve);
			}
		}
	}
}

/** Given: left OP right_val == target, solve for left */
function invert_left(op: string, target: number, right_val: number): number {
	switch (op) {
		case '+': return target - right_val;       // left + r == t  →  left == t - r
		case '-': return target + right_val;       // left - r == t  →  left == t + r
		case '*': return right_val === 0 ? 0 : target / right_val; // left * r == t  →  left == t / r
		case '/': return target * right_val;       // left / r == t  →  left == t * r
		default: throw new Error(`Unknown operator: ${op}`);
	}
}

/** Given: left_val OP right == target, solve for right */
function invert_right(op: string, target: number, left_val: number): number {
	switch (op) {
		case '+': return target - left_val;        // l + right == t  →  right == t - l
		case '-': return left_val - target;        // l - right == t  →  right == l - t
		case '*': return left_val === 0 ? 0 : target / left_val; // l * right == t  →  right == t / l
		case '/': return target === 0 ? 0 : left_val / target;   // l / right == t  →  right == l / t
		default: throw new Error(`Unknown operator: ${op}`);
	}
}

// ═══════════════════════════════════════════════════════════════════
// CYCLE DETECTION
// Before propagating, check if a chain of formulas forms a cycle.
// ═══════════════════════════════════════════════════════════════════

/** A formula registry: maps "object.attribute" → compiled Node */
export type FormulaMap = Map<string, Node>;

function ref_key(object: string, attribute: string): string {
	return `${object}.${attribute}`;
}

/**
 * Returns the cycle path if one exists, or null if acyclic.
 * Example: ["wall.height", "door.height", "wall.height"]
 */
export function detect_cycle(formulas: FormulaMap): string[] | null {
	const visited = new Set<string>();
	const in_stack = new Set<string>();

	for (const key of formulas.keys()) {
		const cycle = dfs(key, formulas, visited, in_stack, []);
		if (cycle) return cycle;
	}
	return null;
}

function dfs(
	key: string,
	formulas: FormulaMap,
	visited: Set<string>,
	in_stack: Set<string>,
	path: string[],
): string[] | null {
	if (in_stack.has(key)) {
		// found a cycle — return path from the cycle start
		const cycle_start = path.indexOf(key);
		return [...path.slice(cycle_start), key];
	}
	if (visited.has(key)) return null;

	visited.add(key);
	in_stack.add(key);
	path.push(key);

	const node = formulas.get(key);
	if (node) {
		const deps = collect_references(node);
		for (const dep of deps) {
			const dep_key = ref_key(dep.object, dep.attribute);
			const cycle = dfs(dep_key, formulas, visited, in_stack, path);
			if (cycle) return cycle;
		}
	}

	path.pop();
	in_stack.delete(key);
	return null;
}
