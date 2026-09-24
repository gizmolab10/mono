import { describe, it, expect } from 'vitest';
import { Point } from '../types/Coordinates';
import type { Projected } from '../types/Interfaces';

// Test the pure geometry functions extracted from Hits_3D
// These don't need the full class machinery

// --- Helpers to create test data ---

function proj(x: number, y: number, z = 0, w = 1): Projected {
	return { x, y, z, w };
}

// --- Point near segment (edge hit detection) ---

function point_near_segment(point: Point, a: Projected, b: Projected, radius: number): boolean {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len_sq = dx * dx + dy * dy;
	if (len_sq === 0) return false;
	const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len_sq));
	const proj_x = a.x + t * dx;
	const proj_y = a.y + t * dy;
	const dist_sq = (point.x - proj_x) ** 2 + (point.y - proj_y) ** 2;
	return dist_sq < radius * radius;
}

describe('point_near_segment', () => {
	const radius = 5;

	it('returns true when point is on segment', () => {
		const a = proj(0, 0);
		const b = proj(100, 0);
		expect(point_near_segment(new Point(50, 0), a, b, radius)).toBe(true);
	});

	it('returns true when point is near segment', () => {
		const a = proj(0, 0);
		const b = proj(100, 0);
		expect(point_near_segment(new Point(50, 3), a, b, radius)).toBe(true);
	});

	it('returns false when point is far from segment', () => {
		const a = proj(0, 0);
		const b = proj(100, 0);
		expect(point_near_segment(new Point(50, 10), a, b, radius)).toBe(false);
	});

	it('returns true near endpoint a', () => {
		const a = proj(0, 0);
		const b = proj(100, 0);
		expect(point_near_segment(new Point(2, 2), a, b, radius)).toBe(true);
	});

	it('returns true near endpoint b', () => {
		const a = proj(0, 0);
		const b = proj(100, 0);
		expect(point_near_segment(new Point(98, 2), a, b, radius)).toBe(true);
	});

	it('returns false beyond endpoints', () => {
		const a = proj(0, 0);
		const b = proj(100, 0);
		// Point is on the line but past endpoint b
		expect(point_near_segment(new Point(110, 0), a, b, radius)).toBe(false);
	});

	it('returns false for zero-length segment', () => {
		const a = proj(50, 50);
		const b = proj(50, 50);
		expect(point_near_segment(new Point(50, 50), a, b, radius)).toBe(false);
	});

	it('works with diagonal segments', () => {
		const a = proj(0, 0);
		const b = proj(100, 100);
		// Point on diagonal
		expect(point_near_segment(new Point(50, 50), a, b, radius)).toBe(true);
		// Point near diagonal
		expect(point_near_segment(new Point(52, 48), a, b, radius)).toBe(true);
		// Point far from diagonal
		expect(point_near_segment(new Point(60, 40), a, b, radius)).toBe(false);
	});
});

// --- Is front facing (face visibility) ---

function is_front_facing(face: number[], projected: Projected[]): boolean {
	if (face.length < 3) return false;
	const p0 = projected[face[0]];
	const p1 = projected[face[1]];
	const p2 = projected[face[2]];
	if (p0.w < 0 || p1.w < 0 || p2.w < 0) return false;
	// 2D cross product: (p1-p0) × (p2-p0)
	// Negative = CCW in screen coords (y-down) = front-facing
	const cross = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
	return cross < 0;
}

describe('is_front_facing', () => {
	it('returns true for CW winding in screen coords (front-facing)', () => {
		// CW visually in y-down screen coords = negative cross product = front-facing
		// 0,0 -> 0,100 -> 100,100 forms CW triangle
		const projected = [proj(0, 0), proj(0, 100), proj(100, 100)];
		const face = [0, 1, 2];
		expect(is_front_facing(face, projected)).toBe(true);
	});

	it('returns false for CCW winding in screen coords (back-facing)', () => {
		// CCW visually in y-down screen coords = positive cross product = back-facing
		// 0,0 -> 100,0 -> 100,100 forms CCW triangle
		const projected = [proj(0, 0), proj(100, 0), proj(100, 100)];
		const face = [0, 1, 2];
		expect(is_front_facing(face, projected)).toBe(false);
	});

	it('returns false for degenerate face (< 3 vertices)', () => {
		const projected = [proj(0, 0), proj(100, 0)];
		expect(is_front_facing([0, 1], projected)).toBe(false);
		expect(is_front_facing([0], projected)).toBe(false);
		expect(is_front_facing([], projected)).toBe(false);
	});

	it('returns false when any vertex is behind camera (w < 0)', () => {
		const projected = [proj(0, 0, 0, 1), proj(100, 0, 0, 1), proj(100, 100, 0, -1)];
		const face = [0, 1, 2];
		expect(is_front_facing(face, projected)).toBe(false);
	});

	it('handles quad faces (uses first 3 vertices)', () => {
		// Quad: CW winding in screen coords (front-facing)
		const projected = [proj(0, 0), proj(0, 100), proj(100, 100), proj(100, 0)];
		const face = [0, 1, 2, 3];
		expect(is_front_facing(face, projected)).toBe(true);
	});
});

