import type Smart_Object from '../runtime/Smart_Object';
import { quat } from 'gl-matrix';

// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — ORIENTATION
// Compute orientation from bounds geometry.
// Variable children get their quaternion recomputed after propagation.
// ═══════════════════════════════════════════════════════════════════

class Orientation {

	/**
	 * Compute orientation quaternion from an SO's current bounds.
	 *
	 * The diagonal vector from (x_min, y_min, z_min) to (x_max, y_max, z_max)
	 * defines the child's "direction" in parent space. We find which two axes
	 * span the angled plane and compute the rotation from atan2.
	 *
	 * Convention: angles are between 0° and 90° exclusive.
	 * The rotation is around the axis perpendicular to the two varying axes.
	 *
	 * Returns the quaternion. Does NOT mutate the SO.
	 */
	from_bounds(so: Smart_Object): quat {
		const dx = so.x_max - so.x_min;
		const dy = so.y_max - so.y_min;
		const dz = so.z_max - so.z_min;

		// Find which two axes define the angled plane.
		// The "thin" axis (smallest dimension) is the rotation axis.
		// The other two form the plane where the angle lives.
		const adx = Math.abs(dx), ady = Math.abs(dy), adz = Math.abs(dz);

		const result = quat.create(); // identity

		if (adx <= ady && adx <= adz) {
			// Thin along x → angle is in YZ plane → rotate around X
			if (ady < 0.001 || adz < 0.001) return result;
			const angle = Math.atan2(adz, ady);
			quat.setAxisAngle(result, [1, 0, 0], angle);
		} else if (ady <= adx && ady <= adz) {
			// Thin along y → angle is in XZ plane → rotate around Y
			if (adx < 0.001 || adz < 0.001) return result;
			const angle = Math.atan2(adz, adx);
			quat.setAxisAngle(result, [0, 1, 0], angle);
		} else {
			// Thin along z → angle is in XY plane → rotate around Z
			if (adx < 0.001 || ady < 0.001) return result;
			const angle = Math.atan2(ady, adx);
			quat.setAxisAngle(result, [0, 0, 1], angle);
		}

		return result;
	}

	/**
	 * Recompute orientation for a variable (non-fixed) SO.
	 * Mutates so.orientation in place.
	 */
	recompute(so: Smart_Object): void {
		if (so.fixed) return;
		const q = this.from_bounds(so);
		quat.copy(so.orientation, q);
	}

	/**
	 * After rotating a fixed child, recompute max bounds from the new angle
	 * while preserving min bounds (origin) and total length.
	 *
	 * Before rotation: the SO has some width/height/depth.
	 * After rotation: the quaternion changed. We need to redistribute the
	 * diagonal length across the two axes in the angled plane according
	 * to the new angle.
	 */
	recompute_max_bounds(so: Smart_Object): void {
		// Total diagonal length in the angled plane
		const dx = so.x_max - so.x_min;
		const dy = so.y_max - so.y_min;
		const dz = so.z_max - so.z_min;

		// Extract angle from the quaternion
		// The rotation axis tells us which plane the angle is in
		const axis = [0, 0, 0];
		const angle = quat.getAxisAngle(axis, so.orientation);

		// Determine which two axes are in the angled plane based on rotation axis
		const ax = Math.abs(axis[0]), ay = Math.abs(axis[1]), az = Math.abs(axis[2]);

		if (ax > ay && ax > az) {
			// Rotating around X → angle in YZ plane
			const length = Math.sqrt(dy * dy + dz * dz);
			if (length < 0.001) return;
			so.set_bound('y_max', so.y_min + length * Math.cos(angle));
			so.set_bound('z_max', so.z_min + length * Math.sin(angle));
		} else if (ay > ax && ay > az) {
			// Rotating around Y → angle in XZ plane
			const length = Math.sqrt(dx * dx + dz * dz);
			if (length < 0.001) return;
			so.set_bound('x_max', so.x_min + length * Math.cos(angle));
			so.set_bound('z_max', so.z_min + length * Math.sin(angle));
		} else {
			// Rotating around Z → angle in XY plane
			const length = Math.sqrt(dx * dx + dy * dy);
			if (length < 0.001) return;
			so.set_bound('x_max', so.x_min + length * Math.cos(angle));
			so.set_bound('y_max', so.y_min + length * Math.sin(angle));
		}
	}
}

export const orientation = new Orientation();
