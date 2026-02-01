import type { O_Scene } from '../types/Interfaces';
import Attribute from '../types/Attribute';
import Identifiable from './Identifiable';

export default class Smart_Object extends Identifiable {
	attribute: Attribute | null = null;
	scene: O_Scene | null;
	name: string;

	constructor(name: string = '', scene: O_Scene | null = null) {
		super();
		this.name = name;
		this.scene = scene;
	}

	get hasScene(): boolean { return !!this.scene; }
}
