import { writable, get } from 'svelte/store';
import { T_Unit, T_Unit_System } from './Enumerations';
import { tu } from '../common/Testworthy_Utilities';
import { preferences, T_Preference } from '../managers/Preferences';

// ═══════════════════════════════════════════════════════════════════
// CONVERSION TABLE — millimeters per unit
// ═══════════════════════════════════════════════════════════════════

const mm_per: Record<T_Unit, number> = {
	// imperial
	[T_Unit.inch]:			25.4,
	[T_Unit.foot]:			304.8,
	[T_Unit.yard]:			914.4,
	[T_Unit.mile]:			1_609_344,
	// metric
	[T_Unit.angstrom]:		1e-7,
	[T_Unit.nanometer]:		1e-6,
	[T_Unit.micrometer]:	0.001,
	[T_Unit.millimeter]:	1,
	[T_Unit.centimeter]:	10,
	[T_Unit.meter]:			1000,
	[T_Unit.kilometer]:		1_000_000,
	// marine
	[T_Unit.fathom]:		1828.8,
	[T_Unit.nautical_mile]:	1_852_000,
	// archaic
	[T_Unit.hand]:			101.6,
	[T_Unit.span]:			228.6,
	[T_Unit.cubit]:			457.2,
	[T_Unit.ell]:			1143,
	[T_Unit.rod]:			5029.2,
	[T_Unit.perch]:			5029.2,
	[T_Unit.chain]:			20_116.8,
	[T_Unit.furlong]:		201_168,
	[T_Unit.league]:		4_828_032,
};

// ═══════════════════════════════════════════════════════════════════
// DISPLAY SYMBOLS
// ═══════════════════════════════════════════════════════════════════

const symbol: Record<T_Unit, string> = {
	// imperial
	[T_Unit.inch]:			'"',
	[T_Unit.foot]:			"'",
	[T_Unit.yard]:			' yd',
	[T_Unit.mile]:			' mi',
	// metric
	[T_Unit.angstrom]:		' \u00C5',
	[T_Unit.nanometer]:		' nm',
	[T_Unit.micrometer]:	' \u00B5m',
	[T_Unit.millimeter]:	' mm',
	[T_Unit.centimeter]:	' cm',
	[T_Unit.meter]:			' m',
	[T_Unit.kilometer]:		' km',
	// marine
	[T_Unit.fathom]:		' ftm',
	[T_Unit.nautical_mile]:	' nmi',
	// archaic
	[T_Unit.hand]:			' hh',
	[T_Unit.span]:			' span',
	[T_Unit.cubit]:			' cubit',
	[T_Unit.ell]:			' ell',
	[T_Unit.rod]:			' rod',
	[T_Unit.perch]:			' perch',
	[T_Unit.chain]:			' ch',
	[T_Unit.furlong]:		' fur',
	[T_Unit.league]:		' lea',
};

// ═══════════════════════════════════════════════════════════════════
// SYSTEM MEMBERSHIP
// ═══════════════════════════════════════════════════════════════════

const system_map: Record<T_Unit_System, T_Unit[]> = {
	[T_Unit_System.imperial]: [T_Unit.inch, T_Unit.foot, T_Unit.yard, T_Unit.mile],
	[T_Unit_System.metric]:   [T_Unit.angstrom, T_Unit.nanometer, T_Unit.micrometer, T_Unit.millimeter, T_Unit.centimeter, T_Unit.meter, T_Unit.kilometer],
	[T_Unit_System.marine]:   [T_Unit.fathom, T_Unit.nautical_mile],
	[T_Unit_System.archaic]:  [T_Unit.hand, T_Unit.span, T_Unit.cubit, T_Unit.ell, T_Unit.rod, T_Unit.perch, T_Unit.chain, T_Unit.furlong, T_Unit.league],
};

const imperial_units = new Set(system_map[T_Unit_System.imperial]);

// ═══════════════════════════════════════════════════════════════════
// FRACTION HELPERS
// ═══════════════════════════════════════════════════════════════════

function to_fraction(decimal: number, max_denominator: number = 64): { whole: number; numerator: number; denominator: number } {
	const whole = Math.floor(decimal);
	const remainder = decimal - whole;
	if (remainder < 1 / (max_denominator * 2)) {
		return { whole, numerator: 0, denominator: 1 };
	}
	const raw_numerator = Math.round(remainder * max_denominator);
	if (raw_numerator >= max_denominator) {
		return { whole: whole + 1, numerator: 0, denominator: 1 };
	}
	const divisor = tu.gcd(raw_numerator, max_denominator);
	return { whole, numerator: raw_numerator / divisor, denominator: max_denominator / divisor };
}

function format_fractional(value: number, unit_symbol: string): string {
	const { whole, numerator, denominator } = to_fraction(Math.abs(value));
	const sign = value < 0 ? '-' : '';
	if (numerator === 0) {
		return sign + whole + unit_symbol;
	}
	if (whole === 0) {
		return sign + numerator + '/' + denominator + unit_symbol;
	}
	return sign + whole + ' ' + numerator + '/' + denominator + unit_symbol;
}

// ═══════════════════════════════════════════════════════════════════
// PARSE HELPERS
// ═══════════════════════════════════════════════════════════════════

function parse_fraction(input: string): number | null {
	const trimmed = input.trim();
	// whole and fraction: "5 1/4"
	const whole_frac = trimmed.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
	if (whole_frac) {
		const w = parseInt(whole_frac[1]);
		const n = parseInt(whole_frac[2]);
		const d = parseInt(whole_frac[3]);
		if (d === 0) return null;
		const sign = w < 0 ? -1 : 1;
		return w + sign * (n / d);
	}
	// fraction only: "1/4"
	const frac = trimmed.match(/^(-?\d+)\/(\d+)$/);
	if (frac) {
		const n = parseInt(frac[1]);
		const d = parseInt(frac[2]);
		if (d === 0) return null;
		return n / d;
	}
	// decimal: "5.25" or "5"
	const num = parseFloat(trimmed);
	return isNaN(num) ? null : num;
}

