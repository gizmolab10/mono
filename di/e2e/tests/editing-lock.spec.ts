import { test, expect } from '@playwright/test';

// Rule 53 — when the editing-lock toggle is on, clicks on the canvas do nothing.
// The cursor stays as the open-grab-hand and no selection is made.

// Read the lock state from the page's read hooks.
const is_editing_allowed = (page: import('@playwright/test').Page) =>
	page.evaluate(() => (window as unknown as { di_test: { is_editing_allowed: () => boolean } }).di_test.is_editing_allowed());

// Read the current selection (or null) from the page's read hooks.
const current_selection = (page: import('@playwright/test').Page) =>
	page.evaluate(() => (window as unknown as { di_test: { selection: () => unknown } }).di_test.selection());

test('the lock toggle starts on by default', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	// allow_editing is false when the lock is on.
	expect(await is_editing_allowed(page)).toBe(false);
});

test('with the editing-lock on, a click on the canvas does not pick a part', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	// Confirm lock is on; if not, this test would not be meaningful.
	expect(await is_editing_allowed(page)).toBe(false);

	// Click somewhere on the canvas. Pick the middle of the canvas.
	const canvas = page.locator('canvas').first();
	await canvas.click();

	// With the lock on, no selection should result.
	expect(await current_selection(page)).toBeNull();
});

test('once the editing-lock is toggled off, clicks on the canvas pick a part', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	// Toggle the lock off via the toolbar button (matched by its text).
	// The button's text is either "edit ⟳" (lock off) or "🔒 edit ⟳" (lock on).
	const lock_button = page.getByRole('button', { name: /edit ⟳/ });
	await expect(lock_button).toBeVisible();
	await lock_button.click();

	// Wait until the read hook confirms the lock is now off.
	await page.waitForFunction(() =>
		(window as unknown as { di_test: { is_editing_allowed: () => boolean } }).di_test.is_editing_allowed() === true
	);

	// Click in the middle of the canvas. The default scene loads with parts
	// visible near the center, so a click there should hit something.
	const canvas = page.locator('canvas').first();
	const box = await canvas.boundingBox();
	if (!box) throw new Error('canvas not visible');
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

	// Allow a moment for the click to propagate through the hit-test.
	await page.waitForTimeout(300);

	const selection = await current_selection(page);
	expect(selection).not.toBeNull();
});
