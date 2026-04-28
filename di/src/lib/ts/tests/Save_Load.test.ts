import { describe, it, expect, beforeEach } from 'vitest';
import { vec3 } from 'gl-matrix';
import type { Bound } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';
import { scene } from '../render/Scene';
import { camera } from '../render/Camera';
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
