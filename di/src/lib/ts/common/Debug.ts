import { selection } from '../managers/Selection';
import { stores } from '../managers/Stores';
import { scenes } from '../managers/Scenes';
import { scene } from '../render/Scene';
import { camera } from '../render/Camera';
import { engine } from '../render/Engine';
import { render } from '../render/Render';
import { w_dim_dropped_avg, set_spring_k, last_hull, last_hull_input, last_drawn_lines, push_outside_hull } from '../render/R_Dimensions';
import { e as events } from '../events/Events';
import Smart_Object from '../runtime/Smart_Object';
import type { Bound } from '../types/Types';
import { quat, vec3 } from 'gl-matrix';
import { get } from 'svelte/store';

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
				// Hide every smart object that shares this name. Basement has
				// several name-duplicates (two "wall", two "stud", etc.); the
				// caller's intent is "hide that part", which means all of them.
				let changed = false;
				for (const node of scene.get_all()) {
					if (node.so.name === (name as string)) {
						node.so.visible = Boolean(visible);
						changed = true;
					}
				}
				if (changed) stores.tick();
				return null;
			}) as (...args: unknown[]) => unknown,
			set_all_visible: (() => {
				for (const node of scene.get_all()) node.so.visible = true;
				stores.tick();
				return null;
			}) as (...args: unknown[]) => unknown,
			set_so_hide_children: ((name: unknown, hide: unknown) => {
				const node = scene.get_all().find(o => o.so.name === (name as string));
				if (node) {
					node.so.hide_children = Boolean(hide);
					stores.tick();
				}
				return null;
			}) as (...args: unknown[]) => unknown,

			// ─── Dimensions hooks (test-only) ─────────────────────────────
			// One entry per dimension label drawn this paint. The position
			// and size are the screen-space rectangle the label occupies.
			dim_labels: () => render.dimension_rects.map(r => ({
				so_name: r.so.name,
				so_visible: r.so.visible,
				axis: r.axis,
				x: r.x, y: r.y, w: r.w, h: r.h,
			})),
			// Rolling count of dropped dimension labels (off-canvas or
			// silhouette-push exceeds the canvas size).
			dim_dropped_count: () => get(w_dim_dropped_avg),
			// Whether x-ray mode is currently active: OPTION is held AND at
			// least one part in the scene is invisible.
			is_xray_active: () => {
				const option_down = get(events.w_option_down);
				const has_invisible = scene.get_all().some(o => !o.so.visible);
				return option_down && has_invisible;
			},
			// TEMP measurement — set the spring constant at runtime.
			set_spring_k: ((v: unknown) => { set_spring_k(Number(v)); stores.tick(); return null; }) as (...args: unknown[]) => unknown,
			// TEMP measurement — drawn dimension-line endpoints, one per drawn label, same order as dim_labels.
			dim_lines: () => last_drawn_lines.slice(),
			// TEMP measurement — every projected point that fed the silhouette outline this paint, each tagged with its source SO name.
			dim_hull_input: () => last_hull_input.slice(),
			// TEMP measurement — every smart object in the scene with id, name, visibility, and parent id.
			// Use the id (not the name) for parent matching — names are not unique.
			all_smart_objects: () => scene.get_all().map(o => ({
				id: o.so.id,
				name: o.so.name,
				visible: o.so.visible,
				parent_id: o.parent ? o.parent.so.id : null,
			})),
			// TEMP measurement — count drawn labels whose centre sits inside the silhouette outline.
			dim_inside_count: () => {
				if (last_hull.length < 3) return 0;
				let inside = 0;
				for (const r of render.dimension_rects) {
					const push = push_outside_hull(r.x, r.y, last_hull, 0);
					if (push.dx !== 0 || push.dy !== 0) inside++;
				}
				return inside;
			},
			// Load a bundled scene file by path (e.g. "home/basement").
			load_scene: (async (arg: unknown) => {
				const name = arg as string;
				const raw = await scenes.load_library_file(name);
				if (!raw) return false;
				const parsed = scenes.parse_text(raw);
				if (!parsed) return false;
				engine.load_scene(parsed);
				return true;
			}) as (...args: unknown[]) => unknown,
		};
	}

}

export const debug = new Debug();
