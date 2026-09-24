// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — NODE TYPES
// The compile tree. Each node knows its type and children.
// ═══════════════════════════════════════════════════════════════════

export type Operator = '+' | '-' | '*' | '/';

export type Node =
	| { type: 'binary'; operator: Operator; left: Node; right: Node }
	| { type: 'reference'; object: string; attribute: string }
	| { type: 'unary'; operator: '-'; operand: Node }
	| { type: 'literal'; value: number };

class Nodes {

	literal(value: number): Node {
		return { type: 'literal', value };
	}

	reference(object: string, attribute: string): Node {
		return { type: 'reference', object, attribute };
	}

	binary(operator: Operator, left: Node, right: Node): Node {
		return { type: 'binary', operator, left, right };
	}

	unary(operand: Node): Node {
		return { type: 'unary', operator: '-', operand };
	}

	ref_key(object: string, attribute: string): string {
		return `${object}.${attribute}`;
	}
}

export const nodes = new Nodes();
