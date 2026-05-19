import { test, expect } from '@playwright/test';
import { open_app, load_basement, dim_labels, rects_overlap } from './dim-helpers';

// Rule 1 — crowded dimension labels separate via a force-driven pass.
// After the pass has settled, no two label rectangles should overlap.

test('settled basement layout has no pairwise label overlap', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	// Extra settling beyond what load_basement already waits for. The force
	// pass runs once per paint; a few hundred milliseconds is plenty.
	await page.waitForTimeout(800);

	const labels = await dim_labels(page);
	expect(labels.length).toBeGreaterThan(1);

	const overlaps: Array<{ a: string; b: string }> = [];
	for (let i = 0; i < labels.length; i++) {
		for (let j = i + 1; j < labels.length; j++) {
			if (rects_overlap(labels[i], labels[j])) {
				overlaps.push({ a: `${labels[i].so_name}:${labels[i].axis}`, b: `${labels[j].so_name}:${labels[j].axis}` });
			}
		}
	}

	// Print a useful failure message when something overlaps so the
	// regression is easy to track down.
	expect(overlaps, `overlapping pairs: ${JSON.stringify(overlaps)}`).toEqual([]);
});
