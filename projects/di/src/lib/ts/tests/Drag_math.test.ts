import { describe, it, expect } from 'vitest';
import { vec3 } from 'gl-matrix';
import { ray_plane_hit, decompose_delta } from '../editors/Drag';

// ── ray_plane_hit ──

describe('ray_plane_hit', () => {
	it('ray straight down onto a horizontal floor hits directly below', () => {
		const origin: vec3 = [0, 0, 10];
		const dir: vec3    = [0, 0, -1];
		const plane_pt: vec3   = [0, 0, 0];
		const plane_n: vec3    = [0, 0, 1];
		const hit = ray_plane_hit(origin, dir, plane_pt, plane_n);
		expect(hit[0]).toBeCloseTo(0, 5);
		expect(hit[1]).toBeCloseTo(0, 5);
		expect(hit[2]).toBeCloseTo(0, 5);
	});

	it('ray at 45 degrees onto a horizontal floor lands offset by the drop distance', () => {
		const origin: vec3 = [0, 0, 10];
		const dir = vec3.normalize(vec3.create(), [1, 0, -1]);
		const plane_pt: vec3 = [0, 0, 0];
		const plane_n: vec3  = [0, 0, 1];
		const hit = ray_plane_hit(origin, dir, plane_pt, plane_n);
		expect(hit[0]).toBeCloseTo(10, 4);
		expect(hit[1]).toBeCloseTo(0, 5);
		expect(hit[2]).toBeCloseTo(0, 4);
	});

	it('ray parallel to the plane returns the ray origin as a safe fallback', () => {
		const origin: vec3 = [5, 5, 10];
		const dir: vec3    = [1, 0, 0];
		const plane_pt: vec3 = [0, 0, 0];
		const plane_n: vec3  = [0, 0, 1];
		const hit = ray_plane_hit(origin, dir, plane_pt, plane_n);
		// denom is 0 → t is 0 → result is origin
		expect(hit[0]).toBeCloseTo(5, 5);
		expect(hit[1]).toBeCloseTo(5, 5);
		expect(hit[2]).toBeCloseTo(10, 5);
	});

	it('hit on a tilted plane lies on the plane', () => {
		const origin: vec3 = [0, 0, 10];
		const dir: vec3    = [0, 0, -1];
		const plane_pt: vec3 = [0, 0, 0];
		const plane_n = vec3.normalize(vec3.create(), [0, 1, 1]);
		const hit = ray_plane_hit(origin, dir, plane_pt, plane_n);
		// Verify the hit point lies on the plane: dot(hit - plane_pt, normal) ≈ 0
		const diff = vec3.sub(vec3.create(), hit, plane_pt);
		expect(vec3.dot(diff, plane_n)).toBeCloseTo(0, 5);
	});

	it('ray from behind the plane still finds the intersection', () => {
		const origin: vec3 = [0, 0, -5];
		const dir: vec3    = [0, 0, 1];
		const plane_pt: vec3 = [0, 0, 0];
		const plane_n: vec3  = [0, 0, 1];
		const hit = ray_plane_hit(origin, dir, plane_pt, plane_n);
		expect(hit[2]).toBeCloseTo(0, 5);
	});
});

// ── decompose_delta ──

