import { Thing }        from '../entities/Thing';
import { Relationship } from '../entities/Relationship';
import { Predicate }    from '../entities/Predicate';
import { Trait }        from '../entities/Trait';
import { Tag }          from '../entities/Tag';
import { T_Predicate }  from '../common/Enumerations';
import type { Integer } from '../types/Types';

class S_Store {
	things        = $state(new Map<string, Thing>());
	relationships = $state(new Map<string, Relationship>());
	predicates    = $state(new Map<string, Predicate>());
	traits        = $state(new Map<string, Trait>());
	tags          = $state(new Map<string, Tag>());

	// ————————————————————————————————————————— Things

	remember_thing(thing: Thing): void {
		if (!this.things.has(thing.id)) {
			this.things.set(thing.id, thing);
		}
	}

	forget_thing(hid: Integer): void {
		for (const [id, t] of this.things) {
			if (t.hid === hid) { this.things.delete(id); break; }
		}
	}

	forget_all_things(): void { this.things = new Map(); }

	// ————————————————————————————————————————— Relationships

	remember_relationship(rel: Relationship): void {
		if (!this.relationships.has(rel.id)) {
			this.relationships.set(rel.id, rel);
		}
	}

	forget_relationship(hid: Integer): void {
		for (const [id, r] of this.relationships) {
			if (r.hid === hid) { this.relationships.delete(id); break; }
		}
	}

	forget_all_relationships(): void { this.relationships = new Map(); }

	// ————————————————————————————————————————— Predicates

	remember_predicate(pred: Predicate): void {
		this.predicates.set(pred.kind, pred);
	}

	forget_all_predicates(): void { this.predicates = new Map(); }

	// ————————————————————————————————————————— Traits

	remember_trait(trait: Trait): void {
		if (!this.traits.has(trait.id)) {
			this.traits.set(trait.id, trait);
		}
	}

	forget_all_traits(): void { this.traits = new Map(); }

	// ————————————————————————————————————————— Tags

	remember_tag(tag: Tag): void {
		if (!this.tags.has(tag.id)) {
			this.tags.set(tag.id, tag);
		}
	}

	forget_all_tags(): void { this.tags = new Map(); }

	// ————————————————————————————————————————— All

	forget_all(): void {
		this.forget_all_things();
		this.forget_all_relationships();
		this.forget_all_predicates();
		this.forget_all_traits();
		this.forget_all_tags();
	}

	// ————————————————————————————————————————— Derived indexes

	children_of(parentId: string): Thing[] {
		const out: Thing[] = [];
		for (const rel of this.relationships.values()) {
			if (rel.kind === T_Predicate.contains && rel.idParent === parentId) {
				const child = this.things.get(rel.idChild);
				if (child) out.push(child);
			}
		}
		return out;
	}

	parents_of(childId: string): Thing[] {
		const out: Thing[] = [];
		for (const rel of this.relationships.values()) {
			if (rel.kind === T_Predicate.contains && rel.idChild === childId) {
				const parent = this.things.get(rel.idParent);
				if (parent) out.push(parent);
			}
		}
		return out;
	}

}

export const store = new S_Store();
