import type { Portable_Attribute } from './Interfaces';
import type { Node } from '../algebra';
import { compiler } from '../algebra';

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

	serialize(): Portable_Attribute {
		const pa: Portable_Attribute = { value: this.value };
		if (this.formula) pa.formula = this.formula;
		return pa;
	}

	deserialize(data: Portable_Attribute): void {
		this.value = data.value;
		if (data.formula) {
			this.formula = data.formula;
			try { this.compiled = compiler.compile(data.formula); } catch { /* skip */ }
		}
	}
}
