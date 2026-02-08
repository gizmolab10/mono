// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — NODE TYPES
// The compile tree. Each node knows its type and children.
// ═══════════════════════════════════════════════════════════════════

export type Operator = '+' | '-' | '*' | '/';

export type Node =
	| { type: 'literal'; value: number }
	| { type: 'reference'; object: string; attribute: string }
	| { type: 'binary'; operator: Operator; left: Node; right: Node }
	| { type: 'unary'; operator: '-'; operand: Node };

// ── constructors ──

export function literal(value: number): Node {
	return { type: 'literal', value };
}

export function reference(object: string, attribute: string): Node {
	return { type: 'reference', object, attribute };
}

export function binary(operator: Operator, left: Node, right: Node): Node {
	return { type: 'binary', operator, left, right };
}

export function unary(operand: Node): Node {
	return { type: 'unary', operator: '-', operand };
}
