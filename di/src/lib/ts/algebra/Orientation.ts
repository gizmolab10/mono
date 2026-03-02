/**
 * Swing-twist decomposition for cardinal axes.
 *
 * Given quat q and a cardinal twist axis, decompose:
 *   q = swing · twist
 * where twist is the rotation purely around the specified axis.
 *
 * gl-matrix quat layout: [x, y, z, w] → indices 0, 1, 2, 3.
 */

import { quat } from 'gl-matrix';
import type { Axis_Name } from '../types/Types';

const AXIS_INDEX: Record<Axis_Name, number> = { x: 0, y: 1, z: 2 };

export function swing_twist(q: quat, axis: Axis_Name): { twist: quat; twist_angle: number; swing: quat } {
	const i = AXIS_INDEX[axis];

	// Project q onto the twist axis: keep only the axis component and w
	const t = quat.create();
	t[i] = q[i];
	t[3] = q[3];

	const len = Math.sqrt(t[i] * t[i] + t[3] * t[3]);
	if (len < 1e-10) {
		// Degenerate: no twist component — entire rotation is swing
		return { twist: quat.create(), twist_angle: 0, swing: quat.clone(q) };
	}
	quat.normalize(t, t);

	const twist_angle = 2 * Math.atan2(t[i], t[3]);

	// swing = q · twist⁻¹
	const twist_inv = quat.create();
	quat.invert(twist_inv, t);
	const s = quat.create();
	quat.multiply(s, q, twist_inv);

	return { twist: t, twist_angle, swing: s };
}

/**
 * Find (inner_angle, outer_angle) minimizing angular distance between
 * q and R(outer, outer_angle) · R(inner, inner_angle).
 *
 * Alternating projection: fix one angle, solve the other via twist extraction.
 * Converges in ~5 iterations to the closest 2-axis approximation.
 */
export function closest_pair_angles(
	q: quat, inner: Axis_Name, outer: Axis_Name, iterations = 5
): { inner_angle: number; outer_angle: number } {
	const ii = AXIS_INDEX[inner];
	const oi = AXIS_INDEX[outer];
	const i_vec: [number, number, number] = [0, 0, 0]; i_vec[ii] = 1;
	const o_vec: [number, number, number] = [0, 0, 0]; o_vec[oi] = 1;

	// Initial guess: direct twist extraction for inner axis
	let i_angle = 2 * Math.atan2(q[ii], q[3]);
	let o_angle = 0;

	const tmp = quat.create();
	const stripped = quat.create();

	for (let n = 0; n < iterations; n++) {
		// Fix inner, find optimal outer: stripped = q · R(inner, -i_angle)
		quat.setAxisAngle(tmp, i_vec, -i_angle);
		quat.multiply(stripped, q, tmp);
		o_angle = 2 * Math.atan2(stripped[oi], stripped[3]);

		// Fix outer, find optimal inner: stripped = R(outer, -o_angle) · q
		quat.setAxisAngle(tmp, o_vec, -o_angle);
		quat.multiply(stripped, tmp, q);
		i_angle = 2 * Math.atan2(stripped[ii], stripped[3]);
	}

	return { inner_angle: i_angle, outer_angle: o_angle };
}
