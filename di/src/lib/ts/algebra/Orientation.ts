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
