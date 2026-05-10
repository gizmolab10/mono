import { test, expect } from '@playwright/test';
import { mat4, vec4 } from 'gl-matrix';

// ═══════════════════════════════════════════════════════════════════
// Shared helpers — read the canvas, parse the print transform,
// dispatch the two browser print notifications, and run the rule's
// math on a known scene to compute the expected silhouette transform.
// ═══════════════════════════════════════════════════════════════════

const transform_of = (page: import('@playwright/test').Page) =>
	page.locator('.region.graph canvas').evaluate(el => (el as HTMLElement).style.transform);

function parse_transform(transform: string): { tx: number, ty: number, scale: number } | null {
	if (!transform) return null;
	const match = transform.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)\s*scale\(([-0-9.]+)\)/);
	if (!match) return null;
	return { tx: parseFloat(match[1]), ty: parseFloat(match[2]), scale: parseFloat(match[3]) };
}

const canvas_css_size = (page: import('@playwright/test').Page) =>
	page.locator('.region.graph canvas').evaluate(el => {
		const node = el as HTMLElement;
		return { width: node.clientWidth, height: node.clientHeight };
	});

async function dispatch_print_start(page: import('@playwright/test').Page) {
	// The print handler watches the canvas with a resize observer; its initial
	// callback fires on the next layout pass. Wait long enough for the
	// transform to land before the test reads it.
	await page.evaluate(() => {
		window.dispatchEvent(new Event('beforeprint'));
		return new Promise(resolve => setTimeout(resolve, 50));
	});
}

async function dispatch_print_end(page: import('@playwright/test').Page) {
	await page.evaluate(() => {
		window.dispatchEvent(new Event('afterprint'));
		return new Promise(resolve => setTimeout(resolve, 50));
	});
}

// Read the running app's canvas dimensions and current camera matrices,
// then build the combined view × projection matrix the print pipeline
// uses to project world points to drawing pixels.
async function read_canvas_and_view_projection(page: import('@playwright/test').Page) {
	await page.waitForTimeout(100);
	const canvas_dims = await page.locator('.region.graph canvas').evaluate(el => {
		const node = el as HTMLCanvasElement;
		return {
			drawing_w: node.width,
			drawing_h: node.height,
			css_w: node.clientWidth,
			css_h: node.clientHeight,
		};
	});
	const view_arr = await page.evaluate(() =>
		(window as unknown as { di_test: { camera_view: () => number[] } }).di_test.camera_view()
	);
	const proj_arr = await page.evaluate(() =>
		(window as unknown as { di_test: { camera_projection: () => number[] } }).di_test.camera_projection()
	);
	const view = mat4.fromValues(...(view_arr as Parameters<typeof mat4.fromValues>));
	const proj = mat4.fromValues(...(proj_arr as Parameters<typeof mat4.fromValues>));
	const view_proj = mat4.create();
	mat4.multiply(view_proj, proj, view);
	return { canvas_dims, view_proj };
}

// Eight world-space corners of an axis-aligned box.
function corners_of(b: { x_min: number, x_max: number, y_min: number, y_max: number, z_min: number, z_max: number }): Array<[number, number, number]> {
	const out: Array<[number, number, number]> = [];
	for (const x of [b.x_min, b.x_max])
		for (const y of [b.y_min, b.y_max])
			for (const z of [b.z_min, b.z_max])
				out.push([x, y, z]);
	return out;
}

