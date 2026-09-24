import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { engine } from '../render/Engine';
import { constraints } from '../algebra';
import { selection } from '../managers/Selection';
import { scenes } from '../managers/Scenes';
import { stores } from '../managers/Stores';
import { status } from '../managers/Status';
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

function set_engine_root(root: Smart_Object): void {
	scenes.root_so = root;
	scenes.root_id = root.id;
	(engine as unknown as { root_scene: typeof root.scene }).root_scene = root.scene!;
}

function children_of(parent: Smart_Object): Smart_Object[] {
	return scene.get_all().map(o => o.so).filter(s => s.scene?.parent?.so === parent);
}

beforeEach(() => {
	scene.clear();
	selection.current = null;
	status.clear();
	stores.w_all_sos.set([]);
});

// ═══════════════════════════════════════════════════════════════════
// Rule 59 — cutting a smart object in half
// ═══════════════════════════════════════════════════════════════════

// ── Picking the longest direction ──

describe('the cut routine picks the longest direction', () => {

	it('the direction whose stored length is largest is the one chosen for the cut', () => {
		// ALPHA: x-length 10, y-length 30, z-length 20 → y is longest, cut along y.
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 10, y_min: 0, y_max: 30, z_min: 0, z_max: 20 }, root);
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		// ALPHA should now have y-length = 15; x and z unchanged.
		expect(alpha.axes[1].length.value).toBeCloseTo(15);
		expect(alpha.axes[0].length.value).toBeCloseTo(10);
		expect(alpha.axes[2].length.value).toBeCloseTo(20);
	});

	it('a tie between two directions for the largest stored length refuses the cut and posts a red status-strip message', () => {
		// ALPHA: x-length 30, y-length 30 → tied for longest.
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 30, y_min: 0, y_max: 30, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(status.current).not.toBeNull();
		expect(status.current!.text).toMatch(/tied for longest/);
		expect(status.current!.kind).toBe('error');
	});

	it('a tied-longest refusal does not change any stored value on the selection or anywhere in the scene', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 30, y_min: 0, y_max: 30, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);

		const before_count = scene.get_all().length;
		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(scene.get_all().length).toBe(before_count);
		expect(alpha.axes[0].length.value).toBeCloseTo(30);
		expect(alpha.axes[1].length.value).toBeCloseTo(30);
	});
});

// ── Equal halves ──

describe('the cut produces two equal halves', () => {

	it('after the cut the original\'s length value on the cut direction equals half the original\'s pre-cut length', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(alpha.axes[0].length.value).toBeCloseTo(20);
	});

	it('after the cut the new sibling\'s length value on the cut direction equals half the original\'s pre-cut length', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		expect(new_sibling).not.toBe(alpha);
		expect(new_sibling.axes[0].length.value).toBeCloseTo(20);
	});

	it('the original keeps the lower half — its start on the cut direction is unchanged', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(alpha.axes[0].start.value).toBeCloseTo(0);
	});

	it('the new sibling holds the upper half — its end on the cut direction equals the original\'s pre-cut end', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		expect(new_sibling.axes[0].end.value).toBeCloseTo(40);
		expect(new_sibling.axes[0].start.value).toBeCloseTo(20);
	});
});

// ── Selection and naming ──

describe('selection and naming after the cut', () => {

	it('the new sibling becomes the selected part after the cut completes', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(selection.current!.so).not.toBe(alpha);
		expect(selection.current!.so!.scene?.parent?.so).toBe(root);
	});

	it('the original keeps its name unchanged', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(alpha.name).toBe('ALPHA');
	});

	it('the new sibling carries the original\'s name with a numeric suffix bumped to avoid collision', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		expect(new_sibling.name).not.toBe('ALPHA');
		expect(new_sibling.name).toMatch(/ALPHA/);
	});
});

// ── Refusal cases ──

