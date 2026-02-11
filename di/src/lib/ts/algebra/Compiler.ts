import { nodes } from './Nodes';
import type { Node, Operator } from './Nodes';
import type { Token } from './Tokenizer';
import { tokenizer } from './Tokenizer';

// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — COMPILER
// Token stream → Node tree via recursive descent.
//
// Grammar:
//   expression  →  term (('+' | '-') term)*
//   term        →  factor (('*' | '/') factor)*
//   factor      →  '-' factor | atom
//   atom        →  NUMBER | BARE_NUMBER | REFERENCE | '(' expression ')'
// ═══════════════════════════════════════════════════════════════════

class Compiler {

	compile(input: string): Node {
		const tokens = tokenizer.tokenize(input);
		const parser = new Parser(tokens);
		const node = parser.expression();
		parser.expect_end();
		return node;
	}
}

export const compiler = new Compiler();

// ── internal parser ──

class Parser {
	private tokens: Token[];
	private pos: number = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	private peek(): Token {
		return this.tokens[this.pos] ?? { type: 'end' };
	}

	private advance(): Token {
		const token = this.tokens[this.pos];
		this.pos++;
		return token;
	}

	expect_end(): void {
		const token = this.peek();
		if (token.type !== 'end') {
			throw new Error(`Unexpected token '${this.token_label(token)}' — expected end of expression`);
		}
	}

	// expression  →  term (('+' | '-') term)*
	expression(): Node {
		let left = this.term();
		while (this.is_operator('+') || this.is_operator('-')) {
			const op = (this.advance() as { type: 'operator'; value: Operator }).value;
			const right = this.term();
			left = nodes.binary(op, left, right);
		}
		return left;
	}

	// term  →  factor (('*' | '/') factor)*
	private term(): Node {
		let left = this.factor();
		while (this.is_operator('*') || this.is_operator('/')) {
			const op = (this.advance() as { type: 'operator'; value: Operator }).value;
			const right = this.factor();
			left = nodes.binary(op, left, right);
		}
		return left;
	}

	// factor  →  '-' factor | atom
	private factor(): Node {
		if (this.is_operator('-')) {
			this.advance();
			const operand = this.factor();
			return nodes.unary(operand);
		}
		return this.atom();
	}

	// atom  →  NUMBER | BARE_NUMBER | REFERENCE | '(' expression ')'
	private atom(): Node {
		const token = this.peek();

		if (token.type === 'number') {
			this.advance();
			return nodes.literal(token.value);
		}

		if (token.type === 'bare_number') {
			this.advance();
			return nodes.literal(token.value);
		}

		if (token.type === 'reference') {
			this.advance();
			return nodes.reference(token.object, token.attribute);
		}

		if (token.type === 'paren' && token.value === '(') {
			this.advance();
			const node = this.expression();
			if (!(this.peek().type === 'paren' && (this.peek() as any).value === ')')) {
				throw new Error(`Expected ')' but got '${this.token_label(this.peek())}'`);
			}
			this.advance();
			return node;
		}

		throw new Error(`Expected number, reference, or '(' but got '${this.token_label(token)}'`);
	}

	private is_operator(op: string): boolean {
		const t = this.peek();
		return t.type === 'operator' && t.value === op;
	}

	private token_label(token: Token): string {
		switch (token.type) {
			case 'number': return String(token.value);
			case 'bare_number': return String(token.value);
			case 'reference': return `${token.object}.${token.attribute}`;
			case 'operator': return token.value;
			case 'paren': return token.value;
			case 'end': return 'end';
		}
	}
}
