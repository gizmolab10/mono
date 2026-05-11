import { selection } from '../managers/Selection';
import { stores } from '../managers/Stores';
import { scene } from '../render/Scene';
import { camera } from '../render/Camera';
import Smart_Object from '../runtime/Smart_Object';
import type { Bound } from '../types/Types';
import { quat, vec3 } from 'gl-matrix';

const CUBE_EDGES: [number, number][] = [
	[0, 1], [1, 2], [2, 3], [3, 0],
	[4, 5], [5, 6], [6, 7], [7, 4],
	[0, 4], [1, 5], [2, 6], [3, 7],
];

// Six faces of a cube, each as a list of vertex indices in the canonical
// winding order used everywhere else in the project (see Topology.test.ts).
// Required so the renderer (solid mode by default) can paint and outline the
// box and the back-face cull picks the right ones.
const CUBE_FACES: number[][] = [
	[3, 2, 1, 0], // z_min
	[4, 5, 6, 7], // z_max
	[0, 4, 7, 3], // x_min
	[2, 6, 5, 1], // x_max
	[7, 6, 2, 3], // y_max
	[0, 1, 5, 4], // y_min
];

export class Debug {

	/**
	 * Attach the test hooks the browser-driven test suite needs.
	 * Only fires when the URL carries `?test=1`. A normal user session sees
	 * no extra surface on the page. The read hooks expose internal state for
	 * test assertions; the write hooks let tests build a known scene and
	 * camera so they can check exact values from the print pipeline.
	 */
	apply_queryStrings(queryStrings: URLSearchParams): void {
		if (typeof window === 'undefined') return;
		if (queryStrings.get('test') !== '1') return;
		(window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test = {
			// ─── Read hooks ───────────────────────────────────────────────
			orientation: () => Array.from(stores.current_orientation()),
			selection: () => {
				const sel = selection.current;
				return sel ? { so_id: sel.so.id, type: sel.type, index: sel.index } : null;
			},
			view_mode: () => stores.current_view_mode,
			is_editing_allowed: () => stores.allow_editing,
			is_rotation_snap_on: () => stores.rotation_snap,
			camera_view: () => Array.from(camera.view as unknown as Iterable<number>),
			camera_projection: () => Array.from(camera.projection as unknown as Iterable<number>),

			// ─── Write hooks (test-only) ──────────────────────────────────
			clear_scene: () => { scene.clear(); return null; },
			add_so: ((arg: unknown) => {
				const config = arg as { name: string, bounds: Partial<Record<Bound, number>>, parent_name?: string };
				const so = new Smart_Object(config.name);
				const parent_node = config.parent_name
					? scene.get_all().find(o => o.so.name === config.parent_name)
					: undefined;
				// Wire the scene reference BEFORE setting bounds so set_bound applies
				// the parent-relative subtraction; otherwise the bounds get stored
				// as absolute values and read back as doubled values.
				const o_scene = scene.create({ so, edges: CUBE_EDGES, faces: CUBE_FACES, parent: parent_node });
				so.scene = o_scene;
				for (const [k, v] of Object.entries(config.bounds)) {
					so.set_bound(k as Bound, v as number);
				}
				for (const axis of so.axes) {
					axis.length.value = axis.end.value - axis.start.value;
				}
				return null;
			}) as (...args: unknown[]) => unknown,
			set_camera_position: ((eye: unknown, target: unknown, up: unknown) => {
				const e = eye as [number, number, number];
				const t = target as [number, number, number];
				const u = up as [number, number, number];
				camera.set_position(
					vec3.fromValues(e[0], e[1], e[2]),
					vec3.fromValues(t[0], t[1], t[2]),
					vec3.fromValues(u[0], u[1], u[2]),
				);
				return null;
			}) as (...args: unknown[]) => unknown,
			set_camera_ortho: ((on: unknown) => { camera.set_ortho(Boolean(on)); return null; }) as (...args: unknown[]) => unknown,
			set_orientation: ((q: unknown) => {
				const a = q as [number, number, number, number];
				stores.set_orientation(quat.fromValues(a[0], a[1], a[2], a[3]));
				return null;
			}) as (...args: unknown[]) => unknown,
			set_scale: ((s: unknown) => { stores.w_scale.set(Number(s)); return null; }) as (...args: unknown[]) => unknown,
			set_decorations: ((n: unknown) => { stores.w_decorations.set(Number(n)); return null; }) as (...args: unknown[]) => unknown,
			set_so_visibility: ((name: unknown, visible: unknown) => {
				const node = scene.get_all().find(o => o.so.name === (name as string));
				if (node) node.so.visible = Boolean(visible);
				return null;
			}) as (...args: unknown[]) => unknown,
			set_so_hide_children: ((name: unknown, hide: unknown) => {
				const node = scene.get_all().find(o => o.so.name === (name as string));
				if (node) node.so.hide_children = Boolean(hide);
				return null;
			}) as (...args: unknown[]) => unknown,
		};
	}

}

export const debug = new Debug();
