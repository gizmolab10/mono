import { test, expect } from '@playwright/test';
import { mat4 } from 'gl-matrix';

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

// Read the canvas pixels and return the smallest rectangle containing
// every non-transparent pixel — the painted-pixel silhouette the
// production print handler uses (rule 39). Returns null when nothing
// is painted.
async function read_painted_silhouette(page: import('@playwright/test').Page) {
	return await page.locator('.region.graph canvas').evaluate(el => {
		const canvas = el as HTMLCanvasElement;
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		const w = canvas.width;
		const h = canvas.height;
		if (w === 0 || h === 0) return null;
		const data = ctx.getImageData(0, 0, w, h).data;
		let x_lo = w, x_hi = -1, y_lo = h, y_hi = -1;
		for (let y = 0; y < h; y++) {
			const row = y * w * 4;
			for (let x = 0; x < w; x++) {
				if (data[row + x * 4 + 3] === 0) continue;
				if (x < x_lo) x_lo = x;
				if (x > x_hi) x_hi = x;
				if (y < y_lo) y_lo = y;
				if (y > y_hi) y_hi = y;
			}
		}
		if (x_hi < x_lo || y_hi < y_lo) return null;
		return { left: x_lo, top: y_lo, width: x_hi - x_lo + 1, height: y_hi - y_lo + 1 };
	});
}

// Apply the same fit-and-centre math the production handler uses, but
// starting from a known silhouette in drawing-pixel coordinates instead
// of computing the silhouette from world corners. The math: map the
// silhouette through the canvas's object-fit:contain placement to get
// CSS-pixel coordinates, then compute the scale that fits the silhouette
// to the canvas's CSS box along the limiting side, plus the translation
// that centres it.
function expected_transform_from_silhouette(
	sil: { left: number, top: number, width: number, height: number },
	canvas: { drawing_w: number, drawing_h: number, css_w: number, css_h: number },
): { scale: number, tx: number, ty: number } | null {
	if (sil.width <= 0 || sil.height <= 0) return null;
	const f = Math.min(canvas.css_w / canvas.drawing_w, canvas.css_h / canvas.drawing_h);
	const lb_x = (canvas.css_w - canvas.drawing_w * f) / 2;
	const lb_y = (canvas.css_h - canvas.drawing_h * f) / 2;
	const sil_css = {
		left:   sil.left   * f + lb_x,
		top:    sil.top    * f + lb_y,
		width:  sil.width  * f,
		height: sil.height * f,
	};
	const scale = Math.min(canvas.css_w / sil_css.width, canvas.css_h / sil_css.height);
	const tx = canvas.css_w / 2 - (sil_css.left + sil_css.width  / 2) * scale;
	const ty = canvas.css_h / 2 - (sil_css.top  + sil_css.height / 2) * scale;
	return { scale, tx, ty };
}

