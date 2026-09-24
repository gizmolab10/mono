import { h, k, Tag, Trait, T_Thing, T_Trait, T_Create, T_Predicate } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import type { Dictionary } from '../types/Types';
import '../common/Extensions';

class Pivot {

	extract_fromDict(dict: Dictionary) {
		// each dict represents a Thing, which has a title, name, description and parent 1 link
		// later, in create_relationships_fromAllTraits, above ...
		// ... create a Relationship for each trait that has a dict containing a parent 1 link
		// TODO: what is the parent 2 link?
		const idBase = h.db.idBase;
		const thing_id = Identifiable.newID();
		const t_thing = dict['Type'] == 'bookmark' ? T_Thing.bookmark : T_Thing.generic;
		const title = dict['Title'].removeWhiteSpace();					// TODO: for remote db we need the thing id from the server
		h.thing_remember_runtimeCreate(idBase, thing_id, title, 'blue', t_thing);		// create a Thing for each dict
		this.create_trait_forThingfromDict(thing_id, dict);
		this.create_tags_forThing_fromDict(thing_id, dict);
		if (['TEAM LIBRARY', 'MEMBER LIBRARY'].includes(title)) {		// these two things are roots in airtable, directly add them to our root
			h.relationship_remember_runtimeCreateUnique(idBase, Identifiable.newID(), T_Predicate.contains, h.root.id, thing_id, [0, 0]);
		}
	}
	
	static readonly _____TRAITS: unique symbol;

	create_trait_forThingfromDict(thing_id: string, dict: Dictionary): Trait {
		const isBookmark = dict['Type'] == 'bookmark' ? T_Thing.bookmark : T_Thing.generic;
		const text = (isBookmark ? dict['Link'] : dict['Description']) ?? k.unknown;
		const t_trait = isBookmark ? T_Trait.link : T_Trait.text;
		const trait = h.trait_remember_runtimeCreate(h.db.idBase, Identifiable.newID(), thing_id, t_trait, text);			// save dict in memory, but do not persist it
		trait.dict = dict;
		return trait;
	}
	
	static readonly _____TAGS: unique symbol;

	create_tags_forThing_fromDict(thingID: string, dict: Dictionary) {
		const keys = ['Custom Tags', 'Custom Tags (Local)', 'All Local Tags (folder names)'];
		for (const key of [...keys]) {
			this.create_tag_forThing_andKey_fromDict(thingID, dict[key]);
		}
	}

	create_tag_forThing_andKey_fromDict(thingID: string, tag_types: string): Tag | null {
		if (!!tag_types) {
			for (const tag_type of [...tag_types.split(k.comma)]) {
				const tag = h.tag_remember_runtimeCreateUnique_forType(h.db.idBase, Identifiable.newID(), tag_type.trim(), [thingID.hash()]);
				return tag;
			}
		}
		return null;
	}
	
	static readonly _____RELATIONSHIPS: unique symbol;

	async create_relationships_fromAllTraits() {
		// for each trait that has a dict containing a parent <x> link
		for (const trait of [...h.traits]) {
			for (const key of ['parent 1 link']) {
				await this.create_relationship_fromTrait(trait, key);
			}
			trait.dict = {};			// not save dict, too big. was: this.shrink_dict(dict);
		}
		while (this.assure_small_families()) {}			// repeat until no changes
		// await this.cleanup_lost_and_found();  // Make sure we await this
	}

	private async create_relationship_fromTrait(trait: Trait, key: string) {
		const parent_title = trait.dict[key]?.removeWhiteSpace();
		if (!!parent_title) {
			;
			const parents = h.things_forTitle(parent_title);
			const parent = parents?.[0] ?? await h.lost_and_found();
			if (!!parent) {
				h.relationship_remember_runtimeCreateUnique(h.db.idBase, Identifiable.newID(), T_Predicate.contains, parent.id, trait.ownerID, [0, 0]);
			}
		}
	}
	
	static readonly _____CHUNKING: unique symbol;

