import { test, expect, type Page } from '@playwright/test';
import { open_app, load_basement } from './dim-helpers';

// Rule 9 (white-box) — every projected vertex that fed the silhouette
// outline this paint must come from a painted LEAF smart object (no
// container parts whose bounding-box corners would inflate the outline).
// This test reads the hull's source point set and checks that no point's
// source SO has at least one painted child.

type Test_Window = {
	di_test: {
		dim_hull_input: () => Array<{ x: number; y: number; so_id: string; so_name: string }>;
		all_smart_objects: () => Array<{ id: string; name: string; visible: boolean; parent_id: string | null }>;
	};
};

async function hull_input(page: Page): Promise<Array<{ x: number; y: number; so_id: string; so_name: string }>> {
	return await page.evaluate(() => {
		const w = window as unknown as Test_Window;
		return w.di_test.dim_hull_input();
	});
}

async function all_sos(page: Page): Promise<Array<{ id: string; name: string; visible: boolean; parent_id: string | null }>> {
	return await page.evaluate(() => {
		const w = window as unknown as Test_Window;
		return w.di_test.all_smart_objects();
	});
}

test('silhouette outline is built from leaf parts only — no container corners contribute', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await open_app(page);
	await load_basement(page);
	await page.waitForTimeout(800);

	const points = await hull_input(page);
	const sos = await all_sos(page);

	expect(points.length).toBeGreaterThan(0);
	expect(sos.length).toBeGreaterThan(0);

	// Replicate the renderer's "is painted" predicate: the SO's own visible
	// flag is on AND every ancestor's visible flag is on too. Without the
	// ancestor walk, this test counts a part as a container even when its
	// (locally-visible) child is hidden by an upstream invisibility.
	const by_id = new Map<string, { id: string; name: string; visible: boolean; parent_id: string | null }>();
	for (const so of sos) by_id.set(so.id, so);
	function is_painted(id: string): boolean {
		let cur = by_id.get(id);
		while (cur) {
			if (!cur.visible) return false;
			if (!cur.parent_id) return true;
			cur = by_id.get(cur.parent_id);
		}
		return true;
	}

	// Build set of SO ids that have at least one painted child (containers
	// per rule 9). Match by id, not name — basement has duplicate names.
	const has_painted_child = new Set<string>();
	for (const so of sos) {
		if (so.parent_id && is_painted(so.id)) {
			has_painted_child.add(so.parent_id);
		}
	}

	// Walk hull-input points. Any point whose source SO id has at least one
	// visible child is a container contribution — that's the rule-9 violation.
	const violators: Array<{ id: string; name: string; count: number }> = [];
	const counts = new Map<string, { name: string; count: number }>();
	for (const p of points) {
		if (has_painted_child.has(p.so_id)) {
			const entry = counts.get(p.so_id) ?? { name: p.so_name, count: 0 };
			entry.count++;
			counts.set(p.so_id, entry);
		}
	}
	for (const [id, entry] of counts) violators.push({ id, name: entry.name, count: entry.count });

	for (const v of violators) {
		console.log(`  >>> container in hull input: ${v.name} (id ${v.id}) contributed ${v.count} points`);
	}
	console.log(`  >>> hull-input points = ${points.length}, container-source = ${violators.length}`);

	expect(violators, `container-source points in hull: ${JSON.stringify(violators)}`).toEqual([]);
});
