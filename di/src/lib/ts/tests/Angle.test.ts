import { describe, it, expect } from 'vitest';
import Angle, { Direction } from '../types/Angle';
import '../common/Extensions';

describe('Angle', () => {
	describe('static constants', () => {
		it('defines full rotation as 2π', () => {
			expect(Angle.full).toBe(Math.PI * 2);
		});

		it('defines half rotation as π', () => {
			expect(Angle.half).toBe(Math.PI);
		});

		it('defines quarter rotation as π/2', () => {
			expect(Angle.quarter).toBe(Math.PI / 2);
		});

		it('defines three_quarters as 3π/2', () => {
			expect(Angle.three_quarters).toBe(Math.PI * 1.5);
		});
	});

	describe('radians_from_degrees', () => {
		it('converts 0 degrees', () => {
			expect(Angle.radians_from_degrees(0)).toBe(0);
		});

		it('converts 90 degrees', () => {
			expect(Angle.radians_from_degrees(90)).toBeCloseTo(Math.PI / 2, 10);
		});

		it('converts 180 degrees', () => {
			expect(Angle.radians_from_degrees(180)).toBeCloseTo(Math.PI, 10);
		});

		it('converts 360 degrees', () => {
			expect(Angle.radians_from_degrees(360)).toBeCloseTo(Math.PI * 2, 10);
		});
	});

	describe('angle_from_name', () => {
		it('returns correct angle for up', () => {
			expect(Angle.angle_from_name('up')).toBe(-Math.PI / 2);
		});

		it('returns correct angle for down', () => {
			expect(Angle.angle_from_name('down')).toBe(Math.PI / 2);
		});

		it('returns correct angle for right', () => {
			expect(Angle.angle_from_name('right')).toBe(Math.PI);
		});

		it('returns correct angle for left', () => {
			expect(Angle.angle_from_name('left')).toBe(0);
		});

		it('returns null for unknown name', () => {
			expect(Angle.angle_from_name('diagonal')).toBeNull();
		});
	});
});

describe('Direction enum', () => {
	it('maps up to three_quarters (270 degrees)', () => {
		expect(Direction.up).toBe(Angle.three_quarters);
	});

	it('maps down to quarter (90 degrees)', () => {
		expect(Direction.down).toBe(Angle.quarter);
	});

	it('maps right to half (180 degrees)', () => {
		expect(Direction.right).toBe(Angle.half);
	});

	it('maps left to zero', () => {
		expect(Direction.left).toBe(Angle.zero);
	});
});

describe('Angle.angle_of', () => {
	it('returns 0 for point on positive x-axis', () => {
		expect(Angle.angle_of(1, 0)).toBeCloseTo(0, 10);
	});

	it('returns π/2 for point above (negative y in browser)', () => {
		expect(Angle.angle_of(0, -1)).toBeCloseTo(Math.PI / 2, 10);
	});

	it('flips browser-Y convention', () => {
		// in browser coords, positive y is down, so (0, 1) points down = -π/2
		expect(Angle.angle_of(0, 1)).toBeCloseTo(-Math.PI / 2, 10);
	});
});

describe('Angle.rotate_xy', () => {
	it('rotates point on x-axis by 90 degrees', () => {
		const [rx, ry] = Angle.rotate_xy(1, 0, Math.PI / 2);
		expect(rx).toBeCloseTo(0, 10);
		expect(ry).toBeCloseTo(-1, 10);  // browser coords: y inverted
	});

	it('rotates point by 180 degrees', () => {
		const [rx, ry] = Angle.rotate_xy(1, 0, Math.PI);
		expect(rx).toBeCloseTo(-1, 10);
		expect(ry).toBeCloseTo(0, 10);
	});
});
