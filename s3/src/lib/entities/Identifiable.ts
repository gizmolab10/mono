import '../common/Extensions';
import { v4 as uuidv4 } from 'uuid';
import type { Integer } from '../types/Types';

export class Identifiable {
	id:  string;
	hid: Integer;

	constructor(id: string = Identifiable.newID()) {
		this.id  = id;
		this.hid = id.hash();
	}

	static newID(prefix: string = 'NEW'): string {
		const uuid = uuidv4().replace(/-/g, '');
		return prefix + uuid.slice(-14);
	}

	static removeAll(item: string, from: string): string {
		let result = from;
		let prev   = '';
		while (result !== prev) { prev = result; result = result.split(item).join(''); }
		return result;
	}

	static id_inReverseOrder(id: string): string {
		if (id.length > 3) return Identifiable.newID();
		return id[0] + id.slice(1).split('').reverse().join('');
	}

	equals(other: Identifiable | null | undefined): boolean {
		return !!other && this.id === other.id;
	}

	setID(id: string = Identifiable.newID()) {
		this.id  = id;
		this.hid = id.hash();
	}
}
