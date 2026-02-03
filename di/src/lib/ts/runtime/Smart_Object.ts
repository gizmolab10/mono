import type { O_Scene } from '../types/Interfaces';
import type { Dictionary } from '../types/Types';
import Attribute from '../types/Attribute';
import Identifiable from './Identifiable';

export default class Smart_Object extends Identifiable {
	attributes_dict_byName: Dictionary<Attribute> = {};
	scene: O_Scene | null;
	name: string;

	constructor(name: string = '', scene: O_Scene | null = null) {
		super();
		this.name = name;
		this.scene = scene;
		this.setup();
	}

	get hasScene(): boolean { return !!this.scene; }

	setup() {
		for (const name of ['x', 'y', 'z', 'width', 'height', 'depth']) {
			this.attributes_dict_byName[name] = new Attribute(name);
		}
	}
}