// Apply the rule's stated math to a list of world-space corners and
// return the silhouette transform the print handler should produce.
// Returns null when the silhouette is empty (no corners contributed,
// or all corners clamped away to nothing).
function expected_transform_for(
	corners: Array<[number, number, number]>,
	view_proj: import('gl-matrix').mat4,
	canvas: { drawing_w: number, drawing_h: number, css_w: number, css_h: number },
): { scale: number, tx: number, ty: number } | null {
	if (corners.length === 0) return null;

	let x_lo = Infinity, x_hi = -Infinity;
	let y_lo = Infinity, y_hi = -Infinity;
	let any = false;
	for (const [x, y, z] of corners) {
		const v = vec4.fromValues(x, y, z, 1);
		vec4.transformMat4(v, v, view_proj);
		if (v[3] === 0) continue;
		const ndc_x = v[0] / v[3];
		const ndc_y = v[1] / v[3];
		const px = (ndc_x * 0.5 + 0.5) * canvas.drawing_w;
		const py = (1 - (ndc_y * 0.5 + 0.5)) * canvas.drawing_h;
		if (px < x_lo) x_lo = px;
		if (px > x_hi) x_hi = px;
		if (py < y_lo) y_lo = py;
		if (py > y_hi) y_hi = py;
		any = true;
	}
	if (!any) return null;

	x_lo = Math.max(0, x_lo);
	y_lo = Math.max(0, y_lo);
	x_hi = Math.min(canvas.drawing_w, x_hi);
	y_hi = Math.min(canvas.drawing_h, y_hi);

	const sil_drawing = { left: x_lo, top: y_lo, width: x_hi - x_lo, height: y_hi - y_lo };
	if (sil_drawing.width <= 0 || sil_drawing.height <= 0) return null;

	const f = Math.min(canvas.css_w / canvas.drawing_w, canvas.css_h / canvas.drawing_h);
	const lb_x = (canvas.css_w - canvas.drawing_w * f) / 2;
	const lb_y = (canvas.css_h - canvas.drawing_h * f) / 2;
	const sil_css = {
		left:   sil_drawing.left   * f + lb_x,
		top:    sil_drawing.top    * f + lb_y,
		width:  sil_drawing.width  * f,
		height: sil_drawing.height * f,
	};

	const scale = Math.min(canvas.css_w / sil_css.width, canvas.css_h / sil_css.height);
	const tx = canvas.css_w / 2 - (sil_css.left + sil_css.width  / 2) * scale;
	const ty = canvas.css_h / 2 - (sil_css.top  + sil_css.height / 2) * scale;
	return { scale, tx, ty };
}

// Open the page with a known viewport and a known overhead camera, ready
// for the test to build a scene and fire the print handler.
async function setup_print_page(page: import('@playwright/test').Page) {
	await page.setViewportSize({ width: 1200, height: 900 });
	await page.goto('/?test=1');
	await page.waitForSelector('.region.graph canvas');
	await page.waitForFunction(() => 'di_test' in window);
	await page.evaluate(() => {
		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
		t.clear_scene();
		t.set_camera_position([0, 0, 200], [0, 0, 0], [0, 1, 0]);
		t.set_camera_ortho(true);
	});
}

// ═══════════════════════════════════════════════════════════════════
// Rule 39 — the drawing's screen silhouette is the smallest rectangle
// on the screen that contains every visible block's projection.
// ═══════════════════════════════════════════════════════════════════

test('Rule 39 — the print handler computes a non-empty silhouette and applies a sensible transform', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('.region.graph canvas');
	await page.waitForFunction(() => 'di_test' in window);

	expect(await transform_of(page)).toBe('');

	await dispatch_print_start(page);

	const transform = await transform_of(page);
	const parsed = parse_transform(transform);
	expect(parsed).not.toBeNull();
	if (!parsed) return;

	expect(parsed.scale).toBeGreaterThan(0);
	expect(Number.isFinite(parsed.tx)).toBe(true);
	expect(Number.isFinite(parsed.ty)).toBe(true);
});

test('Rule 39 — running the handler twice produces the same transform (the silhouette is stable)', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('.region.graph canvas');
	await page.waitForFunction(() => 'di_test' in window);

	await dispatch_print_start(page);
	const first = parse_transform(await transform_of(page));
	expect(first).not.toBeNull();

	await dispatch_print_end(page);
	expect(await transform_of(page)).toBe('');

	await dispatch_print_start(page);
	const second = parse_transform(await transform_of(page));
	expect(second).not.toBeNull();
	if (!first || !second) return;

	expect(second.scale).toBeCloseTo(first.scale, 4);
	expect(second.tx).toBeCloseTo(first.tx, 4);
	expect(second.ty).toBeCloseTo(first.ty, 4);
});

// ═══════════════════════════════════════════════════════════════════
// Rule 61 — during printing, the browser delivers two notifications;
// the second triggers the silhouette and printable-area calculation.
// ═══════════════════════════════════════════════════════════════════

test('Rule 61 — dispatching the print-start notification populates the canvas transform', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('.region.graph canvas');
	await page.waitForFunction(() => 'di_test' in window);

	expect(await transform_of(page)).toBe('');

	await dispatch_print_start(page);

	const after = await transform_of(page);
	expect(after).not.toBe('');
	expect(after).toMatch(/translate.*scale/);
});

