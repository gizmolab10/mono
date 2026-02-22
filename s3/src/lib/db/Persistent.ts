import type { DocumentData, DocumentReference } from 'firebase/firestore';
import { T_Thing, T_Trait, T_Predicate, T_Persistable } from '../common/Enumerations';
import type { Thing }        from '../entities/Thing';
import type { Trait }        from '../entities/Trait';
import type { Tag }          from '../entities/Tag';
import type { Predicate }    from '../entities/Predicate';
import type { Integer }      from '../types/Types';

// ————————————————————————————————————————— PersistentThing

export class PersistentThing {
	t_thing: T_Thing;
	title:   string;
	color:   string;

	constructor(data: DocumentData) {
		const remote = data as PersistentThing;
		this.t_thing = remote.t_thing;
		this.title   = remote.title;
		this.color   = remote.color;
	}

	get hasNoData(): boolean { return !this.title && !this.color && !this.t_thing; }

	get virginTitle(): string {
		const title = this.title;
		if (title.includes('@')) {
			return title.split('@')[0];
		}
		return title;
	}

	isEqualTo(thing: Thing | null): boolean {
		return !!thing &&
			thing.t_thing === this.t_thing &&
			thing.title   === this.title &&
			thing.color   === this.color;
	}
}

// ————————————————————————————————————————— PersistentTrait

export class PersistentTrait {
	t_trait: T_Trait;
	ownerID: string;
	text:    string;

	constructor(data: DocumentData) {
		const remote = data as PersistentTrait;
		this.ownerID = remote.ownerID;
		this.t_trait = remote.t_trait;
		this.text    = remote.text;
	}

	get hasNoData(): boolean { return !this.ownerID && !this.t_trait; }

	isEqualTo(trait: Trait | null): boolean {
		return !!trait &&
			trait.ownerID === this.ownerID &&
			trait.t_trait === this.t_trait &&
			trait.text    === this.text;
	}
}

// ————————————————————————————————————————— PersistentTag

export class PersistentTag {
	thingHIDs: Array<Integer>;
	type:      string;

	constructor(data: DocumentData) {
		const remote = data as PersistentTag;
		this.thingHIDs = remote.thingHIDs;
		this.type      = remote.type;
	}

	get hasNoData(): boolean { return !this.thingHIDs && !this.type; }

	isEqualTo(tag: Tag | null): boolean {
		return !!tag && tag.thingHIDs === this.thingHIDs;
	}
}

// ————————————————————————————————————————— PersistentPredicate

export class PersistentPredicate {
	isBidirectional: boolean;
	kind:            T_Predicate;

	constructor(data: DocumentData) {
		const remote          = data as PersistentPredicate;
		this.isBidirectional  = remote.isBidirectional;
		this.kind             = remote.kind;
	}

	isEqualTo(predicate: Predicate | null): boolean {
		return !!predicate &&
			predicate.isBidirectional === this.isBidirectional &&
			predicate.kind            === this.kind;
	}
}

// ————————————————————————————————————————— PersistentRelationship

export class PersistentRelationship {
	predicate!: DocumentReference;
	parent!:    DocumentReference;
	child!:     DocumentReference;
	orders:     Array<number>;
	kind!:      T_Predicate;

	constructor(data: DocumentData) {
		const remote = data as PersistentRelationship;
		this.orders    = remote.orders ?? [0, 0];
		this.kind      = remote.kind;
		this.predicate = remote.predicate;
		this.parent    = remote.parent;
		this.child     = remote.child;
	}
}

// ————————————————————————————————————————— Validation

export function data_isValidOfKind(t_persistable: T_Persistable, data: DocumentData): boolean {
	if (!data) return false;
	switch (t_persistable) {
		case T_Persistable.things: {
			const thing = new PersistentThing(data);
			if (thing.hasNoData) return false;
			break;
		}
		case T_Persistable.traits: {
			const trait = new PersistentTrait(data);
			if (trait.hasNoData) return false;
			break;
		}
		case T_Persistable.tags: {
			const tag = data as PersistentTag;
			if (!tag.thingHIDs || !tag.type) return false;
			break;
		}
		case T_Persistable.relationships: {
			const rel = data as PersistentRelationship;
			if (!rel.predicate || !rel.parent || !rel.child) return false;
			break;
		}
		case T_Persistable.predicates: {
			if (!data.kind) return false;
			break;
		}
		default:
			return false;
	}
	return true;
}