	private assure_small_families(): boolean {
		let changed = false;
		const max_children = 35;
		;
		const rootAncestry = h.rootAncestry;
		rootAncestry.traverse((ancestry) => {
			const ancestry_title = ancestry.abbreviated_title;
			const ancestry_thing_id = ancestry.thing?.id;
			const child_ancestries = ancestry.childAncestries;
			if (!!ancestry_thing_id && child_ancestries.length > max_children) {
				changed = true;
				const chunks = [];
				for (let i = 0; i < child_ancestries.length; i += max_children) {
					chunks.push(child_ancestries.slice(i, i + max_children));
				}
				for (const [index, chunk] of [...chunks.entries()]) {
					const chunk_thing_id = Identifiable.newID();
					const chunk_thing = h.thing_remember_runtimeCreateUnique(h.db.idBase, chunk_thing_id, ancestry_title + '.' + (index + 1), 'blue', T_Thing.generic);
					h.relationship_remember_runtimeCreateUnique(h.db.idBase, Identifiable.newID(), T_Predicate.contains, ancestry_thing_id, chunk_thing.id, [0, 0], T_Create.getPersistentID);
					for (const child_ancestry of [...chunk]) {
						const child_relationship = child_ancestry.relationship;
						if (!!child_relationship) {
							child_relationship.assign_idParent(chunk_thing_id);
						}
					}
				}
			}
			return false;	// continue
		});
		if (changed) {
			h.ancestries_forget_all();
			h.ancestry_remember(rootAncestry);
		}
		return changed;
	}
	
	static readonly _____DEPRECATED: unique symbol;

	convert_key(key: string): number {
		const encodedKey = key.encode_as_property();
		if (!!encodedKey) {
			const newkey = T_Pivot_Fields[encodedKey as keyof typeof T_Pivot_Fields];
			return newkey;
		}
		return -1;
	}

	shrink_dict(dict: Dictionary): Dictionary {
		const shrunk: Dictionary = {};
		const keys_to_remove = ['Type', 'Link', 'Description', 'parent 1 link', 'data types import'];
		for (const key in dict) {
			if (!keys_to_remove.includes(key) && dict[key] != k.empty) {
				shrunk[key] = dict[key].removeWhiteSpace();
			}
		}
		return shrunk;
	}

	async cleanup_lost_and_found() {		// not currently in use
		
		const lost_and_found = await h.lost_and_found();
		if (!!lost_and_found) {
			const lost_and_found_ancestry = lost_and_found.ancestry;
			for (const child_zncestry of lost_and_found_ancestry.childAncestries) {
				const grandChildren_count = child_zncestry.childRelationships.length ?? 0;
				const child_relationship = child_zncestry.relationship;
				if (!!child_relationship) {
					const clump_name = grandChildren_count == 0 ? 'leaves' : 'crowds';
					const clump_ancestry = await h.ancestry_persistentCreateUnique(clump_name, lost_and_found_ancestry, T_Thing.generic);
					const idParent = clump_ancestry?.thing?.id;
					if (!!idParent) {
						child_relationship.assign_idParent(idParent);
					}
				}
			}
		}
	}

}

export const pivot = new Pivot();

enum T_Pivot_Fields {
	Title,
	parent_1_link,
	Custom_Tags_$$Local$,
	Societal_Sectors,
	Wheel_of_Co$$$Creation_Sectors,
	Data_Subtypes,
	Main_Data_Type,
	Link,
	data_types_import,
	name,
	All_Local_Tags_$$folder_names$,
	Description,
	Parent_2_tags,
	parent_2_link,
	Parent_3_Tags,
	Parent_3_link,
	Parent_4_Tags,
	Parent_Link_4,
	Parent_5_Tags,
	Parent_Link_5,
	Parent_6_Tags,
	Source_Created_Date,
	Domain,
	Custom_Tags,
	Privacy_Field_of_record,
	Type,
	Ignore_for_Sync,
	Ready_to_Sync,
	Last_Synced,
	User_Curators
}
