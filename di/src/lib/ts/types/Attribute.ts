import type { Compact_Attribute } from './Interfaces';
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

	serialize(): Compact_Attribute {
		if (this.formula) return { formula: this.formula };
		return this.value;
	}

	deserialize(data: Compact_Attribute): void {
		if (typeof data === 'number') {
			this.value = data;
			return;
		}
		if (data.formula) {
			this.formula = data.formula;
			this.value = 0;
			try { this.compiled = compiler.compile(data.formula); } catch { /* skip */ }
		} else {
			this.value = data.value ?? 0;
		}
	}
}
