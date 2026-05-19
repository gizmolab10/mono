import { test, expect, type Page } from '@playwright/test';
import { dim_labels } from './dim-helpers';

// Floater test — a "floater" is a label whose centre is not on the dimension
// line drawn underneath it. Per Jonathan's report and threshold setting:
// any non-zero gap counts as a floater.

type Drawn_Line = { d1x: number; d1y: number; d2x: number; d2y: number };

async function dim_lines(page: Page): Promise<Drawn_Line[]> {
	return await page.evaluate(() => {
		const w = window as unknown as { di_test: { dim_lines: () => Drawn_Line[] } };
		return w.di_test.dim_lines();
	});
}

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

// Perpendicular distance from point P to the closest point on the segment
// running between A and B. Standard segment-distance math: project P onto
// the segment, clamp the projection parameter to [0, 1], measure euclidean
// distance from P to the clamped foot.
function distance_point_to_segment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
	const abx = bx - ax;
	const aby = by - ay;
	const len2 = abx * abx + aby * aby;
	if (len2 < 1e-9) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
	const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / len2));
	const fx = ax + t * abx;
	const fy = ay + t * aby;
	return Math.sqrt((px - fx) ** 2 + (py - fy) ** 2);
}

test('drawer at the floater orientation has no labels disconnected from their dim line', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	const ok = await page.evaluate(async () => {
		const w = window as unknown as { di_test: { load_scene: (n: string) => Promise<boolean> } };
		return await w.di_test.load_scene('cabinetry/drawer');
	});
	if (!ok) throw new Error('failed to load drawer scene');

	await set_orientation(page, [0.14, -0.67, -0.72, 0.12]);
	await set_scale(page, 2.08);

	await page.waitForFunction(() => {
		const w = window as unknown as { di_test: { dim_labels: () => unknown[] } };
		return w.di_test.dim_labels().length > 0;
	}, undefined, { timeout: 10_000 });
	await page.waitForTimeout(1500);

	const labels = await dim_labels(page);
	const lines = await dim_lines(page);
	expect(labels.length).toBe(lines.length);

	const THRESHOLD = 0; // any non-zero gap is a floater
	const floaters: Array<{ label: string; gap: number }> = [];
	for (let i = 0; i < labels.length; i++) {
		const lab = labels[i];
		const ln = lines[i];
		const gap = distance_point_to_segment(lab.x, lab.y, ln.d1x, ln.d1y, ln.d2x, ln.d2y);
		if (gap > THRESHOLD) {
			floaters.push({ label: `${lab.so_name}/${lab.axis}`, gap });
		}
	}

	// Print the readout so the failure (if any) tells us which labels float and by how much.
	for (const f of floaters) {
		console.log(`  >>> floater: ${f.label}  gap = ${f.gap.toFixed(2)} px`);
	}
	console.log(`  >>> total drawn = ${labels.length}, floaters = ${floaters.length}`);

	expect(floaters, `floaters: ${JSON.stringify(floaters)}`).toEqual([]);
});
