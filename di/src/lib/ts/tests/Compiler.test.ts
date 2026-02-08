import { describe, it, expect } from 'vitest';
import { tokenizer, compiler } from '../algebra';
import type { Node } from '../algebra';

// ═══════════════════════════════════════════════════════════════════
// TOKENIZER
// ═══════════════════════════════════════════════════════════════════

describe('Tokenizer', () => {

	it('tokenizes bare numbers', () => {
		const tokens = tokenizer.tokenize('42');
		expect(tokens[0]).toEqual({ type: 'bare_number', value: 42 });
	});

	it('tokenizes decimals', () => {
		const tokens = tokenizer.tokenize('3.5');
		expect(tokens[0]).toEqual({ type: 'bare_number', value: 3.5 });
	});

	it('tokenizes operators', () => {
		const tokens = tokenizer.tokenize('1 + 2');
		expect(tokens[0]).toEqual({ type: 'bare_number', value: 1 });
		expect(tokens[1]).toEqual({ type: 'operator', value: '+' });
		expect(tokens[2]).toEqual({ type: 'bare_number', value: 2 });
	});

	it('tokenizes all four operators', () => {
		const tokens = tokenizer.tokenize('1 + 2 - 3 * 4 / 5');
		const ops = tokens.filter(t => t.type === 'operator').map(t => (t as any).value);
		expect(ops).toEqual(['+', '-', '*', '/']);
	});

	it('tokenizes parentheses', () => {
		const tokens = tokenizer.tokenize('(1 + 2)');
		expect(tokens[0]).toEqual({ type: 'paren', value: '(' });
		expect(tokens[4]).toEqual({ type: 'paren', value: ')' });
	});

	it('tokenizes references', () => {
		const tokens = tokenizer.tokenize('wall.height');
		expect(tokens[0]).toEqual({ type: 'reference', object: 'wall', attribute: 'height' });
	});

	it('tokenizes inch suffix', () => {
		const tokens = tokenizer.tokenize('6"');
		expect(tokens[0].type).toBe('number');
		expect((tokens[0] as any).value).toBeCloseTo(152.4); // 6 * 25.4
	});

	it('tokenizes foot suffix', () => {
		const tokens = tokenizer.tokenize("5'");
		expect(tokens[0].type).toBe('number');
		expect((tokens[0] as any).value).toBeCloseTo(1524); // 5 * 304.8
	});

	it('tokenizes metric suffix', () => {
		const tokens = tokenizer.tokenize('2.5 mm');
		expect(tokens[0].type).toBe('number');
		expect((tokens[0] as any).value).toBeCloseTo(2.5); // mm is 1:1
	});

	it('tokenizes cm suffix', () => {
		const tokens = tokenizer.tokenize('10 cm');
		expect(tokens[0].type).toBe('number');
		expect((tokens[0] as any).value).toBeCloseTo(100); // 10 * 10
	});

	it('tokenizes mixed expression', () => {
		const tokens = tokenizer.tokenize('wall.height - 6"');
		expect(tokens[0]).toEqual({ type: 'reference', object: 'wall', attribute: 'height' });
		expect(tokens[1]).toEqual({ type: 'operator', value: '-' });
		expect(tokens[2].type).toBe('number');
		expect((tokens[2] as any).value).toBeCloseTo(152.4);
	});

	it('ends with end token', () => {
		const tokens = tokenizer.tokenize('1');
		expect(tokens[tokens.length - 1]).toEqual({ type: 'end' });
	});

	it('throws on unexpected character', () => {
		expect(() => tokenizer.tokenize('1 & 2')).toThrow();
	});

	it('throws on bare identifier without dot', () => {
		expect(() => tokenizer.tokenize('wall')).toThrow(/Expected '.' after/);
	});

	it('throws on reference with missing attribute', () => {
		expect(() => tokenizer.tokenize('wall.')).toThrow(/Expected attribute name/);
	});
});

// ═══════════════════════════════════════════════════════════════════
// COMPILER (PARSER)
// ═══════════════════════════════════════════════════════════════════

