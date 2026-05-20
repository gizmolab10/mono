import { test, expect } from '@playwright/test';
import { open_app, load_basement, dim_labels, dim_dropped_count, type Dim_Label } from './dim-helpers';

// New-design rule 16 — sanity check that the search finds a real
// solution on basement.di at a roomy viewport, NOT a degenerate one
// padded with drops. Asserts:
//   - at least a handful of labels are drawn
//   - the dropped count is zero (every label found a placement)
//   - every pair of labels keeps 33 pixels clearance
// If the search ever has to fall back on the drop policy here, the
// search itself is too weak for the target scene.

function rect_distance(a: Dim_Label, b: Dim_Label): number {
	const dx = Math.max(0, Math.abs(a.x - b.x) - (a.w + b.w) / 2);
	const dy = Math.max(0, Math.abs(a.y - b.y) - (a.h + b.h) / 2);
	return Math.sqrt(dx * dx + dy * dy);
}

test('basement search finds an assignment with no drops and full pairwise clearance', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const labels = await dim_labels(page);
	const dropped = await dim_dropped_count(page);

	expect(labels.length).toBeGreaterThan(10);
	expect(dropped, `expected zero dropped labels but got ${dropped}`).toBe(0);

	const too_close: Array<{ a: string; b: string; gap: number }> = [];
	for (let i = 0; i < labels.length; i++) {
		for (let j = i + 1; j < labels.length; j++) {
			const gap = rect_distance(labels[i], labels[j]);
			if (gap < 33) {
				too_close.push({
					a: `${labels[i].so_name}:${labels[i].axis}`,
					b: `${labels[j].so_name}:${labels[j].axis}`,
					gap: Math.round(gap),
				});
			}
		}
	}

	expect(too_close, `pairs under 33 pixels: ${JSON.stringify(too_close)}`).toEqual([]);
});