describe('refusal cases — the cut leaves the scene untouched and posts a red status message', () => {

	it('the selection is the root of the scene', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 50, z_min: 0, z_max: 25 });
		set_engine_root(root);

		const before_count = scene.get_all().length;
		selection.current = { so: root, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(scene.get_all().length).toBe(before_count);
		expect(status.current).not.toBeNull();
		expect(status.current!.kind).toBe('error');
	});

	it('the selection is a clone of a repeater (its parent is a repeater and it is not the parent\'s first child)', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const wall = make_so('WALL', { x_min: 0, x_max: 60, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 20, firewall: false };
		const stud_template = make_so('STUD', { x_min: 0, x_max: 4, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);
		const stud_clone = make_so('STUD2', { x_min: 20, x_max: 24, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);
		set_engine_root(root);

		const before_count = scene.get_all().length;
		selection.current = { so: stud_clone, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(scene.get_all().length).toBe(before_count);
		expect(status.current).not.toBeNull();
		expect(status.current!.text).toMatch(/clone/);
		// ensure stud_template was not touched
		expect(stud_template.axes[0].length.value).toBeCloseTo(4);
	});

	it('the selection is the template of a repeater (its parent is a repeater and it is the parent\'s first child)', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const wall = make_so('WALL', { x_min: 0, x_max: 60, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 20, firewall: false };
		const stud_template = make_so('STUD', { x_min: 0, x_max: 4, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);
		set_engine_root(root);

		const before_count = scene.get_all().length;
		selection.current = { so: stud_template, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(scene.get_all().length).toBe(before_count);
		expect(status.current).not.toBeNull();
		expect(status.current!.text).toMatch(/template/);
	});

	it('the selection has children of its own and is not itself a repeater', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		make_so('CHILD', { x_min: 0, x_max: 5, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, alpha);
		set_engine_root(root);

		const before_count = scene.get_all().length;
		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(scene.get_all().length).toBe(before_count);
		expect(status.current).not.toBeNull();
		expect(status.current!.text).toMatch(/children/);
	});

	it('a refused cut does not create a new sibling', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 30, y_min: 0, y_max: 30, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);

		const before_count = scene.get_all().length;
		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so(); // tied-longest refusal

		expect(scene.get_all().length).toBe(before_count);
	});
});

// ── Repeater exception ──

describe('repeaters are an exception to the has-children refusal', () => {

	it('a cut on a repeater succeeds — the repeater has children but the cut runs anyway', () => {
		const root = make_so('root', { x_min: 0, x_max: 200, y_min: 0, y_max: 200, z_min: 0, z_max: 200 });
		const wall = make_so('WALL', { x_min: 0, x_max: 60, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 20, firewall: false };
		make_so('STUD', { x_min: 0, x_max: 4, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);
		set_engine_root(root);

		const before_count = scene.get_all().length;
		selection.current = { so: wall, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(scene.get_all().length).toBeGreaterThan(before_count);
	});

	it('after the cut, both halves are repeaters', () => {
		const root = make_so('root', { x_min: 0, x_max: 200, y_min: 0, y_max: 200, z_min: 0, z_max: 200 });
		const wall = make_so('WALL', { x_min: 0, x_max: 60, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 20, firewall: false };
		make_so('STUD', { x_min: 0, x_max: 4, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);
		set_engine_root(root);

		selection.current = { so: wall, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		expect(wall.repeater?.is_repeating).toBe(true);
		expect(new_sibling.repeater?.is_repeating).toBe(true);
	});

	it('after the cut, each half carries its own copy of the template as its first child', () => {
		const root = make_so('root', { x_min: 0, x_max: 200, y_min: 0, y_max: 200, z_min: 0, z_max: 200 });
		const wall = make_so('WALL', { x_min: 0, x_max: 60, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 20, firewall: false };
		make_so('STUD', { x_min: 0, x_max: 4, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);
		set_engine_root(root);

		selection.current = { so: wall, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		const original_children = children_of(wall);
		const sibling_children = children_of(new_sibling);
		expect(original_children.length).toBeGreaterThanOrEqual(1);
		expect(sibling_children.length).toBeGreaterThanOrEqual(1);
		// Templates have distinct ids — they are independent copies
		expect(original_children[0].id).not.toBe(sibling_children[0].id);
	});
});

// ── Formula behavior on the cut direction — invariant on length ──

describe('formula behavior on the cut direction — invariant on length', () => {

	it('the formula on the length attribute is preserved unchanged on the original', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 2;
		const err = constraints.set_formula(alpha, 'width', '40');
		expect(err).toBeNull();
		const before_text = alpha.axes[0].length.formula_display;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(alpha.axes[0].length.formula_display).toBe(before_text);
	});

	it('the formula on the length attribute is preserved unchanged on the new sibling', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 2;
		const err = constraints.set_formula(alpha, 'width', '40');
		expect(err).toBeNull();
		const before_text = alpha.axes[0].length.formula_display;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		expect(new_sibling.axes[0].length.formula_display).toBe(before_text);
	});

	it('the original\'s end is set to the half-way point along the original\'s pre-cut span', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 2;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		// half-way is start + length/2 = 0 + 20 = 20
		expect(alpha.axes[0].end.value).toBeCloseTo(20);
		expect(alpha.axes[0].end.has_formula).toBe(false);
	});

	it('the new sibling\'s start is set to the half-way point along the original\'s pre-cut span', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 2;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		expect(new_sibling.axes[0].start.value).toBeCloseTo(20);
		expect(new_sibling.axes[0].start.has_formula).toBe(false);
	});
});

// ── Formula behavior on the cut direction — invariant on start ──

describe('formula behavior on the cut direction — invariant on start', () => {

	it('the formula on the start attribute is preserved unchanged on the original', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 0;
		const err = constraints.set_formula(alpha, 'x_min', '0');
		expect(err).toBeNull();
		const before_text = alpha.axes[0].start.formula_display;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(alpha.axes[0].start.formula_display).toBe(before_text);
	});

	it('the formula on the start attribute is preserved unchanged on the new sibling', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 0;
		const err = constraints.set_formula(alpha, 'x_min', '0');
		expect(err).toBeNull();
		const before_text = alpha.axes[0].start.formula_display;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		// On invariant-on-start, start is the derived attribute. The cut
		// touches length and end on the original; the new sibling gets a
		// halved length. The new sibling's start is left alone — its formula
		// (cloned from the original) survives the cut. The geometric position
		// follows from the derivation: start = end - length = original_end -
		// half_length = half_way.
		const new_sibling = selection.current!.so!;
		expect(new_sibling.axes[0].start.formula_display).toBe(before_text);
		expect(alpha.axes[0].start.formula_display).toBe(before_text);
	});

	it('the length on the original is set to half', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 0;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(alpha.axes[0].length.value).toBeCloseTo(20);
	});

	it('the length on the new sibling is set to half', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 0;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		expect(new_sibling.axes[0].length.value).toBeCloseTo(20);
	});

	it('the original\'s end value lands at the half-way point as a consequence of the halved length', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 0;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(alpha.axes[0].end.value).toBeCloseTo(20);
	});

	it('the new sibling\'s start value sits at the half-way point', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 0;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		expect(new_sibling.axes[0].start.value).toBeCloseTo(20);
	});
});

