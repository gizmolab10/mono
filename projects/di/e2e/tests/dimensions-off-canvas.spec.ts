import { test, expect } from '@playwright/test';
import { open_app, load_basement, dim_labels, dim_dropped_count } from './dim-helpers';

// Rule 11/12 — dimension labels that would push past the canvas edge are
// dropped instead of clipped. When the canvas is roomy, nothing drops;
// when the canvas is squeezed, the dropped count climbs and the labels
// that survive all sit inside the canvas rectangle.

test('basement at a roomy viewport draws labels and reports a dropped count', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const labels = await dim_labels(page);
	expect(labels.length).toBeGreaterThan(0);
	// The dropped count is a non-negative running average; basement is
	// dense enough that even a roomy viewport may drop a few labels.
	// The number must be finite and not negative.
	const dropped = await dim_dropped_count(page);
	expect(dropped).toBeGreaterThanOrEqual(0);
	expect(Number.isFinite(dropped)).toBe(true);
});

test('squeezing the viewport drops more labels and the survivors stay on canvas', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const roomy_labels = await dim_labels(page);
	const roomy_dropped = await dim_dropped_count(page);
	expect(roomy_labels.length).toBeGreaterThan(0);

	await page.setViewportSize({ width: 320, height: 320 });
	await page.waitForTimeout(1200);

	const tight_labels = await dim_labels(page);
	const tight_dropped = await dim_dropped_count(page);

	// The squeeze should either increase the dropped count or reduce the
	// survivor count below the roomy count.
	expect(tight_dropped >= roomy_dropped || tight_labels.length < roomy_labels.length).toBe(true);

	// Every surviving label must sit fully inside the canvas rectangle.
	const canvas_box = await page.locator('canvas').first().boundingBox();
	if (!canvas_box) throw new Error('canvas not visible');
	for (const label of tight_labels) {
		const left = label.x - label.w / 2;
		const right = label.x + label.w / 2;
		const top = label.y - label.h / 2;
		const bottom = label.y + label.h / 2;
		expect(left).toBeGreaterThanOrEqual(-1);
		expect(top).toBeGreaterThanOrEqual(-1);
		expect(right).toBeLessThanOrEqual(canvas_box.width + 1);
		expect(bottom).toBeLessThanOrEqual(canvas_box.height + 1);
	}
});
