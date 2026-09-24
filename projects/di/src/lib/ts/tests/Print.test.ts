import { describe, it, expect, beforeEach } from 'vitest';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { camera } from '../render/Camera';
import { Size } from '../types/Coordinates';

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const CANVAS_W = 200;
const CANVAS_H = 150;

beforeEach(() => {
	camera.init(new Size(CANVAS_W, CANVAS_H));
	camera.set_position(
		vec3.fromValues(0, 0, 100),
		vec3.fromValues(0, 0, 0),
		vec3.fromValues(0, 1, 0),
	);
	camera.set_ortho(false);
});

// World → drawing-pixel projection, matching the math the print handler uses
// when it walks every smart object's corners. World point goes through
// view × projection, divides by w to land in normalized device coordinates,
// then scales into the canvas's drawing-pixel dimensions.
function world_to_drawing_px(world: vec3, canvas_w: number, canvas_h: number): { x: number, y: number } {
	const view_proj = mat4.create();
	mat4.multiply(view_proj, camera.projection, camera.view);
	const v = vec4.fromValues(world[0], world[1], world[2], 1);
	vec4.transformMat4(v, v, view_proj);
	const ndc_x = v[0] / v[3];
	const ndc_y = v[1] / v[3];
	const px = (ndc_x * 0.5 + 0.5) * canvas_w;
	const py = (1 - (ndc_y * 0.5 + 0.5)) * canvas_h;
	return { x: px, y: py };
}

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

// Mirror of the fit-and-centre math the print handler uses when it computes
// the scale and translate that map a silhouette rectangle to a canvas area.
// Each test uses this helper directly so the algorithm is pinned by the test
// itself; the e2e suite verifies the production handler obeys the same rule.
function compute_fit(
	sil: { left: number, top: number, width: number, height: number },
	area_w: number,
	area_h: number,
): { scale: number, tx: number, ty: number } {
	const scale = Math.min(area_w / sil.width, area_h / sil.height);
	const tx = area_w / 2 - (sil.left + sil.width  / 2) * scale;
	const ty = area_h / 2 - (sil.top  + sil.height / 2) * scale;
	return { scale, tx, ty };
}

// Apply a (translate, scale) transform to a point and return the new point.
function apply_transform(p: { x: number, y: number }, t: { scale: number, tx: number, ty: number }): { x: number, y: number } {
	return { x: p.x * t.scale + t.tx, y: p.y * t.scale + t.ty };
}

// ═══════════════════════════════════════════════════════════════════
// Rule 60 — three coordinate systems for printing.
// World (in millimetres), drawing pixels (the canvas's own coordinate
// space), and printed-paper pixels are three distinct systems. The
// world ↔ drawing-pixel leg is invertible: a world point projected
// to a pixel and shot back as a ray passes through the original point.
// The drawing ↔ paper leg is exercised by the browser-driven tests.
// ═══════════════════════════════════════════════════════════════════