// ── Formula behavior on the cut direction — invariant on end ──

describe('formula behavior on the cut direction — invariant on end', () => {

	it('the formula on the end attribute is preserved unchanged on the new sibling', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 1;
		const err = constraints.set_formula(alpha, 'x_max', '40');
		expect(err).toBeNull();
		const before_text = alpha.axes[0].end.formula_display;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		expect(new_sibling.axes[0].end.formula_display).toBe(before_text);
	});

	it('the original\'s end value lands at the half-way point as a consequence of the halved length', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 1;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		// On invariant-on-end, end is the derived attribute. The cut writes
		// length=half on the original; end is recomputed as start + length =
		// 0 + 20 = 20. The cut routine does not touch the original's end
		// attribute itself per the spec rule "leave the invariant formula
		// alone." Without a user-typed formula on end, the derivation alone
		// drives the value.
		expect(alpha.axes[0].end.value).toBeCloseTo(20);
	});

	it('the length on the original is set to half', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 1;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		expect(alpha.axes[0].length.value).toBeCloseTo(20);
	});

	it('the length on the new sibling is set to half', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 1;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		expect(new_sibling.axes[0].length.value).toBeCloseTo(20);
	});

	it('the new sibling\'s start value sits at the half-way point', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		alpha.axes[0].invariant = 1;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		const new_sibling = selection.current!.so!;
		expect(new_sibling.axes[0].start.value).toBeCloseTo(20);
	});
});

