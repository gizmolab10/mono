import { describe, it, expect } from 'vitest';
import { compiler, evaluator } from '../algebra';
import type { Resolver, Writer, FormulaMap } from '../algebra';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Simple mock resolver from a dictionary */
function mock_resolver(values: Record<string, number>): Resolver {
	return (object, attribute) => {
		const key = `${object}.${attribute}`;
		if (key in values) return values[key];
		throw new Error(`Unknown reference: ${key}`);
	};
}

/** Mock writer that records writes */
function mock_writer(): { writer: Writer; writes: Record<string, number> } {
	const writes: Record<string, number> = {};
	const writer: Writer = (object, attribute, value) => {
		writes[`${object}.${attribute}`] = value;
	};
	return { writer, writes };
}

// ═══════════════════════════════════════════════════════════════════
// FORWARD EVALUATION
// ═══════════════════════════════════════════════════════════════════

describe('evaluate', () => {

	it('evaluates a literal', () => {
		const node = compiler.compile('42');
		expect(evaluator.evaluate(node, mock_resolver({}))).toBe(42);
	});

	it('evaluates a reference', () => {
		const node = compiler.compile('wall.height');
		const resolve = mock_resolver({ 'wall.height': 2438.4 });
		expect(evaluator.evaluate(node, resolve)).toBeCloseTo(2438.4);
	});

	it('evaluates addition', () => {
		const node = compiler.compile('wall.height + 100');
		const resolve = mock_resolver({ 'wall.height': 2438.4 });
		expect(evaluator.evaluate(node, resolve)).toBeCloseTo(2538.4);
	});

	it('evaluates subtraction with unit literal', () => {
		// wall.height - 6" (6" = 152.4mm)
		const node = compiler.compile('wall.height - 6"');
		const resolve = mock_resolver({ 'wall.height': 2438.4 });
		expect(evaluator.evaluate(node, resolve)).toBeCloseTo(2286);
	});

	it('evaluates multiplication', () => {
		const node = compiler.compile('2 * door.width');
		const resolve = mock_resolver({ 'door.width': 914.4 });
		expect(evaluator.evaluate(node, resolve)).toBeCloseTo(1828.8);
	});

	it('evaluates division', () => {
		const node = compiler.compile('wall.width / 2');
		const resolve = mock_resolver({ 'wall.width': 3048 });
		expect(evaluator.evaluate(node, resolve)).toBeCloseTo(1524);
	});

	it('evaluates division by zero as 0', () => {
		const node = compiler.compile('wall.width / 0');
		const resolve = mock_resolver({ 'wall.width': 3048 });
		expect(evaluator.evaluate(node, resolve)).toBe(0);
	});

	it('evaluates unary minus', () => {
		const node = compiler.compile('-wall.height');
		const resolve = mock_resolver({ 'wall.height': 2438.4 });
		expect(evaluator.evaluate(node, resolve)).toBeCloseTo(-2438.4);
	});

	it('evaluates complex expression with precedence', () => {
		// 2 * door.width + 10 mm = 2*914.4 + 10 = 1838.8
		const node = compiler.compile('2 * door.width + 10 mm');
		const resolve = mock_resolver({ 'door.width': 914.4 });
		expect(evaluator.evaluate(node, resolve)).toBeCloseTo(1838.8);
	});

	it('evaluates parenthesized expression', () => {
		// (wall.height + 100) * 2 = (2438.4 + 100) * 2 = 5076.8
		const node = compiler.compile('(wall.height + 100) * 2');
		const resolve = mock_resolver({ 'wall.height': 2438.4 });
		expect(evaluator.evaluate(node, resolve)).toBeCloseTo(5076.8);
	});
});

// ═══════════════════════════════════════════════════════════════════
// REVERSE PROPAGATION
// ═══════════════════════════════════════════════════════════════════