// --- Point in polygon (face hit detection) ---

function point_in_polygon(point: Point, face: number[], projected: Projected[]): boolean {
	let inside = false;
	const n = face.length;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const pi = projected[face[i]];
		const pj = projected[face[j]];
		if (pi.w < 0 || pj.w < 0) return false;
		if (((pi.y > point.y) !== (pj.y > point.y)) &&
			(point.x < (pj.x - pi.x) * (point.y - pi.y) / (pj.y - pi.y) + pi.x)) {
			inside = !inside;
		}
	}
	return inside;
}

describe('point_in_polygon', () => {
	describe('triangle', () => {
		const projected = [proj(0, 0), proj(100, 0), proj(50, 100)];
		const face = [0, 1, 2];

		it('returns true for point inside', () => {
			expect(point_in_polygon(new Point(50, 50), face, projected)).toBe(true);
		});

		it('returns false for point outside', () => {
			expect(point_in_polygon(new Point(150, 50), face, projected)).toBe(false);
			expect(point_in_polygon(new Point(-10, 50), face, projected)).toBe(false);
			expect(point_in_polygon(new Point(50, 150), face, projected)).toBe(false);
		});

		it('returns true for point near centroid', () => {
			// Centroid of triangle at (0,0), (100,0), (50,100) is (50, 33.33)
			expect(point_in_polygon(new Point(50, 33), face, projected)).toBe(true);
		});
	});

	describe('square', () => {
		const projected = [proj(0, 0), proj(100, 0), proj(100, 100), proj(0, 100)];
		const face = [0, 1, 2, 3];

		it('returns true for point inside', () => {
			expect(point_in_polygon(new Point(50, 50), face, projected)).toBe(true);
		});

		it('returns true for point in corner region', () => {
			expect(point_in_polygon(new Point(10, 10), face, projected)).toBe(true);
			expect(point_in_polygon(new Point(90, 90), face, projected)).toBe(true);
		});

		it('returns false for point outside', () => {
			expect(point_in_polygon(new Point(150, 50), face, projected)).toBe(false);
			expect(point_in_polygon(new Point(50, 150), face, projected)).toBe(false);
		});
	});

	it('returns false when any vertex is behind camera', () => {
		const projected = [proj(0, 0, 0, 1), proj(100, 0, 0, -1), proj(50, 100, 0, 1)];
		const face = [0, 1, 2];
		expect(point_in_polygon(new Point(50, 50), face, projected)).toBe(false);
	});
});

// --- Corner hit detection (distance check) ---

function test_corner(point: Point, projected: Projected, radius: number): boolean {
	if (projected.w < 0) return false;
	const dx = point.x - projected.x;
	const dy = point.y - projected.y;
	return dx * dx + dy * dy < radius * radius;
}

describe('test_corner', () => {
	const radius = 8;

	it('returns true when point is on corner', () => {
		expect(test_corner(new Point(50, 50), proj(50, 50), radius)).toBe(true);
	});

	it('returns true when point is within radius', () => {
		expect(test_corner(new Point(55, 50), proj(50, 50), radius)).toBe(true);
		expect(test_corner(new Point(50, 55), proj(50, 50), radius)).toBe(true);
	});

	it('returns false when point is outside radius', () => {
		expect(test_corner(new Point(60, 50), proj(50, 50), radius)).toBe(false);
	});

	it('returns false when vertex is behind camera', () => {
		expect(test_corner(new Point(50, 50), proj(50, 50, 0, -1), radius)).toBe(false);
	});

	it('handles edge of radius (exclusive)', () => {
		// At exactly radius distance, should be false (< not <=)
		expect(test_corner(new Point(58, 50), proj(50, 50), radius)).toBe(false);
		expect(test_corner(new Point(57.9, 50), proj(50, 50), radius)).toBe(true);
	});
});

// --- Face flip logic (XOR for opposite face) ---

describe('opposite face index', () => {
	it('XOR with 1 swaps paired faces', () => {
		expect(0 ^ 1).toBe(1);
		expect(1 ^ 1).toBe(0);
		expect(2 ^ 1).toBe(3);
		expect(3 ^ 1).toBe(2);
		expect(4 ^ 1).toBe(5);
		expect(5 ^ 1).toBe(4);
	});
});
