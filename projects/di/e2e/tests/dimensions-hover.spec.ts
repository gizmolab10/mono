import { test, expect } from '@playwright/test';
import { open_app, load_basement, dim_labels } from './dim-helpers';

// New-design rule 14 — when the cursor sits on a dimension number, the
// number renders in bold, the dimension and witness lines render
// thicker (1.5 px vs 0.5 px), and the matching part highlights. Needs
// a new test hook dim_hover_state() that returns the currently hovered
// label's name + axis, the line thickness, and the bold flag.
// Skipped until the hook exists.

type Hover_State = {
	hovered_so: string | null;
	hovered_axis: 'x' | 'y' | 'z' | null;
	line_width_px: number;
	number_bold: boolean;
	hovered_part_highlighted: boolean;
};
type Test_Window = {
	di_test: { dim_hover_state: () => Hover_State };
};

test('hovering a dimension number bolds it and thickens the lines', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const labels = await dim_labels(page);
	expect(labels.length).toBeGreaterThan(0);
	const target = labels[0];

	await page.mouse.move(target.x, target.y);
	await page.waitForTimeout(150);

	const state = await page.evaluate(
		() => (window as unknown as Test_Window).di_test.dim_hover_state(),
	);

	expect(state.hovered_so).toBe(target.so_name);
	expect(state.hovered_axis).toBe(target.axis);
	expect(state.line_width_px).toBeCloseTo(1.5, 1);
	expect(state.number_bold).toBe(true);
	expect(state.hovered_part_highlighted).toBe(true);
});