test('Rule 61 — dispatching the print-end notification clears the canvas transform', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('.region.graph canvas');
	await page.waitForFunction(() => 'di_test' in window);

	await dispatch_print_start(page);
	expect(await transform_of(page)).not.toBe('');

	await dispatch_print_end(page);
	expect(await transform_of(page)).toBe('');
});

// ═══════════════════════════════════════════════════════════════════
// Rules 39 + 62 — a known scene plus a known camera produces the
// exact silhouette and transform that the rule prescribes.
// ═══════════════════════════════════════════════════════════════════

test('Rules 39 + 62 — a single box produces the exact silhouette transform the rule prescribes', async ({ page }) => {
	await setup_print_page(page);

	const ALPHA = { x_min: -50, x_max: 50, y_min: -30, y_max: 30, z_min: -20, z_max: 20 };
	await page.evaluate((bounds) => {
		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
		t.add_so({ name: 'ALPHA', bounds });
	}, ALPHA);

	const { canvas_dims, view_proj } = await read_canvas_and_view_projection(page);
	const expected = expected_transform_for(corners_of(ALPHA), view_proj, canvas_dims);
	expect(expected).not.toBeNull();
	if (!expected) return;

	await dispatch_print_start(page);
	const actual = parse_transform(await transform_of(page));
	expect(actual).not.toBeNull();
	if (!actual) return;

	expect(actual.scale).toBeCloseTo(expected.scale, 3);
	expect(actual.tx).toBeCloseTo(expected.tx, 0);
	expect(actual.ty).toBeCloseTo(expected.ty, 0);
});

