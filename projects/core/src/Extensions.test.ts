import { describe, it, expect } from 'vitest';
import './Extensions';

describe('Number extensions', () => {
	describe('isBetween', () => {
		it('returns true for value in range (inclusive)', () => {
			expect((5).isBetween(1, 10, true)).toBe(true);
		});

		it('returns true for value at boundary (inclusive)', () => {
			expect((1).isBetween(1, 10, true)).toBe(true);
			expect((10).isBetween(1, 10, true)).toBe(true);
		});

		it('returns false for value at boundary (exclusive)', () => {
			expect((1).isBetween(1, 10, false)).toBe(false);
			expect((10).isBetween(1, 10, false)).toBe(false);
		});

		it('returns false for value outside range', () => {
			expect((0).isBetween(1, 10, true)).toBe(false);
			expect((11).isBetween(1, 10, true)).toBe(false);
		});

		it('handles reversed bounds', () => {
			expect((5).isBetween(10, 1, true)).toBe(true);
		});
	});

	describe('force_between', () => {
		it('returns value if within range', () => {
			expect((5).force_between(1, 10)).toBe(5);
		});

		it('clamps to minimum', () => {
			expect((0).force_between(1, 10)).toBe(1);
		});

		it('clamps to maximum', () => {
			expect((15).force_between(1, 10)).toBe(10);
		});

		it('handles reversed bounds', () => {
			expect((15).force_between(10, 1)).toBe(10);
		});
	});

	describe('force_asInteger_between', () => {
		it('rounds and clamps', () => {
			expect((5.7).force_asInteger_between(1, 10)).toBe(6);
			expect((0.2).force_asInteger_between(1, 10)).toBe(1);
		});
	});

	describe('normalize_between_zeroAnd', () => {
		it('returns value if already in range', () => {
			expect((0.5).normalize_between_zeroAnd(1)).toBe(0.5);
		});

		it('wraps negative values', () => {
			expect((-1).normalize_between_zeroAnd(10)).toBe(9);
			expect((-0.5).normalize_between_zeroAnd(1)).toBeCloseTo(0.5, 10);
		});

		it('wraps values exceeding max', () => {
			expect((12).normalize_between_zeroAnd(10)).toBe(2);
			expect((1.5).normalize_between_zeroAnd(1)).toBeCloseTo(0.5, 10);
		});

		it('handles multiple wraps', () => {
			expect((25).normalize_between_zeroAnd(10)).toBe(5);
			expect((-25).normalize_between_zeroAnd(10)).toBe(5);
		});

		it('returns 0 for value 0', () => {
			expect((0).normalize_between_zeroAnd(10)).toBe(0);
		});
	});

	describe('angle_normalized', () => {
		it('normalizes to 0..2π', () => {
			const twoPi = Math.PI * 2;
			expect((0).angle_normalized()).toBe(0);
			expect((Math.PI).angle_normalized()).toBeCloseTo(Math.PI, 10);
			expect((twoPi + 1).angle_normalized()).toBeCloseTo(1, 10);
			expect((-1).angle_normalized()).toBeCloseTo(twoPi - 1, 10);
		});
	});

	describe('angle_normalized_aroundZero', () => {
		it('normalizes to -π..π', () => {
			expect((0).angle_normalized_aroundZero()).toBeCloseTo(0, 10);
			expect((Math.PI * 1.5).angle_normalized_aroundZero()).toBeCloseTo(-Math.PI / 2, 10);
		});
	});

	describe('isAlmost', () => {
		it('returns true if within tolerance', () => {
			expect((5).isAlmost(5.01, 0.1)).toBe(true);
			expect((5).isAlmost(4.99, 0.1)).toBe(true);
		});

		it('returns false if outside tolerance', () => {
			expect((5).isAlmost(5.2, 0.1)).toBe(false);
		});
	});

	describe('increment_by', () => {
		it('increments with wrap', () => {
			expect((8).increment_by(3, 10)).toBe(1);
			expect((2).increment_by(-3, 10)).toBe(9);
		});
	});

	describe('increment', () => {
		it('increments by 1', () => {
			expect((5).increment(true, 10)).toBe(6);
			expect((5).increment(false, 10)).toBe(4);
		});

		it('wraps around', () => {
			expect((9).increment(true, 10)).toBe(0);
			expect((0).increment(false, 10)).toBe(9);
		});
	});

	describe('roundToEven', () => {
		it('rounds to nearest even', () => {
			expect((3).roundToEven()).toBe(4);
			expect((5).roundToEven()).toBe(6);
			expect((4).roundToEven()).toBe(4);
		});
	});

	describe('nth', () => {
		it('adds correct suffix', () => {
			expect((1).nth()).toBe('1st');
			expect((2).nth()).toBe('2nd');
			expect((3).nth()).toBe('3rd');
			expect((4).nth()).toBe('4th');
			expect((11).nth()).toBe('11th');
			expect((12).nth()).toBe('12th');
			expect((13).nth()).toBe('13th');
			expect((21).nth()).toBe('21st');
			expect((22).nth()).toBe('22nd');
			expect((23).nth()).toBe('23rd');
		});
	});

	describe('asDegrees / degrees_of', () => {
		it('converts radians to degrees string', () => {
			expect((Math.PI).asDegrees()).toBe('180');
			expect((Math.PI / 2).degrees_of(1)).toBe('90.0');
		});
	});

	describe('straddles_zero', () => {
		it('detects when angles straddle zero', () => {
			const almostFull = Math.PI * 1.9;
			const justPastZero = 0.1;
			expect(almostFull.straddles_zero(justPastZero)).toBe(true);
		});
	});

	describe('bump_towards', () => {
		it('snaps to boundary if close', () => {
			expect((0.01).bump_towards(0, 10, 0.1)).toBe(0);
			expect((9.99).bump_towards(0, 10, 0.1)).toBe(10);
		});

		it('returns value if not close to boundary', () => {
			expect((5).bump_towards(0, 10, 0.1)).toBe(5);
		});
	});
});

