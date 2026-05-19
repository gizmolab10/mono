import { test, expect } from '@playwright/test';
import { open_app, load_basement, dim_labels } from './dim-helpers';

// Rule 1 — the force-driven label layout settles. After the simulation has
// had time to run, label positions stop changing. Operational check: take
// two snapshots half a second apart and assert no label centre has moved by
// more than a pixel between them.

test('basement layout settles — labels do not drift between successive frames', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	// Extra wait beyond load_basement's settle so any startup motion damps out.
	await page.waitForTimeout(800);

	const first = await dim_labels(page);
	await page.waitForTimeout(500);
	const second = await dim_labels(page);

	expect(first.length).toBe(second.length);

	const TOLERANCE_PX = 1.0;
	const drifting: Array<{ label: string; dx: number; dy: number }> = [];
	for (let i = 0; i < first.length; i++) {
		const a = first[i];
		const b = second[i];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		if (Math.abs(dx) > TOLERANCE_PX || Math.abs(dy) > TOLERANCE_PX) {
			drifting.push({ label: `${a.so_name}/${a.axis}`, dx, dy });
		}
	}

	for (const d of drifting) {
		console.log(`  >>> drifting: ${d.label}  dx=${d.dx.toFixed(2)} dy=${d.dy.toFixed(2)}`);
	}
	console.log(`  >>> drawn = ${first.length}, drifting = ${drifting.length}`);

	expect(drifting, `labels still moving: ${JSON.stringify(drifting)}`).toEqual([]);
});
