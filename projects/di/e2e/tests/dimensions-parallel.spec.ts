import { test, expect, type Page } from '@playwright/test';
import { dim_labels } from './dim-helpers';

// Parallel-line test — every drawn dimension line should run parallel to the
// projected direction of the part edge it measures. Under orthographic
// projection, parallel 3D lines stay parallel in 2D, so any visible slant
// between the drawn line and its measured edge is a real bug (not a
// perspective vanishing-point effect).

type Drawn_Line = { d1x: number; d1y: number; d2x: number; d2y: number; edge_angle: number };

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

async function set_ortho(page: Page, on: boolean): Promise<void> {
	await page.evaluate((flag) => {
		const w = window as unknown as { di_test: { set_camera_ortho: (b: boolean) => null } };
		w.di_test.set_camera_ortho(flag);
	}, on);
}

// Shortest absolute difference between two angles, accounting for the fact
// that a line is direction-agnostic (so 180-degree differences count as 0).
function angle_diff_radians(a: number, b: number): number {
	let d = Math.abs(a - b);
	while (d > Math.PI) d -= Math.PI;
	if (d > Math.PI / 2) d = Math.PI - d;
	return d;
}

test('drawer in orthographic mode draws every dimension line parallel to its measured edge', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);

	const ok = await page.evaluate(async () => {
		const w = window as unknown as { di_test: { load_scene: (n: string) => Promise<boolean> } };
		return await w.di_test.load_scene('cabinetry/drawer');
	});
	if (!ok) throw new Error('failed to load drawer scene');

	await set_ortho(page, true);
	await set_orientation(page, [0.34, 0.24, 0.44, -0.80]);
	await set_scale(page, 2.08);

	await page.waitForFunction(() => {
		const w = window as unknown as { di_test: { dim_labels: () => unknown[] } };
		return w.di_test.dim_labels().length > 0;
	}, undefined, { timeout: 10_000 });
	await page.waitForTimeout(1500);

	const labels = await dim_labels(page);
	const lines = await dim_lines(page);
	expect(labels.length).toBe(lines.length);

	// Tolerance: 0.005 radians ≈ 0.3 degrees, generous for floating-point
	// noise. In orthographic mode, parallel-in-3D becomes parallel-in-2D
	// exactly, so anything bigger than this is a real slant bug.
	const TOLERANCE = 0.005;
	const slants: Array<{ label: string; degrees: number }> = [];
	for (let i = 0; i < labels.length; i++) {
		const lab = labels[i];
		const ln = lines[i];
		const drawn_angle = Math.atan2(ln.d2y - ln.d1y, ln.d2x - ln.d1x);
		const diff = angle_diff_radians(drawn_angle, ln.edge_angle);
		if (diff > TOLERANCE) {
			slants.push({ label: `${lab.so_name}/${lab.axis}`, degrees: diff * 180 / Math.PI });
		}
	}

	for (const s of slants) {
		console.log(`  >>> slant: ${s.label}  off by ${s.degrees.toFixed(2)} degrees`);
	}
	console.log(`  >>> total drawn = ${labels.length}, slants = ${slants.length}`);

	expect(slants, `slanted lines: ${JSON.stringify(slants)}`).toEqual([]);
});
