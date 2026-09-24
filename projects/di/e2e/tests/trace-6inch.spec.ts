import { test, type Page } from '@playwright/test';

// TEMP trace — load drawer at the exact orientation/zoom Jonathan saw the
// 6" label slant, capture the browser console, print every dimension-line
// fallback the painter reports.

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

test.skip('trace dimension-line fallbacks on drawer at the 6" view', async ({ page }) => {
	const seen = new Set<string>();
	page.on('console', msg => {
		const t = msg.text();
		if (t.includes('fell behind the witness line') && !seen.has(t)) {
			seen.add(t);
			console.log('  >>>', t);
		}
	});

	await page.setViewportSize({ width: 1400, height: 900 });
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	const ok = await page.evaluate(async () => {
		const w = window as unknown as { di_test: { load_scene: (n: string) => Promise<boolean> } };
		return await w.di_test.load_scene('cabinetry/drawer');
	});
	if (!ok) throw new Error('failed to load drawer scene');

	await set_orientation(page, [-0.12, -0.60, -0.72, 0.33]);
	await set_scale(page, 2.08);

	await page.waitForFunction(() => {
		const w = window as unknown as { di_test: { dim_labels: () => unknown[] } };
		return w.di_test.dim_labels().length > 0;
	}, undefined, { timeout: 10_000 });
	await page.waitForTimeout(1500);

	// Print which labels are present so we know the 6" survived.
	const labels = await page.evaluate(() => {
		const w = window as unknown as { di_test: { dim_labels: () => Array<{ so_name: string; axis: string }> } };
		return w.di_test.dim_labels();
	});
	console.log('  >>> labels drawn:', labels.map(l => `${l.so_name}/${l.axis}`).join(', '));
});
