import { test, expect } from '@playwright/test';

// Rule 55 — when the rotation-snap toggle is on, releasing a tumble drag
// animates the orientation to the nearest face-aligned orientation.

const orientation = (page: import('@playwright/test').Page) =>
	page.evaluate(() => (window as unknown as { di_test: { orientation: () => number[] } }).di_test.orientation());

const is_rotation_snap_on = (page: import('@playwright/test').Page) =>
	page.evaluate(() => (window as unknown as { di_test: { is_rotation_snap_on: () => boolean } }).di_test.is_rotation_snap_on());

// Move the rotation-snap toggle into the requested state. Reads the current
// state and clicks the toolbar button only if it isn't already there.
async function set_rotation_snap(page: import('@playwright/test').Page, want_on: boolean): Promise<void> {
	const on = await is_rotation_snap_on(page);
	if (on === want_on) return;
	await page.locator('button.snap-button').click();
	await page.waitForFunction(
		(target) => (window as unknown as { di_test: { is_rotation_snap_on: () => boolean } }).di_test.is_rotation_snap_on() === target,
		want_on,
	);
}

test('a tumble drag with rotation-snap on lands on a face-aligned orientation', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	// Snap is off by default — turn it on for this test.
	await set_rotation_snap(page, true);
	expect(await is_rotation_snap_on(page)).toBe(true);

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

	// The resulting orientation should be one of the twenty-four face-aligned
	// rotations of the cube. Face-aligned cube quaternions only contain the
	// values 0, ±0.5, ±√2/2, and ±1 — so each component squared sits near
	// 0, 0.25, 0.5, or 1.0. We assert all four components meet that test.
	const after = await orientation(page);
	const allowed_squares = [0, 0.25, 0.5, 1.0];
	const tolerance = 0.02;
	for (const component of after) {
		const sq = component * component;
		const nearest = allowed_squares.reduce((best, candidate) =>
			Math.abs(candidate - sq) < Math.abs(best - sq) ? candidate : best,
		);
		expect(Math.abs(nearest - sq)).toBeLessThan(tolerance);
	}
});
