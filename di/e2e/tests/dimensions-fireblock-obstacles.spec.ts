import { test, expect } from '@playwright/test';
import { open_app, load_basement } from './dim-helpers';

// New-design rule 18 — fireblock labels (first-fireblock repeat-axis,
// shortened-last-fireblock repeat-axis) keep being selected by the
// repeater rule, NOT by the search. Every other label must still
// respect the 33-pixel clearance from a fireblock label. Needs the
// new test hook dim_labels_by_kind() (rule 25) that tags each drawn
// label as 'template' | 'clone' | 'fireblock-first' |
// 'fireblock-last-shortened' | 'regular'. Skipped until the hook
// exists.

type Tagged_Label = {
	so_name: string;
	axis: 'x' | 'y' | 'z';
	x: number;
	y: number;
	w: number;
	h: number;
	kind: 'template' | 'clone' | 'fireblock-first' | 'fireblock-last-shortened' | 'regular';
};
type Test_Window = {
	di_test: { dim_labels_by_kind: () => Tagged_Label[] };
};

function rect_distance(a: Tagged_Label, b: Tagged_Label): number {
	const dx = Math.max(0, Math.abs(a.x - b.x) - (a.w + b.w) / 2);
	const dy = Math.max(0, Math.abs(a.y - b.y) - (a.h + b.h) / 2);
	return Math.sqrt(dx * dx + dy * dy);
}

function is_fireblock(kind: Tagged_Label['kind']): boolean {
	return kind === 'fireblock-first' || kind === 'fireblock-last-shortened';
}

test.skip('non-fireblock labels keep 33 pixels clearance from fireblock labels', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);

	const labels = await page.evaluate(
		() => (window as unknown as Test_Window).di_test.dim_labels_by_kind(),
	);

	const fireblocks = labels.filter(l => is_fireblock(l.kind));
	const others     = labels.filter(l => !is_fireblock(l.kind));
	expect(fireblocks.length).toBeGreaterThan(0);
	expect(others.length).toBeGreaterThan(0);

	const too_close: Array<{ fireblock: string; other: string; gap: number }> = [];
	for (const fb of fireblocks) {
		for (const other of others) {
			const gap = rect_distance(fb, other);
			if (gap < 33) {
				too_close.push({ fireblock: `${fb.so_name}:${fb.axis}`, other: `${other.so_name}:${other.axis}`, gap: Math.round(gap) });
			}
		}
	}

	expect(too_close, `non-fireblock labels too close to a fireblock label: ${JSON.stringify(too_close)}`).toEqual([]);
});
