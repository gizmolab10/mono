import { test, expect } from '@playwright/test';
import { open_app, load_basement } from './dim-helpers';

// New-design rule 12 — when no four-DOF assignment can satisfy every
// clearance, the search drops the most-conflicted labels first.
// Forces an over-constrained state by shrinking the viewport down to a
// width where some labels must drop, then asserts the dropped labels
// are the ones with the highest conflict count. Needs a new test hook
// dim_drop_report() that returns the dropped labels along with the
// conflict count they had before being dropped. Skipped until the
// hook exists.

type Drop_Entry = { so_name: string; axis: 'x' | 'y' | 'z'; conflict_count: number };
type Test_Window = {
	di_test: { dim_drop_report: () => { dropped: Drop_Entry[]; kept_max_conflict: number } };
};

test.skip('over-constrained basement drops the most-conflicted labels first', async ({ page }) => {
	await page.setViewportSize({ width: 700, height: 500 });
	await open_app(page);
	await load_basement(page);

	const report = await page.evaluate(
		() => (window as unknown as Test_Window).di_test.dim_drop_report(),
	);

	expect(report.dropped.length).toBeGreaterThan(0);
	for (const d of report.dropped) {
		expect(
			d.conflict_count,
			`label ${d.so_name}:${d.axis} was dropped with conflict count ${d.conflict_count}, ` +
			`but a label with conflict count ${report.kept_max_conflict} was kept`,
		).toBeGreaterThanOrEqual(report.kept_max_conflict);
	}
});
