import { test, expect } from '@playwright/test';
import { open_app, load_basement } from './dim-helpers';

// New-design rule 18 — repeater clones are skipped entirely; only the
// template (the first child of a repeater) draws all three axes. The
// fireblock exception (first and shortened-last fireblocks draw the
// repeat-axis dimension) is covered separately by dimensions-
// fireblock-obstacles.spec.ts. This test asserts that no ordinary
// repeater clone has any drawn dimension at all.
//
// Needs a new test hook dim_labels_by_kind() that tags each painted
// label as one of: 'template', 'clone', 'fireblock-first',
// 'fireblock-last-shortened', or 'regular' (no repeater context).
// Skipped until the hook exists.

type Tagged_Label = {
	so_name: string;
	axis: 'x' | 'y' | 'z';
	kind: 'template' | 'clone' | 'fireblock-first' | 'fireblock-last-shortened' | 'regular';
};
type Test_Window = {
	di_test: { dim_labels_by_kind: () => Tagged_Label[] };
};

test.skip('ordinary repeater clones (non-fireblock) draw no dimensions', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const labels = await page.evaluate(
		() => (window as unknown as Test_Window).di_test.dim_labels_by_kind(),
	);

	const stray_clones = labels.filter(l => l.kind === 'clone');
	expect(stray_clones, `clone labels found (should be zero): ${JSON.stringify(stray_clones)}`).toEqual([]);
});