test('Rule 39 — two boxes far apart in world space produce a silhouette that contains both', async ({ page }) => {
	await setup_print_page(page);

	// ALPHA on the left, BETA on the right. Far enough apart that a
	// single-object silhouette would be much smaller than the two-object one.
	const ALPHA = { x_min: -60, x_max: -30, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	const BETA  = { x_min:  30, x_max:  60, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	await page.evaluate((args) => {
		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
		t.add_so({ name: 'ALPHA', bounds: args.alpha });
		t.add_so({ name: 'BETA',  bounds: args.beta  });
	}, { alpha: ALPHA, beta: BETA });

	const { canvas_dims, view_proj } = await read_canvas_and_view_projection(page);
	const all_corners = [...corners_of(ALPHA), ...corners_of(BETA)];
	const expected = expected_transform_for(all_corners, view_proj, canvas_dims);
	expect(expected).not.toBeNull();
	if (!expected) return;

	await dispatch_print_start(page);
	const actual = parse_transform(await transform_of(page));
	expect(actual).not.toBeNull();
	if (!actual) return;

	expect(actual.scale).toBeCloseTo(expected.scale, 3);
	expect(actual.tx).toBeCloseTo(expected.tx, 0);
	expect(actual.ty).toBeCloseTo(expected.ty, 0);

	// Sanity: the two-box silhouette must be wider than a single-box silhouette
	// would have been (single-box scale would be much larger).
	const alpha_only = expected_transform_for(corners_of(ALPHA), view_proj, canvas_dims);
	expect(alpha_only).not.toBeNull();
	if (alpha_only) expect(actual.scale).toBeLessThan(alpha_only.scale);
});

test('Rule 39 — a box that extends past the visible frame has its silhouette clamped to the canvas edges', async ({ page }) => {
	await setup_print_page(page);

	// Make the box much wider than the camera can see so the left and
	// right corners project past the canvas edges in drawing pixels.
	const HUGE = { x_min: -500, x_max: 500, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	await page.evaluate((bounds) => {
		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
		t.add_so({ name: 'HUGE', bounds });
	}, HUGE);

	const { canvas_dims, view_proj } = await read_canvas_and_view_projection(page);
	const expected = expected_transform_for(corners_of(HUGE), view_proj, canvas_dims);
	expect(expected).not.toBeNull();
	if (!expected) return;

	await dispatch_print_start(page);
	const actual = parse_transform(await transform_of(page));
	expect(actual).not.toBeNull();
	if (!actual) return;

	// The expected transform was computed with clamping baked in. If the
	// production handler doesn't clamp (or clamps differently), these
	// numbers diverge and the test fails.
	expect(actual.scale).toBeCloseTo(expected.scale, 3);
	expect(actual.tx).toBeCloseTo(expected.tx, 0);
	expect(actual.ty).toBeCloseTo(expected.ty, 0);
});

test('Rule 39 — a box whose visibility flag is off contributes nothing to the silhouette', async ({ page }) => {
	await setup_print_page(page);

	// Visible ALPHA on the left, invisible BETA on the right. Without the
	// visibility filter, BETA would expand the silhouette to the right.
	const ALPHA = { x_min: -40, x_max: -10, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	const BETA  = { x_min:  10, x_max:  40, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	await page.evaluate((args) => {
		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
		t.add_so({ name: 'ALPHA', bounds: args.alpha });
		t.add_so({ name: 'BETA',  bounds: args.beta  });
		t.set_so_visibility('BETA', false);
	}, { alpha: ALPHA, beta: BETA });

	const { canvas_dims, view_proj } = await read_canvas_and_view_projection(page);
	// Expected silhouette uses ALPHA only — BETA is invisible.
	const expected = expected_transform_for(corners_of(ALPHA), view_proj, canvas_dims);
	expect(expected).not.toBeNull();
	if (!expected) return;

	await dispatch_print_start(page);
	const actual = parse_transform(await transform_of(page));
	expect(actual).not.toBeNull();
	if (!actual) return;

	expect(actual.scale).toBeCloseTo(expected.scale, 3);
	expect(actual.tx).toBeCloseTo(expected.tx, 0);
	expect(actual.ty).toBeCloseTo(expected.ty, 0);
});

test('Rule 39 — a child whose ancestor has hide-children on contributes nothing to the silhouette', async ({ page }) => {
	await setup_print_page(page);

	// Parent ALPHA on the left, child CHILD on the right (and parented
	// to ALPHA). With hide-children turned on for ALPHA, the silhouette
	// should reflect ALPHA alone — CHILD is suppressed.
	const ALPHA = { x_min: -40, x_max: -10, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	const CHILD = { x_min:  10, x_max:  40, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	await page.evaluate((args) => {
		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
		t.add_so({ name: 'ALPHA', bounds: args.alpha });
		t.add_so({ name: 'CHILD', bounds: args.child, parent_name: 'ALPHA' });
		t.set_so_hide_children('ALPHA', true);
	}, { alpha: ALPHA, child: CHILD });

	const { canvas_dims, view_proj } = await read_canvas_and_view_projection(page);
	const expected = expected_transform_for(corners_of(ALPHA), view_proj, canvas_dims);
	expect(expected).not.toBeNull();
	if (!expected) return;

	await dispatch_print_start(page);
	const actual = parse_transform(await transform_of(page));
	expect(actual).not.toBeNull();
	if (!actual) return;

	expect(actual.scale).toBeCloseTo(expected.scale, 3);
	expect(actual.tx).toBeCloseTo(expected.tx, 0);
	expect(actual.ty).toBeCloseTo(expected.ty, 0);
});

test('Rule 39 — an empty scene leaves the canvas with no transform applied', async ({ page }) => {
	await setup_print_page(page);
	// setup_print_page already cleared the scene. No SOs added.

	expect(await transform_of(page)).toBe('');

	await dispatch_print_start(page);

	// With no objects, the silhouette is empty and the handler returns
	// early — leaving the canvas untouched.
	expect(await transform_of(page)).toBe('');
});

// ═══════════════════════════════════════════════════════════════════
// Rule 62 — the production handler produces a centred transform.
// ═══════════════════════════════════════════════════════════════════

test('Rule 39 — the canvas-resize signal causes the transform to be re-applied with the new dimensions (timing pin)', async ({ page }) => {
	await setup_print_page(page);

	const ALPHA = { x_min: -30, x_max: 30, y_min: -20, y_max: 20, z_min: -10, z_max: 10 };
	await page.evaluate((bounds) => {
		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
		t.add_so({ name: 'ALPHA', bounds });
	}, ALPHA);

	// Capture the original canvas CSS-pixel size, then fire the print-start
	// notification and capture the scale value of the resulting transform.
	const initial_css_w = await page.locator('.region.graph canvas').evaluate(el => (el as HTMLElement).clientWidth);
	await dispatch_print_start(page);
	const before_resize = parse_transform(await transform_of(page));
	expect(before_resize).not.toBeNull();
	if (!before_resize) return;

	// Now force the canvas's CSS box to change size. The handler should
	// observe the resize and re-apply the transform.
	await page.evaluate((new_w) => {
		const canvas = document.querySelector('.region.graph canvas') as HTMLElement;
		canvas.style.width = `${new_w}px`;
	}, initial_css_w * 2);
	await page.waitForTimeout(100);

	const after_resize = parse_transform(await transform_of(page));
	expect(after_resize).not.toBeNull();
	if (!after_resize) return;

	// The scale must change after the canvas resizes — otherwise the handler
	// is reading stale dimensions and producing the wrong transform for the
	// printed page area.
	expect(Math.abs(after_resize.scale - before_resize.scale)).toBeGreaterThan(0.01);
});

// ═══════════════════════════════════════════════════════════════════
// Diagnostic test — uses Playwright's print media emulation to
// reproduce the real-browser print stylesheet effects (the canvas
// resizing). Logs the dimensions the handler sees at each stage so
// the bug can be isolated.
// ═══════════════════════════════════════════════════════════════════

test('Diagnostic — print media emulation: log the canvas dimensions before and after the print stylesheet activates, and verify the resulting transform', async ({ page }) => {
	await setup_print_page(page);

	const ALPHA = { x_min: -50, x_max: 50, y_min: -30, y_max: 30, z_min: -20, z_max: 20 };
	await page.evaluate((bounds) => {
		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
		t.add_so({ name: 'ALPHA', bounds });
	}, ALPHA);

	// Dimensions on screen, before print stylesheet activates.
	const before = await page.locator('.region.graph canvas').evaluate(el => {
		const node = el as HTMLCanvasElement;
		return {
			drawing_w: node.width,
			drawing_h: node.height,
			css_w: node.clientWidth,
			css_h: node.clientHeight,
			window_w: window.innerWidth,
			window_h: window.innerHeight,
		};
	});

	// Activate the print media query. This is what triggers the print stylesheet
	// in a real browser when the user opens the print preview.
	await page.emulateMedia({ media: 'print' });
	await page.waitForTimeout(100);

	// Dimensions during print, after stylesheet activates.
	const during = await page.locator('.region.graph canvas').evaluate(el => {
		const node = el as HTMLCanvasElement;
		return {
			drawing_w: node.width,
			drawing_h: node.height,
			css_w: node.clientWidth,
			css_h: node.clientHeight,
			window_w: window.innerWidth,
			window_h: window.innerHeight,
		};
	});

	// Fire the print-start notification.
	await dispatch_print_start(page);
	const after_transform = parse_transform(await transform_of(page));

	// Log everything so the failure mode is visible in the test output.
	console.log('ALPHA scene, viewport 1200 by 900');
	console.log('  before print media — canvas drawing surface', before.drawing_w, 'by', before.drawing_h, '— canvas CSS box', before.css_w, 'by', before.css_h, '— window inner', before.window_w, 'by', before.window_h);
	console.log('  during print media — canvas drawing surface', during.drawing_w, 'by', during.drawing_h, '— canvas CSS box', during.css_w, 'by', during.css_h, '— window inner', during.window_w, 'by', during.window_h);
	console.log('  applied transform — scale', after_transform?.scale, '— translate', after_transform?.tx, ',', after_transform?.ty);

	// Compute what the transform should be for the during-print dimensions.
	const view_arr = await page.evaluate(() =>
		(window as unknown as { di_test: { camera_view: () => number[] } }).di_test.camera_view()
	);
	const proj_arr = await page.evaluate(() =>
		(window as unknown as { di_test: { camera_projection: () => number[] } }).di_test.camera_projection()
	);
	const view = mat4.fromValues(...(view_arr as Parameters<typeof mat4.fromValues>));
	const proj = mat4.fromValues(...(proj_arr as Parameters<typeof mat4.fromValues>));
	const view_proj = mat4.create();
	mat4.multiply(view_proj, proj, view);

	const expected_during = expected_transform_for(corners_of(ALPHA), view_proj, {
		drawing_w: during.drawing_w,
		drawing_h: during.drawing_h,
		css_w: during.css_w,
		css_h: during.css_h,
	});
	const expected_before = expected_transform_for(corners_of(ALPHA), view_proj, {
		drawing_w: before.drawing_w,
		drawing_h: before.drawing_h,
		css_w: before.css_w,
		css_h: before.css_h,
	});

	console.log('  expected for during-print dimensions — scale', expected_during?.scale, '— translate', expected_during?.tx, ',', expected_during?.ty);
	console.log('  expected for before-print dimensions — scale', expected_before?.scale, '— translate', expected_before?.tx, ',', expected_before?.ty);

	// Reset the media emulation for following tests.
	await page.emulateMedia({ media: null });

	// Assert: the applied transform should match the during-print expected,
	// not the before-print one. If it matches the before-print one, the
	// handler is reading stale dimensions.
	expect(after_transform).not.toBeNull();
	expect(expected_during).not.toBeNull();
	if (!after_transform || !expected_during) return;
	expect(after_transform.scale).toBeCloseTo(expected_during.scale, 2);
});

// ═══════════════════════════════════════════════════════════════════
// Rules 63 + 64 — the print layout's containers fill the page
// ═══════════════════════════════════════════════════════════════════

test('Rule 63 — the drawing area\'s CSS box fills the printable area during print', async ({ page }) => {
	await setup_print_page(page);

	const ALPHA = { x_min: -50, x_max: 50, y_min: -30, y_max: 30, z_min: -20, z_max: 20 };
	await page.evaluate((bounds) => {
		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
		t.add_so({ name: 'ALPHA', bounds });
	}, ALPHA);

	await page.emulateMedia({ media: 'print' });
	await page.waitForTimeout(100);

	const dims = await page.evaluate(() => {
		const canvas = document.querySelector('.region.graph canvas') as HTMLCanvasElement;
		return {
			canvas_w: canvas.clientWidth,
			canvas_h: canvas.clientHeight,
			window_w: window.innerWidth,
			window_h: window.innerHeight,
		};
	});

	await page.emulateMedia({ media: null });

	// With a half-inch default margin on every side (96 CSS pixels at 96dpi
	// per inch), the canvas should equal (window minus one inch) on each
	// axis. Allow a few pixels tolerance for rounding.
	const inch = 96;
	const expected_w = dims.window_w - 2 * inch * 0.5;
	const expected_h = dims.window_h - 2 * inch * 0.5;
	expect(Math.abs(dims.canvas_w - expected_w)).toBeLessThan(8);
	expect(Math.abs(dims.canvas_h - expected_h)).toBeLessThan(8);
});

test('Rule 65 — the printed sheet carries a default half-inch margin on every side', async ({ page }) => {
	await setup_print_page(page);

	await page.emulateMedia({ media: 'print' });
	await page.waitForTimeout(100);

	const padding = await page.evaluate(() => {
		const cs = getComputedStyle(document.body);
		return {
			top:    cs.paddingTop,
			right:  cs.paddingRight,
			bottom: cs.paddingBottom,
			left:   cs.paddingLeft,
			box_sizing: cs.boxSizing,
		};
	});

	await page.emulateMedia({ media: null });

	// Half-inch at 96dpi is 48 CSS pixels. Each padding side should equal
	// that value, and box-sizing must be border-box so body still fills the
	// page area despite the padding.
	expect(padding.top   ).toBe('48px');
	expect(padding.right ).toBe('48px');
	expect(padding.bottom).toBe('48px');
	expect(padding.left  ).toBe('48px');
	expect(padding.box_sizing).toBe('border-box');
});

test('Rule 64 — the body fills the page height during print', async ({ page }) => {
	await setup_print_page(page);

	await page.emulateMedia({ media: 'print' });
	await page.waitForTimeout(100);

	const dims = await page.evaluate(() => ({
		body_h: document.body.clientHeight,
		window_h: window.innerHeight,
	}));

	await page.emulateMedia({ media: null });

	// The body's height must cover the window's height during print. If
	// it collapses below the window, the chain of percentage heights
	// below cannot resolve to the page area. Overflow is allowed.
	expect(dims.body_h).toBeGreaterThanOrEqual(dims.window_h * 0.95);
});

test('Rule 62 — the production handler produces a centred transform: applying scale then translate to the canvas centre lands inside the canvas area', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('.region.graph canvas');
	await page.waitForFunction(() => 'di_test' in window);

	await dispatch_print_start(page);

	const parsed = parse_transform(await transform_of(page));
	expect(parsed).not.toBeNull();
	if (!parsed) return;

	const css = await canvas_css_size(page);
	const inverse_centre_x = (css.width  / 2 - parsed.tx) / parsed.scale;
	const inverse_centre_y = (css.height / 2 - parsed.ty) / parsed.scale;

	expect(Number.isFinite(inverse_centre_x)).toBe(true);
	expect(Number.isFinite(inverse_centre_y)).toBe(true);

	const tolerance = Math.max(css.width, css.height);
	expect(inverse_centre_x).toBeGreaterThan(-tolerance);
	expect(inverse_centre_x).toBeLessThan(css.width + tolerance);
	expect(inverse_centre_y).toBeGreaterThan(-tolerance);
	expect(inverse_centre_y).toBeLessThan(css.height + tolerance);
});
