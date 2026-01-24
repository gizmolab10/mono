import { describe, it, expect } from 'vitest';
import { Point, Size, Rect, Polar, Point3, Size3, Block } from '../types/Coordinates';
import '../common/Extensions';

describe('Point', () => {
	describe('constructor', () => {
		it('creates point with default values', () => {
			const p = new Point();
			expect(p.x).toBe(0);
			expect(p.y).toBe(0);
		});

		it('creates point with specified values', () => {
			const p = new Point(3, 4);
			expect(p.x).toBe(3);
			expect(p.y).toBe(4);
		});
	});

	describe('magnitude', () => {
		it('calculates magnitude for 3-4-5 triangle', () => {
			const p = new Point(3, 4);
			expect(p.magnitude).toBe(5);
		});

		it('returns 0 for zero point', () => {
			expect(Point.zero.magnitude).toBe(0);
		});
	});

	describe('arithmetic', () => {
		it('offsets by another point', () => {
			const p1 = new Point(1, 2);
			const p2 = new Point(3, 4);
			const result = p1.offsetBy(p2);
			expect(result.x).toBe(4);
			expect(result.y).toBe(6);
		});

		it('negates correctly', () => {
			const p = new Point(3, -4);
			const neg = p.negated;
			expect(neg.x).toBe(-3);
			expect(neg.y).toBe(4);
		});

		it('multiplies equally', () => {
			const p = new Point(2, 3);
			const result = p.multipliedEquallyBy(4);
			expect(result.x).toBe(8);
			expect(result.y).toBe(12);
		});

		it('divides equally', () => {
			const p = new Point(10, 20);
			const result = p.dividedEquallyBy(2);
			expect(result.x).toBe(5);
			expect(result.y).toBe(10);
		});

		it('calculates vector_to', () => {
			const p1 = new Point(1, 1);
			const p2 = new Point(4, 5);
			const vec = p1.vector_to(p2);
			expect(vec.x).toBe(3);
			expect(vec.y).toBe(4);
		});
	});

	describe('rotate_by', () => {
		it('rotates point on x-axis by 90 degrees', () => {
			const p = new Point(1, 0);
			const rotated = p.rotate_by(Math.PI / 2);
			expect(rotated.x).toBeCloseTo(0, 10);
			expect(rotated.y).toBeCloseTo(-1, 10);  // browser coords: y inverted
		});

		it('rotates point by 180 degrees', () => {
			const p = new Point(1, 0);
			const rotated = p.rotate_by(Math.PI);
			expect(rotated.x).toBeCloseTo(-1, 10);
			expect(rotated.y).toBeCloseTo(0, 10);
		});
	});

	describe('static constructors', () => {
		it('creates point from x only', () => {
			const p = Point.x(5);
			expect(p.x).toBe(5);
			expect(p.y).toBe(0);
		});

		it('creates point from y only', () => {
			const p = Point.y(7);
			expect(p.x).toBe(0);
			expect(p.y).toBe(7);
		});

		it('creates square point', () => {
			const p = Point.square(3);
			expect(p.x).toBe(3);
			expect(p.y).toBe(3);
		});
	});

	describe('equals', () => {
		it('returns true for equal points', () => {
			const p1 = new Point(1, 2);
			const p2 = new Point(1, 2);
			expect(p1.equals(p2)).toBe(true);
		});

		it('returns false for different points', () => {
			const p1 = new Point(1, 2);
			const p2 = new Point(1, 3);
			expect(p1.equals(p2)).toBe(false);
		});
	});
});

describe('Size', () => {
	describe('constructor', () => {
		it('creates size with default values', () => {
			const s = new Size();
			expect(s.width).toBe(0);
			expect(s.height).toBe(0);
		});

		it('creates size with specified values', () => {
			const s = new Size(100, 200);
			expect(s.width).toBe(100);
			expect(s.height).toBe(200);
		});
	});

	describe('center', () => {
		it('calculates center correctly', () => {
			const s = new Size(100, 200);
			const c = s.center;
			expect(c.x).toBe(50);
			expect(c.y).toBe(100);
		});
	});

	describe('arithmetic', () => {
		it('insets equally', () => {
			const s = new Size(100, 100);
			const inset = s.insetEquallyBy(10);
			expect(inset.width).toBe(80);
			expect(inset.height).toBe(80);
		});

		it('extends by delta', () => {
			const s = new Size(100, 100);
			const extended = s.extendedBy(new Point(10, 20));
			expect(extended.width).toBe(110);
			expect(extended.height).toBe(120);
		});
	});
});

