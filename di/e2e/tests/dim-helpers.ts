import type { Page } from '@playwright/test';

// Shared helpers for the three dimension-rule browser tests. Each helper
// reaches into the test-only di_test object the app exposes when the URL
// carries ?test=1 (see Debug.ts).

export type Dim_Label = {
	so_name: string;
	so_visible: boolean;
	axis: 'x' | 'y' | 'z';
	x: number;
	y: number;
	w: number;
	h: number;
};

type Test_Window = {
	di_test: {
		dim_labels: () => Dim_Label[];
		dim_dropped_count: () => number;
		is_xray_active: () => boolean;
		load_scene: (name: string) => Promise<boolean>;
		set_so_visibility: (name: string, visible: boolean) => null;
		set_all_visible: () => null;
	};
};

/** Open the app, wait for the canvas and the test hooks. */
export async function open_app(page: Page): Promise<void> {
	await page.goto('/?test=1');
	await page.waitForSelector('canvas');
	await page.waitForFunction(() => 'di_test' in window);
}

/** Load the bundled basement scene and wait for at least one dimension
 *  label to appear (proof the renderer has painted dimensions). */
export async function load_basement(page: Page): Promise<void> {
	const ok = await page.evaluate(async () => {
		const w = window as unknown as Test_Window;
		return await w.di_test.load_scene('home/basement');
	});
	if (!ok) throw new Error('failed to load basement scene');
	// Give the renderer a chance to paint and the force pass to settle.
	await page.waitForFunction(() => {
		const w = window as unknown as Test_Window;
		return w.di_test.dim_labels().length > 0;
	}, undefined, { timeout: 10_000 });
	// Extra settling time for the force layout to reach a stable state.
	await page.waitForTimeout(500);
}

export const dim_labels = (page: Page): Promise<Dim_Label[]> =>
	page.evaluate(() => (window as unknown as Test_Window).di_test.dim_labels());

export const dim_dropped_count = (page: Page): Promise<number> =>
	page.evaluate(() => (window as unknown as Test_Window).di_test.dim_dropped_count());

export const is_xray_active = (page: Page): Promise<boolean> =>
	page.evaluate(() => (window as unknown as Test_Window).di_test.is_xray_active());

export const set_so_visibility = (page: Page, name: string, visible: boolean): Promise<null> =>
	page.evaluate(
		({ name, visible }) => (window as unknown as Test_Window).di_test.set_so_visibility(name, visible),
		{ name, visible },
	);

export const set_all_visible = (page: Page): Promise<null> =>
	page.evaluate(() => (window as unknown as Test_Window).di_test.set_all_visible());

/** Two label rectangles overlap when both their horizontal and vertical
 *  centre distances are smaller than half the sum of widths/heights. */
export function rects_overlap(a: Dim_Label, b: Dim_Label): boolean {
	const dx = Math.abs(a.x - b.x);
	const dy = Math.abs(a.y - b.y);
	return dx < (a.w + b.w) / 2 && dy < (a.h + b.h) / 2;
}
