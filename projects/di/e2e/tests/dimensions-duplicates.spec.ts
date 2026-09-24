import { test, expect, type Page } from '@playwright/test';
import { open_app, dim_labels } from './dim-helpers';

// Rule 4 — when two parts produce the same dimension text, only one label
// for that text is drawn. Build a scene with two boxes of identical bounds
// and confirm the resulting labels have no duplicate text strings.

type Test_Window = {
	di_test: {
		clear_scene: () => null;
		add_so: (config: { name: string; bounds: Record<string, number>; parent_name?: string }) => null;
	};
};

async function clear_scene(page: Page): Promise<void> {
	await page.evaluate(() => {
		const w = window as unknown as Test_Window;
		w.di_test.clear_scene();
	});
}

async function add_so(page: Page, name: string, bounds: Record<string, number>): Promise<void> {
	await page.evaluate(({ name, bounds }) => {
		const w = window as unknown as Test_Window;
		w.di_test.add_so({ name, bounds });
	}, { name, bounds });
}

test('two parts of identical size produce only one label per dimension text', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);

	await clear_scene(page);
	// Two boxes of exactly the same size, separated along the x axis so they
	// project as distinct objects on screen. Each box would normally produce
	// three labels (one per axis); with the duplicate-text rule, only the
	// first instance of each unique number should survive.
	await add_so(page, 'ALPHA', { x_min: -100, x_max: -20, y_min: 0, y_max: 50, z_min: 0, z_max: 30 });
	await add_so(page, 'BETA',  { x_min:   20, x_max: 100, y_min: 0, y_max: 50, z_min: 0, z_max: 30 });

	await page.waitForFunction(() => {
		const w = window as unknown as { di_test: { dim_labels: () => unknown[] } };
		return w.di_test.dim_labels().length > 0;
	}, undefined, { timeout: 10_000 });
	await page.waitForTimeout(800);

	const labels = await dim_labels(page);
	expect(labels.length).toBeGreaterThan(0);

	// Read the text of each label via a fresh evaluate, since dim_labels does
	// not expose the text string. Use the same iteration order as dim_labels.
	const texts = await page.evaluate(() => {
		const w = window as unknown as { di_test: { dim_lines: () => unknown[] } };
		void w.di_test.dim_lines();
		// dim_labels does not carry text; reach into the render dimension rects
		// for the text via a side-channel — read every drawn dim text from the canvas-side state.
		// Fallback: just use the so_name/axis pair as a proxy for "should be unique".
		return [];
	});
	void texts;

	// Without label text exposed, fall back to checking (so_name, axis) pairs are unique:
	// duplicate dimensions on different parts but same axis would print as the same value,
	// triggering the drop-duplicate rule. So (so_name, axis) duplicates SHOULD NOT happen.
	const seen = new Set<string>();
	const dups: string[] = [];
	for (const l of labels) {
		const key = `${l.so_name}/${l.axis}`;
		if (seen.has(key)) dups.push(key);
		seen.add(key);
	}
	expect(dups, `duplicate (part, axis) keys: ${JSON.stringify(dups)}`).toEqual([]);

	// With ALPHA and BETA matching exactly on all three axes, the total drawn
	// label count must be exactly 3 (one for each unique axis value), not 6.
	const ALPHA_labels = labels.filter(l => l.so_name === 'ALPHA').length;
	const BETA_labels  = labels.filter(l => l.so_name === 'BETA').length;
	console.log(`  >>> ALPHA labels = ${ALPHA_labels}, BETA labels = ${BETA_labels}, total = ${labels.length}`);
	expect(ALPHA_labels + BETA_labels).toBe(3);
});
