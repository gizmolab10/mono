import { test, expect } from '@playwright/test';
import { open_app, load_basement, dim_labels } from './dim-helpers';

// New-design rule 17 — clicking a drawn dimension number begins inline
// editing of its underlying value (when editable; bound formulas are
// read-only). Edits commit on Enter or focus-out, revert on Escape.
// While editing, the rest of the dimension layout pauses. Needs new
// test hooks dim_edit_state() (returns whether an editor is open and
// the part/axis being edited) and dim_layout_frozen() (returns whether
// the rest of the layout is paused). Skipped until the hooks exist.

type Edit_State = {
	editing: boolean;
	so_name: string | null;
	axis: 'x' | 'y' | 'z' | null;
	editable: boolean;
};
type Test_Window = {
	di_test: {
		dim_edit_state: () => Edit_State;
		dim_layout_frozen: () => boolean;
	};
};

test.skip('clicking a dimension opens an editor and pauses layout; Escape reverts', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const labels = await dim_labels(page);
	expect(labels.length).toBeGreaterThan(0);
	const target = labels.find(l => true)!; // first label that is editable in practice

	await page.mouse.click(target.x, target.y);
	await page.waitForTimeout(150);

	let state = await page.evaluate(() => (window as unknown as Test_Window).di_test.dim_edit_state());
	expect(state.editing).toBe(true);
	expect(state.so_name).toBe(target.so_name);
	expect(state.axis).toBe(target.axis);

	const frozen = await page.evaluate(() => (window as unknown as Test_Window).di_test.dim_layout_frozen());
	expect(frozen).toBe(true);

	await page.keyboard.press('Escape');
	await page.waitForTimeout(100);

	state = await page.evaluate(() => (window as unknown as Test_Window).di_test.dim_edit_state());
	expect(state.editing).toBe(false);
});
