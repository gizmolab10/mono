import { test, expect, type Page } from '@playwright/test';
import { open_app, load_basement } from './dim-helpers';

// Rule 10 (white-box) — for each drawn label the algorithm enumerates four
// candidate witness directions (the two perpendicular axes, each signed),
// filters out the ones too close to the camera axis or with too-long
// projected witness lines, then picks the surviving candidate with the
// smallest silhouette-clearance distance.
//
// The renderer publishes, per drawn label, an array of four clearance
// values (with null for rejected candidates) and the index it chose. This
// test asserts the chosen index has a clearance value equal to the minimum
// of the non-null clearances — i.e. the algorithm picks an actual minimum.

type Drawn_Line = {
	clearances: (number | null)[];
	chosen_index: number;
};

async function dim_lines(page: Page): Promise<Drawn_Line[]> {
	return await page.evaluate(() => {
		const w = window as unknown as { di_test: { dim_lines: () => Drawn_Line[] } };
		return w.di_test.dim_lines();
	});
}

test('every drawn label picks the witness direction with the smallest clearance among survivors', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);
	await page.waitForTimeout(800);

	const lines = await dim_lines(page);
	expect(lines.length).toBeGreaterThan(0);

	const TOLERANCE = 1e-6;
	const mispicks: Array<{ index: number; chosen: number; min: number; clearances: (number | null)[] }> = [];
	for (let i = 0; i < lines.length; i++) {
		const ln = lines[i];
		const valid = ln.clearances.filter((c): c is number => c !== null);
		if (valid.length === 0) continue; // nothing survived filters; label drew via the all-four fallback
		const chosen_value = ln.clearances[ln.chosen_index];
		if (chosen_value === null || chosen_value === undefined) {
			mispicks.push({ index: i, chosen: -1, min: Math.min(...valid), clearances: ln.clearances });
			continue;
		}
		const min = Math.min(...valid);
		if (Math.abs(chosen_value - min) > TOLERANCE) {
			mispicks.push({ index: i, chosen: chosen_value, min, clearances: ln.clearances });
		}
	}

	for (const m of mispicks) {
		console.log(`  >>> mispick at label #${m.index}: chosen clearance = ${m.chosen}, smallest valid = ${m.min}, all = ${JSON.stringify(m.clearances)}`);
	}
	console.log(`  >>> drawn = ${lines.length}, mispicks = ${mispicks.length}`);

	expect(mispicks, `direction choice does not match smallest clearance: ${JSON.stringify(mispicks)}`).toEqual([]);
});
