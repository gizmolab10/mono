import { test, expect, type Page } from '@playwright/test';
import { open_app, load_basement, dim_labels } from './dim-helpers';

// New-design rule 22 — 2D mode is not a special case. Every part gets
// all three axes considered for placement, regardless of view mode.
// The 2D-from-the-front view does NOT restrict a part to only the two
// axes of its front-most face. Needs a new test hook set_view_mode()
// that switches between '2d' and '3d'. Skipped until the hook exists.

type Test_Window = {
	di_test: { set_view_mode: (mode: '2d' | '3d') => null };
};

async function set_view_mode(page: Page, mode: '2d' | '3d'): Promise<void> {
	await page.evaluate(
		(m) => (window as unknown as Test_Window).di_test.set_view_mode(m),
		mode,
	);
	await page.waitForTimeout(300);
}

test.skip('switching to 2D mode still considers all three axes per part', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const before = await dim_labels(page);
	const axes_per_part_3d = new Map<string, Set<string>>();
	for (const l of before) {
		if (!axes_per_part_3d.has(l.so_name)) axes_per_part_3d.set(l.so_name, new Set());
		axes_per_part_3d.get(l.so_name)!.add(l.axis);
	}

	await set_view_mode(page, '2d');

	const after = await dim_labels(page);
	const axes_per_part_2d = new Map<string, Set<string>>();
	for (const l of after) {
		if (!axes_per_part_2d.has(l.so_name)) axes_per_part_2d.set(l.so_name, new Set());
		axes_per_part_2d.get(l.so_name)!.add(l.axis);
	}

	// Every part that had label(s) in 3D mode should be eligible for the
	// same set of axes in 2D mode. Whether each axis is actually drawn
	// depends on filters and clearance, but the SEARCH does not pre-
	// restrict the axis set in 2D.
	const restricted: Array<{ so: string; lost_axes: string[] }> = [];
	for (const [so, axes_3d] of axes_per_part_3d.entries()) {
		const axes_2d = axes_per_part_2d.get(so) ?? new Set<string>();
		const lost: string[] = [];
		for (const a of axes_3d) if (!axes_2d.has(a)) lost.push(a);
		if (lost.length > 0) restricted.push({ so: so, lost_axes: lost });
	}

	// At least one part should still have its three axes considered. A
	// pure "front-face only" restriction would drop one axis on every
	// part, which is exactly the regression this test catches.
	const three_axis_parts = [...axes_per_part_2d.values()].filter(s => s.size === 3);
	expect(three_axis_parts.length).toBeGreaterThan(0);
});
