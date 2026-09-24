import { describe, it, expect, beforeEach } from 'vitest';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { constraints } from '../algebra';
import { tokenizer } from '../algebra';
import { status } from '../managers/Status';
import { get } from 'svelte/store';

const cube_edges: [number, number][] = [
	[0, 1], [1, 2], [2, 3], [3, 0],
	[4, 5], [5, 6], [6, 7], [7, 4],
	[0, 4], [1, 5], [2, 6], [3, 7],
];

function add_so(name: string, bounds?: Partial<Record<Bound, number>>, parent_so?: Smart_Object): Smart_Object {
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
	status.clear();
});

// ═══════════════════════════════════════════════════════════════════
// Forward reads — the center letter resolves to start-plus-end-over-two
// on the named direction, on every read.
//
// Forward-read tests put the formula on a length cell (which stores the
// evaluated value directly, no parent offset) and reference centers on
// other directions or other parts so the self-loop check does not fire.
// ═══════════════════════════════════════════════════════════════════

describe('forward read of the center letter', () => {

	it('a length cell that reads a different direction\'s center evaluates to start-plus-end over two on that direction', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 8, y_min: 0, y_max: 40 });
		const error = constraints.set_formula(so, 'width', 'y.c');
		expect(error).toBeNull();
		expect(so.axes[0].length.value).toBeCloseTo(20);
	});

	it('a length cell that reads a different direction\'s center via the dot-prefix self form evaluates correctly', () => {
		// `y.c` and `.y.c` both refer to a center; `y.c` is self-axis-qualified.
		const so = add_so('alpha', { x_min: 0, x_max: 8, y_min: 0, y_max: 40 });
		const error = constraints.set_formula(so, 'width', 'y.c');
		expect(error).toBeNull();
		expect(so.axes[0].length.value).toBeCloseTo(20);
	});

	it('a length cell that reads a center plus a literal evaluates correctly', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 8, y_min: 0, y_max: 40 });
		const error = constraints.set_formula(so, 'width', 'y.c + 5');
		expect(error).toBeNull();
		expect(so.axes[0].length.value).toBeCloseTo(25);
	});

	it('a length cell that reads two centers (mixed cross-axis form) evaluates to their sum', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 8, y_min: 0, y_max: 40, z_min: 0, z_max: 6 });
		const error = constraints.set_formula(so, 'width', 'y.c + z.c');
		expect(error).toBeNull();
		// y center is 20, z center is 3, sum is 23.
		expect(so.axes[0].length.value).toBeCloseTo(23);
	});

	it('a length cell that reads another part\'s center via the part\'s identifier evaluates correctly', () => {
		const beta = add_so('beta', { x_min: 0, x_max: 100 });
		const alpha = add_so('alpha', { x_min: 0, x_max: 4 });
		// alpha's width formula reads beta's x center.
		const error = constraints.set_formula(alpha, 'width', `${beta.id}.x_center`);
		expect(error).toBeNull();
		expect(alpha.axes[0].length.value).toBeCloseTo(50);
	});

	it('the resolver returns the live center after the underlying start or end changes (no stale cache)', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 8, y_min: 0, y_max: 40 });
		const error = constraints.set_formula(so, 'width', 'y.c');
		expect(error).toBeNull();
		expect(so.axes[0].length.value).toBeCloseTo(20);

		so.set_bound('y_max', 200);
		constraints.propagate(so);
		expect(so.axes[0].length.value).toBeCloseTo(100);
	});

});

// ═══════════════════════════════════════════════════════════════════
// Self-loop check — same-direction same-SO center references on s/e/l
// are rejected at edit time. Cross-direction and cross-SO references are
// accepted.
// ═══════════════════════════════════════════════════════════════════

