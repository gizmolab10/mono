import type { Smart_Object } from '../runtime';
import type { Axis_Name } from '../types/Types';

// The dotted name from the root down to a smart object.
//
// For the root itself it is just the root's own name. For any part below the
// root the root's name is implicit and left off — so a part directly under the
// root is just its own name, and a deeper part joins its line of parents with
// dots, e.g. "wall.stud".
export function full_name(so: Smart_Object): string {
	const names: string[] = [];
	let current: Smart_Object | null = so;
	while (current) {
		names.push(current.name);
		current = current.scene?.parent?.so ?? null;
	}
	if (names.length <= 1) return so.name;	// the root — nothing above it
	names.pop();							// drop the implicit root
	return names.reverse().join('.');
}

// The measurement name a direction carries: x is width, y is depth, z is
// height. (These three are the words the rest of the app already uses for a
// smart object's span along each direction.)
export function measurement_name(axis: Axis_Name): string {
	return axis === 'x' ? 'width' : axis === 'y' ? 'depth' : 'height';
}

// A dimensional's full name: the owning part's full name, then the measurement
// name, e.g. "wall.stud.height".
export function dimensional_name(so: Smart_Object, axis: Axis_Name): string {
	return `${full_name(so)}.${measurement_name(axis)}`;
}
