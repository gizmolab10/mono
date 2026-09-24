import { test, expect } from '@playwright/test';
import { open_app, load_basement } from './dim-helpers';

// New-design rule 10 (correctness check on the search input) — every
// pair of labels flagged as "in conflict" by the search must really be
// under 33 screen pixels apart, and every pair under 33 pixels apart
// must be flagged. No false positives, no false negatives — otherwise
// the search either rejects fine assignments or accepts overlapping
// ones. Needs a new test hook dim_conflict_graph_check() that returns
// any mislabeled pairs. Skipped until the hook exists.

type Mislabel = { a: string; b: string; gap: number; flagged: boolean };
type Test_Window = {
	di_test: { dim_conflict_graph_check: () => Mislabel[] };
};

test('conflict graph flags exactly the pairs under 33 pixels', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const mislabels = await page.evaluate(
		() => (window as unknown as Test_Window).di_test.dim_conflict_graph_check(),
	);

	expect(mislabels, `mislabeled label pairs: ${JSON.stringify(mislabels)}`).toEqual([]);
});