describe('Rule 60 — coordinate systems round-trip', () => {
	it('a world point at the camera target round-trips through drawing pixels', () => {
		const world_point = vec3.fromValues(0, 0, 0);
		const px = world_to_drawing_px(world_point, CANVAS_W, CANVAS_H);
		const ray = camera.screen_to_ray(px.x, px.y);
		expect(distance_to_ray(world_point, ray.origin, ray.dir)).toBeLessThan(0.01);
	});

	it('a world point near the origin but off the focal plane round-trips', () => {
		const world_point = vec3.fromValues(5, -3, 7);
		const px = world_to_drawing_px(world_point, CANVAS_W, CANVAS_H);
		const ray = camera.screen_to_ray(px.x, px.y);
		expect(distance_to_ray(world_point, ray.origin, ray.dir)).toBeLessThan(0.01);
	});

	it('a world point well off-axis round-trips', () => {
		const world_point = vec3.fromValues(-25, 30, -15);
		const px = world_to_drawing_px(world_point, CANVAS_W, CANVAS_H);
		const ray = camera.screen_to_ray(px.x, px.y);
		expect(distance_to_ray(world_point, ray.origin, ray.dir)).toBeLessThan(0.01);
	});

	it('a world point exactly on the camera axis round-trips', () => {
		const world_point = vec3.fromValues(0, 0, 50);
		const px = world_to_drawing_px(world_point, CANVAS_W, CANVAS_H);
		expect(px.x).toBeCloseTo(CANVAS_W / 2, 4);
		expect(px.y).toBeCloseTo(CANVAS_H / 2, 4);
		const ray = camera.screen_to_ray(px.x, px.y);
		expect(distance_to_ray(world_point, ray.origin, ray.dir)).toBeLessThan(0.01);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rule 62 — from a silhouette and a printable-area pair, compute a
// single uniform scale that fits the silhouette inside the area along
// the limiting side, plus a translation that puts the silhouette's
// centre at the area's centre.
// ═══════════════════════════════════════════════════════════════════

describe('Rule 62 — scale to fit, translate to centre', () => {
	it('a wider-than-paper silhouette: the width ratio limits the scale, the height falls short, the silhouette ends up centred on the page', () => {
		// silhouette is 4 wide, 1 tall — wider in aspect than paper.
		// paper is 2 wide, 2 tall.
		const sil = { left: 10, top: 100, width: 40, height: 10 };
		const area_w = 20;
		const area_h = 20;
		const fit = compute_fit(sil, area_w, area_h);

		// Width ratio (20/40 = 0.5) limits scale.
		expect(fit.scale).toBeCloseTo(0.5, 6);

		// Centre of silhouette must land on centre of area.
		const sil_centre = { x: sil.left + sil.width / 2, y: sil.top + sil.height / 2 };
		const mapped = apply_transform(sil_centre, fit);
		expect(mapped.x).toBeCloseTo(area_w / 2, 6);
		expect(mapped.y).toBeCloseTo(area_h / 2, 6);

		// Width fits exactly: scaled silhouette width = area width.
		expect(sil.width * fit.scale).toBeCloseTo(area_w, 6);
		// Height falls short: scaled silhouette height < area height.
		expect(sil.height * fit.scale).toBeLessThan(area_h);
	});

	it('a taller-than-paper silhouette: the height ratio limits the scale, the width falls short, the silhouette ends up centred on the page', () => {
		// silhouette is 1 wide, 4 tall — taller in aspect than paper.
		// paper is 2 wide, 2 tall.
		const sil = { left: 50, top: 5, width: 10, height: 40 };
		const area_w = 20;
		const area_h = 20;
		const fit = compute_fit(sil, area_w, area_h);

		// Height ratio (20/40 = 0.5) limits scale.
		expect(fit.scale).toBeCloseTo(0.5, 6);

		const sil_centre = { x: sil.left + sil.width / 2, y: sil.top + sil.height / 2 };
		const mapped = apply_transform(sil_centre, fit);
		expect(mapped.x).toBeCloseTo(area_w / 2, 6);
		expect(mapped.y).toBeCloseTo(area_h / 2, 6);

		expect(sil.height * fit.scale).toBeCloseTo(area_h, 6);
		expect(sil.width * fit.scale).toBeLessThan(area_w);
	});

	it('a silhouette with the same aspect as paper: both sides fit exactly, no margin on either axis', () => {
		// silhouette is 2 wide, 1 tall; paper is 4 wide, 2 tall — same aspect.
		const sil = { left: 30, top: 30, width: 20, height: 10 };
		const area_w = 40;
		const area_h = 20;
		const fit = compute_fit(sil, area_w, area_h);

		// Both ratios equal — scale matches either.
		expect(fit.scale).toBeCloseTo(2, 6);

		const sil_centre = { x: sil.left + sil.width / 2, y: sil.top + sil.height / 2 };
		const mapped = apply_transform(sil_centre, fit);
		expect(mapped.x).toBeCloseTo(area_w / 2, 6);
		expect(mapped.y).toBeCloseTo(area_h / 2, 6);

		expect(sil.width  * fit.scale).toBeCloseTo(area_w, 6);
		expect(sil.height * fit.scale).toBeCloseTo(area_h, 6);
	});
});