describe('Compiler', () => {

	// ── literals ──

	it('compiles a bare number', () => {
		const node = compiler.compile('42');
		expect(node).toEqual({ type: 'literal', value: 42 });
	});

	it('compiles a unit literal (inches)', () => {
		const node = compiler.compile('6"');
		expect(node.type).toBe('literal');
		expect((node as any).value).toBeCloseTo(152.4);
	});

	it('compiles a unit literal (feet)', () => {
		const node = compiler.compile("3'");
		expect(node.type).toBe('literal');
		expect((node as any).value).toBeCloseTo(914.4);
	});

	it('compiles a unit literal (mm)', () => {
		const node = compiler.compile('25.4 mm');
		expect(node).toEqual({ type: 'literal', value: 25.4 });
	});

	// ── references ──

	it('compiles a reference', () => {
		const node = compiler.compile('wall.height');
		expect(node).toEqual({ type: 'reference', object: 'wall', attribute: 'height' });
	});

	it('compiles a reference with underscores', () => {
		const node = compiler.compile('door.x_min');
		expect(node).toEqual({ type: 'reference', object: 'door', attribute: 'x_min' });
	});

	// ── precedence ──

	it('respects mul over add: 1 + 2 * 3 = add(1, mul(2,3))', () => {
		const node = compiler.compile('1 + 2 * 3');
		expect(node).toEqual({
			type: 'binary', operator: '+',
			left: { type: 'literal', value: 1 },
			right: {
				type: 'binary', operator: '*',
				left: { type: 'literal', value: 2 },
				right: { type: 'literal', value: 3 },
			},
		});
	});

	it('respects div over sub: 10 - 6 / 2 = sub(10, div(6,2))', () => {
		const node = compiler.compile('10 - 6 / 2');
		expect(node).toEqual({
			type: 'binary', operator: '-',
			left: { type: 'literal', value: 10 },
			right: {
				type: 'binary', operator: '/',
				left: { type: 'literal', value: 6 },
				right: { type: 'literal', value: 2 },
			},
		});
	});

	it('left-associates: 1 - 2 - 3 = sub(sub(1,2), 3)', () => {
		const node = compiler.compile('1 - 2 - 3');
		expect(node).toEqual({
			type: 'binary', operator: '-',
			left: {
				type: 'binary', operator: '-',
				left: { type: 'literal', value: 1 },
				right: { type: 'literal', value: 2 },
			},
			right: { type: 'literal', value: 3 },
		});
	});

	// ── parentheses ──

	it('parens override precedence: (1 + 2) * 3', () => {
		const node = compiler.compile('(1 + 2) * 3');
		expect(node).toEqual({
			type: 'binary', operator: '*',
			left: {
				type: 'binary', operator: '+',
				left: { type: 'literal', value: 1 },
				right: { type: 'literal', value: 2 },
			},
			right: { type: 'literal', value: 3 },
		});
	});

	it('nested parens: ((1 + 2))', () => {
		const node = compiler.compile('((1 + 2))');
		expect(node).toEqual({
			type: 'binary', operator: '+',
			left: { type: 'literal', value: 1 },
			right: { type: 'literal', value: 2 },
		});
	});

	// ── unary minus ──

	it('unary minus: -5', () => {
		const node = compiler.compile('-5');
		expect(node).toEqual({
			type: 'unary', operator: '-',
			operand: { type: 'literal', value: 5 },
		});
	});

	it('unary minus on reference: -wall.height', () => {
		const node = compiler.compile('-wall.height');
		expect(node).toEqual({
			type: 'unary', operator: '-',
			operand: { type: 'reference', object: 'wall', attribute: 'height' },
		});
	});

	// ── unit literals in expressions ──

	it('compiles wall.height - 6"', () => {
		const node = compiler.compile('wall.height - 6"');
		expect(node.type).toBe('binary');
		const bin = node as Extract<Node, { type: 'binary' }>;
		expect(bin.operator).toBe('-');
		expect(bin.left).toEqual({ type: 'reference', object: 'wall', attribute: 'height' });
		expect(bin.right.type).toBe('literal');
		expect((bin.right as any).value).toBeCloseTo(152.4);
	});

	it('compiles 2 * door.width + 10 mm', () => {
		const node = compiler.compile('2 * door.width + 10 mm');
		// should be: add(mul(2, door.width), 10)
		expect(node.type).toBe('binary');
		const bin = node as Extract<Node, { type: 'binary' }>;
		expect(bin.operator).toBe('+');
		expect(bin.left).toEqual({
			type: 'binary', operator: '*',
			left: { type: 'literal', value: 2 },
			right: { type: 'reference', object: 'door', attribute: 'width' },
		});
		expect(bin.right).toEqual({ type: 'literal', value: 10 });
	});

	// ── error cases ──

	it('throws on empty input', () => {
		expect(() => compiler.compile('')).toThrow();
	});

	it('throws on unclosed paren', () => {
		expect(() => compiler.compile('(1 + 2')).toThrow(/Expected '\)'/);
	});

	it('throws on trailing operator', () => {
		expect(() => compiler.compile('1 +')).toThrow();
	});

	it('throws on double operator', () => {
		expect(() => compiler.compile('1 + * 2')).toThrow();
	});

	it('throws on unexpected token after expression', () => {
		expect(() => compiler.compile('1 2')).toThrow(/Unexpected token/);
	});
});
