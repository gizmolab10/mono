import { test, expect } from '@playwright/test';

// Rule 56 — a drag with a current selection edits the selection. A drag
// with no selection tumbles the camera around the topmost SO.

const orientation = (page: import('@playwright/test').Page) =>
	page.evaluate(() => (window as unknown as { di_test: { orientation: () => number[] } }).di_test.orientation());

const selection = (page: import('@playwright/test').Page) =>
	page.evaluate(() => (window as unknown as { di_test: { selection: () => unknown } }).di_test.selection());

const angle_diff = (a: number[], b: number[]) => {
	let max = 0;
	for (let i = 0; i < Math.min(a.length, b.length); i++) {
		max = Math.max(max, Math.abs(a[i] - b[i]));
	}
	return max;
};

test('a drag of empty canvas changes the camera angle (a tumble)', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	// Whatever selection state we start in, the canvas-drag-tumbles behavior
	// holds when the drag does not engage with the selected target. We tumble
	// from a known-empty corner of the canvas.
	const before = await orientation(page);

	const canvas = page.locator('canvas').first();
	const box = await canvas.boundingBox();
	if (!box) throw new Error('canvas not visible');

	// Drag from a corner of the canvas — well off any centered SO.
	const sx = box.x + 30;
	const sy = box.y + 30;

	await page.mouse.move(sx, sy);
	await page.mouse.down();
	await page.mouse.move(sx + 100, sy + 80, { steps: 10 });
	await page.mouse.up();

	// Allow time for any post-drag snap animation to finish.
	await page.waitForTimeout(800);

	const after = await orientation(page);
	expect(angle_diff(before, after)).toBeGreaterThan(0.02);
});

test('with a selection in place, the selection persists after a drag', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	// Editing is allowed by default. If a prior toggle left the lock on, flip it off.
	const allowed = await page.evaluate(() =>
		(window as unknown as { di_test: { is_editing_allowed: () => boolean } }).di_test.is_editing_allowed()
	);
	if (!allowed) {
		await page.getByRole('button', { name: /edit ⟳/ }).click();
		await page.waitForFunction(() =>
			(window as unknown as { di_test: { is_editing_allowed: () => boolean } }).di_test.is_editing_allowed() === true
		);
	}

	const canvas = page.locator('canvas').first();
	const box = await canvas.boundingBox();
	if (!box) throw new Error('canvas not visible');
	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;

	// Click in the middle to make a selection.
	await page.mouse.click(cx, cy);
	await page.waitForTimeout(300);

	const before_sel = await selection(page);
	expect(before_sel).not.toBeNull();

	// Drag a small amount. The selection should persist; the drag does not
	// clear it. (Whether the drag edits the selection or tumbles depends on
	// which area was grabbed; both are valid behaviors of rule 56.)
	await page.mouse.move(cx, cy);
	await page.mouse.down();
	await page.mouse.move(cx + 20, cy + 10, { steps: 5 });
	await page.mouse.up();
	await page.waitForTimeout(300);

	const after_sel = await selection(page);
	expect(after_sel).not.toBeNull();
});
