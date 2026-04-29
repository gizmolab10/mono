import { describe, it, expect, beforeEach } from 'vitest';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { engine } from '../render/Engine';
import { constraints } from '../algebra';

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
// Test 10 — Linear repeater clones share the template's width
// ═══════════════════════════════════════════════════════════════════

describe('linear stud repeater', () => {
	it('test 10: clones have the template\'s width', () => {
		const root = make_so('root', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 });
		const wall = make_so('wall', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		make_so('stud', { x_min: 0, x_max: 1, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);

		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 4 };

		engine.sync_repeater(wall);

		const wall_children = scene.get_all().filter(o => o.parent === wall.scene);
		const studs = wall_children.map(o => o.so);

		// First child is the template, the rest are clones
		expect(studs.length).toBeGreaterThan(1);
		for (const s of studs) {
			expect(s.axes[0].length.value).toBe(1);
		}
	});
});

// ═══════════════════════════════════════════════════════════════════
// Test 11 — Linear repeater clones step along the run axis
// ═══════════════════════════════════════════════════════════════════

describe('linear stud repeater stride', () => {
	it('test 11: each clone steps by the configured spacing along the run axis', () => {
		const root = make_so('root', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 });
		const wall = make_so('wall', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		make_so('stud', { x_min: 0, x_max: 2, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);

		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 2 };

		engine.sync_repeater(wall);

		const wall_children = scene.get_all().filter(o => o.parent === wall.scene);
		const studs = wall_children.map(o => o.so);

		expect(studs.length).toBeGreaterThanOrEqual(3);
		const first_x = studs[0].axes[0].start.value;
		expect(studs[1].axes[0].start.value - first_x).toBe(2);
		expect(studs[2].axes[0].start.value - first_x).toBe(4);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Test 12 — Linear repeater at depth: clone z-end follows formula
// ═══════════════════════════════════════════════════════════════════

describe('linear stud repeater at depth', () => {
	it('test 12: clones reproduce the template z-end stored value', () => {
		const root = make_so('root', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 });
		const middle = make_so('middle', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		const wall = make_so('wall', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, middle);
		const stud = make_so('stud', { x_min: 0, x_max: 1, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);

		const err = constraints.set_formula(stud, 'z_max', `${wall.id}.z_max`);
		expect(err).toBeNull();
		constraints.propagate(stud);

		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 4 };
		engine.sync_repeater(wall);

		const wall_children = scene.get_all().filter(o => o.parent === wall.scene);
		const studs = wall_children.map(o => o.so);

		expect(studs.length).toBeGreaterThan(1);
		const template_z_end = studs[0].axes[2].end.value;
		for (const s of studs.slice(1)) {
			expect(s.axes[2].end.value).toBe(template_z_end);
		}
	});
});

// ═══════════════════════════════════════════════════════════════════
// Test 13 — Re-running sync does not change the template
// ═══════════════════════════════════════════════════════════════════

describe('linear stud repeater idempotence', () => {
	it('test 13: running sync several times does not change template stored values', () => {
		const root = make_so('root', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 });
		const wall = make_so('wall', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		const stud = make_so('stud', { x_min: 0, x_max: 1, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);

		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 4 };

		engine.sync_repeater(wall);

		const snap = stud.axes.map(a => ({
			start: a.start.value,
			end: a.end.value,
			length: a.length.value,
		}));

		engine.sync_repeater(wall);
		engine.sync_repeater(wall);
		engine.sync_repeater(wall);

		for (let i = 0; i < 3; i++) {
			expect(stud.axes[i].start.value).toBe(snap[i].start);
			expect(stud.axes[i].end.value).toBe(snap[i].end);
			expect(stud.axes[i].length.value).toBe(snap[i].length);
		}
	});
});

// ═══════════════════════════════════════════════════════════════════
// Test 14 — Linear repeater fireblocks: size and position
// ═══════════════════════════════════════════════════════════════════

describe('linear stud repeater fireblocks', () => {
	it('test 14: regular and bookend fireblocks have the right size and position', () => {
		const root = make_so('root', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 });
		const wall = make_so('wall', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		make_so('stud', { x_min: 0, x_max: 1, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);

		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 4, firewall: true };

		engine.sync_repeater(wall);

		const wall_children = scene.get_all().filter(o => o.parent === wall.scene);
		const all_pieces = wall_children.map(o => o.so);

		// Layout: template at x=0, stud clones at 4, 8, bookend stud at 11,
		// then 3 fireblocks (regular bays at x=1 and x=5, bookend bay at x=9).
		// Studs occupy indices 0..3, fireblocks occupy 4..6.
		const first_regular_fireblock = all_pieces[4];
		const bookend_fireblock = all_pieces[6];

		expect(first_regular_fireblock.axes[0].length.value).toBe(3);
		expect(first_regular_fireblock.axes[0].start.value).toBe(1);
		expect(first_regular_fireblock.axes[0].end.value).toBe(4);
		expect(first_regular_fireblock.get_bound('x_min')).toBe(1);
		expect(first_regular_fireblock.get_bound('x_max')).toBe(4);

		expect(bookend_fireblock.axes[0].length.value).toBe(2);
		expect(bookend_fireblock.axes[0].start.value).toBe(9);
		expect(bookend_fireblock.axes[0].end.value).toBe(11);
		expect(bookend_fireblock.get_bound('x_min')).toBe(9);
		expect(bookend_fireblock.get_bound('x_max')).toBe(11);

		// The placement code picks the tallest non-run dimension of the template as the up-down axis.
		// Template stud: width 1, depth 4, height 8 — so the up-down axis is z (height 8).
		// Fireblock should sit centered along z with the stud's width, so mid-start = 3.5 and mid-end = 4.5.
		expect(first_regular_fireblock.axes[2].start.value).toBe(3.5);
		expect(first_regular_fireblock.axes[2].end.value).toBe(4.5);
		expect(first_regular_fireblock.get_bound('z_min')).toBe(3.5);
		expect(first_regular_fireblock.get_bound('z_max')).toBe(4.5);
	});
});
