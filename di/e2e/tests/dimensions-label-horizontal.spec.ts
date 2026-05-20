import { test, expect } from '@playwright/test';
import { open_app, load_basement } from './dim-helpers';

// New-design rule 7 — every drawn dimension label's text is drawn
// aligned with the screen horizontal, never rotated to match the dim
// line's screen angle. Needs a new test hook dim_label_angles() that
// returns the rotation (radians) of each painted label. Skipped until
// the hook exists.

type Label_Angle = { so_name: string; axis: 'x' | 'y' | 'z'; angle_radians: number };
type Test_Window = {
	di_test: { dim_label_angles: () => Label_Angle[] };
};

test.skip('every drawn dimension label is drawn horizontally', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const angles = await page.evaluate(
		() => (window as unknown as Test_Window).di_test.dim_label_angles(),
	);

	const rotated = angles.filter(a => Math.abs(a.angle_radians) > 0.001);
	expect(rotated, `labels not drawn horizontally: ${JSON.stringify(rotated)}`).toEqual([]);
});
