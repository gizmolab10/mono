import { describe, it, expect } from 'vitest';
import { Testworthy_Utilities, tu } from './Testworthy_Utilities';

describe('Testworthy_Utilities', () => {
	describe('cumulativeSum', () => {
		it('returns cumulative sum for simple array', () => {
			expect(tu.cumulativeSum([10, 20, 30])).toEqual([10, 30, 60]);
		});

		it('handles single element', () => {
			expect(tu.cumulativeSum([5])).toEqual([5]);
		});

		it('handles empty array', () => {
			expect(tu.cumulativeSum([])).toEqual([]);
		});

		it('handles negative numbers', () => {
			expect(tu.cumulativeSum([10, -5, 20])).toEqual([10, 5, 25]);
		});

		it('handles zeros', () => {
			expect(tu.cumulativeSum([0, 0, 10])).toEqual([0, 0, 10]);
		});
	});

	describe('strip_duplicates', () => {
		it('removes duplicate values', () => {
			expect(tu.strip_duplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
		});

		it('preserves order of first occurrence', () => {
			expect(tu.strip_duplicates([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
		});

		it('handles empty array', () => {
			expect(tu.strip_duplicates([])).toEqual([]);
		});

		it('handles array with no duplicates', () => {
			expect(tu.strip_duplicates([1, 2, 3])).toEqual([1, 2, 3]);
		});

		it('handles strings', () => {
			expect(tu.strip_duplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
		});
	});

	describe('strip_falsies', () => {
		it('removes null and undefined', () => {
			expect(tu.strip_falsies([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
		});

		it('removes empty strings', () => {
			expect(tu.strip_falsies(['a', '', 'b'])).toEqual(['a', 'b']);
		});

		it('removes zeros', () => {
			expect(tu.strip_falsies([1, 0, 2])).toEqual([1, 2]);
		});

		it('removes false', () => {
			expect(tu.strip_falsies([true, false, true])).toEqual([true, true]);
		});

		it('handles empty array', () => {
			expect(tu.strip_falsies([])).toEqual([]);
		});
	});

	describe('remove', () => {
		it('removes item from array', () => {
			expect(tu.remove([1, 2, 3], 2)).toEqual([1, 3]);
		});

		it('removes only first occurrence', () => {
			expect(tu.remove([1, 2, 2, 3], 2)).toEqual([1, 2, 3]);
		});

		it('returns unchanged array if item not found', () => {
			expect(tu.remove([1, 2, 3], 4)).toEqual([1, 2, 3]);
		});

		it('handles empty array', () => {
			expect(tu.remove([], 1)).toEqual([]);
		});
	});

	describe('remove_fromArray_byReference', () => {
		it('removes item by reference', () => {
			const obj1 = { id: 1 };
			const obj2 = { id: 2 };
			const obj3 = { id: 3 };
			const arr = [obj1, obj2, obj3];
			expect(tu.remove_fromArray_byReference(obj2, arr)).toEqual([obj1, obj3]);
		});

		it('returns original array if item is null', () => {
			const arr = [1, 2, 3];
			expect(tu.remove_fromArray_byReference(null as any, arr)).toEqual([1, 2, 3]);
		});

		it('does not remove by value equality', () => {
			const arr = [{ id: 1 }, { id: 2 }];
			const similar = { id: 1 };  // same value, different reference
			expect(tu.remove_fromArray_byReference(similar, arr)).toEqual(arr);
		});
	});

	describe('indexOf_inArray_byReference', () => {
		it('finds index by reference', () => {
			const obj1 = { id: 1 };
			const obj2 = { id: 2 };
			const arr = [obj1, obj2];
			expect(tu.indexOf_inArray_byReference(obj2, arr)).toBe(1);
		});

		it('returns -1 if not found', () => {
			const obj1 = { id: 1 };
			const obj2 = { id: 2 };
			const arr = [obj1];
			expect(tu.indexOf_inArray_byReference(obj2, arr)).toBe(-1);
		});

		it('returns -1 for null item', () => {
			expect(tu.indexOf_inArray_byReference(null as any, [1, 2])).toBe(-1);
		});
	});

	describe('concatenateArrays', () => {
		it('concatenates two arrays', () => {
			expect(tu.concatenateArrays([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
		});

		it('handles empty arrays', () => {
			expect(tu.concatenateArrays([], [1, 2])).toEqual([1, 2]);
			expect(tu.concatenateArrays([1, 2], [])).toEqual([1, 2]);
		});
	});

	describe('uniquely_concatenateArrays', () => {
		it('concatenates and removes duplicates', () => {
			expect(tu.uniquely_concatenateArrays([1, 2], [2, 3])).toEqual([1, 2, 3]);
		});

		it('preserves order', () => {
			expect(tu.uniquely_concatenateArrays([1, 2], [3, 1])).toEqual([1, 2, 3]);
		});
	});

	describe('strip_invalid', () => {
		it('removes falsies and duplicates', () => {
			expect(tu.strip_invalid([1, null, 2, 2, undefined, 3])).toEqual([1, 2, 3]);
		});
	});

	describe('convert_toNumber', () => {
		it('converts boolean array to binary number', () => {
			expect(tu.convert_toNumber([true, false, false])).toBe(1);   // 001
			expect(tu.convert_toNumber([false, true, false])).toBe(2);  // 010
			expect(tu.convert_toNumber([true, true, false])).toBe(3);   // 011
			expect(tu.convert_toNumber([false, false, true])).toBe(4);  // 100
		});

		it('handles empty array', () => {
			expect(tu.convert_toNumber([])).toBe(0);
		});

		it('handles all true', () => {
			expect(tu.convert_toNumber([true, true, true])).toBe(7);  // 111
		});

		it('handles all false', () => {
			expect(tu.convert_toNumber([false, false, false])).toBe(0);
		});
	});

	describe('valueFrom_atIndex', () => {
		it('gets value at index', () => {
			const dict = { a: 10, b: 20, c: 30 };
			expect(tu.valueFrom_atIndex(dict, 0)).toBe(10);
			expect(tu.valueFrom_atIndex(dict, 1)).toBe(20);
			expect(tu.valueFrom_atIndex(dict, 2)).toBe(30);
		});

		it('throws for out of bounds index', () => {
			const dict = { a: 10 };
			expect(() => tu.valueFrom_atIndex(dict, 5)).toThrow('Index 5 is out of bounds');
			expect(() => tu.valueFrom_atIndex(dict, -1)).toThrow('Index -1 is out of bounds');
		});
	});

	describe('t_or_f', () => {
		it('returns | for true', () => {
			expect(tu.t_or_f(true)).toBe('|');
		});

		it('returns - for false', () => {
			expect(tu.t_or_f(false)).toBe('-');
		});
	});

	describe('copyObject', () => {
		it('creates shallow copy preserving prototype', () => {
			class Foo {
				x = 1;
				getX() { return this.x; }
			}
			const original = new Foo();
			const copy = tu.copyObject(original);
			expect(copy.x).toBe(1);
			expect(copy.getX()).toBe(1);
			expect(copy).not.toBe(original);
		});
	});

	describe('convertToObject', () => {
		it('extracts specified fields', () => {
			const instance = { a: 1, b: 2, c: 3 };
			expect(tu.convertToObject(instance, ['a', 'c'])).toEqual({ a: 1, c: 3 });
		});

		it('ignores missing fields', () => {
			const instance = { a: 1 };
			expect(tu.convertToObject(instance, ['a', 'b'])).toEqual({ a: 1 });
		});
	});
});
