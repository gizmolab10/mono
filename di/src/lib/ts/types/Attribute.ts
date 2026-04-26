import type { Compact_Attribute } from './Interfaces';
import { compiler, tokenizer } from '../algebra';
import type { Node, Token } from '../algebra';

export default class Attribute {
	formula: Token[] | null = null;
	compiled: Node | null = null;
	is_locked: boolean = false;
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
		if (this.formula) {
			const result: { formula: string; is_locked?: boolean } = { formula: tokenizer.untokenize(this.formula) };
			if (this.is_locked) result.is_locked = true;
			return result;
		}
		if (this.is_locked) {
			return { value: this.value, is_locked: true };
		}
		return this.value;
	}

	deserialize(data: Compact_Attribute): void {
		if (data == null) { this.value = 0; this.is_locked = false; return; }
		if (typeof data === 'number') {
			this.value = data;
			this.is_locked = false;
			if (this.name === 'height') console.log(`deserialize ${this.name} from bare number: value=${this.value}, locked=${this.is_locked}`);
			return;
		}
		this.is_locked = data.is_locked ?? false;
		if (data.formula) {
			this.formula = tokenizer.fuse_name_tokens(tokenizer.tokenize(data.formula));
			this.value = data.value ?? 0;
			try { this.compiled = compiler.compile(data.formula); } catch { /* skip */ }
		} else {
			this.value = data.value ?? 0;
		}
		if (this.name === 'height' || this.name === 'z_max' || this.name === 'z_min') console.log(`deserialize ${this.name} from object: value=${this.value}, locked=${this.is_locked}`);
	}
}