describe('decompose_delta', () => {
	it('delta along the first edge produces a result along the first local edge', () => {
		const delta: vec3    = [10, 0, 0];
		const e1_world: vec3 = [1, 0, 0];
		const e2_world: vec3 = [0, 1, 0];
		const e1_local: vec3 = [5, 0, 0];
		const e2_local: vec3 = [0, 3, 0];
		const result = decompose_delta(delta, e1_world, e2_world, e1_local, e2_local);
		expect(result).not.toBeNull();
		// coefficient along e1 is 10/1 = 10, result = 10 * e1_local = [50, 0, 0]
		expect(result![0]).toBeCloseTo(50, 5);
		expect(result![1]).toBeCloseTo(0, 5);
		expect(result![2]).toBeCloseTo(0, 5);
	});

	it('delta along the second edge produces a result along the second local edge', () => {
		const delta: vec3    = [0, 7, 0];
		const e1_world: vec3 = [1, 0, 0];
		const e2_world: vec3 = [0, 1, 0];
		const e1_local: vec3 = [5, 0, 0];
		const e2_local: vec3 = [0, 3, 0];
		const result = decompose_delta(delta, e1_world, e2_world, e1_local, e2_local);
		expect(result).not.toBeNull();
		// coefficient along e2 is 7/1 = 7, result = 7 * e2_local = [0, 21, 0]
		expect(result![0]).toBeCloseTo(0, 5);
		expect(result![1]).toBeCloseTo(21, 5);
		expect(result![2]).toBeCloseTo(0, 5);
	});

	it('diagonal delta between two equal orthogonal edges gives equal components', () => {
		const delta: vec3    = [1, 1, 0];
		const e1_world: vec3 = [1, 0, 0];
		const e2_world: vec3 = [0, 1, 0];
		const e1_local: vec3 = [1, 0, 0];
		const e2_local: vec3 = [0, 1, 0];
		const result = decompose_delta(delta, e1_world, e2_world, e1_local, e2_local);
		expect(result).not.toBeNull();
		expect(result![0]).toBeCloseTo(1, 5);
		expect(result![1]).toBeCloseTo(1, 5);
	});

	it('zero delta returns zero', () => {
		const delta: vec3    = [0, 0, 0];
		const e1_world: vec3 = [1, 0, 0];
		const e2_world: vec3 = [0, 1, 0];
		const e1_local: vec3 = [1, 0, 0];
		const e2_local: vec3 = [0, 1, 0];
		const result = decompose_delta(delta, e1_world, e2_world, e1_local, e2_local);
		expect(result).not.toBeNull();
		expect(result![0]).toBeCloseTo(0, 5);
		expect(result![1]).toBeCloseTo(0, 5);
		expect(result![2]).toBeCloseTo(0, 5);
	});

	it('returns null for zero-length edge vectors', () => {
		const delta: vec3    = [1, 0, 0];
		const e1_world: vec3 = [0, 0, 0];
		const e2_world: vec3 = [0, 1, 0];
		const e1_local: vec3 = [1, 0, 0];
		const e2_local: vec3 = [0, 1, 0];
		expect(decompose_delta(delta, e1_world, e2_world, e1_local, e2_local)).toBeNull();
	});

	it('works with rotated world edges — rotation preserves decomposition', () => {
		// World edges are rotated 90 degrees around Z: e1 now points in +Y, e2 in -X
		const e1_world: vec3 = [0, 1, 0];
		const e2_world: vec3 = [-1, 0, 0];
		const e1_local: vec3 = [1, 0, 0];
		const e2_local: vec3 = [0, 1, 0];
		// World delta is [0, 5, 0] — purely along e1_world
		const delta: vec3 = [0, 5, 0];
		const result = decompose_delta(delta, e1_world, e2_world, e1_local, e2_local);
		expect(result).not.toBeNull();
		// Should map to 5 * e1_local = [5, 0, 0]
		expect(result![0]).toBeCloseTo(5, 5);
		expect(result![1]).toBeCloseTo(0, 5);
	});

	it('works with scaled world edges — world displacement maps proportionally to local', () => {
		// World edge is 100 units long, local edge is 10 units (10:1 ratio)
		const e1_world: vec3 = [100, 0, 0];
		const e2_world: vec3 = [0, 100, 0];
		const e1_local: vec3 = [10, 0, 0];
		const e2_local: vec3 = [0, 10, 0];
		// World delta of 50 along e1 → coefficient = 5000/10000 = 0.5 → local = 0.5 * 10 = 5
		const delta: vec3 = [50, 0, 0];
		const result = decompose_delta(delta, e1_world, e2_world, e1_local, e2_local);
		expect(result).not.toBeNull();
		expect(result![0]).toBeCloseTo(5, 5);
		expect(result![1]).toBeCloseTo(0, 5);
	});
});