describe('propagate', () => {

	it('propagates through subtraction: a = b - 6" → change a, update b', () => {
		// formula: wall.height - 6"
		// if result should be 2286 (= 90"), what must wall.height be?
		// wall.height - 152.4 == 2286  →  wall.height == 2438.4
		const node = compiler.compile('wall.height - 6"');
		const resolve = mock_resolver({ 'wall.height': 0 }); // old value irrelevant
		const { writer, writes } = mock_writer();
		evaluator.propagate(node, 2286, resolve, writer);
		expect(writes['wall.height']).toBeCloseTo(2438.4);
	});

	it('propagates through addition: a = b + 100', () => {
		// wall.height + 100 == 2538.4  →  wall.height == 2438.4
		const node = compiler.compile('wall.height + 100');
		const resolve = mock_resolver({ 'wall.height': 0 });
		const { writer, writes } = mock_writer();
		evaluator.propagate(node, 2538.4, resolve, writer);
		expect(writes['wall.height']).toBeCloseTo(2438.4);
	});

	it('propagates through multiplication: a = 2 * b', () => {
		// 2 * door.width == 1828.8  →  door.width == 914.4
		const node = compiler.compile('2 * door.width');
		const resolve = mock_resolver({ 'door.width': 0 });
		const { writer, writes } = mock_writer();
		evaluator.propagate(node, 1828.8, resolve, writer);
		expect(writes['door.width']).toBeCloseTo(914.4);
	});

	it('propagates through division: a = b / 2', () => {
		// wall.width / 2 == 1524  →  wall.width == 3048
		const node = compiler.compile('wall.width / 2');
		const resolve = mock_resolver({ 'wall.width': 0 });
		const { writer, writes } = mock_writer();
		evaluator.propagate(node, 1524, resolve, writer);
		expect(writes['wall.width']).toBeCloseTo(3048);
	});

	it('propagates through unary minus: a = -b', () => {
		// -wall.height == -2438.4  →  wall.height == 2438.4
		const node = compiler.compile('-wall.height');
		const resolve = mock_resolver({ 'wall.height': 0 });
		const { writer, writes } = mock_writer();
		evaluator.propagate(node, -2438.4, resolve, writer);
		expect(writes['wall.height']).toBeCloseTo(2438.4);
	});

	it('propagates when ref is on the right: a = 100 - b', () => {
		// 100 - door.height == 40  →  door.height == 60
		const node = compiler.compile('100 - door.height');
		const resolve = mock_resolver({ 'door.height': 0 });
		const { writer, writes } = mock_writer();
		evaluator.propagate(node, 40, resolve, writer);
		expect(writes['door.height']).toBeCloseTo(60);
	});

	it('propagates through nested ops: (b + 10) * 2 == target', () => {
		// (wall.height + 10) * 2 == 200  →  wall.height + 10 == 100  →  wall.height == 90
		const node = compiler.compile('(wall.height + 10) * 2');
		const resolve = mock_resolver({ 'wall.height': 0 });
		const { writer, writes } = mock_writer();
		evaluator.propagate(node, 200, resolve, writer);
		expect(writes['wall.height']).toBeCloseTo(90);
	});

	it('throws on no references', () => {
		const node = compiler.compile('42 + 10');
		const resolve = mock_resolver({});
		const { writer } = mock_writer();
		expect(() => evaluator.propagate(node, 100, resolve, writer)).toThrow(/No references/);
	});

	it('throws on multiple references', () => {
		const node = compiler.compile('wall.height + door.width');
		const resolve = mock_resolver({ 'wall.height': 100, 'door.width': 50 });
		const { writer } = mock_writer();
		expect(() => evaluator.propagate(node, 200, resolve, writer)).toThrow(/Multiple references/);
	});
});

// ═══════════════════════════════════════════════════════════════════
// CYCLE DETECTION
// ═══════════════════════════════════════════════════════════════════

describe('detect_cycle', () => {

	it('returns null for no formulas', () => {
		const formulas: FormulaMap = new Map();
		expect(evaluator.detect_cycle(formulas)).toBeNull();
	});

	it('returns null for acyclic formulas', () => {
		const formulas: FormulaMap = new Map();
		// door.height = wall.height - 6"
		formulas.set('door.height', compiler.compile('wall.height - 6"'));
		expect(evaluator.detect_cycle(formulas)).toBeNull();
	});

	it('returns null for chain without cycle', () => {
		const formulas: FormulaMap = new Map();
		// a.x = b.x + 10, b.x = c.x * 2
		formulas.set('a.x', compiler.compile('b.x + 10'));
		formulas.set('b.x', compiler.compile('c.x * 2'));
		expect(evaluator.detect_cycle(formulas)).toBeNull();
	});

	it('detects direct cycle: A → B → A', () => {
		const formulas: FormulaMap = new Map();
		formulas.set('a.x', compiler.compile('b.x + 10'));
		formulas.set('b.x', compiler.compile('a.x - 10'));
		const cycle = evaluator.detect_cycle(formulas);
		expect(cycle).not.toBeNull();
		expect(cycle!.length).toBeGreaterThanOrEqual(3); // a.x → b.x → a.x
		expect(cycle![0]).toBe(cycle![cycle!.length - 1]); // starts and ends same
	});

	it('detects indirect cycle: A → B → C → A', () => {
		const formulas: FormulaMap = new Map();
		formulas.set('a.x', compiler.compile('b.x + 1'));
		formulas.set('b.x', compiler.compile('c.x + 1'));
		formulas.set('c.x', compiler.compile('a.x + 1'));
		const cycle = evaluator.detect_cycle(formulas);
		expect(cycle).not.toBeNull();
		expect(cycle![0]).toBe(cycle![cycle!.length - 1]);
	});

	it('detects self-referencing formula', () => {
		const formulas: FormulaMap = new Map();
		formulas.set('a.x', compiler.compile('a.x + 1'));
		const cycle = evaluator.detect_cycle(formulas);
		expect(cycle).not.toBeNull();
		expect(cycle).toEqual(['a.x', 'a.x']);
	});

	it('only flags the cycle, not unrelated formulas', () => {
		const formulas: FormulaMap = new Map();
		formulas.set('a.x', compiler.compile('b.x + 1'));
		formulas.set('b.x', compiler.compile('a.x + 1'));
		formulas.set('c.x', compiler.compile('d.x + 1')); // unrelated, acyclic
		const cycle = evaluator.detect_cycle(formulas);
		expect(cycle).not.toBeNull();
		expect(cycle!.some(k => k === 'c.x')).toBe(false);
	});
});
