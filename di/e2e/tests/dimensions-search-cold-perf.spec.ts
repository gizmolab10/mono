import { test, expect } from '@playwright/test';
import { open_app, load_basement } from './dim-helpers';

// New-design performance budget — a full cold run of the search on
// basement.di (around 100 labels after repeater clones are dropped)
// must complete within roughly 25 milliseconds. Needs a new test hook
// dim_last_cold_search_ms() that returns the duration of the most
// recent full-search run. Skipped until the hook exists.

type Test_Window = {
	di_test: {
		dim_last_cold_search_ms: () => number;
		force_cold_search: () => null;
	};
};

test.skip('cold-run search on basement stays under 25 milliseconds', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	await page.evaluate(() => (window as unknown as Test_Window).di_test.force_cold_search());
	const ms = await page.evaluate(
		() => (window as unknown as Test_Window).di_test.dim_last_cold_search_ms(),
	);

	expect(ms, `cold-run search took ${ms.toFixed(1)} ms`).toBeLessThanOrEqual(25);
});
