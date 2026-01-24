import { k, Thing, databases, T_Trait, h } from '../common/Global_Imports';
import { Persistable, T_Persistable } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';
import Airtable from 'airtable';

export default class Trait extends Persistable {
	t_trait: T_Trait = T_Trait.text;
	ownerID: string = k.empty;
	text: string = k.empty;
	dict: Dictionary = {};	// need this for pivot data import

	constructor(idBase: string, id: string, ownerID: string, t_trait: T_Trait, text: string = k.empty, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.traits, id, already_persisted);
		this.ownerID = ownerID;
		this.t_trait = t_trait;
		this.text = text;
	}

	get owner():	   Thing | null { return h.thing_forHID(this.ownerID.hash()); }
	get fields(): Airtable.FieldSet { return { type: this.t_trait, ownerID: [this.ownerID], text: this.text }; }

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.trait_persistentUpdate(this);
		} else {
			await databases.db_now.trait_remember_persistentCreate(this);
		}
	}
	
	static type_fromSeriously(type: string): T_Trait {
		switch (type) {
			case 'n': return T_Trait.note;
			case 'd': return T_Trait.date;
			case 'h': return T_Trait.link;
			case 'c': return T_Trait.citation;
			case '$': return T_Trait.money;
			case '#': return T_Trait.phone;
		}
		return T_Trait.text;
	}

}
