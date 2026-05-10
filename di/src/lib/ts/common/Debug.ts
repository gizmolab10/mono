import { selection } from '../managers/Selection';
import { stores } from '../managers/Stores';
import { scene } from '../render/Scene';
import { camera } from '../render/Camera';
import Smart_Object from '../runtime/Smart_Object';
import type { Bound } from '../types/Types';
import { vec3 } from 'gl-matrix';

const CUBE_EDGES: [number, number][] = [
	[0, 1], [1, 2], [2, 3], [3, 0],
	[4, 5], [5, 6], [6, 7], [7, 4],
	[0, 4], [1, 5], [2, 6], [3, 7],
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
				for (const [k, v] of Object.entries(config.bounds)) {
					so.set_bound(k as Bound, v as number);
				}
				for (const axis of so.axes) {
					axis.length.value = axis.end.value - axis.start.value;
				}
				const parent_node = config.parent_name
					? scene.get_all().find(o => o.so.name === config.parent_name)
					: undefined;
				const o_scene = scene.create({ so, edges: CUBE_EDGES, parent: parent_node });
				so.scene = o_scene;
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
