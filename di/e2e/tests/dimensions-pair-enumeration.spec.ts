import { test, expect } from '@playwright/test';
import { open_app, load_basement } from './dim-helpers';

// New-design rule 10 / rule 11 — for every placeable label, the
// (edge, direction) enumeration must leave at least one viable pair
// standing after the camera-axis filter, the witness-length filter,
// and the 80-pixel push cap have run. A label with zero viable pairs
// is dropped, which is acceptable — but every PAINTED label must
// have come from a non-empty pair set. Needs the test hook
// dim_viable_pair_counts() (rule 25) that returns the viable-pair
// count per drawn label. Skipped until the hook exists.

type Pair_Report = { so_name: string; axis: 'x' | 'y' | 'z'; pair_count: number };
type Test_Window = {
	di_test: { dim_viable_pair_counts: () => Pair_Report[] };
};

test('every drawn label was chosen from a non-empty viable-pair set', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const reports = await page.evaluate(
		() => (window as unknown as Test_Window).di_test.dim_viable_pair_counts(),
	);

	const empty = reports.filter(r => r.pair_count === 0);
	expect(empty, `labels painted with no viable (edge, direction) pairs: ${JSON.stringify(empty)}`).toEqual([]);
});
