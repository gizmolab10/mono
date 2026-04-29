import { test, expect } from '@playwright/test';

// Sanity check — the page loads and the read hooks attach.

test('the running app loads and the read hooks are reachable', async ({ page }) => {
	await page.goto('/?test=1');
	// Wait for the canvas to be present.
	await page.waitForSelector('canvas');
	// The read hooks attach during onMount. Wait a moment for them to register.
	await page.waitForFunction(() => 'di_test' in window);

	const view_mode = await page.evaluate(() => {
		const w = window as unknown as { di_test: { view_mode: () => string } };
		return w.di_test.view_mode();
	});
	expect(['2d', '3d']).toContain(view_mode);
});
