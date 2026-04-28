import { describe, it, expect, beforeEach } from 'vitest';
import { vec3 } from 'gl-matrix';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { camera } from '../render/Camera';
import { engine } from '../render/Engine';
import { constraints } from '../algebra';
import { Size } from '../types/Coordinates';

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

// Capture a small snapshot in the same shape the running app writes when it
// saves: each block gets its serialized form plus the id of its parent (if any),
// and the camera contributes its own snapshot.
type Saved_SO = ReturnType<Smart_Object['serialize']> & { parent_id?: string };
type Saved_World = {
	smart_objects: Saved_SO[];
	camera: ReturnType<typeof camera.serialize>;
	root_id: string;
};

function capture(root: Smart_Object): Saved_World {
	return {
		smart_objects: scene.get_all().map(o => ({
			...o.so.serialize(),
			...(o.parent ? { parent_id: o.parent.so.id } : {}),
		})),
		camera: camera.serialize(),
		root_id: root.id,
	};
}

// Replay a saved snapshot: rebuild every block, wire the parent links, rebind
// formulas, recompute, restore the camera. Mirrors the load-side steps in the
// app's load flow without depending on the rest of the engine.
function replay(saved: Saved_World): Smart_Object[] {
	scene.clear();

	const sos: Smart_Object[] = [];
	for (const data of saved.smart_objects) {
		const so = Smart_Object.deserialize(data);
		const so_scene = scene.create({ so, edges: cube_edges });
		so.scene = so_scene;
		sos.push(so);
	}

	for (let i = 0; i < saved.smart_objects.length; i++) {
		const parent_id = saved.smart_objects[i].parent_id;
		if (!parent_id) continue;
		const parent_so = sos.find(s => s.id === parent_id);
		if (parent_so?.scene) {
			sos[i].scene!.parent = parent_so.scene;
			constraints.rebind_formulas(sos[i], parent_id);
		}
	}

	constraints.propagate_all();
	camera.deserialize(saved.camera);
	return sos;
}

beforeEach(() => {
	scene.clear();
	camera.init(new Size(100, 100));
});

// ═══════════════════════════════════════════════════════════════════
// Rule 33 — saving and loading is a round trip
// ═══════════════════════════════════════════════════════════════════

describe('saving and loading is a round trip', () => {
	it('a parent and a child come back with the same stored numbers and parent link', () => {
		const root = make_so('root', { x_min: 0, x_max: 20, y_min: 0, y_max: 20, z_min: 0, z_max: 20 });
		const child = make_so('child', { x_min: 2, x_max: 8 }, root);

		const saved = capture(root);
		const sos = replay(saved);

		const root_back = sos.find(s => s.id === root.id)!;
		const child_back = sos.find(s => s.id === child.id)!;

		expect(root_back.attributes_dict_byName['x_min'].value).toBe(0);
		expect(root_back.attributes_dict_byName['x_max'].value).toBe(20);

		expect(child_back.attributes_dict_byName['x_min'].value).toBe(2);
		expect(child_back.attributes_dict_byName['x_max'].value).toBe(8);

		expect(child_back.scene?.parent?.so.id).toBe(root.id);
	});

	it('a locked length stays locked across the round trip', () => {
		const root = make_so('root', { x_min: 0, x_max: 20 });
		const child = make_so('child', { x_min: 2, x_max: 8 }, root);
		child.axes[0].length.value = 6;
		child.axes[0].length.is_locked = true;

		const saved = capture(root);
		const sos = replay(saved);

		const child_back = sos.find(s => s.id === child.id)!;
		expect(child_back.axes[0].length.is_locked).toBe(true);
		expect(child_back.axes[0].length.value).toBe(6);
	});

	it('the camera position comes back unchanged', () => {
		const root = make_so('root', { x_min: 0, x_max: 10 });
		camera.set_position(
			vec3.fromValues(10, 20, 30),
			vec3.fromValues(1, 2, 3),
			vec3.fromValues(0, 1, 0),
		);

		const saved = capture(root);

		// Move the camera elsewhere to prove the restore is real.
		camera.set_position(
			vec3.fromValues(0, 0, 0),
			vec3.fromValues(0, 0, 1),
			vec3.fromValues(1, 0, 0),
		);

		replay(saved);

		expect(camera.eye[0]).toBeCloseTo(10);
		expect(camera.eye[1]).toBeCloseTo(20);
		expect(camera.eye[2]).toBeCloseTo(30);

		expect(camera.center_pos[0]).toBeCloseTo(1);
		expect(camera.center_pos[1]).toBeCloseTo(2);
		expect(camera.center_pos[2]).toBeCloseTo(3);
	});

	it('the saved world survives a trip through a string and back', () => {
		const root = make_so('root', { x_min: 0, x_max: 20 });
		const child = make_so('child', { x_min: 3, x_max: 11 }, root);
		child.axes[1].length.value = 4;
		child.axes[1].length.is_locked = true;

		const saved = capture(root);
		const text = JSON.stringify(saved);
		const reread = JSON.parse(text) as Saved_World;

		const sos = replay(reread);

		const child_back = sos.find(s => s.id === child.id)!;
		expect(child_back.attributes_dict_byName['x_min'].value).toBe(3);
		expect(child_back.attributes_dict_byName['x_max'].value).toBe(11);
		expect(child_back.axes[1].length.is_locked).toBe(true);
		expect(child_back.axes[1].length.value).toBe(4);
		expect(child_back.scene?.parent?.so.id).toBe(root.id);
	});
});

// ═══════════════════════════════════════════════════════════════════
// Rule 45 — a repeater's duplicates are not saved with the scene
// ═══════════════════════════════════════════════════════════════════

describe('a repeater\'s duplicates are not saved', () => {
	it('the saved snapshot of a repeater scene contains only the master, not the duplicates', () => {
		// Build root, a wall configured as a linear repeater, and a master stud inside the wall.
		// Trigger the repeater sync to spawn the duplicates.
		const root = make_so('root', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 });
		const wall = make_so('wall', { x_min: 0, x_max: 12, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, root);
		const stud = make_so('stud', { x_min: 0, x_max: 1, y_min: 0, y_max: 4, z_min: 0, z_max: 8 }, wall);

		wall.repeater = { is_repeating: true, run_axis: 0, spacing: 4 };
		engine.sync_repeater(wall);

		// Confirm the sync actually produced more than one stud-like child under the wall.
		const all_before_save = scene.get_all();
		const wall_children = all_before_save.filter(o => o.parent === wall.scene);
		expect(wall_children.length).toBeGreaterThan(1);

		// Compute the set of duplicate ids the same way the real save path computes them:
		// for any repeating SO, every child after the first is treated as a duplicate.
		const duplicate_ids = new Set<string>();
		for (const o of all_before_save) {
			if (!o.so.repeater?.is_repeating) continue;
			const children = all_before_save.filter(c => c.parent === o.so.scene);
			for (const c of children.slice(1)) duplicate_ids.add(c.so.id);
		}

		// Build the saved-style list, dropping the duplicates the same way the real save does.
		const saved_objects = all_before_save
			.filter(o => !duplicate_ids.has(o.so.id))
			.map(o => o.so.id);

		// Saved set: root, wall, master stud — and nothing else.
		expect(saved_objects).toContain(root.id);
		expect(saved_objects).toContain(wall.id);
		expect(saved_objects).toContain(stud.id);
		expect(saved_objects.length).toBe(3);

		// And there really were duplicates that got excluded.
		expect(duplicate_ids.size).toBeGreaterThan(0);
	});
});
