import { test, expect } from '@playwright/test';

// Rule 54 — switching from the normal three-dimensional view to the flat
// view snaps the camera onto the front-most face of the topmost SO and
// saves the prior orientation. Switching back restores that orientation.

const view_mode = (page: import('@playwright/test').Page) =>
	page.evaluate(() => (window as unknown as { di_test: { view_mode: () => string } }).di_test.view_mode());

const orientation = (page: import('@playwright/test').Page) =>
	page.evaluate(() => (window as unknown as { di_test: { orientation: () => number[] } }).di_test.orientation());

test('switching from 3D to 2D and back restores the prior orientation', async ({ page }) => {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	// Start in 3D mode by default. If not, this test is not meaningful.
	expect(await view_mode(page)).toBe('3d');
	const before = await orientation(page);

	// Toggle to 2D mode via the toolbar button. The button text contains "2D" or "3D"
	// depending on the current mode.
	const mode_button = page.getByRole('button', { name: /3D|2D/ });
	await expect(mode_button).toBeVisible();
	await mode_button.click();

	// Wait for the mode to flip.
	await page.waitForFunction(() =>
		(window as unknown as { di_test: { view_mode: () => string } }).di_test.view_mode() === '2d'
	);

	// Toggle back to 3D mode.
	await mode_button.click();
	await page.waitForFunction(() =>
		(window as unknown as { di_test: { view_mode: () => string } }).di_test.view_mode() === '3d'
	);

	// Allow the snap-back animation to settle. I AM GUESSING the animation
	// takes well under a second; a half-second wait should be plenty.
	await page.waitForTimeout(700);

	// The orientation should be very close to where it started.
	const after = await orientation(page);
	expect(after.length).toBe(before.length);
	for (let i = 0; i < before.length; i++) {
		expect(Math.abs(after[i] - before[i])).toBeLessThan(0.05);
	}
});
