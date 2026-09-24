import { test, expect } from '@playwright/test';
import { open_app, load_basement, dim_labels } from './dim-helpers';

// New-design rule 21 (search determinism) — loading the same scene
// from a fresh app twice must produce the same chosen four-DOF values
// per label. Without determinism, basement.di would flicker between
// equivalent solutions on every reload.

test('loading basement twice produces identical label positions', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });

	await open_app(page);
	await load_basement(page);
	const first = await dim_labels(page);

	await page.reload();
	await page.waitForFunction(() => 'di_test' in window);
	await load_basement(page);
	const second = await dim_labels(page);

	expect(first.length).toBe(second.length);
	expect(first.length).toBeGreaterThan(1);

	const first_sorted  = [...first].sort((a, b) => a.so_name.localeCompare(b.so_name) || a.axis.localeCompare(b.axis));
	const second_sorted = [...second].sort((a, b) => a.so_name.localeCompare(b.so_name) || a.axis.localeCompare(b.axis));

	const diffs: Array<{ key: string; first: { x: number; y: number }; second: { x: number; y: number } }> = [];
	for (let i = 0; i < first_sorted.length; i++) {
		const a = first_sorted[i];
		const b = second_sorted[i];
		if (a.so_name !== b.so_name || a.axis !== b.axis) {
			diffs.push({ key: `${a.so_name}:${a.axis} vs ${b.so_name}:${b.axis}`, first: { x: a.x, y: a.y }, second: { x: b.x, y: b.y } });
			continue;
		}
		if (Math.round(a.x) !== Math.round(b.x) || Math.round(a.y) !== Math.round(b.y)) {
			diffs.push({ key: `${a.so_name}:${a.axis}`, first: { x: Math.round(a.x), y: Math.round(a.y) }, second: { x: Math.round(b.x), y: Math.round(b.y) } });
		}
	}

	expect(diffs, `label positions differed between runs: ${JSON.stringify(diffs)}`).toEqual([]);
});
