import { test, expect } from '@playwright/test';
import { open_app, load_basement, dim_labels, type Dim_Label } from './dim-helpers';

// New-design rule 5 — every pair of drawn labels keeps at least
// PAIR_CLEARANCE_PX (5 screen pixels today) apart, measured
// rectangle-to-rectangle. Step 6 salvage: threshold tracks the new
// rule 5; the old 33-px number from the abandoned algorithm is gone.

function rect_distance(a: Dim_Label, b: Dim_Label): number {
	const a_left   = a.x - a.w / 2;
	const a_right  = a.x + a.w / 2;
	const a_top    = a.y - a.h / 2;
	const a_bottom = a.y + a.h / 2;
	const b_left   = b.x - b.w / 2;
	const b_right  = b.x + b.w / 2;
	const b_top    = b.y - b.h / 2;
	const b_bottom = b.y + b.h / 2;
	const dx = Math.max(0, Math.max(b_left - a_right, a_left - b_right));
	const dy = Math.max(0, Math.max(b_top - a_bottom, a_top - b_bottom));
	return Math.sqrt(dx * dx + dy * dy);
}

test('every pair of drawn labels on basement keeps at least 5 pixels apart', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const labels = await dim_labels(page);
	expect(labels.length).toBeGreaterThan(1);

	const too_close: Array<{ a: string; b: string; gap: number }> = [];
	for (let i = 0; i < labels.length; i++) {
		for (let j = i + 1; j < labels.length; j++) {
			const gap = rect_distance(labels[i], labels[j]);
			if (gap < 5) {
				too_close.push({
					a: `${labels[i].so_name}:${labels[i].axis}`,
					b: `${labels[j].so_name}:${labels[j].axis}`,
					gap: Math.round(gap),
				});
			}
		}
	}

	expect(too_close, `pairs under 5 pixels: ${JSON.stringify(too_close)}`).toEqual([]);
});
