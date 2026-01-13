import { T_Quadrant, T_Orientation } from '../types/Angle';
import { Point } from '../types/Coordinates';
import Angle from '../types/Angle';

describe('Point', () => {
	it('create a vector', () => {
		const point = new Point(1, 2);
		expect(point.x).toBe(1);
		expect(point.y).toBe(2);
	});
	
	it('negate a vector', () => {
		const point = new Point(1, 2).negated;
		expect(point.x).toBe(-1);
		expect(point.y).toBe(-2);
	});

	it('add two vectors', () => {
		const point1 = new Point(1, 2);
		const point2 = new Point(3, 4);
		const result = point1.offsetBy(point2);
		expect(result.x).toBe(4);
		expect(result.y).toBe(6);
	});

	it('vector magnitude', () => {
		const point = new Point(1, 2);
		const magnitude = point.magnitude;
		const squared = point.x * point.x + point.y * point.y;
		expect(magnitude).toBe(Math.sqrt(squared));
	});

});

describe('Angle', () => {

	it('vector from polar', () => {
		const point = Point.fromPolar(Math.sqrt(2), Math.PI / 4);
		expect(point.x).toBeCloseTo(1);
		expect(point.y).toBeCloseTo(-1);	// in browser coordinates, negative y is above x axis
	});

	it('vector angle', () => {
		const point = new Point(2, -2);	// in browser coordinates, negative y is above x axis
		const angle = point.angle;
		expect(angle).toBe(Math.PI / 4);
	});

	it('quadrant', () => {
		expect(new Angle(Math.PI / 3).quadrant_ofAngle).toBe(T_Quadrant.upperRight);	// 60° is in upper right quadrant
	});

	it('orientation', () => {
		expect(new Angle(Math.PI / 3).orientation_ofAngle).toBe(T_Orientation.up);		//	60° orients up
		expect(new Angle(Math.PI / 2).orientation_ofAngle).toBe(T_Orientation.up);		//	90° orients up
		expect(new Angle(Math.PI / 6).orientation_ofAngle).toBe(T_Orientation.right);	//	30° orients right
		expect(new Angle(Math.PI * 1.25).orientation_ofAngle).toBe(T_Orientation.down);	// 205° orients down
	});

});
