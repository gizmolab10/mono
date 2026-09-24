import type { Integer } from '../types/Types';
import { v4 as uuid } from 'uuid';
import '../common/Extensions';

export default class Identifiable {
	hid: Integer;
	id: string;

	constructor(id: string = Identifiable.newID()) {
		this.hid = id.hash();
		this.id = id;
	}

	static newID(prefix: string = 'NEW'): string { return prefix + Identifiable.removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
	equals(other: Identifiable | null | undefined): boolean { return !!other && this.id == other.id; }

	static removeAll(item: string, from: string): string {
		let to = from;
		let length = from.length;
		do {
			length = to.length;
			to = to.replace(item, '');
		} while (length != to.length)
		return to;
	}

	setID(id: string = Identifiable.newID()) {
		this.hid = id.hash();
		this.id = id;
	}

	static remove_item_byHID<T>(from: Array<T>, item: T): Array<T> {
		const identifiable = item as Identifiable;
		const identifiables = from as Array<Identifiable>;
		return identifiables.filter(t => t.hid != identifiable.hid) as Array<T>;
	}

	static id_inReverseOrder(id: string): string {
		if (id.length > 3) { return this.newID(); }
		const parts = id.split('');
		const start = parts.shift();
		return [start, ...parts.reverse()].join('');
	}
	
}
