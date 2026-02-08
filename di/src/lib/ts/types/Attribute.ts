import type { Node } from '../algebra';

export default class Attribute {
	value: number;
	name: string;
	formula: string | null = null;
	compiled: Node | null = null;

	constructor(name: string, value: number = 0) {
		this.value = value;
		this.name = name;
	}

	get has_formula(): boolean { return this.formula !== null; }
}
