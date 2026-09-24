import { e, h, k, u, x, debug, colors, S_Items, databases, Seriously_Range } from '../common/Global_Imports';
import { Tag, Trait, Ancestry, Predicate, Persistable, Relationship } from '../common/Global_Imports';
import { T_Thing, T_Trait, T_Debug, T_Predicate, T_Persistable } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';
import { get } from 'svelte/store';

export default class Thing extends Persistable {
	selectionRange = new Seriously_Range(0, 0);
	bulkRootID: string = k.empty;
	t_thing: T_Thing;
	title: string;
	color: string;

	constructor(idBase: string, id: string, title = k.title.default, color = colors.default_forThings, t_thing = T_Thing.generic, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.things, id, already_persisted);
		this.selectionRange = new Seriously_Range(0, title.length);
		this.t_thing = t_thing;
		this.title = title;
		this.color = color;
	};
	
	get si_tags():				S_Items		   <Tag> { return h.si_tags_forThingHID(this.hid); }
	get si_traits():	 null | S_Items		 <Trait> { return h.si_traits_forOwnerHID(this.hid); }
	get si_ancestries(): null | S_Items   <Ancestry> { return h.si_ancesties_forThingHID(this.hid); }
	get parents():				Array		 <Thing> { return this.parents_ofKind(T_Predicate.contains); }
	get parentIDs():			Array		<string> { return this.parents.map(t => t.id); }
	get ancestries():		 	Array	  <Ancestry> { return this.si_ancestries?.items ?? []; }
	get childRelationships():	Array <Relationship> { return h.relationships_ofKind_forParents_ofThing(T_Predicate.contains, false, this); }
	get relatedRelationships(): Array <Relationship> { return h.relationships_ofKind_forParents_ofThing(T_Predicate.isRelated, false, this); }
	get fields():		  		Dictionary  <string> { return { title: this.title, color: this.color, type: this.t_thing }; }
	get abbreviated_title():				  string { return this.title.split(' ').map(word => word[0]).join(k.empty).toLowerCase(); }
	get idBridging():						  string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get description():						  string { return this.id + ' "' + this.title + k.quote; }
	get breadcrumb_title():					  string { return this.title.clipWithEllipsisAt(15); }
	get width_ofTitle():					  number { return u.getWidthOf(this.title); }
	get isRoot():							 boolean { return this.t_thing == T_Thing.root; }
	get isFolder():							 boolean { return this.t_thing == T_Thing.folder; }
	get isBookmark():						 boolean { return this.t_thing == T_Thing.bookmark; }
	get isBulkAlias():						 boolean { return this.t_thing == T_Thing.bulk; }
	get isExternals():						 boolean { return this.t_thing == T_Thing.externals; }
	get hasRelated():						 boolean { return this.relatedRelationships.length > 0; }
	get isAcrossBulk():						 boolean { return this.idBase != h.db.idBase; }
	get hasParents():						 boolean { return this.hasParents_ofKind(T_Predicate.contains); }
	get isFocus():							 boolean { return (get(x.w_ancestry_focus)?.thing?.id ?? k.empty) == this.id; }
	
	get parents_ofAllKinds(): Array<Thing> {
		let parents: Array<Thing> = [];
		for (const predicate of h.predicates) {
			const more = this.parents_ofKind(predicate.kind)
			parents = u.uniquely_concatenateArrays_ofIdentifiables(parents, more) as Array<Thing>;
		}
		return parents;
	}

	get thing_isBulk_expanded(): boolean {		// cross db ancestries needs special attention
		if (this.isBulkAlias) {
			const ancestries = x.si_expanded.items;
			if (!!ancestries) {
				for (const ancestry of ancestries) {
					if (this.id == ancestry.thing?.id) {
						return true;
					}
				}
			}
		}
		return false;
	}

	debugLog(message: string) { this.log(T_Debug.things, message); }
	trait_forType(type: T_Trait) { return this.si_traits?.item as Trait; }
	hasParents_ofKind(kind: string): boolean { return this.parents_ofKind(kind).length > 0; }
	hasMultipleParents_ofKind(kind: string): boolean { return this.parents_ofKind(kind).length > 1; }
	log(option: T_Debug, message: string) { debug.log_maybe(option, message + k.space + this.description); }

	override isInDifferentBulkThan(other: Thing): boolean {
		return super.isInDifferentBulkThan(other) || (other.isBulkAlias && !this.isBulkAlias && this.idBase != other.title);
	}

	signal_color_change() {
		e.w_count_rebuild.update(n => n + 1);
		colors.w_thing_color.set(`${this.id}${k.separator.generic}${get(e.w_count_rebuild)}`);
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.thing_persistentUpdate(this);
		} else {
			await databases.db_now.thing_remember_persistentCreate(this);
		}
	}

	crumbWidth(numberOfParents: number): number {
		const forNone = this.width_ofTitle + 10;
		switch (numberOfParents) {
			case 0:	 return forNone;
			case 1:	 return forNone + 11;
			default: return forNone + 18;
		}
	}

	remove_fromGrabbed_andExpanded_andResolveFocus() {
		// called when this (thing) is being deleted
		for (const ancestry of this.ancestries) {		// DO NOT REMOVE ANCESTRIES ???
			if (ancestry.id_thing == this.id) {
				ancestry.remove_fromGrabbed_andExpanded();
			}
		}
		const focus = get(x.w_ancestry_focus);
		if (focus?.thing?.hid == this.hid) {
			h.rootAncestry.becomeFocus();
		}
	}

	parents_ofKind(kind: string): Array<Thing> {
		let parents: Array<Thing> = [];
		if (!this.isRoot) {
			const relationships = h.relationships_ofKind_forParents_ofThing(kind, true, this);
			for (const relationship of relationships) {
				const thing = relationship.parent;
				if (!!thing) {
					parents.push(thing);
				}
			}
		}
		return parents;
	}

	static readonly _____ANCESTRIES: unique symbol;

	get ancestry(): Ancestry { return this.ancestries[0] ?? h.rootAncestry; }

	get ancestry_maybe(): Ancestry | null {
		const ancestries = h.ancestries_forThing(this);
		return ancestries.length > 0 ? ancestries[0] : null;
	}

	ancestries_createUnique_forPredicate(predicate: Predicate | null): Array<Ancestry> {
		let ancestries: Array<Ancestry> = [];
		if (!!predicate){
			if (predicate.isBidirectional) {
				ancestries = h.ancestries_create_forThing_andPredicate(this, predicate);
			} else {
				let parents = this.parents_ofKind(predicate.kind) ?? [];
				for (const parent of parents) {
					const parentAncestries = parent.isRoot ? [h.rootAncestry] : h.ancestries_create_forThing_andPredicate(parent, predicate);
					ancestries = u.concatenateArrays(ancestries, parentAncestries);
				}
			}
			ancestries = u.strip_thingDuplicates_from(u.strip_falsies(ancestries));
		}
		return ancestries;
	}
	
}