describe('Rect', () => {
	describe('constructor', () => {
		it('creates rect with defaults', () => {
			const r = new Rect();
			expect(r.x).toBe(0);
			expect(r.y).toBe(0);
			expect(r.width).toBe(0);
			expect(r.height).toBe(0);
		});

		it('creates rect with origin and size', () => {
			const r = new Rect(new Point(10, 20), new Size(100, 200));
			expect(r.x).toBe(10);
			expect(r.y).toBe(20);
			expect(r.width).toBe(100);
			expect(r.height).toBe(200);
		});
	});

	describe('derived properties', () => {
		const r = new Rect(new Point(10, 20), new Size(100, 200));

		it('calculates extent', () => {
			expect(r.extent.x).toBe(110);
			expect(r.extent.y).toBe(220);
		});

		it('calculates center', () => {
			expect(r.center.x).toBe(60);
			expect(r.center.y).toBe(120);
		});

		it('calculates corners', () => {
			expect(r.topRight.equals(new Point(110, 20))).toBe(true);
			expect(r.bottomLeft.equals(new Point(10, 220))).toBe(true);
		});
	});

	describe('contains', () => {
		const r = new Rect(new Point(0, 0), new Size(100, 100));

		it('returns true for point inside', () => {
			expect(r.contains(new Point(50, 50))).toBe(true);
		});

		it('returns true for point on edge', () => {
			expect(r.contains(new Point(0, 0))).toBe(true);
			expect(r.contains(new Point(100, 100))).toBe(true);
		});

		it('returns false for point outside', () => {
			expect(r.contains(new Point(150, 50))).toBe(false);
			expect(r.contains(new Point(-1, 50))).toBe(false);
		});
	});

	describe('intersects', () => {
		const r1 = new Rect(new Point(0, 0), new Size(100, 100));

		it('returns true for overlapping rects', () => {
			const r2 = new Rect(new Point(50, 50), new Size(100, 100));
			expect(r1.intersects(r2)).toBe(true);
		});

		it('returns true for touching rects', () => {
			const r2 = new Rect(new Point(100, 0), new Size(100, 100));
			expect(r1.intersects(r2)).toBe(true);
		});

		it('returns false for non-overlapping rects', () => {
			const r2 = new Rect(new Point(200, 200), new Size(100, 100));
			expect(r1.intersects(r2)).toBe(false);
		});
	});

	describe('static constructors', () => {
		it('creates centered rect', () => {
			const r = Rect.createCenterRect(new Point(50, 50), new Size(20, 20));
			expect(r.x).toBe(40);
			expect(r.y).toBe(40);
			expect(r.center.x).toBe(50);
			expect(r.center.y).toBe(50);
		});
	});
});

describe('Point3', () => {
	it('creates 3D point', () => {
		const p = new Point3(1, 2, 3);
		expect(p.x).toBe(1);
		expect(p.y).toBe(2);
		expect(p.z).toBe(3);
	});

	it('calculates magnitude', () => {
		const p = new Point3(1, 2, 2);
		expect(p.magnitude).toBe(3);
	});

	it('calculates cross product', () => {
		const p1 = new Point3(1, 0, 0);
		const p2 = new Point3(0, 1, 0);
		const cross = p1.cross(p2);
		expect(cross.x).toBe(0);
		expect(cross.y).toBe(0);
		expect(cross.z).toBe(1);
	});

	it('calculates dot product', () => {
		const p1 = new Point3(1, 2, 3);
		const p2 = new Point3(4, 5, 6);
		expect(p1.dot(p2)).toBe(32);  // 1*4 + 2*5 + 3*6
	});

	it('normalizes vector', () => {
		const p = new Point3(3, 0, 4);
		const n = p.normalized;
		expect(n.x).toBeCloseTo(0.6, 10);
		expect(n.y).toBe(0);
		expect(n.z).toBeCloseTo(0.8, 10);
		expect(n.magnitude).toBeCloseTo(1, 10);
	});
});

describe('Polar', () => {
	it('converts to Point', () => {
		const polar = new Polar(1, 0);
		const point = polar.asPoint;
		expect(point.x).toBeCloseTo(1, 10);
		expect(point.y).toBeCloseTo(0, 10);
	});

	it('converts 45 degrees', () => {
		const polar = new Polar(Math.sqrt(2), Math.PI / 4);
		const point = polar.asPoint;
		expect(point.x).toBeCloseTo(1, 10);
		expect(point.y).toBeCloseTo(-1, 10);  // browser coords
	});
});
