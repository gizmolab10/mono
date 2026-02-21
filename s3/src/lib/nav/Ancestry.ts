import { store }       from '../store/store.svelte';
import { T_Thing, T_Predicate } from '../common/Enumerations';
import type { Thing } from '../entities/Thing';

export class Ancestry {
	id: string;

	constructor(id: string = '') {
		this.id = id;
	}

	get thing(): Thing | undefined {
		if (this.id === '') {
			for (const t of store.things.values()) {
				if (t.t_thing === T_Thing.root) return t;
			}
			return undefined;
		}
		const parts    = this.id.split('/');
		const lastRelId = parts[parts.length - 1];
		const rel       = store.relationships.get(lastRelId);
		if (!rel) return undefined;
		return store.things.get(rel.idChild);
	}

	get depth(): number {
		if (this.id === '') return 0;
		return this.id.split('/').length;
	}

	get parentAncestry(): Ancestry {
		if (this.id === '') return this;
		const parts = this.id.split('/');
		parts.pop();
		return new Ancestry(parts.join('/'));
	}

	get branchAncestries(): Ancestry[] {
		const t = this.thing;
		if (!t) return [];
		const children = store.children_of(t.id);
		const result: Ancestry[] = [];
		for (const child of children) {
			for (const rel of store.relationships.values()) {
				if (rel.idParent === t.id && rel.idChild === child.id && rel.kind === T_Predicate.contains) {
					const childPath = this.id === '' ? rel.id : `${this.id}/${rel.id}`;
					result.push(new Ancestry(childPath));
					break;
				}
			}
		}
		return result;
	}
}

export const rootAncestry = new Ancestry('');
