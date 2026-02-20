import type { Compact_Attribute } from './Interfaces';
import type { Node } from '../algebra';
import type { Token } from '../algebra';
import { compiler, tokenizer } from '../algebra';

export default class Attribute {
	formula: Token[] | null = null;
	compiled: Node | null = null;
	value: number;
	name: string;

	constructor(name: string, value: number = 0) {
		this.value = value;
		this.name = name;
	}

	get has_formula(): boolean { return this.formula !== null; }

	/** Display string: untokenize the stored tokens. */
	get formula_display(): string | null {
		return this.formula ? tokenizer.untokenize(this.formula) : null;
	}

	serialize(): Compact_Attribute {
		if (this.formula) return { formula: tokenizer.untokenize(this.formula) };
		return this.value;
	}

	deserialize(data: Compact_Attribute): void {
		if (typeof data === 'number') {
			this.value = data;
			return;
		}
		if (data.formula) {
			this.formula = tokenizer.tokenize(data.formula);
			this.value = 0;
			try { this.compiled = compiler.compile(data.formula); } catch { /* skip */ }
		} else {
			this.value = data.value ?? 0;
		}
	}
}
