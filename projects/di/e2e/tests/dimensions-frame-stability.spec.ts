import { test, expect } from '@playwright/test';
import { open_app, load_basement, dim_labels } from './dim-helpers';

// New-design rule 19 — when the view doesn't change between paints,
// last paint's four-DOF values are reused. The visible outcome: every drawn label
// sits at the SAME screen position from one paint to the next. The
// old force pass would micro-shift labels frame to frame; the new
// design must not.

test('basement labels stay put between successive paints under no view change', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const first = await dim_labels(page);
	await page.waitForTimeout(800);
	const second = await dim_labels(page);

	expect(first.length).toBe(second.length);

	const drifted: Array<{ key: string; first: { x: number; y: number }; second: { x: number; y: number }; px: number }> = [];
	const a_sorted = [...first].sort((a, b) => a.so_name.localeCompare(b.so_name) || a.axis.localeCompare(b.axis));
	const b_sorted = [...second].sort((a, b) => a.so_name.localeCompare(b.so_name) || a.axis.localeCompare(b.axis));

	for (let i = 0; i < a_sorted.length; i++) {
		const a = a_sorted[i];
		const b = b_sorted[i];
		const dx = a.x - b.x;
		const dy = a.y - b.y;
		const px = Math.sqrt(dx * dx + dy * dy);
		if (px > 0.5) {
			drifted.push({
				key: `${a.so_name}:${a.axis}`,
				first:  { x: Math.round(a.x), y: Math.round(a.y) },
				second: { x: Math.round(b.x), y: Math.round(b.y) },
				px: Math.round(px),
			});
		}
	}

	expect(drifted, `labels drifted between paints: ${JSON.stringify(drifted)}`).toEqual([]);
});
