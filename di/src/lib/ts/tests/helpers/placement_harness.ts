import { mat4 } from 'gl-matrix';
import { scene } from '../../render/Scene';
import { camera } from '../../render/Camera';
import { render } from '../../render/Render';
import { stores } from '../../managers/Stores';
import { run_uniface_placement, set_off_canvas_filter_enabled_for_tests } from '../../render/Dimension_Placement';
import type { Uniface_Placement_Result } from '../../render/Dimension_Placement';
import { cube_edges, cube_faces, make_so } from './scene_mock';
import Smart_Object from '../../runtime/Smart_Object';

/** One part the harness adds to the scene. Bounds are world-space mm. */
export type Part_Definition = {
	name: string;
	x_min: number; x_max: number;
	y_min: number; y_max: number;
	z_min: number; z_max: number;
};

/** Wires up the scene singleton, the camera matrices, the renderer size,
 *  and the stores so run_uniface_placement can run inside a unit test.
 *  Then runs the placement once and returns the result. The harness is
 *  destructive: it clears the scene each call. Use it for tests that
 *  need to assert on actual placement output rather than on pure
 *  geometry helpers. */
export function run_placement_on_parts(parts: readonly Part_Definition[]): Uniface_Placement_Result {
	scene.clear();
	// Root SO — non-rotated. Children are dim-rendered; root itself is
	// non-interactive per the placement code's parent check.
	const root_so = new Smart_Object('root');
	const root = scene.create({ so: root_so, edges: cube_edges, faces: cube_faces });
	for (const p of parts) {
		const so = make_so(p.name, p.x_min, p.x_max, p.y_min, p.y_max, p.z_min, p.z_max);
		scene.create({ so, edges: cube_edges, faces: cube_faces, parent: root });
	}
	// Camera and projection matrices — identity transforms. The placement
	// reads anchor and edge points after projection, but with identity
	// camera + identity-ish projection the points pass through.
	mat4.identity(camera.view);
	mat4.identity(camera.projection);
	// Renderer canvas size — needs to be non-zero so project_vertex
	// scales x and y by half-width and half-height. 800 x 600 is a
	// reasonable test canvas.
	(render as unknown as { size: { width: number; height: number } }).size = { width: 800, height: 600 };
	// Ensure the orientation store starts at identity quaternion so the
	// edge-on filter sees no tumble.
	stores.w_orientation.set([0, 0, 0, 1]);
	// Tests use identity projection matrices, which put every anchor far
	// off the synthetic canvas; the off-canvas filter would otherwise
	// reject every candidate. Disable it for tests.
	set_off_canvas_filter_enabled_for_tests(false);
	return run_uniface_placement();
}

/** Reset the scene after a test so other tests are not contaminated. */
export function reset_placement_test_state(): void {
	scene.clear();
}
