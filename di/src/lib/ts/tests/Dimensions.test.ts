import { describe, it, expect } from 'vitest';
import { convex_hull, ray_polygon_exit, push_outside_hull } from '../render/R_Dimensions';

// Rule 9 of crowded dimensionals — silhouette is one convex hull of all
// painted leaf parts' projected vertices. Rule 10 + 11 — the chosen witness
// direction's push distance is measured by how far an arrow from the
// candidate's home has to travel before exiting that hull.
//
// These helpers are pure (input → output, no scene state) and underpin both
// rules. Tested here against small hand-built point sets that are easy to
// reason about visually.

describe('convex_hull', () => {
	it('returns the input for two or fewer points', () => {
		expect(convex_hull([])).toEqual([]);
		expect(convex_hull([{ x: 1, y: 1 }])).toEqual([{ x: 1, y: 1 }]);
		expect(convex_hull([{ x: 1, y: 1 }, { x: 2, y: 2 }])).toEqual([{ x: 1, y: 1 }, { x: 2, y: 2 }]);
	});

	it('returns the four corners of a square unchanged', () => {
		const square = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
			{ x: 0, y: 10 },
		];
		const hull = convex_hull(square);
		expect(hull.length).toBe(4);
		// The hull must contain every corner regardless of order.
		for (const corner of square) {
			expect(hull).toContainEqual(corner);
		}
	});

	it('drops a point that sits inside the hull', () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
			{ x: 0, y: 10 },
			{ x: 5, y: 5 },  // interior point — should not appear in the hull
		];
		const hull = convex_hull(points);
		expect(hull.length).toBe(4);
		expect(hull).not.toContainEqual({ x: 5, y: 5 });
	});

	it('builds a triangle hull from points on its three vertices plus interior points', () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 5, y: 10 },
			{ x: 5, y: 3 },   // interior
			{ x: 5, y: 5 },   // interior
		];
		const hull = convex_hull(points);
		expect(hull.length).toBe(3);
		expect(hull).toContainEqual({ x: 0, y: 0 });
		expect(hull).toContainEqual({ x: 10, y: 0 });
		expect(hull).toContainEqual({ x: 5, y: 10 });
	});

	it('drops collinear points on a hull edge', () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 5, y: 0 },   // on the bottom edge — collinear, gets dropped
			{ x: 10, y: 0 },
			{ x: 5, y: 10 },
		];
		const hull = convex_hull(points);
		expect(hull.length).toBe(3);
		expect(hull).not.toContainEqual({ x: 5, y: 0 });
	});
});

describe('ray_polygon_exit', () => {
	const unit_square = [
		{ x: 0, y: 0 },
		{ x: 10, y: 0 },
		{ x: 10, y: 10 },
		{ x: 0, y: 10 },
	];

	it('returns -1 when the arrow does not cross the polygon', () => {
		// Arrow starts to the right of the square and points further right —
		// never touches the polygon.
		const exit = ray_polygon_exit(20, 5, 1, 0, unit_square);
		expect(exit).toBe(-1);
	});

	it('returns the far-edge distance when the arrow starts inside the polygon', () => {
		// Arrow from the center pointing right — far edge of the square is at
		// x=10, so the exit distance from x=5 is 5.
		const exit = ray_polygon_exit(5, 5, 1, 0, unit_square);
		expect(exit).toBeCloseTo(5, 6);
	});

	it('returns the far-edge distance when the arrow starts to the left of the polygon', () => {
		// Arrow from (-5, 5) pointing right — the arrow enters at x=0 and
		// exits at x=10. The far exit distance from x=-5 is 15.
		const exit = ray_polygon_exit(-5, 5, 1, 0, unit_square);
		expect(exit).toBeCloseTo(15, 6);
	});

	it('handles a non-axis-aligned arrow direction', () => {
		// Arrow from origin at 45 degrees through a square — the arrow exits
		// at the top-right corner (10, 10). The function returns the t
		// parameter where exit point = (ox + dx*t, oy + dy*t), so t=10 here.
		// Note: t is NOT euclidean distance for non-unit direction vectors —
		// callers must normalize if they need actual distance.
		const exit = ray_polygon_exit(0, 0, 1, 1, unit_square);
		expect(exit).toBeCloseTo(10, 6);
	});

	it('returns -1 when the polygon is entirely behind the arrow origin', () => {
		// Arrow at (20, 5) pointing further right — polygon is behind it.
		const exit = ray_polygon_exit(20, 5, 1, 0, unit_square);
		expect(exit).toBe(-1);
	});
});

