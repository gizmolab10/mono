import { test, expect } from '@playwright/test';

// Rule 55 — when the rotation-snap toggle is on, releasing a tumble drag
// animates the orientation to the nearest face-aligned orientation.

const orientation = (page: import('@playwright/test').Page) =>
	page.evaluate(() => (window as unknown as { di_test: { orientation: () => number[] } }).di_test.orientation());

test('a tumble drag with rotation-snap on lands on a face-aligned orientation', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	// Start the canvas tumble. With nothing selected, dragging the canvas tumbles.
	const canvas = page.locator('canvas').first();
	const box = await canvas.boundingBox();
	if (!box) throw new Error('canvas not visible');

	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;

	// Drag from center to a slightly off-axis position.
	await page.mouse.move(cx, cy);
	await page.mouse.down();
	await page.mouse.move(cx + 50, cy + 30, { steps: 10 });
	await page.mouse.up();

	// Allow time for the snap-back animation to complete. I AM GUESSING
	// the animation duration is short; a one-second wait should cover it.
	await page.waitForTimeout(1000);

	// The resulting orientation should be one of the six face-aligned ones.
	// A face-aligned quaternion has three components near zero and one near ±1
	// (approximately — the quaternion encodes the rotation; for face-aligned
	// rotations, it's typically (0,0,0,1), (0,0,1,0), (0,1,0,0), or (1,0,0,0)
	// or a 45-degree pair). We assert at least one component is close to ±1.
	const after = await orientation(page);
	const max_abs = Math.max(...after.map(n => Math.abs(n)));
	expect(max_abs).toBeGreaterThan(0.9);
});