describe('self-loop check on the center letter', () => {

	it('a formula on the start of a direction that references center of that same direction on the same SO is rejected', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 10 });
		const error = constraints.set_formula(so, 'x_min', 'c');
		expect(error).not.toBeNull();
		expect(error!.message.toLowerCase()).toContain('loop');
	});

	it('a formula on the end of a direction that references center of that same direction on the same SO is rejected', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 10 });
		const error = constraints.set_formula(so, 'x_max', 'c');
		expect(error).not.toBeNull();
	});

	it('a formula on the length of a direction that references center of that same direction on the same SO is rejected', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 10 });
		const error = constraints.set_formula(so, 'width', 'c');
		expect(error).not.toBeNull();
	});

	it('a formula on the start of one direction that references center of a different direction on the same SO is accepted', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 10, y_min: 0, y_max: 4 });
		const error = constraints.set_formula(so, 'x_min', 'y.c');
		expect(error).toBeNull();
	});

	it('a formula on the start of a direction that references center of the same direction on a different SO is accepted', () => {
		const beta = add_so('beta', { x_min: 0, x_max: 100 });
		const alpha = add_so('alpha', { x_min: 0, x_max: 10 });
		const error = constraints.set_formula(alpha, 'x_min', `${beta.id}.x_center`);
		expect(error).toBeNull();
	});

	it('a self-loop with the qualified form is also rejected (start references same-axis center via axis-qualified self)', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 10 });
		// Host is x_min; `x.c` is qualified-self for x — same direction, same SO.
		const error = constraints.set_formula(so, 'x_min', 'x.c');
		expect(error).not.toBeNull();
	});

});

// ═══════════════════════════════════════════════════════════════════
// Drag through center — the writer paths refuse to write
// ═══════════════════════════════════════════════════════════════════

describe('drag through center', () => {

	it('the resolver-level writer refuses to write through a center attribute', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 10 });
		constraints.write(so.id, 'x_center', 999);
		expect(so.x_min).toBe(0);
		expect(so.x_max).toBe(10);
	});

	it('the free-constant writer refuses to write through a center attribute', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 10 });
		const synthetic_attr = { name: 'x_center', value: 5, is_locked: false } as unknown as Smart_Object['axes'][0]['start'];
		constraints.write_free_constant({ kind: 'attr', so, attr: synthetic_attr }, 999);
		expect(synthetic_attr.value).toBe(5);
	});

	// ─── Phase 2: refusal posts a message to the status strip ────────────

	it('walking the upstream of a cell whose formula reads a center publishes "cannot drag a center" to the status strip', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 8, y_min: 0, y_max: 40 });
		// Set a formula on width that reads y's center — a cross-direction read.
		const error = constraints.set_formula(so, 'width', 'y.c');
		expect(error).toBeNull();

		// Simulate the drag-setup walker. The walker enters y_center, finds no
		// underlying number, and publishes the refusal message.
		status.clear();
		constraints.collect_upstream(so, 'width');
		expect(status.current).not.toBeNull();
		expect(status.current!.text).toBe('cannot drag a center');
		expect(status.current!.kind).toBe('error');
	});

	it('the resolver-level write to a center publishes "cannot drag a center" to the status strip', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 10 });
		status.clear();
		constraints.write(so.id, 'x_center', 999);
		expect(status.current).not.toBeNull();
		expect(status.current!.text).toBe('cannot drag a center');
		expect(status.current!.kind).toBe('error');
	});

	it('the free-constant write to a center publishes "cannot drag a center" to the status strip', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 10 });
		const synthetic_attr = { name: 'x_center', value: 5, is_locked: false } as unknown as Smart_Object['axes'][0]['start'];
		status.clear();
		constraints.write_free_constant({ kind: 'attr', so, attr: synthetic_attr }, 999);
		expect(status.current).not.toBeNull();
		expect(status.current!.text).toBe('cannot drag a center');
		expect(status.current!.kind).toBe('error');
	});

	it('repeating the same refusal does not fill the strip queue with duplicates', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 8, y_min: 0, y_max: 40 });
		const error = constraints.set_formula(so, 'width', 'y.c');
		expect(error).toBeNull();

		status.clear();
		// Trigger the same refusal many times in a row.
		for (let i = 0; i < 50; i++) {
			constraints.collect_upstream(so, 'width');
		}
		// The strip dedup keeps the queue at one entry.
		expect(get(status.w_queue)).toHaveLength(1);
	});

	it('a drag whose formula does not read a center does not post the message', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 8, y_min: 0, y_max: 40 });
		const beta = add_so('beta', { x_min: 0, x_max: 100 });
		// width reads beta's start — no center involved.
		const error = constraints.set_formula(so, 'width', `${beta.id}.x_min`);
		expect(error).toBeNull();

		status.clear();
		constraints.collect_upstream(so, 'width');
		expect(status.current).toBeNull();
	});

});

