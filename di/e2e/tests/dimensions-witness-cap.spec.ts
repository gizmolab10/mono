import { test, expect, type Page } from '@playwright/test';
import { open_app, load_basement, dim_labels } from './dim-helpers';

// Rule 11 — caps to keep labels on the canvas. One of the caps says the
// projected witness line stays within 120 pixels. This test reads every
// drawn label's witness anchors and dimension-line endpoints, computes the
// drawn witness length, and asserts no drawn witness exceeds 120 pixels.

type Drawn_Line = {
	d1x: number; d1y: number; d2x: number; d2y: number;
	w1x: number; w1y: number; w2x: number; w2y: number;
};

async function dim_lines(page: Page): Promise<Drawn_Line[]> {
	return await page.evaluate(() => {
		const w = window as unknown as { di_test: { dim_lines: () => Drawn_Line[] } };
		return w.di_test.dim_lines();
	});
}

function distance(ax: number, ay: number, bx: number, by: number): number {
	return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

test('every drawn witness line is within the 120-pixel cap', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);
	await page.waitForTimeout(800);

	const labels = await dim_labels(page);
	const lines = await dim_lines(page);
	expect(labels.length).toBe(lines.length);
	expect(labels.length).toBeGreaterThan(0);

	const CAP = 120;
	const SLACK = 1; // one pixel of floating-point slack
	const violators: Array<{ label: string; w1: number; w2: number }> = [];
	for (let i = 0; i < labels.length; i++) {
		const lab = labels[i];
		const ln = lines[i];
		const w1len = distance(ln.w1x, ln.w1y, ln.d1x, ln.d1y);
		const w2len = distance(ln.w2x, ln.w2y, ln.d2x, ln.d2y);
		if (w1len > CAP + SLACK || w2len > CAP + SLACK) {
			violators.push({ label: `${lab.so_name}/${lab.axis}`, w1: w1len, w2: w2len });
		}
	}

	for (const v of violators) {
		console.log(`  >>> over-long witness: ${v.label}  w1=${v.w1.toFixed(1)} w2=${v.w2.toFixed(1)}`);
	}
	console.log(`  >>> drawn = ${labels.length}, over-long = ${violators.length}`);

	expect(violators, `witness lines over cap: ${JSON.stringify(violators)}`).toEqual([]);
});
