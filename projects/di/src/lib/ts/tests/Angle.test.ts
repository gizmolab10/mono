import { describe, it, expect } from 'vitest';
import Angle, { T_Quadrant, T_Orientation, Direction } from '../types/Angle';
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

	describe('orientation_from_name', () => {
		it('returns T_Orientation.up for up', () => {
			expect(Angle.orientation_from_name('up')).toBe(T_Orientation.up);
		});

		it('returns T_Orientation.down for down', () => {
			expect(Angle.orientation_from_name('down')).toBe(T_Orientation.down);
		});

		it('returns T_Orientation.right for right', () => {
			expect(Angle.orientation_from_name('right')).toBe(T_Orientation.right);
		});

		it('returns T_Orientation.left for left', () => {
			expect(Angle.orientation_from_name('left')).toBe(T_Orientation.left);
		});

		it('returns null for unknown name', () => {
			expect(Angle.orientation_from_name('diagonal')).toBeNull();
		});
	});

	describe('quadrant_ofAngle', () => {
		it('returns upperRight for angle 0', () => {
			const a = new Angle(0);
			expect(a.quadrant_ofAngle).toBe(T_Quadrant.upperRight);
		});

		it('returns upperRight for small positive angle', () => {
			const a = new Angle(Math.PI / 4);  // 45 degrees
			expect(a.quadrant_ofAngle).toBe(T_Quadrant.upperRight);
		});

		it('returns upperLeft for angle π/2 to π', () => {
			const a = new Angle(Math.PI * 0.75);  // 135 degrees
			expect(a.quadrant_ofAngle).toBe(T_Quadrant.upperLeft);
		});

		it('returns lowerLeft for angle π to 3π/2', () => {
			const a = new Angle(Math.PI * 1.25);  // 225 degrees
			expect(a.quadrant_ofAngle).toBe(T_Quadrant.lowerLeft);
		});

		it('returns lowerRight for angle 3π/2 to 2π', () => {
			const a = new Angle(Math.PI * 1.75);  // 315 degrees
			expect(a.quadrant_ofAngle).toBe(T_Quadrant.lowerRight);
		});

		it('handles negative angles by normalizing', () => {
			const a = new Angle(-Math.PI / 4);  // -45 degrees = 315 degrees
			expect(a.quadrant_ofAngle).toBe(T_Quadrant.lowerRight);
		});
	});

	describe('octant_ofAngle', () => {
		it('returns 0 for angle near 0', () => {
			const a = new Angle(0);
			expect(a.octant_ofAngle).toBe(0);
		});

		it('returns correct octant for 45 degrees', () => {
			const a = new Angle(Math.PI / 4);
			expect(a.octant_ofAngle).toBe(1);
		});

		it('returns correct octant for 90 degrees', () => {
			const a = new Angle(Math.PI / 2);
			expect(a.octant_ofAngle).toBe(2);
		});

		it('returns correct octant for 180 degrees', () => {
			const a = new Angle(Math.PI);
			expect(a.octant_ofAngle).toBe(4);
		});

		it('returns correct octant for 270 degrees', () => {
			const a = new Angle(Math.PI * 1.5);
			expect(a.octant_ofAngle).toBe(6);
		});
	});

	describe('orientation_ofAngle', () => {
		it('returns right for angle near 0', () => {
			const a = new Angle(0.1);
			expect(a.orientation_ofAngle).toBe(T_Orientation.right);
		});

		it('returns up for angle near π/2', () => {
			const a = new Angle(Math.PI / 2);
			expect(a.orientation_ofAngle).toBe(T_Orientation.up);
		});

		it('returns left for angle near π', () => {
			const a = new Angle(Math.PI);
			expect(a.orientation_ofAngle).toBe(T_Orientation.left);
		});

		it('returns down for angle near 3π/2', () => {
			const a = new Angle(Math.PI * 1.5);
			expect(a.orientation_ofAngle).toBe(T_Orientation.down);
		});
	});

	describe('angle_points_* helpers', () => {
		it('angle_points_up returns true for upper quadrants', () => {
			expect(new Angle(Math.PI / 4).angle_points_up).toBe(true);
			expect(new Angle(Math.PI * 0.75).angle_points_up).toBe(true);
		});

		it('angle_points_up returns false for lower quadrants', () => {
			expect(new Angle(Math.PI * 1.25).angle_points_up).toBe(false);
			expect(new Angle(Math.PI * 1.75).angle_points_up).toBe(false);
		});

		it('angle_points_right returns true for right quadrants', () => {
			expect(new Angle(Math.PI / 4).angle_points_right).toBe(true);
			expect(new Angle(Math.PI * 1.75).angle_points_right).toBe(true);
		});

		it('angle_points_right returns false for left quadrants', () => {
			expect(new Angle(Math.PI * 0.75).angle_points_right).toBe(false);
			expect(new Angle(Math.PI * 1.25).angle_points_right).toBe(false);
		});

		it('angle_points_down returns true for down orientation', () => {
			expect(new Angle(Math.PI * 1.5).angle_points_down).toBe(true);
		});
	});

	describe('cursor_forAngle', () => {
		it('returns ns-resize for angle 0', () => {
			const a = new Angle(0);
			expect(a.cursor_forAngle).toBe('ns-resize');
		});

		it('returns ew-resize for horizontal angles', () => {
			const a = new Angle(Math.PI / 2);
			expect(a.cursor_forAngle).toBe('ew-resize');
		});

		it('returns diagonal cursor for 45 degree angles', () => {
			const a = new Angle(Math.PI / 4);
			expect(a.cursor_forAngle).toBe('nwse-resize');
		});
	});

	describe('quadrant_basis_angle', () => {
		it('returns 0 for upperRight', () => {
			const a = new Angle(Math.PI / 4);
			expect(a.quadrant_basis_angle).toBe(0);
		});

		it('returns quarter for upperLeft', () => {
			const a = new Angle(Math.PI * 0.75);
			expect(a.quadrant_basis_angle).toBe(Angle.quarter);
		});

		it('returns half for lowerLeft', () => {
			const a = new Angle(Math.PI * 1.25);
			expect(a.quadrant_basis_angle).toBe(Angle.half);
		});

		it('returns three_quarters for lowerRight', () => {
			const a = new Angle(Math.PI * 1.75);
			expect(a.quadrant_basis_angle).toBe(Angle.three_quarters);
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

describe('T_Quadrant enum', () => {
	it('has correct string values', () => {
		expect(T_Quadrant.upperRight).toBe('ur');
		expect(T_Quadrant.upperLeft).toBe('ul');
		expect(T_Quadrant.lowerLeft).toBe('ll');
		expect(T_Quadrant.lowerRight).toBe('lr');
	});
});

describe('T_Orientation enum', () => {
	it('has correct string values', () => {
		expect(T_Orientation.right).toBe('right');
		expect(T_Orientation.left).toBe('left');
		expect(T_Orientation.up).toBe('up');
		expect(T_Orientation.down).toBe('down');
	});
});
