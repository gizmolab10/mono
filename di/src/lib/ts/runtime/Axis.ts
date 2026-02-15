import type { Portable_Axis } from '../types/Interfaces';
import type { Axis_Name } from '../types/Types';
import Attribute from '../types/Attribute';

/** One dimension of a Smart_Object — bundles start, end, length, and angle.
 *  Invariant: length = end - start. One of the three is derived from the other two. */
export default class Axis {
	attributes: Attribute[];
	invariant: number = 2;
	name: Axis_Name;

	constructor(name: Axis_Name) {
		this.name = name;
		this.attributes = [
			new Attribute(`${name}_min`),
			new Attribute(`${name}_max`),
			new Attribute(this.length_name),
			new Attribute(`${name}_angle`),
		];
	}

	get length_name(): string { return this.name === 'x' ? 'width' : this.name === 'y' ? 'height' : 'depth'; }

	get start():  Attribute { return this.attributes[0]; }
	get end():    Attribute { return this.attributes[1]; }
	get length(): Attribute { return this.attributes[2]; }
	get angle():  Attribute { return this.attributes[3]; }

	serialize(): Portable_Axis {
		return {
			attributes: [
				this.start.serialize(),
				this.end.serialize(),
				this.length.serialize(),
				this.angle.serialize(),
			],
			invariant: this.invariant,
		};
	}

	deserialize(data: Portable_Axis): void {
		const [start, end, length, angle] = data.attributes;
		this.start.deserialize(start);
		this.end.deserialize(end);
		this.length.deserialize(length);
		this.angle.deserialize(angle);
		this.invariant = data.invariant ?? 2;
	}
}
