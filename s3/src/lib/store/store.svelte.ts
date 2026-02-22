import { Thing }        from '../entities/Thing';
import { Relationship } from '../entities/Relationship';
import { Predicate }    from '../entities/Predicate';
import { Trait }        from '../entities/Trait';
import { Tag }          from '../entities/Tag';
import { T_Predicate, T_Thing } from '../common/Enumerations';
import type { Integer } from '../types/Types';

const BASE = 'seed';

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

	// ————————————————————————————————————————— Seed

	load_seed(): void {
		this.forget_all();

		// Things
		const things: [string, string, string, T_Thing?][] = [
			['root',  'Root',       '#b4b4b4', T_Thing.root],
			['a',     'Concepts',   '#6ea8d9'],
			['a1',    'Ideas',      '#6ea8d9'],
			['a2',    'Principles', '#6ea8d9'],
			['a3',    'Models',     '#6ea8d9'],
			['b',     'Projects',   '#7bc47f'],
			['b1',    'Alpha',      '#7bc47f'],
			['b2',    'Beta',       '#7bc47f'],
			['c',     'People',     '#e8a86e'],
			['c1',    'Alice',      '#e8a86e'],
			['c2',    'Bob',        '#e8a86e'],
			['d',     'Resources',  '#b98fd9'],
			['d1',    'Books',      '#b98fd9'],
			['d2',    'Tools',      '#b98fd9'],
			['d3',    'Notes',      '#b98fd9'],
		];

		for (const [id, title, color, t_thing] of things) {
			this.remember_thing(new Thing(BASE, id, title, color, t_thing ?? T_Thing.generic));
		}

		// Relationships (parentId → childId)
		const edges: [string, string, string][] = [
			['r01', 'root', 'a'],
			['r02', 'root', 'b'],
			['r03', 'root', 'c'],
			['r04', 'root', 'd'],
			['r05', 'a',    'a1'],
			['r06', 'a',    'a2'],
			['r07', 'a',    'a3'],
			['r08', 'b',    'b1'],
			['r09', 'b',    'b2'],
			['r10', 'c',    'c1'],
			['r11', 'c',    'c2'],
			['r12', 'd',    'd1'],
			['r13', 'd',    'd2'],
			['r14', 'd',    'd3'],
		];

		for (const [id, parent, child] of edges) {
			this.remember_relationship(new Relationship(BASE, id, T_Predicate.contains, parent, child, [0, 0]));
		}

		// Default predicates
		const predicateKinds: [string, boolean][] = [
			[T_Predicate.contains,    false],
			[T_Predicate.isRelated,   true],
			[T_Predicate.isTagged,    true],
			[T_Predicate.requires,    true],
			[T_Predicate.alliedWith,  true],
			[T_Predicate.appreciates, true],
			[T_Predicate.explainedBy, true],
			[T_Predicate.supportedBy, true],
		];

		for (const [kind, bidir] of predicateKinds) {
			this.remember_predicate(new Predicate(kind, kind, bidir));
		}
	}
}

export const store = new S_Store();
