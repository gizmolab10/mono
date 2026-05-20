import { test, expect } from '@playwright/test';
import { open_app, load_basement, dim_labels, type Dim_Label } from './dim-helpers';

// New-design rule 15 — hovering a dimension on a part shows a popup
// with the part's ancestry path joined by dots, then the axis info.
// Format: "name (x | width)" / "(y | depth)" / "(z | height)". A root-
// level dimension reads "width (x)" with no leading period. Needs a
// new test hook dim_popup_text() that returns the popup's current
// string. Skipped until the hook exists.

type Test_Window = {
	di_test: { dim_popup_text: () => string };
};

async function popup_after_hover(page: import('@playwright/test').Page, label: Dim_Label): Promise<string> {
	await page.mouse.move(label.x, label.y);
	await page.waitForTimeout(150);
	return await page.evaluate(
		() => (window as unknown as Test_Window).di_test.dim_popup_text(),
	);
}

test.skip('hovering a dimension shows the ancestry path with the axis info appended', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const labels = await dim_labels(page);
	expect(labels.length).toBeGreaterThan(0);

	// Pick the first label and check the format matches the rule.
	const first = labels[0];
	const popup = await popup_after_hover(page, first);

	// Body of the rule: format is `name (x | width)` / `(y | depth)` /
	// `(z | height)`. Root-level dimension reads `width (x)` with no
	// leading period — so when the popup starts with `width|depth|height`
	// the part is the root and there is no ancestry path.
	const axis_token = first.axis === 'x' ? 'x | width' : first.axis === 'y' ? 'y | depth' : 'z | height';
	expect(popup).toContain(axis_token);
	expect(popup.startsWith('.')).toBe(false);
});
