import { describe, it, expect, beforeEach } from 'vitest';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { camera } from '../render/Camera';
import { Size } from '../types/Coordinates';

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const SCREEN_W = 100;
const SCREEN_H = 100;

beforeEach(() => {
	camera.init(new Size(SCREEN_W, SCREEN_H));
	camera.set_position(
		vec3.fromValues(0, 0, 100),  // eye
		vec3.fromValues(0, 0, 0),    // looking at the origin
		vec3.fromValues(0, 1, 0),    // up is +y
	);
});

// Forward project a world point to a screen pixel using the same matrices
// the app uses elsewhere when it draws.
function world_to_screen(world: vec3): { x: number; y: number } {
	const view_projection = mat4.create();
	mat4.multiply(view_projection, camera.projection, camera.view);
	const clip = vec4.fromValues(world[0], world[1], world[2], 1);
	vec4.transformMat4(clip, clip, view_projection);
	const ndc_x = clip[0] / clip[3];
	const ndc_y = clip[1] / clip[3];
	const screen_x = (ndc_x + 1) * 0.5 * SCREEN_W;
	const screen_y = (1 - ndc_y) * 0.5 * SCREEN_H;
	return { x: screen_x, y: screen_y };
}

// Distance from a point to the nearest spot on a ray.
function distance_to_ray(point: vec3, origin: vec3, dir: vec3): number {
	const offset = vec3.create();
	vec3.subtract(offset, point, origin);
	const along = vec3.dot(offset, dir);
	const closest = vec3.create();
	vec3.scaleAndAdd(closest, origin, dir, along);
	const gap = vec3.create();
	vec3.subtract(gap, point, closest);
	return vec3.length(gap);
}

// ═══════════════════════════════════════════════════════════════════
// Rule 27 — a click on the screen becomes a ray pointing into the world
// ═══════════════════════════════════════════════════════════════════

describe('a click on the screen becomes a ray pointing into the world', () => {
	it('clicking the center of the screen gives a ray pointing straight at the camera target', () => {
		const { origin, dir } = camera.screen_to_ray(SCREEN_W / 2, SCREEN_H / 2);

		// The ray should start near the camera position and point toward the target.
		// Camera sits at (0, 0, 100) looking at the origin, so the ray points along -z.
		expect(dir[0]).toBeCloseTo(0, 5);
		expect(dir[1]).toBeCloseTo(0, 5);
		expect(dir[2]).toBeCloseTo(-1, 5);

		// Origin lies on the line from the eye toward the target.
		expect(origin[0]).toBeCloseTo(0, 5);
		expect(origin[1]).toBeCloseTo(0, 5);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rules 26 and 27 — projecting a world point forward to the screen and
// then back into a ray gives a ray that passes through the original point
// ═══════════════════════════════════════════════════════════════════

describe('forward projection then ray-cast is a round trip', () => {
	it('a ray cast from the screen spot of a known world point passes through that point', () => {
		const world_point = vec3.fromValues(10, 5, 0);

		const screen = world_to_screen(world_point);
		const { origin, dir } = camera.screen_to_ray(screen.x, screen.y);

		const gap = distance_to_ray(world_point, origin, dir);
		expect(gap).toBeCloseTo(0, 3);
	});

	it('the round trip works for several different world points', () => {
		const points: vec3[] = [
			vec3.fromValues(0, 0, 0),
			vec3.fromValues(20, 10, -30),
			vec3.fromValues(-15, 25, 5),
			vec3.fromValues(0, -8, 40),
		];

		for (const world_point of points) {
			const screen = world_to_screen(world_point);
			const { origin, dir } = camera.screen_to_ray(screen.x, screen.y);
			const gap = distance_to_ray(world_point, origin, dir);
			expect(gap).toBeCloseTo(0, 3);
		}
	});
});
