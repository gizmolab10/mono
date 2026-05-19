import { test, expect, type Page } from '@playwright/test';
import { open_app, dim_labels } from './dim-helpers';

// Rule 16 — every drawn label's centre sits on or outside the combined
// silhouette outline. Loads drawer at one of the orientations Jonathan
// reported labels-inside-silhouette behavior at, then asserts the
// inside-silhouette count is zero.
//
// As of the floater fix, the labels that used to land inside the outline
// at this orientation have been dropped (their drawn lines could not be
// painted parallel), so the count is zero today. If Jonathan reports new
// inside-silhouette views, additional orientations should be added here.

async function set_scale(page: Page, s: number): Promise<void> {
	await page.evaluate((ss) => {
		const w = window as unknown as { di_test: { set_scale: (v: number) => null } };
		w.di_test.set_scale(ss);
	}, s);
}

async function set_orientation(page: Page, q: [number, number, number, number]): Promise<void> {
	await page.evaluate((qq) => {
		const w = window as unknown as { di_test: { set_orientation: (q: number[]) => null } };
		w.di_test.set_orientation(qq);
	}, q as unknown as number[]);
}

async function inside_count(page: Page): Promise<number> {
	return await page.evaluate(() => {
		const w = window as unknown as { di_test: { dim_inside_count: () => number } };
		return w.di_test.dim_inside_count();
	});
}

test('drawer at the inside-silhouette orientation has no labels inside the outline', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	const ok = await page.evaluate(async () => {
		const w = window as unknown as { di_test: { load_scene: (n: string) => Promise<boolean> } };
		return await w.di_test.load_scene('cabinetry/drawer');
	});
	if (!ok) throw new Error('failed to load drawer scene');

	await set_orientation(page, [0.12, 0.63, 0.69, -0.33]);
	await set_scale(page, 2.08);

	await page.waitForFunction(() => {
		const w = window as unknown as { di_test: { dim_labels: () => unknown[] } };
		return w.di_test.dim_labels().length > 0;
	}, undefined, { timeout: 10_000 });
	await page.waitForTimeout(1500);

	const labels = await dim_labels(page);
	const inside = await inside_count(page);
	console.log(`  >>> drawn = ${labels.length}, inside silhouette = ${inside}`);

	expect(inside).toBe(0);
});
