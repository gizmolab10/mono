import { test, type Page } from '@playwright/test';
import { open_app, load_basement, dim_labels, dim_dropped_count } from './dim-helpers';

// TEMP measurement — not a real test. Loads a scene at a fixed orientation,
// measures label count + dropped count with the spring on, then turns the
// spring off and measures again. Prints both numbers so we can quote real
// percentages instead of guessing.

type Probe = { drawn: number; dropped: number; inside: number };

async function set_spring(page: Page, k: number): Promise<void> {
	await page.evaluate((kk) => {
		const w = window as unknown as { di_test: { set_spring_k: (v: number) => null } };
		w.di_test.set_spring_k(kk);
	}, k);
}

async function set_orientation(page: Page, q: [number, number, number, number]): Promise<void> {
	await page.evaluate((qq) => {
		const w = window as unknown as { di_test: { set_orientation: (q: number[]) => null } };
		w.di_test.set_orientation(qq);
	}, q as unknown as number[]);
}

async function probe(page: Page): Promise<Probe> {
	await page.waitForTimeout(1500);
	const inside = await page.evaluate(() => {
		const w = window as unknown as { di_test: { dim_inside_count: () => number } };
		return w.di_test.dim_inside_count();
	});
	return { drawn: (await dim_labels(page)).length, dropped: await dim_dropped_count(page), inside };
}

async function load_drawer(page: Page): Promise<void> {
	const ok = await page.evaluate(async () => {
		const w = window as unknown as { di_test: { load_scene: (n: string) => Promise<boolean> } };
		return await w.di_test.load_scene('cabinetry/drawer');
	});
	if (!ok) throw new Error('failed to load drawer scene');
	await page.waitForFunction(() => {
		const w = window as unknown as { di_test: { dim_labels: () => unknown[] } };
		return w.di_test.dim_labels().length > 0;
	}, undefined, { timeout: 10_000 });
	await page.waitForTimeout(500);
}

function pct(after: number, before: number): string {
	if (before === 0) return 'n/a';
	return `${((after - before) / before * 100).toFixed(1)}%`;
}

async function measure_at(label: string, page: Page): Promise<void> {
	await set_spring(page, 0.08);
	const on = await probe(page);
	await set_spring(page, 0);
	const off = await probe(page);
	await set_spring(page, 0.08);
	console.log(`  >>> ${label}`);
	console.log(`  >>>   spring on:  drawn=${on.drawn}  dropped-avg=${on.dropped.toFixed(1)}  inside-silhouette=${on.inside}`);
	console.log(`  >>>   spring off: drawn=${off.drawn}  dropped-avg=${off.dropped.toFixed(1)}  inside-silhouette=${off.inside}`);
	console.log(`  >>>   delta:      drawn=${off.drawn - on.drawn} (${pct(off.drawn, on.drawn)})  dropped=${(off.dropped - on.dropped).toFixed(1)} (${pct(off.dropped, on.dropped)})  inside=${off.inside - on.inside}`);
}

test('measure spring on vs off across scenes and orientations', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);

	await load_basement(page);
	await measure_at('basement at default orientation', page);

	await load_drawer(page);
	await measure_at('drawer at default orientation', page);

	await set_orientation(page, [0.12, 0.63, 0.69, -0.33]);
	await measure_at('drawer at [0.12, 0.63, 0.69, -0.33]', page);

	await set_orientation(page, [-0.35, -0.38, -0.57, 0.64]);
	await measure_at('drawer at [-0.35, -0.38, -0.57, 0.64]', page);

	await set_orientation(page, [-0.48, -0.42, -0.49, 0.60]);
	await measure_at('drawer at [-0.48, -0.42, -0.49, 0.60]', page);
});