// ── Formulas on the two non-cut directions are copied unchanged ──

describe('formulas on the two non-cut directions are copied unchanged', () => {

	it('a formula on the length of a non-cut direction on the new sibling matches what the original had before the cut', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		// Cut axis is x (longest). Put a formula on the y-direction's length.
		const err = constraints.set_formula(alpha, 'depth', '5');
		expect(err).toBeNull();
		const before_text = alpha.axes[1].length.formula_display;
		set_engine_root(root);

		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		engine.cut_selected_so();

		// Original keeps its formula.
		expect(alpha.axes[1].length.formula_display).toBe(before_text);
		// New sibling has the same formula on the same direction.
		const new_sibling = selection.current!.so!;
		expect(new_sibling.axes[1].length.formula_display).toBe(before_text);
	});
});

// ── Can-cut flag (used by the details panel to decide whether to show the cut button) ──

describe('the can-cut flag', () => {

	it('returns true when the selection is a leaf SO with a unique longest direction', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);
		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		expect(engine.can_cut_selected()).toBe(true);
	});

	it('returns false when the selection is the root', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 50, z_min: 0, z_max: 25 });
		set_engine_root(root);
		selection.current = { so: root, type: T_Hit_3D.face, index: 0 };
		expect(engine.can_cut_selected()).toBe(false);
	});

	it('returns false when the selection has children and is not a repeater', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 40, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, root);
		make_so('CHILD', { x_min: 0, x_max: 5, y_min: 0, y_max: 5, z_min: 0, z_max: 5 }, alpha);
		set_engine_root(root);
		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		expect(engine.can_cut_selected()).toBe(false);
	});

	it('returns true when the selection is a repeater (the has-children exception)', () => {
		const root = make_so('root', { x_min: 0, x_max: 200, y_min: 0, y_max: 200, z_min: 0, z_max: 200 });
		const wall = make_so('WALL', { x_min: 0, x_max: 60, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 20, firewall: false };
		make_so('STUD', { x_min: 0, x_max: 4, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);
		set_engine_root(root);
		selection.current = { so: wall, type: T_Hit_3D.face, index: 0 };
		expect(engine.can_cut_selected()).toBe(true);
	});

	it('returns false when two longest dimensions are tied', () => {
		const root = make_so('root', { x_min: 0, x_max: 100, y_min: 0, y_max: 100, z_min: 0, z_max: 100 });
		const alpha = make_so('ALPHA', { x_min: 0, x_max: 30, y_min: 0, y_max: 30, z_min: 0, z_max: 5 }, root);
		set_engine_root(root);
		selection.current = { so: alpha, type: T_Hit_3D.face, index: 0 };
		expect(engine.can_cut_selected()).toBe(false);
	});
});

// Note: vitest's `get` helper from svelte/store is imported above; not used directly in this file
// but kept in case future tests need to inspect derived stores.
void get;
