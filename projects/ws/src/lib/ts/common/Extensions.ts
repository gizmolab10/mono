import type { Integer } from '../types/Types';

declare global {
	interface String {
		hash(): Integer;
		lastWord(): string;
		html_encode(): string;
		unCamelCase(): string;
		removeWhiteSpace(): string;
		encode_as_property(): string;
		decode_from_property(): string;
		injectEllipsisAt(at: number): string;
		clipWithEllipsisAt(at: number): string;
		fontSize_relativeTo(base: number): number;
		removeOccurencesOf(characters: string): string;
		beginWithEllipsis_forLength(length: number): string;
	}
}

Object.defineProperty(String.prototype, 'unCamelCase', {
	value: function(): string {
		return this.replace(/([A-Z])/g, ' $1').toLowerCase();
	},
	writable: false, // Set writable to false to prevent the method to be overwritten
	enumerable: false, // Set enumerable to false to avoid unintended behavior
	configurable: false // Set configurable to false to prevent redefinition of the property
});

Object.defineProperty(String.prototype, 'removeWhiteSpace', {
	value: function(): string {
		return this.split('\n').join(' ').split('\t').join('').trim();
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(String.prototype, 'encode_as_property', {
	value: function(): string {
		// in ts, hyphens, spaces and parentheses are not allowed in property names
		return this.removeWhiteSpace().split(' ').join('_').split('-').join('$$$').split('(').join('$$').split(')').join('$');
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(String.prototype, 'decode_from_property', {
	value: function(): string {
		return this.split('$$$').join('-').split('$$').join('(').split('$').join(')');
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(String.prototype, 'removeOccurencesOf', {
	value: function(characters: string): string {
		if (!characters) return this;
		const pattern = new RegExp(`^[${characters}]+|[${characters}]+$`, 'g');
		return this.replace(pattern, '').trim();
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(String.prototype, 'lastWord', {
	value: function(): string {
		return this.split(' ').slice(-1)[0];
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(String.prototype, 'fontSize_relativeTo', {
	value: function(base: number): number {
		if (this.includes('em')) {
			return base * parseFloat(this.split('em')[0]);
		} else if (this.includes('px')) {
			return Number(this.split('px')[0]);
		}
		return Number(this);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(String.prototype, 'injectEllipsisAt', {
	value: function(at: number = 6): string {
		let injected = this;
		const length = injected.length;
		if (length > (at * 2) + 1) {
			injected = injected.slice(0, at) + ' ... ' + injected.slice(length - at, length);
		}
		return injected;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(String.prototype, 'clipWithEllipsisAt', {
	value: function(at: number = 15): string {
		let clipped = this;
		const length = clipped.length;
		if (length > at) {
			clipped = clipped.slice(0, at) + ' ...';
		}
		return clipped;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(String.prototype, 'beginWithEllipsis_forLength', {
	value: function(length: number = 6): string {
		let injected = this;
		if (injected.length > length) {
			injected = ' ... ' + injected.slice(injected.length - length, injected.length);
		}
		return injected;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(String.prototype, 'hash', {
	value: function() {
		let hash = 0,
		i, character;
		if (this.length === 0) {
			return hash;
		}
		for (i = 0; i < this.length; i++) {
			character = this.charCodeAt(i);
			hash = ((hash << 5) - hash) + character;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	},
	writable: true,
	enumerable: true,
	configurable: true
});

Object.defineProperty(String.prototype, 'sizeOf_svgPath', {
	value: function(): string {
		return this.split(' ').slice(-1)[0];
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(String.prototype, 'html_encode', {
	value: function(): string {
		let encoded = this.replace(/\n+/g, '').trim();
		return encodeURIComponent(encoded)
			.replace(/%22/g, '\'')	// un-encode for easier reading
			.replace(/%2B/g, '+')
			.replace(/%3A/g, ':')
			.replace(/%3F/g, '?')
			.replace(/%23/g, '#')
			.replace(/%2F/g, '/')
			.replace(/%3D/g, '=')
			.replace(/%20/g, ' ')
			// .replace(/%3C/g, '<')
			// .replace(/%3E/g, '>')
			;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

declare global {
	interface Number {
		nth(): string;
		asInt(): string;
		asDegrees(): string;
		roundToEven(): number;
		supressZero(): string;
		supressNegative(): string;
		angle_normalized(): number;
		toFixed(precision: number): string;
		angle_normalized_aroundZero(): number;
		degrees_of(precision: number): string;
		straddles_zero(other: number): boolean;
		add_angle_normalized(angle: number): number;
		normalize_between_zeroAnd(value: number): number;
		isAlmost(target: number, within: number): boolean;
		increment_by(delta: number, total: number): number;
		increment(increment: boolean, total: number): number;
		force_between(smallest: number, largest: number): number;
		isBetween(a: number, b: number, inclusive: boolean): boolean;
		isClocklyBetween(a: number, b: number, limit: number): boolean;
		of_n_for_type(n: number, type: string, plurality: string): string;
		force_asInteger_between(smallest: number, largest: number): number;
		bump_towards(smallest: number, largest: number, within: number): number;
		isClocklyAlmost(target: number, within: number, clock: number): boolean;
	}
}

Object.defineProperty(Number.prototype, 'isAlmost', {
	value: function(target: number, within: number): boolean {
		return Math.abs(this - target) < within;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'force_asInteger_between', {
	value: function(a: number, b: number): number {
		return Math.round(this.force_between(a, b));
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'force_between', {
	value: function(a: number, b: number): number {
		const largest = Math.max(a, b);
		const smallest = Math.min(a, b);
		return Math.max(smallest, Math.min(largest, this));
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'increment', {
	value: function(increase: boolean, total: number): number {
		return this.increment_by(increase ? 1 : -1, total);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'increment_by', {
	value: function(delta: number, total: number): number {
		let result = this.valueOf() + delta;
		return result.normalize_between_zeroAnd(total);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'add_angle_normalized', {
	value: function(angle: number): number {
		return (this + angle).angle_normalized();
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'straddles_zero', {
	value: function(other: number): boolean {
		return this.angle_normalized() > other.angle_normalized();
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'angle_normalized', {
	value: function(): number {
		return this.normalize_between_zeroAnd(Math.PI * 2);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'angle_normalized_aroundZero', {
	value: function(): number {
		// range from - to + PI
		return (this + Math.PI).angle_normalized() - Math.PI;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'isBetween', {
	value: function(a: number, b: number, inclusive: boolean): boolean {
		const min = Math.min(a, b),
			  max = Math.max(a, b);
		return inclusive ? (this >= min && this <= max) : (this > min && this < max);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'roundToEven', {
	value: function(): Integer {
		return (Math.round(this / 2) * 2) as Integer;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'asDegrees', {
	value: function(): string {
		return this.degrees_of(0);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'degrees_of', {
	value: function(precision: Integer): string {
		const degrees = this * 180 / Math.PI;
		return degrees.toFixed(precision);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'isClocklyBetween', {
	value: function(a: number, b: number, normalizeTo: number): boolean {
		const value = this.normalize_between_zeroAnd(normalizeTo);
		const cycled: number = value - normalizeTo;
		let min = Math.min(a, b),
			max = Math.max(a, b);
		return this.isBetween(min, max, true) || cycled.isBetween(min, max, true);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'isClocklyAlmost', {
	// after normalizing to normalizeTo, is this almost target (+/- within)?
	value: function(target: number, within: number, normalizeTo: number): boolean {
		return this.isClocklyBetween(target - within, target + within, normalizeTo);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'supressNegative', {
	value: function(): string | number {
		return this < 0 ? '' : this;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'supressZero', {
	value: function(): string | number {
		return this == 0 ? '-' : this;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'asInt', {
	value: function(): string {
		return this.toFixed(0);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'of_n_for_type', {
	value: function(n: number, type: string, plurality: string): string {
		return `${type}${n == 1 ? '' : plurality}: ${(this + 1).nth()} of ${n}`;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'nth', {
	value: function(): string {
		const prefix = this.asInt();
		const n = Number(prefix);
		let suffix = 'th';
		if (n < 10 || n > 20) {
			switch (n % 10) {
				case 1: suffix = 'st'; break;
				case 2: suffix = 'nd'; break;
				case 3: suffix = 'rd'; break;
			}
		}
		return prefix + suffix;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'toFixed', {
	value: function(precision: Integer): string {
		const formatter = new Intl.NumberFormat('en-US', {
			style: 'decimal',
			maximumFractionDigits: precision,
			minimumFractionDigits: precision,
			useGrouping: false
		});
		return formatter.format(this);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'bump_towards', {
	value: function(smallest: number, largest: number, within: number): number {
		if (this < smallest || this.isAlmost(smallest, within)) {
			return smallest;
		}
		if (this > largest || this.isAlmost(largest, within)) {
			return largest;
		}
		return this;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'normalize_between_zeroAnd', {

	// converts this using clock arithmetic
	// force between 0 and value
	// inclusive

	value: function(value: number): number {
		let result = this;
		if (value != 0) {
			while (result < 0) {
				result += value;
			}
			while (result >= value) {
				result -= value;
			}
		}
		return result;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

// Object.defineProperty(String.prototype, 'boilerplate', {
//	value: function(foo: number): string {
//		return k.empty;
//	},
//	enumerable: false, // Set enumerable to false to avoid unintended behavior
//	writable: false, // Set writable to false to prevent the method to be overwritten
//	configurable: false // Set configurable to false to prevent redefinition of the property
// });

export {};