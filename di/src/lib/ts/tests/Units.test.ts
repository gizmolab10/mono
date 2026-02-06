import { describe, it, expect } from 'vitest';
import { units } from '../types/Units';
import { T_Unit, T_Unit_System } from '../types/Enumerations';

describe('Units', () => {

	// ═══════════════════════════════════════════════════════════════════
	// CONVERSION
	// ═══════════════════════════════════════════════════════════════════

	describe('conversion', () => {
		it('mm is identity', () => {
			expect(units.to_mm(1, T_Unit.millimeter)).toBe(1);
			expect(units.from_mm(1, T_Unit.millimeter)).toBe(1);
		});

		it('inches to mm', () => {
			expect(units.to_mm(1, T_Unit.inch)).toBe(25.4);
			expect(units.to_mm(5.25, T_Unit.inch)).toBeCloseTo(133.35);
		});

		it('mm to inches', () => {
			expect(units.from_mm(25.4, T_Unit.inch)).toBe(1);
			expect(units.from_mm(133.35, T_Unit.inch)).toBeCloseTo(5.25);
		});

		it('feet to mm', () => {
			expect(units.to_mm(1, T_Unit.foot)).toBe(304.8);
		});

		it('meters to mm', () => {
			expect(units.to_mm(1, T_Unit.meter)).toBe(1000);
			expect(units.from_mm(1500, T_Unit.meter)).toBe(1.5);
		});

		it('cross-unit conversion', () => {
			// 1 foot = 12 inches
			expect(units.convert(1, T_Unit.foot, T_Unit.inch)).toBeCloseTo(12);
			// 1 meter = 100 cm
			expect(units.convert(1, T_Unit.meter, T_Unit.centimeter)).toBeCloseTo(100);
			// 1 yard = 3 feet
			expect(units.convert(1, T_Unit.yard, T_Unit.foot)).toBeCloseTo(3);
		});

		it('angstrom', () => {
			expect(units.to_mm(1, T_Unit.angstrom)).toBeCloseTo(1e-7);
			expect(units.from_mm(1e-7, T_Unit.angstrom)).toBeCloseTo(1);
		});

		it('nautical mile', () => {
			expect(units.to_mm(1, T_Unit.nautical_mile)).toBe(1_852_000);
		});

		it('cubit', () => {
			expect(units.to_mm(1, T_Unit.cubit)).toBe(457.2);
		});
	});

	// ═══════════════════════════════════════════════════════════════════
	// DATA ACCESS
	// ═══════════════════════════════════════════════════════════════════

	describe('data access', () => {
		it('symbol_for returns correct symbols', () => {
			expect(units.symbol_for(T_Unit.inch)).toBe('"');
			expect(units.symbol_for(T_Unit.foot)).toBe("'");
			expect(units.symbol_for(T_Unit.millimeter)).toBe(' mm');
			expect(units.symbol_for(T_Unit.meter)).toBe(' m');
		});

		it('system_units returns correct members', () => {
			const imperial = units.system_units(T_Unit_System.imperial);
			expect(imperial).toContain(T_Unit.inch);
			expect(imperial).toContain(T_Unit.foot);
			expect(imperial).toContain(T_Unit.yard);
			expect(imperial).toContain(T_Unit.mile);
			expect(imperial).toHaveLength(4);
		});

		it('system_units covers all systems', () => {
			expect(units.system_units(T_Unit_System.metric)).toHaveLength(7);
			expect(units.system_units(T_Unit_System.marine)).toHaveLength(2);
			expect(units.system_units(T_Unit_System.archaic)).toHaveLength(9);
		});

		it('is_imperial detects imperial units', () => {
			expect(units.is_imperial(T_Unit.inch)).toBe(true);
			expect(units.is_imperial(T_Unit.foot)).toBe(true);
			expect(units.is_imperial(T_Unit.meter)).toBe(false);
			expect(units.is_imperial(T_Unit.cubit)).toBe(false);
		});

		it('system_for finds correct system', () => {
			expect(units.system_for(T_Unit.inch)).toBe(T_Unit_System.imperial);
			expect(units.system_for(T_Unit.meter)).toBe(T_Unit_System.metric);
			expect(units.system_for(T_Unit.fathom)).toBe(T_Unit_System.marine);
			expect(units.system_for(T_Unit.cubit)).toBe(T_Unit_System.archaic);
		});
	});

	// ═══════════════════════════════════════════════════════════════════
	// FORMAT — metric/marine/archaic (decimal)
	// ═══════════════════════════════════════════════════════════════════

	describe('format — decimal', () => {
		it('mm in cm', () => {
			expect(units.format(1500, T_Unit.centimeter)).toBe('150 cm');
		});

		it('mm in meters', () => {
			expect(units.format(1500, T_Unit.meter)).toBe('1.5 m');
		});

		it('mm in mm (identity)', () => {
			expect(units.format(25.4, T_Unit.millimeter)).toBe('25.4 mm');
		});

		it('cubit', () => {
			expect(units.format(457.2, T_Unit.cubit)).toBe('1 cubit');
		});

		it('fathom', () => {
			expect(units.format(1828.8, T_Unit.fathom)).toBe('1 ftm');
		});

		it('zero', () => {
			expect(units.format(0, T_Unit.meter)).toBe('0 m');
		});
	});

	// ═══════════════════════════════════════════════════════════════════
	// FORMAT — imperial (fractional)
	// ═══════════════════════════════════════════════════════════════════

	describe('format — fractional', () => {
		it('whole inches', () => {
			expect(units.format(25.4, T_Unit.inch)).toBe('1"');
		});

		it('fractional inches', () => {
			expect(units.format(133.35, T_Unit.inch)).toBe('5 1/4"');
		});

		it('half inch', () => {
			expect(units.format(12.7, T_Unit.inch)).toBe('1/2"');
		});

		it('reduces fractions', () => {
			// 2/4 → 1/2
			expect(units.format(12.7, T_Unit.inch)).toBe('1/2"');
			// 3 inches exactly
			expect(units.format(76.2, T_Unit.inch)).toBe('3"');
		});

		it('zero inches', () => {
			expect(units.format(0, T_Unit.inch)).toBe('0"');
		});

		it('whole feet', () => {
			expect(units.format(304.8, T_Unit.foot)).toBe("1'");
		});
	});

	// ═══════════════════════════════════════════════════════════════════
	// FORMAT COMPOUND
	// ═══════════════════════════════════════════════════════════════════

	describe('format_compound', () => {
		it('feet and inches', () => {
			// 5 feet 3 inches = 5 * 304.8 + 3 * 25.4 = 1600.2
			expect(units.format_compound(1600.2)).toBe("5' 3\"");
		});

		it('feet and fractional inches', () => {
			// 5' 3 1/4" = 5 * 304.8 + 3.25 * 25.4 = 1606.55
			expect(units.format_compound(1606.55)).toBe("5' 3 1/4\"");
		});

		it('exact feet', () => {
			expect(units.format_compound(304.8)).toBe("1'");
		});

		it('inches only (less than a foot)', () => {
			expect(units.format_compound(25.4)).toBe('1"');
		});

		it('fractional inch only', () => {
			expect(units.format_compound(12.7)).toBe('1/2"');
		});

		it('zero', () => {
			expect(units.format_compound(0)).toBe('0"');
		});

		it('large value', () => {
			// 10 feet = 3048 mm
			expect(units.format_compound(3048)).toBe("10'");
		});
	});

	// ═══════════════════════════════════════════════════════════════════
	// PARSE — metric (decimal)
	// ═══════════════════════════════════════════════════════════════════

	describe('parse — decimal', () => {
		it('plain number in cm', () => {
			expect(units.parse('5.25', T_Unit.centimeter)).toBeCloseTo(52.5);
		});

		it('with unit suffix', () => {
			expect(units.parse('5.25 cm', T_Unit.centimeter)).toBeCloseTo(52.5);
		});

		it('integer', () => {
			expect(units.parse('100', T_Unit.millimeter)).toBe(100);
		});

		it('returns null for garbage', () => {
			expect(units.parse('abc', T_Unit.meter)).toBeNull();
		});

		it('returns null for empty string', () => {
			expect(units.parse('', T_Unit.meter)).toBeNull();
		});
	});

	// ═══════════════════════════════════════════════════════════════════
	// PARSE — imperial (fractional)
	// ═══════════════════════════════════════════════════════════════════

	describe('parse — fractional', () => {
		it('whole number in inches', () => {
			expect(units.parse('5', T_Unit.inch)).toBeCloseTo(127);
		});

		it('fraction in inches', () => {
			expect(units.parse('1/4', T_Unit.inch)).toBeCloseTo(6.35);
		});

		it('whole and fraction in inches', () => {
			expect(units.parse('5 1/4', T_Unit.inch)).toBeCloseTo(133.35);
		});

		it('decimal in inches', () => {
			expect(units.parse('5.25', T_Unit.inch)).toBeCloseTo(133.35);
		});

		it('division by zero returns null', () => {
			expect(units.parse('1/0', T_Unit.inch)).toBeNull();
		});
	});

	// ═══════════════════════════════════════════════════════════════════
	// PARSE — compound
	// ═══════════════════════════════════════════════════════════════════

	describe('parse — compound', () => {
		it('feet and inches', () => {
			expect(units.parse("5' 3\"", T_Unit.inch)).toBeCloseTo(1600.2);
		});

		it('feet and fractional inches', () => {
			expect(units.parse("5' 3 1/4\"", T_Unit.inch)).toBeCloseTo(1606.55);
		});

		it('feet only', () => {
			expect(units.parse("5'", T_Unit.inch)).toBeCloseTo(1524);
		});

		it('inches with symbol', () => {
			expect(units.parse('3 1/4"', T_Unit.inch)).toBeCloseTo(82.55);
		});
	});
});
