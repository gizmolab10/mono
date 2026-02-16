import type { Portable_Attribute } from './Interfaces';
import type { Node } from '../algebra';
import { compiler } from '../algebra';

export default class Attribute {
	formula: string | null = null;
	compiled: Node | null = null;
	value: number;
	offset: number = 0;   // offset from parent's corresponding attribute (empty-formula default)
	name: string;

	constructor(name: string, value: number = 0) {
		this.value = value;
		this.name = name;
	}

	get has_formula(): boolean { return this.formula !== null; }

	serialize(): Portable_Attribute {
		if (this.formula) return { formula: this.formula };
		const out: Portable_Attribute = { value: this.value };
		if (this.offset !== 0) out.offset = this.offset;
		return out;
	}

	deserialize(data: Portable_Attribute): void {
		if (data.formula) {
			this.formula = data.formula;
			this.value = 0;
			try { this.compiled = compiler.compile(data.formula); } catch { /* skip */ }
		} else {
			this.value = data.value ?? 0;
		}
		this.offset = data.offset ?? 0;
	}
}