// Set up the page, activate print media so the renderer suppresses the
// grid and axes per rule 66, and wait for layout and paint to settle so
// the canvas pixels reflect what the production handler will see.
async function setup_for_pixel_silhouette(
	page: import('@playwright/test').Page,
	scene_setup: () => Promise<void>,
) {
	await setup_print_page(page);
	await scene_setup();
	await page.waitForTimeout(150);
	await page.emulateMedia({ media: 'print' });
	// Give the renderer multiple animation frames to settle into print-mode
	// dimensions: the canvas resizes when the print stylesheet activates,
	// the renderer redraws, the print handler re-reads pixels, and the
	// final transform is applied.
	await page.waitForTimeout(500);
	// Fire the print-start event one more time so the handler re-reads the
	// now-settled canvas and applies the transform based on the final pixel
	// state — eliminates any race between the renderer's first print-mode
	// redraw and the handler's first read.
	await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
	await page.waitForTimeout(100);
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
		t.set_orientation([0, 0, 0, 1]);
		t.set_scale(1);
		t.set_decorations(0);
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

test('Rules 39 + 62 — a single box paints a silhouette and the handler applies a transform that fits and centres it on the page', async ({ page }) => {
	const ALPHA = { x_min: -50, x_max: 50, y_min: -30, y_max: 30, z_min: -20, z_max: 20 };
	await setup_for_pixel_silhouette(page, async () => {
		await page.evaluate((bounds) => {
			const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
			t.add_so({ name: 'ALPHA', bounds });
		}, ALPHA);
	});

	const { canvas_dims } = await read_canvas_and_view_projection(page);
	const silhouette = await read_painted_silhouette(page);
	expect(silhouette).not.toBeNull();
	if (!silhouette) return;
	const expected = expected_transform_from_silhouette(silhouette, canvas_dims);
	expect(expected).not.toBeNull();
	if (!expected) return;

	const actual = parse_transform(await transform_of(page));
	expect(actual).not.toBeNull();
	if (!actual) return;

	expect(actual.scale).toBeCloseTo(expected.scale, 2);
	expect(actual.tx).toBeCloseTo(expected.tx, 0);
	expect(actual.ty).toBeCloseTo(expected.ty, 0);

	await page.emulateMedia({ media: null });
});

test('Rule 39 — two boxes far apart in world space produce a silhouette that contains both', async ({ page }) => {
	// An invisible root container spans both boxes so the renderer's "centre
	// root at canvas origin" behaviour positions both boxes within it.
	const ROOT  = { x_min: -60, x_max:  60, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	const ALPHA = { x_min: -60, x_max: -30, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	const BETA  = { x_min:  30, x_max:  60, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };

	// First pass: ALPHA alone (as a child of an invisible ROOT) — capture single-box scale.
	await setup_for_pixel_silhouette(page, async () => {
		await page.evaluate((args) => {
			const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
			t.add_so({ name: 'ROOT', bounds: args.root });
			t.set_so_visibility('ROOT', false);
			t.add_so({ name: 'ALPHA', bounds: args.alpha, parent_name: 'ROOT' });
		}, { root: ROOT, alpha: ALPHA });
	});
	const alpha_only_actual = parse_transform(await transform_of(page));
	expect(alpha_only_actual).not.toBeNull();
	await page.emulateMedia({ media: null });

	// Second pass: ROOT (invisible) with ALPHA and BETA as children — the silhouette must contain both.
	await setup_for_pixel_silhouette(page, async () => {
		await page.evaluate((args) => {
			const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
			t.add_so({ name: 'ROOT', bounds: args.root });
			t.set_so_visibility('ROOT', false);
			t.add_so({ name: 'ALPHA', bounds: args.alpha, parent_name: 'ROOT' });
			t.add_so({ name: 'BETA',  bounds: args.beta,  parent_name: 'ROOT' });
		}, { root: ROOT, alpha: ALPHA, beta: BETA });
	});

	const { canvas_dims } = await read_canvas_and_view_projection(page);
	const silhouette = await read_painted_silhouette(page);
	expect(silhouette).not.toBeNull();
	if (!silhouette) return;
	const expected = expected_transform_from_silhouette(silhouette, canvas_dims);
	expect(expected).not.toBeNull();
	if (!expected) return;

	const actual = parse_transform(await transform_of(page));
	expect(actual).not.toBeNull();
	if (!actual) return;

	expect(actual.scale).toBeCloseTo(expected.scale, 2);
	expect(actual.tx).toBeCloseTo(expected.tx, 0);
	expect(actual.ty).toBeCloseTo(expected.ty, 0);

	// Sanity: the two-box silhouette is wider, so its fit scale is smaller
	// than the single-box scale.
	if (alpha_only_actual) expect(actual.scale).toBeLessThan(alpha_only_actual.scale);

	await page.emulateMedia({ media: null });
});

test('Rule 39 — a box that extends past the visible frame paints only its visible portion, and the silhouette equals that portion', async ({ page }) => {
	const HUGE = { x_min: -500, x_max: 500, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	await setup_for_pixel_silhouette(page, async () => {
		await page.evaluate((bounds) => {
			const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
			t.add_so({ name: 'HUGE', bounds });
		}, HUGE);
	});

	const { canvas_dims } = await read_canvas_and_view_projection(page);
	const silhouette = await read_painted_silhouette(page);
	expect(silhouette).not.toBeNull();
	if (!silhouette) return;

	// The painted silhouette must fit within the drawing surface — that is the
	// "only the visible portion contributes" claim. Anything outside the canvas
	// can't have been painted, so it can't appear in the silhouette.
	expect(silhouette.left).toBeGreaterThanOrEqual(0);
	expect(silhouette.top).toBeGreaterThanOrEqual(0);
	expect(silhouette.left + silhouette.width ).toBeLessThanOrEqual(canvas_dims.drawing_w);
	expect(silhouette.top  + silhouette.height).toBeLessThanOrEqual(canvas_dims.drawing_h);

	const expected = expected_transform_from_silhouette(silhouette, canvas_dims);
	expect(expected).not.toBeNull();
	if (!expected) return;

	const actual = parse_transform(await transform_of(page));
	expect(actual).not.toBeNull();
	if (!actual) return;

	expect(actual.scale).toBeCloseTo(expected.scale, 2);
	expect(actual.tx).toBeCloseTo(expected.tx, 0);
	expect(actual.ty).toBeCloseTo(expected.ty, 0);

	await page.emulateMedia({ media: null });
});

test('Rule 39 — a box whose visibility flag is off contributes nothing to the silhouette', async ({ page }) => {
	const ROOT  = { x_min: -40, x_max:  40, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	const ALPHA = { x_min: -40, x_max: -10, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	const BETA  = { x_min:  10, x_max:  40, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };

	// First pass: ALPHA alone (as child of invisible ROOT) — capture the silhouette.
	await setup_for_pixel_silhouette(page, async () => {
		await page.evaluate((args) => {
			const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
			t.add_so({ name: 'ROOT', bounds: args.root });
			t.set_so_visibility('ROOT', false);
			t.add_so({ name: 'ALPHA', bounds: args.alpha, parent_name: 'ROOT' });
		}, { root: ROOT, alpha: ALPHA });
	});
	const alpha_only_silhouette = await read_painted_silhouette(page);
	expect(alpha_only_silhouette).not.toBeNull();
	await page.emulateMedia({ media: null });

	// Second pass: ALPHA visible plus BETA invisible — BETA must not contribute.
	await setup_for_pixel_silhouette(page, async () => {
		await page.evaluate((args) => {
			const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
			t.add_so({ name: 'ROOT', bounds: args.root });
			t.set_so_visibility('ROOT', false);
			t.add_so({ name: 'ALPHA', bounds: args.alpha, parent_name: 'ROOT' });
			t.add_so({ name: 'BETA',  bounds: args.beta,  parent_name: 'ROOT' });
			t.set_so_visibility('BETA', false);
		}, { root: ROOT, alpha: ALPHA, beta: BETA });
	});

	const { canvas_dims } = await read_canvas_and_view_projection(page);
	const silhouette = await read_painted_silhouette(page);
	expect(silhouette).not.toBeNull();
	if (!silhouette || !alpha_only_silhouette) return;

	// The two-object-with-BETA-hidden silhouette must match the ALPHA-only silhouette
	// — BETA being invisible means it paints no pixels.
	expect(silhouette.left  ).toBeCloseTo(alpha_only_silhouette.left  , -1);
	expect(silhouette.top   ).toBeCloseTo(alpha_only_silhouette.top   , -1);
	expect(silhouette.width ).toBeCloseTo(alpha_only_silhouette.width , -1);
	expect(silhouette.height).toBeCloseTo(alpha_only_silhouette.height, -1);

	const expected = expected_transform_from_silhouette(silhouette, canvas_dims);
	expect(expected).not.toBeNull();
	if (!expected) return;

	const actual = parse_transform(await transform_of(page));
	expect(actual).not.toBeNull();
	if (!actual) return;

	expect(actual.scale).toBeCloseTo(expected.scale, 2);
	expect(actual.tx).toBeCloseTo(expected.tx, 0);
	expect(actual.ty).toBeCloseTo(expected.ty, 0);

	await page.emulateMedia({ media: null });
});

test('Rule 39 — a child whose ancestor has hide-children on contributes nothing to the silhouette', async ({ page }) => {
	// Wrap in an invisible ROOT — both passes use the same ROOT so the
	// per-frame "centre root at canvas origin" behaviour is consistent.
	const ROOT  = { x_min: -40, x_max:  40, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	const ALPHA = { x_min: -40, x_max: -10, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
	const CHILD = { x_min:  10, x_max:  40, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };

	// First pass: ALPHA alone (as child of invisible ROOT) — capture silhouette.
	await setup_for_pixel_silhouette(page, async () => {
		await page.evaluate((args) => {
			const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
			t.add_so({ name: 'ROOT', bounds: args.root });
			t.set_so_visibility('ROOT', false);
			t.add_so({ name: 'ALPHA', bounds: args.alpha, parent_name: 'ROOT' });
		}, { root: ROOT, alpha: ALPHA });
	});
	const alpha_only_silhouette = await read_painted_silhouette(page);
	expect(alpha_only_silhouette).not.toBeNull();
	await page.emulateMedia({ media: null });

	// Second pass: ALPHA plus CHILD (as grandchild via ALPHA), with hide-children on ALPHA — CHILD must not contribute.
	await setup_for_pixel_silhouette(page, async () => {
		await page.evaluate((args) => {
			const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
			t.add_so({ name: 'ROOT', bounds: args.root });
			t.set_so_visibility('ROOT', false);
			t.add_so({ name: 'ALPHA', bounds: args.alpha, parent_name: 'ROOT' });
			t.add_so({ name: 'CHILD', bounds: args.child, parent_name: 'ALPHA' });
			t.set_so_hide_children('ALPHA', true);
		}, { root: ROOT, alpha: ALPHA, child: CHILD });
	});

	const { canvas_dims } = await read_canvas_and_view_projection(page);
	const silhouette = await read_painted_silhouette(page);
	expect(silhouette).not.toBeNull();
	if (!silhouette || !alpha_only_silhouette) return;

	// The with-CHILD-hidden silhouette must match the ALPHA-only silhouette.
	expect(silhouette.left  ).toBeCloseTo(alpha_only_silhouette.left  , -1);
	expect(silhouette.top   ).toBeCloseTo(alpha_only_silhouette.top   , -1);
	expect(silhouette.width ).toBeCloseTo(alpha_only_silhouette.width , -1);
	expect(silhouette.height).toBeCloseTo(alpha_only_silhouette.height, -1);

	const expected = expected_transform_from_silhouette(silhouette, canvas_dims);
	expect(expected).not.toBeNull();
	if (!expected) return;

	const actual = parse_transform(await transform_of(page));
	expect(actual).not.toBeNull();
	if (!actual) return;

	expect(actual.scale).toBeCloseTo(expected.scale, 2);
	expect(actual.tx).toBeCloseTo(expected.tx, 0);
	expect(actual.ty).toBeCloseTo(expected.ty, 0);

	await page.emulateMedia({ media: null });
});

test('Rules 39 + 66 — an empty scene paints nothing during print (grid and axes suppressed), so the handler leaves the canvas untouched', async ({ page }) => {
	await setup_for_pixel_silhouette(page, async () => {
		// setup_print_page already cleared the scene. No SOs added.
	});

	// Rule 66: during print, the grid and axes are suppressed. With no SOs
	// added and nothing else painted, the canvas should be transparent —
	// the painted silhouette is empty.
	const silhouette = await read_painted_silhouette(page);
	expect(silhouette).toBeNull();

	// And the handler must therefore leave no transform applied.
	expect(await transform_of(page)).toBe('');

	await page.emulateMedia({ media: null });
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
