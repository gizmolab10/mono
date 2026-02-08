type Integer = number;

/** Define a non-writable, non-enumerable, non-configurable prototype method. */
function define<T>(ctor: { prototype: T }, name: string, value: Function): void {
	Object.defineProperty(ctor.prototype, name, {
		value, writable: false, enumerable: false, configurable: false
	});
}

declare global {
	interface String {
		hash(): Integer;
		lastWord(): string;
		html_encode(): string;
		unCamelCase(): string;
		sizeOf_svgPath(): string;
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

define(String, 'unCamelCase', function(this: string): string {
	return this.replace(/([A-Z])/g, ' $1').toLowerCase();
});

define(String, 'removeWhiteSpace', function(this: string): string {
	return this.split('\n').join(' ').split('\t').join('').trim();
});

define(String, 'encode_as_property', function(this: string): string {
	return this.removeWhiteSpace().split(' ').join('_').split('-').join('$$$').split('(').join('$$').split(')').join('$');
});

define(String, 'decode_from_property', function(this: string): string {
	return this.split('$$$').join('-').split('$$').join('(').split('$').join(')');
});

define(String, 'removeOccurencesOf', function(this: string, characters: string): string {
	if (!characters) return this;
	const pattern = new RegExp(`^[${characters}]+|[${characters}]+$`, 'g');
	return this.replace(pattern, '').trim();
});

define(String, 'lastWord', function(this: string): string {
	return this.split(' ').slice(-1)[0];
});

define(String, 'fontSize_relativeTo', function(this: string, base: number): number {
	if (this.includes('em')) {
		return base * parseFloat(this.split('em')[0]);
	} else if (this.includes('px')) {
		return Number(this.split('px')[0]);
	}
	return Number(this);
});

define(String, 'injectEllipsisAt', function(this: string, at: number = 6): string {
	let injected: string = this;
	const length = injected.length;
	if (length > (at * 2) + 1) {
		injected = injected.slice(0, at) + ' ... ' + injected.slice(length - at, length);
	}
	return injected;
});

define(String, 'clipWithEllipsisAt', function(this: string, at: number = 15): string {
	let clipped: string = this;
	const length = clipped.length;
	if (length > at) {
		clipped = clipped.slice(0, at) + ' ...';
	}
	return clipped;
});

define(String, 'beginWithEllipsis_forLength', function(this: string, length: number = 6): string {
	let injected: string = this;
	if (injected.length > length) {
		injected = ' ... ' + injected.slice(injected.length - length, injected.length);
	}
	return injected;
});

define(String, 'hash', function(this: string): Integer {
	let hash = 0, i, character;
	if (this.length === 0) return hash;
	for (i = 0; i < this.length; i++) {
		character = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + character;
		hash |= 0;
	}
	return hash;
});

define(String, 'html_encode', function(this: string): string {
	let encoded = this.replace(/\n+/g, '').trim();
	return encodeURIComponent(encoded)
		.replace(/%22/g, '\'')
		.replace(/%2B/g, '+')
		.replace(/%3A/g, ':')
		.replace(/%3F/g, '?')
		.replace(/%23/g, '#')
		.replace(/%2F/g, '/')
		.replace(/%3D/g, '=')
		.replace(/%20/g, ' ');
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

define(Number, 'isAlmost', function(this: number, target: number, within: number): boolean {
	return Math.abs(this - target) < within;
});

define(Number, 'force_asInteger_between', function(this: number, a: number, b: number): number {
	return Math.round(this.force_between(a, b));
});

define(Number, 'force_between', function(this: number, a: number, b: number): number {
	const largest = Math.max(a, b);
	const smallest = Math.min(a, b);
	return Math.max(smallest, Math.min(largest, this));
});

define(Number, 'increment', function(this: number, increase: boolean, total: number): number {
	return this.increment_by(increase ? 1 : -1, total);
});

define(Number, 'increment_by', function(this: number, delta: number, total: number): number {
	let result = this.valueOf() + delta;
	return result.normalize_between_zeroAnd(total);
});

define(Number, 'add_angle_normalized', function(this: number, angle: number): number {
	return (this + angle).angle_normalized();
});

define(Number, 'straddles_zero', function(this: number, other: number): boolean {
	return this.angle_normalized() > other.angle_normalized();
});

define(Number, 'angle_normalized', function(this: number): number {
	return this.normalize_between_zeroAnd(Math.PI * 2);
});

define(Number, 'angle_normalized_aroundZero', function(this: number): number {
	return (this + Math.PI).angle_normalized() - Math.PI;
});

define(Number, 'isBetween', function(this: number, a: number, b: number, inclusive: boolean): boolean {
	const min = Math.min(a, b),
		  max = Math.max(a, b);
	return inclusive ? (this >= min && this <= max) : (this > min && this < max);
});

define(Number, 'roundToEven', function(this: number): Integer {
	return (Math.round(this / 2) * 2) as Integer;
});

define(Number, 'asDegrees', function(this: number): string {
	return this.degrees_of(0);
});

define(Number, 'degrees_of', function(this: number, precision: Integer): string {
	const degrees = this * 180 / Math.PI;
	return degrees.toFixed(precision);
});

define(Number, 'isClocklyBetween', function(this: number, a: number, b: number, normalizeTo: number): boolean {
	const value = this.normalize_between_zeroAnd(normalizeTo);
	const cycled: number = value - normalizeTo;
	let min = Math.min(a, b),
		max = Math.max(a, b);
	return this.isBetween(min, max, true) || cycled.isBetween(min, max, true);
});

define(Number, 'isClocklyAlmost', function(this: number, target: number, within: number, normalizeTo: number): boolean {
	return this.isClocklyBetween(target - within, target + within, normalizeTo);
});

define(Number, 'supressNegative', function(this: number): string | number {
	return this < 0 ? '' : this;
});

define(Number, 'supressZero', function(this: number): string | number {
	return this == 0 ? '-' : this;
});

define(Number, 'asInt', function(this: number): string {
	return this.toFixed(0);
});

define(Number, 'of_n_for_type', function(this: number, n: number, type: string, plurality: string): string {
	return `${type}${n == 1 ? '' : plurality}: ${(this + 1).nth()} of ${n}`;
});

define(Number, 'nth', function(this: number): string {
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
});

define(Number, 'toFixed', function(this: number, precision: Integer): string {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'decimal',
		maximumFractionDigits: precision,
		minimumFractionDigits: precision,
		useGrouping: false
	});
	return formatter.format(this);
});

define(Number, 'bump_towards', function(this: number, smallest: number, largest: number, within: number): number {
	if (this < smallest || this.isAlmost(smallest, within)) {
		return smallest;
	}
	if (this > largest || this.isAlmost(largest, within)) {
		return largest;
	}
	return this;
});

define(Number, 'normalize_between_zeroAnd', function(this: number, value: number): number {
	let result: number = this as number;
	if (value != 0) {
		while (result < 0) {
			result += value;
		}
		while (result >= value) {
			result -= value;
		}
	}
	return result;
});

export {};
