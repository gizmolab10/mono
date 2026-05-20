import { test, expect } from '@playwright/test';
import { open_app, load_basement } from './dim-helpers';

// New-design performance budget — when the view hasn't changed, the
// search must be skipped and the search-skipped path (reusing last paint's four-DOF values)
// must complete in under 5 milliseconds. Needs a new test hook
// dim_last_warm_path_ms() that returns the duration of the most recent
// warm-path paint. Skipped until the hook exists.

type Test_Window = {
	di_test: { dim_last_warm_path_ms: () => number };
};

test.skip('warm-path paint on basement stays under 5 milliseconds', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	// Extra paint with no view change to exercise the warm path.
	await page.waitForTimeout(500);

	const ms = await page.evaluate(
		() => (window as unknown as Test_Window).di_test.dim_last_warm_path_ms(),
	);

	expect(ms, `warm-path paint took ${ms.toFixed(1)} ms`).toBeLessThanOrEqual(5);
});