// Outline barrier helper. Returns the push needed so a point sits at least
// `margin` units outside a convex polygon. Used by the dimension force pass
// so the spring can't quietly pull labels back inside the drawing's outline.

describe('push_outside_hull', () => {
	const square_10 = [
		{ x: 0, y: 0 },
		{ x: 10, y: 0 },
		{ x: 10, y: 10 },
		{ x: 0, y: 10 },
	];

	it('returns zero push when the polygon is too small (under three vertices)', () => {
		expect(push_outside_hull(0, 0, [], 5)).toEqual({ dx: 0, dy: 0 });
		expect(push_outside_hull(0, 0, [{ x: 1, y: 1 }], 5)).toEqual({ dx: 0, dy: 0 });
	});

	it('returns zero push when the point is already far outside the polygon', () => {
		// Point at (50, 5) is 40 units to the right of the square's right edge.
		const push = push_outside_hull(50, 5, square_10, 5);
		expect(push).toEqual({ dx: 0, dy: 0 });
	});

	it('returns zero push when the point sits exactly at the requested margin', () => {
		// Point at (15, 5) is 5 units past the right edge — equal to margin.
		const push = push_outside_hull(15, 5, square_10, 5);
		expect(push.dx).toBeCloseTo(0, 6);
		expect(push.dy).toBeCloseTo(0, 6);
	});

	it('pushes a point at the polygon centre out to its closest edge plus margin', () => {
		// Centre of the square is (5, 5). The closest edges are all equally far
		// (5 units), so any one of the four perpendicular directions counts.
		const push = push_outside_hull(5, 5, square_10, 3);
		// Total push amount is centre-to-edge (5) plus margin (3) = 8.
		const push_len = Math.sqrt(push.dx * push.dx + push.dy * push.dy);
		expect(push_len).toBeCloseTo(8, 6);
		// Push direction is axis-aligned (one component is zero).
		const axis_aligned = (Math.abs(push.dx) < 1e-6) !== (Math.abs(push.dy) < 1e-6);
		expect(axis_aligned).toBe(true);
	});

	it('pushes a point slightly inside to clear the closest edge plus margin', () => {
		// Point at (9, 5) — one unit inside the right edge, margin of 4.
		// Closest edge: right edge at x=10. Push outward by (margin - signed_dist) = (4 - (-1)) = 5.
		const push = push_outside_hull(9, 5, square_10, 4);
		expect(push.dx).toBeCloseTo(5, 6);
		expect(push.dy).toBeCloseTo(0, 6);
	});

	it('pushes a point just outside but within the margin out to the full margin', () => {
		// Point at (12, 5) — two units outside the right edge, margin of 5.
		// Push outward by (5 - 2) = 3.
		const push = push_outside_hull(12, 5, square_10, 5);
		expect(push.dx).toBeCloseTo(3, 6);
		expect(push.dy).toBeCloseTo(0, 6);
	});

	it('works the same whether the hull is wound clockwise or counter-clockwise', () => {
		const cw = [
			{ x: 0, y: 0 },
			{ x: 0, y: 10 },
			{ x: 10, y: 10 },
			{ x: 10, y: 0 },
		];
		const push_ccw = push_outside_hull(5, 5, square_10, 3);
		const push_cw = push_outside_hull(5, 5, cw, 3);
		// Both wind around the same shape, so a centre point must be pushed
		// the same total distance regardless of vertex order. (The chosen
		// outward direction can differ for ties, but the magnitude is fixed.)
		const len_ccw = Math.sqrt(push_ccw.dx ** 2 + push_ccw.dy ** 2);
		const len_cw = Math.sqrt(push_cw.dx ** 2 + push_cw.dy ** 2);
		expect(len_ccw).toBeCloseTo(8, 6);
		expect(len_cw).toBeCloseTo(8, 6);
	});

	it('picks the nearest edge as the outward direction for a point near one side', () => {
		// Point at (1, 5) — one unit inside the LEFT edge of the square.
		// Closest edge: left edge at x=0. Push should be in the negative-x direction.
		const push = push_outside_hull(1, 5, square_10, 2);
		// Push magnitude: (margin - signed_dist) = (2 - (-1)) = 3.
		expect(push.dx).toBeCloseTo(-3, 6);
		expect(push.dy).toBeCloseTo(0, 6);
	});
});