function parse_compound(input: string): number | null {
	const trimmed = input.trim();
	// feet and inches: 5' 3 1/4"
	const compound = trimmed.match(/^(-?\d+)'\s*(.+)"$/);
	if (compound) {
		const feet = parseInt(compound[1]);
		const inches = parse_fraction(compound[2]);
		if (inches === null) return null;
		return feet * mm_per[T_Unit.foot] + inches * mm_per[T_Unit.inch];
	}
	// feet only: 5'
	const feet_only = trimmed.match(/^(-?\d+)'$/);
	if (feet_only) {
		return parseInt(feet_only[1]) * mm_per[T_Unit.foot];
	}
	// inches only with symbol: 3 1/4"
	const inches_only = trimmed.match(/^(.+)"$/);
	if (inches_only) {
		const inches = parse_fraction(inches_only[1]);
		if (inches === null) return null;
		return inches * mm_per[T_Unit.inch];
	}
	return null;
}

// ═══════════════════════════════════════════════════════════════════
// UNITS CLASS
// ═══════════════════════════════════════════════════════════════════

export class Units {

	// ── conversion ──

	convert(value: number, from: T_Unit, to: T_Unit): number {
		return value * mm_per[from] / mm_per[to];
	}

	to_mm(value: number, unit: T_Unit): number {
		return value * mm_per[unit];
	}

	from_mm(mm: number, unit: T_Unit): number {
		return mm / mm_per[unit];
	}

	// ── data access ──

	mm_per_unit(unit: T_Unit): number { return mm_per[unit]; }
	symbol_for(unit: T_Unit): string { return symbol[unit]; }
	system_units(system: T_Unit_System): T_Unit[] { return system_map[system]; }
	is_imperial(unit: T_Unit): boolean { return imperial_units.has(unit); }

	system_for(unit: T_Unit): T_Unit_System {
		for (const [system, members] of Object.entries(system_map)) {
			if (members.includes(unit)) return system as T_Unit_System;
		}
		return T_Unit_System.metric;
	}

	// ── formatting (mm → string) ──

	format(mm: number, unit: T_Unit): string {
		const value = this.from_mm(mm, unit);
		if (this.is_imperial(unit)) {
			return format_fractional(value, symbol[unit]);
		}
		// metric/marine/archaic: clean decimal
		const rounded = parseFloat(value.toPrecision(10));
		return rounded + symbol[unit];
	}

	format_compound(mm: number): string {
		const total_inches = mm / mm_per[T_Unit.inch];
		const abs_inches = Math.abs(total_inches);
		const sign = total_inches < 0 ? '-' : '';
		const feet = Math.floor(abs_inches / 12);
		const remaining_inches = abs_inches - feet * 12;
		const { whole, numerator, denominator } = to_fraction(remaining_inches);

		if (feet === 0) {
			// less than a foot — show inches only
			return sign + format_fractional(abs_inches, '"');
		}
		if (whole === 0 && numerator === 0) {
			// exact feet, no inches
			return sign + feet + "'";
		}
		// feet + inches
		let inch_part = '';
		if (numerator === 0) {
			inch_part = whole + '"';
		} else if (whole === 0) {
			inch_part = numerator + '/' + denominator + '"';
		} else {
			inch_part = whole + ' ' + numerator + '/' + denominator + '"';
		}
		return sign + feet + "' " + inch_part;
	}

	// ── system-aware formatting (mm → string) ──

	format_for_system(mm: number, system: T_Unit_System): string {
		if (system === T_Unit_System.imperial) {
			return this.format_compound(mm);
		}
		// metric/marine/archaic: pick best unit for the magnitude
		const members = system_map[system];
		const abs_mm = Math.abs(mm);
		// Walk from largest to smallest; first unit where value ≥ 1 wins
		for (let i = members.length - 1; i >= 0; i--) {
			const unit = members[i];
			if (abs_mm >= mm_per[unit]) {
				return this.format(mm, unit);
			}
		}
		// Fallback: smallest unit in the system
		return this.format(mm, members[0]);
	}

	// ── parsing (string → mm) ──

	parse(input: string, unit: T_Unit): number | null {
		const trimmed = input.trim();
		if (trimmed === '') return null;

		// try compound first (has ' and " markers)
		if (trimmed.includes("'") || trimmed.includes('"')) {
			const compound_result = parse_compound(trimmed);
			if (compound_result !== null) return compound_result;
		}

		// strip unit suffix if present
		const unit_sym = symbol[unit].trim();
		let numeric_part = trimmed;
		if (unit_sym && trimmed.toLowerCase().endsWith(unit_sym.toLowerCase())) {
			numeric_part = trimmed.slice(0, -unit_sym.length).trim();
		}

		const value = parse_fraction(numeric_part);
		if (value === null) return null;
		return value * mm_per[unit];
	}
}

export const units = new Units();

// ═══════════════════════════════════════════════════════════════════
// REACTIVE UNIT SYSTEM STORE (persisted)
// ═══════════════════════════════════════════════════════════════════

const saved_system = preferences.read<T_Unit_System>(T_Preference.unitSystem);
export const w_unit_system = writable<T_Unit_System>(saved_system ?? T_Unit_System.imperial);

w_unit_system.subscribe((system: T_Unit_System) => {
	preferences.write(T_Preference.unitSystem, system);
});

/** Read current unit system synchronously (for non-reactive contexts like Render) */
export function current_unit_system(): T_Unit_System {
	return get(w_unit_system);
}
