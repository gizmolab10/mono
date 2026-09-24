import { test, expect } from '@playwright/test';
import { open_app, load_basement } from './dim-helpers';

// New-design rule 16 (first postcondition) — every drawn label sits at
// least 15 screen pixels outside the combined silhouette outline,
// measured from the closest rectangle corner. Needs a new test hook
// dim_min_silhouette_clearance() that returns the smallest such distance
// across every drawn label. Skipped until the hook exists.

type Test_Window = {
	di_test: { dim_min_silhouette_clearance: () => number };
};

test('every drawn label sits at least 15 pixels outside the combined outline', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const min_clearance = await page.evaluate(
		() => (window as unknown as Test_Window).di_test.dim_min_silhouette_clearance(),
	);

	expect(min_clearance).toBeGreaterThanOrEqual(15);
});
