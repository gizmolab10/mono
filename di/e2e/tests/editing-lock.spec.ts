import { test, expect } from '@playwright/test';

// Rule 53 — when the editing-lock toggle is on, clicks on the canvas do nothing.
// The cursor stays as the open-grab-hand and no selection is made.

const is_editing_allowed = (page: import('@playwright/test').Page) =>
	page.evaluate(() => (window as unknown as { di_test: { is_editing_allowed: () => boolean } }).di_test.is_editing_allowed());

const current_selection = (page: import('@playwright/test').Page) =>
	page.evaluate(() => (window as unknown as { di_test: { selection: () => unknown } }).di_test.selection());

// Move the editing-lock toggle into the requested state. Reads the current
// state and clicks the toolbar button only if it isn't already there.
async function set_lock(page: import('@playwright/test').Page, want_locked: boolean): Promise<void> {
	const want_allowed = !want_locked;
	const allowed = await is_editing_allowed(page);
	if (allowed === want_allowed) return;
	await page.getByRole('button', { name: /edit ⟳/ }).click();
	await page.waitForFunction(
		(target) => (window as unknown as { di_test: { is_editing_allowed: () => boolean } }).di_test.is_editing_allowed() === target,
		want_allowed,
	);
}

test('the lock toggle starts off by default — editing is allowed at startup', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	expect(await is_editing_allowed(page)).toBe(true);
});

test('with the editing-lock turned on, a click on the canvas does not pick a part', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	await set_lock(page, true);
	expect(await is_editing_allowed(page)).toBe(false);

	const canvas = page.locator('canvas').first();
	await canvas.click();

	expect(await current_selection(page)).toBeNull();
});

test('with the editing-lock turned off, a click on the canvas picks a part', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	await set_lock(page, false);
	expect(await is_editing_allowed(page)).toBe(true);

	const canvas = page.locator('canvas').first();
	const box = await canvas.boundingBox();
	if (!box) throw new Error('canvas not visible');
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

	await page.waitForTimeout(300);

	const selection = await current_selection(page);
	expect(selection).not.toBeNull();
});