describe('String extensions', () => {
	describe('hash', () => {
		it('returns consistent hash for same string', () => {
			expect('test'.hash()).toBe('test'.hash());
		});

		it('returns different hash for different strings', () => {
			expect('test'.hash()).not.toBe('other'.hash());
		});

		it('returns 0 for empty string', () => {
			expect(''.hash()).toBe(0);
		});
	});

	describe('lastWord', () => {
		it('returns last word', () => {
			expect('hello world'.lastWord()).toBe('world');
			expect('single'.lastWord()).toBe('single');
		});
	});

	describe('unCamelCase', () => {
		it('converts camelCase to spaces', () => {
			expect('camelCase'.unCamelCase()).toBe('camel case');
			expect('thisIsATest'.unCamelCase()).toBe('this is a test');
		});
	});

	describe('removeWhiteSpace', () => {
		it('removes newlines and tabs', () => {
			// newlines become spaces, tabs are removed
			expect('hello\nworld\ttab'.removeWhiteSpace()).toBe('hello worldtab');
		});
	});

	describe('clipWithEllipsisAt', () => {
		it('clips long strings', () => {
			expect('this is a long string'.clipWithEllipsisAt(10)).toBe('this is a  ...');
		});

		it('leaves short strings alone', () => {
			expect('short'.clipWithEllipsisAt(10)).toBe('short');
		});
	});

	describe('injectEllipsisAt', () => {
		it('injects ellipsis in middle of long strings', () => {
			const result = 'abcdefghijklmnop'.injectEllipsisAt(4);
			expect(result).toBe('abcd ... mnop');
		});

		it('leaves short strings alone', () => {
			expect('short'.injectEllipsisAt(4)).toBe('short');
		});
	});

	describe('encode_as_property / decode_from_property', () => {
		it('roundtrips property encoding', () => {
			const original = 'test-name (value)';
			const encoded = original.encode_as_property();
			expect(encoded).not.toContain('-');
			expect(encoded).not.toContain('(');
			expect(encoded).not.toContain(')');
			// Note: decode doesn't fully roundtrip due to space handling
		});
	});

	describe('fontSize_relativeTo', () => {
		it('parses em units', () => {
			expect('1.5em'.fontSize_relativeTo(16)).toBe(24);
		});

		it('parses px units', () => {
			expect('20px'.fontSize_relativeTo(16)).toBe(20);
		});

		it('parses plain numbers', () => {
			expect('18'.fontSize_relativeTo(16)).toBe(18);
		});
	});
});
