import { describe, it, expect, beforeEach } from 'vitest';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const cube_edges: [number, number][] = [
	[0, 1], [1, 2], [2, 3], [3, 0],
	[4, 5], [5, 6], [6, 7], [7, 4],
	[0, 4], [1, 5], [2, 6], [3, 7],
];

function make_so(name: string, bounds?: Partial<Record<Bound, number>>, parent_so?: Smart_Object): Smart_Object {
	const so = new Smart_Object(name);
	if (bounds) {
		for (const [key, value] of Object.entries(bounds)) {
			so.set_bound(key as Bound, value);
		}
	}
	for (const axis of so.axes) {
		axis.length.value = axis.end.value - axis.start.value;
	}
	const parent_scene = parent_so?.scene ?? undefined;
	const so_scene = scene.create({ so, edges: cube_edges, parent: parent_scene });
	so.scene = so_scene;
	return so;
}

beforeEach(() => {
	scene.clear();
});

// ═══════════════════════════════════════════════════════════════════
// Stipulation 18 — Moving a parent moves its children
// (children's stored numbers do not change; their absolute position shifts)
// ═══════════════════════════════════════════════════════════════════

describe('moving a parent', () => {
	it('shifts a child in space without changing the child\'s stored numbers', () => {
		const root = make_so('root', { x_min: 0, x_max: 20 });
		const child = make_so('child', { x_min: 2, x_max: 8 }, root);

		const stored_before = child.attributes_dict_byName['x_min'].value;
		const stored_max_before = child.attributes_dict_byName['x_max'].value;
		const absolute_before = child.get_bound('x_min');

		// Shift the root from x = 0..20 to x = 5..25 (a pure move).
		root.set_bound('x_min', 5);
		root.set_bound('x_max', 25);

		expect(child.attributes_dict_byName['x_min'].value).toBe(stored_before);
		expect(child.attributes_dict_byName['x_max'].value).toBe(stored_max_before);

		expect(child.get_bound('x_min')).toBe(absolute_before + 5);
		expect(child.get_bound('x_max')).toBe(absolute_before + 5 + (stored_max_before - stored_before));
	});
});

// ═══════════════════════════════════════════════════════════════════
// Stipulation 18 — Resizing a parent does not change a child's stored numbers
// ═══════════════════════════════════════════════════════════════════

describe('resizing a parent', () => {
	it('leaves a child\'s stored numbers untouched when the parent grows on the far side', () => {
		const root = make_so('root', { x_min: 0, x_max: 20 });
		const child = make_so('child', { x_min: 2, x_max: 8 }, root);

		const stored_min_before = child.attributes_dict_byName['x_min'].value;
		const stored_max_before = child.attributes_dict_byName['x_max'].value;
		const absolute_min_before = child.get_bound('x_min');
		const absolute_max_before = child.get_bound('x_max');

		// Grow root on the far side: x = 0..20 becomes x = 0..30.
		root.set_bound('x_max', 30);

		expect(child.attributes_dict_byName['x_min'].value).toBe(stored_min_before);
		expect(child.attributes_dict_byName['x_max'].value).toBe(stored_max_before);

		// The child's start side did not move, so its absolute position stayed put.
		expect(child.get_bound('x_min')).toBe(absolute_min_before);
		expect(child.get_bound('x_max')).toBe(absolute_max_before);
	});
});