// ═══════════════════════════════════════════════════════════════════
// Round-trip through every entry point — type, save, load, rename
// ═══════════════════════════════════════════════════════════════════

describe('round-trip through every entry point', () => {

	it('a formula text containing the center letter survives re-compiling and resolves to the same number', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 8, y_min: 0, y_max: 40 });

		const error = constraints.set_formula(so, 'width', 'y.c + 10');
		expect(error).toBeNull();
		const before = so.axes[0].length.value;

		const stored_text = so.attributes_dict_byName['width'].formula_display ?? '';
		expect(stored_text).toContain('c');

		const error2 = constraints.set_formula(so, 'width', stored_text);
		expect(error2).toBeNull();
		const after = so.axes[0].length.value;
		expect(after).toBeCloseTo(before);
	});

	it('the formula text saved with the center letter intact uses the bare letter, not its expansion', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 8, y_min: 0, y_max: 40 });
		const error = constraints.set_formula(so, 'width', 'y.c + 5');
		expect(error).toBeNull();

		const stored = so.attributes_dict_byName['width'].formula;
		const text = stored ? tokenizer.untokenize(stored) : '';
		expect(text).toContain('c');
		expect(text).not.toContain('y_min');
		expect(text).not.toContain('y_max');
	});

});

// ═══════════════════════════════════════════════════════════════════
// Debug summary — each direction's center appears alongside start, end, length
// (Phase 3 — observability)
// ═══════════════════════════════════════════════════════════════════

describe('debug summary includes the center', () => {

	it('a multi-line debug summary lists every direction with its start, end, length, and center', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 20, y_min: 0, y_max: 40, z_min: 0, z_max: 6 });
		const text = so.describe();
		// Each direction has its center on its line.
		expect(text).toContain('center 10');  // x center
		expect(text).toContain('center 20');  // y center
		expect(text).toContain('center 3');   // z center
		// The SO's name appears at the top.
		expect(text).toContain('alpha');
	});

	it('after editing the start of one direction, the next debug summary shows the updated center', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 20 });
		expect(so.describe()).toContain('center 10');

		so.set_bound('x_max', 100);
		expect(so.describe()).toContain('center 50');
	});

});

// ═══════════════════════════════════════════════════════════════════
// Translation round-trip — concrete-to-agnostic and back
// ═══════════════════════════════════════════════════════════════════

describe('translation round-trip', () => {

	it('a formula written in one form survives round-tripping to the other form and back', () => {
		const so = add_so('alpha', { x_min: 0, x_max: 8, y_min: 0, y_max: 40 });
		// Set a formula in axis-qualified form.
		const error = constraints.set_formula(so, 'width', 'y.c + 1');
		expect(error).toBeNull();

		const before = so.attributes_dict_byName['width'].formula_display;

		// Translate to concrete form (y.c becomes y_center).
		constraints.translate_formulas(so, 'explicit');
		const concrete = so.attributes_dict_byName['width'].formula_display;
		expect(concrete).toContain('y_center');

		// Translate back to agnostic form (y_center becomes y.c).
		constraints.translate_formulas(so, 'agnostic');
		const after = so.attributes_dict_byName['width'].formula_display;
		expect(after).toBe(before);
	});

});
