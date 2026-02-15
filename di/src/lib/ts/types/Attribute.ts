import type { Node } from '../algebra';

export default class Attribute {
	formula: string | null = null;
	compiled: Node | null = null;
	value: number;
	name: string;

	constructor(name: string, value: number = 0) {
		this.value = value;
		this.name = name;
	}

	get has_formula(): boolean { return this.formula !== null; }
}
