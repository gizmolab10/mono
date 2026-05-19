import { test, expect } from '@playwright/test';
import { open_app, load_basement, dim_labels, is_xray_active, set_so_visibility, set_all_visible } from './dim-helpers';

// Rule 13 — while OPTION is held AND at least one part is invisible,
// dimensions flip to draw only for the invisible parts. With every part
// visible, OPTION does nothing.

test('OPTION with every part visible does not flip to x-ray', async ({ page }) => {
	await open_app(page);
	await load_basement(page);

	// Basement ships with several parts hidden by default. Make every
	// part visible so the x-ray trigger condition cannot be met.
	await set_all_visible(page);
	await page.waitForTimeout(300);

	expect(await is_xray_active(page)).toBe(false);

	await page.keyboard.down('Alt');
	await page.waitForTimeout(200);

	// No invisible part, so x-ray does not engage even with OPTION held.
	expect(await is_xray_active(page)).toBe(false);

	await page.keyboard.up('Alt');
});

test('OPTION with one part hidden flips labels to that hidden part', async ({ page }) => {
	await open_app(page);
	await load_basement(page);

	// Start from a clean slate where every part is visible, so the only
	// hidden part going forward is the one this test chooses to hide.
	await set_all_visible(page);
	await page.waitForTimeout(300);

	const visible_labels = await dim_labels(page);
	expect(visible_labels.length).toBeGreaterThan(0);
	// Every label belongs to a visible part before anything is hidden.
	expect(visible_labels.every(l => l.so_visible)).toBe(true);

	// Hide one named part — pick the first SO that shows up in the labels.
	const hide_name = visible_labels[0].so_name;
	await set_so_visibility(page, hide_name, false);
	await page.waitForTimeout(400);

	// With OPTION released, dimensions for hidden parts are not drawn,
	// so the hidden-part label should be absent.
	const without_option = await dim_labels(page);
	expect(without_option.some(l => l.so_name === hide_name)).toBe(false);

	// Hold OPTION — x-ray engages, labels flip to invisible-part only.
	await page.keyboard.down('Alt');
	await page.waitForTimeout(400);

	expect(await is_xray_active(page)).toBe(true);

	const xray_labels = await dim_labels(page);
	expect(xray_labels.length).toBeGreaterThan(0);
	// In x-ray mode every drawn label belongs to a part whose visible
	// flag is off — the labels flipped to the hidden side of the drawing.
	expect(xray_labels.every(l => !l.so_visible)).toBe(true);

	await page.keyboard.up('Alt');
});
