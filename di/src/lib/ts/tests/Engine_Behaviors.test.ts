import { describe, it, expect, beforeEach } from 'vitest';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { engine } from '../render/Engine';
import { constraints } from '../algebra';
import { selection } from '../managers/Selection';
import { scenes } from '../managers/Scenes';
import { stores } from '../managers/Stores';
import { T_Hit_3D } from '../types/Enumerations';

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
	selection.current = null;
});

// ═══════════════════════════════════════════════════════════════════
// Rule 51 — deleting an SO removes its descendants and clears their formulas;
// surviving formulas that referenced any deleted SO are also cleared
// ═══════════════════════════════════════════════════════════════════

describe('deleting an SO clears formulas that referenced it', () => {
	it('a surviving SO whose formula referenced a deleted SO has its formula gone after delete', () => {
		// Build a tree with a parent (root) containing two children. ALPHA carries no formulas;
		// BETA has a formula on its far end that points at ALPHA's far end.
		const root = make_so('root', { x_min: 0, x_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 30 }, root);
		const beta = make_so('BETA', { x_min: 0, x_max: 10 }, root);

		const err = constraints.set_formula(beta, 'x_max', `${alpha.id}.x_max`);
		expect(err).toBeNull();
		expect(beta.attributes_dict_byName['x_max'].has_formula).toBe(true);

		// Mark this scene's root so the engine has somewhere to anchor.
		scenes.root_so = root;
		scenes.root_id = root.id;
		(engine as unknown as { root_scene: typeof root.scene }).root_scene = root.scene!;

		// Select ALPHA and ask the engine to delete it.
		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.delete_selected_so();

		// ALPHA is gone; BETA's formula is cleared.
		const remaining_ids = scene.get_all().map(o => o.so.id);
		expect(remaining_ids).not.toContain(alpha.id);
		expect(beta.attributes_dict_byName['x_max'].has_formula).toBe(false);
	});

	it('deleting an SO that has descendants removes the whole subtree', () => {
		const root = make_so('root', { x_min: 0, x_max: 100 });
		const middle = make_so('MIDDLE', { x_min: 0, x_max: 30 }, root);
		const leaf = make_so('LEAF', { x_min: 0, x_max: 5 }, middle);

		scenes.root_so = root;
		scenes.root_id = root.id;
		(engine as unknown as { root_scene: typeof root.scene }).root_scene = root.scene!;

		selection.current = { so: middle, type: T_Hit_3D.face, index: 0 };
		engine.delete_selected_so();

		const remaining_ids = scene.get_all().map(o => o.so.id);
		expect(remaining_ids).not.toContain(middle.id);
		expect(remaining_ids).not.toContain(leaf.id);
		expect(remaining_ids).toContain(root.id);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rule 52 — changing the precision snaps every plain-number cell;
// cells holding a formula are left alone
// ═══════════════════════════════════════════════════════════════════

describe('changing the precision snaps plain-number cells', () => {
	it('a plain-number cell is rounded to the new grid; a formula-driven cell is not touched', () => {
		const root = make_so('root', { x_min: 0, x_max: 100 });
		const child = make_so('child', { x_min: 0, x_max: 30 }, root);

		// Set a plain non-grid-aligned value on the child's near end.
		child.attributes_dict_byName['x_min'].value = 5.234;

		// Put a formula on the child's far end; its compiled tree should outlive a precision change.
		const err = constraints.set_formula(child, 'x_max', `${root.id}.x_max - 6"`);
		expect(err).toBeNull();
		const formula_text_before = child.attributes_dict_byName['x_max'].formula_display;

		scenes.root_so = root;
		scenes.root_id = root.id;
		(engine as unknown as { root_scene: typeof root.scene }).root_scene = root.scene!;

		// Bump the precision. The exact resulting number depends on the active unit system,
		// but the plain cell should have changed and the formula should still be there.
		stores.w_precision.set(0);
		engine.set_precision(0);

		const after_plain = child.attributes_dict_byName['x_min'].value;
		expect(after_plain).not.toBe(5.234);

		const after_formula = child.attributes_dict_byName['x_max'].formula_display;
		expect(after_formula).toBe(formula_text_before);
		expect(child.attributes_dict_byName['x_max'].has_formula).toBe(true);
	});
});
