 // N.B., do not import these from Global Imports --> avoid dependency issues when importing Utilities class into test code

export type Dictionary<T = any> = Record<string, T>;

export class Testworthy_Utilities {
	private orderedKeysCache = new WeakMap<object, string[]>();

	ignore(_event: Event)							{}
	t_or_f(value: boolean): string					{ return value ? '|' : '-'; }
	location_ofMouseEvent(event: MouseEvent): { x: number, y: number } { return { x: event.clientX, y: event.clientY }; }
	consume_event(event: Event)						{ event.preventDefault(); event.stopPropagation(); }

	// remove item from a dictionary at the index
	// assuming it has string keys and number values
	valueFrom_atIndex<T extends Record<string, number>>(dictionary: T, index: number): number {
		const propNames = Object.keys(dictionary) as Array<keyof T>;
		if (index < 0 || index >= propNames.length) {
			throw new Error(`Index ${index} is out of bounds`);
		}
		return dictionary[propNames[index]];
	}

	valueFrom_atIndex_usingMap<T extends Record<string, number>>(dictionary: T, index: number): number {
		// Get or create the ordered keys for this dictionary
		let orderedKeys = this.orderedKeysCache.get(dictionary);
		if (!orderedKeys) {
			orderedKeys = Object.keys(dictionary);
			this.orderedKeysCache.set(dictionary, orderedKeys);
		}

		if (index < 0 || index >= orderedKeys.length) {
			throw new Error(`Index ${index} is out of bounds`);
		}
		return dictionary[orderedKeys[index] as keyof T];
	}

	remove<T>(from: Array<T>, item: T): Array<T> {
		let array = from;
		const index = array.findIndex((element: T) => element === item);
		if (index !== -1) {
			array.splice(index, 1);
		}
		return array;
	}

	copyObject(obj: any): any {
		const copiedObject = Object.create(Object.getPrototypeOf(obj));
		Object.assign(copiedObject, obj);
		return copiedObject;
	}

	convertToObject(instance: any, fields: string[]): object {
		const o: Dictionary = {};
		for (const field of fields) {
			if (instance.hasOwnProperty(field)) {
				o[field] = instance[field];
			}
		}
		return o;
	}

	static readonly _____ARRAYS: unique symbol;

	concatenateArrays(a: Array<any>, b: Array<any>):  		  Array<any> { return [...a, ...b]; }
	strip_falsies(array: Array<any>):				  		  Array<any> { return array.filter(a => !!a); }
	subtract_arrayFrom(a: Array<any>, b: Array<any>): 		  Array<any> { return b.filter(c => a.filter(d => c != d)); }
	strip_invalid(array: Array<any>):				  		  Array<any> { return this.strip_duplicates(this.strip_falsies(array)); }
	uniquely_concatenateArrays(a: Array<any>, b: Array<any>): Array<any> { return this.strip_duplicates(this.concatenateArrays(a, b)); }
	convert_toNumber(values: Array<boolean>):					  number { return values.reduce((acc, val, index) => acc + (val ? (1 << index) : 0), 0); }

	remove_fromArray_byReference<T>(item: T, array: Array<T>): Array<T> {
		if (!item) return array;
		return array.filter(element => element !== item);
	}

	indexOf_inArray_byReference<T>(item: T, array: Array<T>): number {
		if (!item) return -1;
		return array.findIndex(element => element === item);
	}

	strip_duplicates(array: Array<any>): Array<any> {
		let stripped: Array<any> = [];
		for (const item of array) {
			if (!stripped.includes(item)) {
				stripped.push(item);
			}
		}
		return stripped;
	}

	static readonly _____JSON: unique symbol;

	stringify_object(object: Object): string {
		const ignored = [
			'hid',
			'state',
			'idBase',
			'hidChild',
			'hidParent',
			'isGrabbed',
			'bulkRootID',
			't_database',
			'persistence',
			'selectionRange',
		];
		function removeExtras(key: string, value: any): any | undefined {
			if (ignored.includes(key)) {
				return undefined;
			}
			return value;
		}
		return JSON.stringify(object, removeExtras, 1);
	}

	/**
	 * Returns the cumulative sum (prefix sum) array for the input array.
	 * Example: [10, 20, 30] => [10, 30, 60]
	 */
	cumulativeSum(array: Array<number>): Array<number> {
		const result: Array<number> = [];
		array.reduce((acc, val) => {
			const sum = acc + val;
			result.push(sum);
			return sum;
		}, 0);
		return result;
	}

	gcd(a: number, b: number): number {
		a = Math.abs(a);
		b = Math.abs(b);
		while (b) { [a, b] = [b, a % b]; }
		return a;
	}

}

export const tu = new Testworthy_Utilities();
