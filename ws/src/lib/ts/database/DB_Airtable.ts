import { T_Thing, T_Trait, T_Debug, T_Create, T_Predicate, busy } from '../common/Global_Imports';
import { h, k, u, Thing, Trait, Relationship } from '../common/Global_Imports';
import { T_Persistable } from '../common/Global_Imports';
import { T_Persistence } from '../common/Enumerations';
import { DB_Name, T_Database } from './DB_Common';
import DB_Common from './DB_Common';
import Airtable from 'airtable';

//////////////////////////////
//							//
//		users				//
//		things				//
//		access				//
//		predicates			//
//		relationships		//
//							//
//////////////////////////////

export default class DB_Airtable extends DB_Common {
	personalAccessToken = 'patGTiWbebGZTw0fh.dd17a194aea98f9e4e918d333babde7bcd39903b4179b139ac8866a5f3cfe5b6';
	tryPersonalAccessToken = 'patHLy6SzBPcbjtCM.c032a929620e4c2906a59bec5c6aa955c1cac78875ca8f5d5398ae1ee058ebc8';
	basePivot = new Airtable({ apiKey: this.personalAccessToken }).base('appopcsTBwET2o3RU');
	baseCatalist = new Airtable({ apiKey: this.personalAccessToken }).base('apphGUCbYIEJLvRrR');
	basePublic = new Airtable({ apiKey: this.personalAccessToken }).base('appq1IjzmiRdlZi3H');
	baseWendy = new Airtable({ apiKey: this.personalAccessToken }).base('appuDpzaPN3at9jRL');
	base = this.basePublic;
	relationships_table = this.base(T_Persistable.relationships);
	predicates_table = this.base(T_Persistable.predicates);
	things_table = this.base(T_Persistable.things);
	traits_table = this.base(T_Persistable.traits);
	access_table = this.base(T_Persistable.access);
	users_table = this.base(T_Persistable.users);
	t_persistence = T_Persistence.remote;
	t_database = T_Database.airtable;
	idBase = DB_Name.airtable;

	relationships_errorMessage = 'Error in Relationships:';
	async hierarchy_fetch_forID(idBase: string) {}
	things_errorMessage = 'Error in Things:';
	traits_errorMessage = 'Error in Traits:';

	// async remove_all() {}	// only remove json from localStorage

	async fetch_all(): Promise<boolean> {
		await busy.temporarily_set_isFetching_while(async () => {
			await this.things_fetch_all();
			await this.traits_fetch_all();
			await this.predicates_fetch_all();
			await this.relationships_fetch_all();
			await this.access_fetch_all();
			await this.users_fetch_all();
		});
		return true;
	}

	apply_queryStrings(queryStrings: URLSearchParams) {
		const string = queryStrings.get('name') ?? queryStrings.get('dbid');
		if (!!string) {
			const names = string.split(k.comma);
			if (names.length > 1) {
				const tableID = names[0]
				this.personalAccessToken = names[1];
				this.base = new Airtable({ apiKey: this.personalAccessToken }).base(tableID);
				this.relationships_table = this.base(T_Persistable.relationships);
				this.predicates_table = this.base(T_Persistable.predicates);
				this.things_table = this.base(T_Persistable.things);
				this.access_table = this.base(T_Persistable.access);
				this.users_table = this.base(T_Persistable.users);
			}
		}
	}

	//////////////////////////////
	//			THINGS			//
	//////////////////////////////

	async things_fetch_all() {
		h.things_forget_all(); // clear

		try {
			const select = this.things_table.select();
			const remoteThings = await select.all()
			for (const remoteThing of [...remoteThings]) {
				const id = remoteThing.id;
				const fields = remoteThing.fields;
				h.thing_remember_runtimeCreate(DB_Name.airtable, id, fields.title as string, fields.color as string, (fields.type as T_Thing) ?? fields.trait as string, true, !fields.type);
			}
		} catch (error) {
			alert(this.things_errorMessage + ' (things_fetch_all) ' + error);
		}
	}

	static readonly _____THING: unique symbol;
	
	async thing_remember_persistentCreate(thing: Thing) {
		try {
			const dict = await this.things_table.create(thing.fields);
			thing.persistence.already_persisted = true;		// was saved by create (the line above)
			thing.persistence.awaiting_remoteCreation = false;
			h.thing_remember_updateID_to(thing, dict['id']);
		} catch (error) {
			thing.log(T_Debug.remote, this.things_errorMessage + error);
		}
	}

	async thing_persistentUpdate(thing: Thing) {
		try {
			await this.things_table.update(thing.id, thing.fields);
		} catch (error) {
			thing.log(T_Debug.remote, this.things_errorMessage + error);
		}
	}

	async thing_persistentDelete(thing: Thing) {
		try {
			await this.things_table.destroy(thing.id);
		} catch (error) {
			thing.log(T_Debug.remote, this.things_errorMessage + error);
		}
	}

	static readonly _____TRAIT: unique symbol;

	//////////////////////////////
	//			TRAITS			//
	//////////////////////////////

	async traits_fetch_all() {
		h.traits_forget_all();
		try {
			const records = await this.traits_table.select().all()

			for (const record of [...records]) {
				const id = record.id as string;
				const text = record.fields.text as string;
				const type = record.fields.type as T_Trait;
				const ownerIDs = record.fields.ownerID as (string[]);
				h.trait_remember_runtimeCreateUnique(DB_Name.airtable, id, ownerIDs[0], type, text, true);
			}
		} catch (error) {
			alert(this.traits_errorMessage + error);
		}
	}

	async trait_persistentUpdate(trait: Trait) {
		try {
			await this.traits_table.update(trait.id, trait.fields);
		} catch (error) {
			trait.log(T_Debug.remote, this.traits_errorMessage + error);
		}
	}

	async trait_persistentDelete(trait: Trait) {
		try {
			await this.traits_table.destroy(trait.id);
		} catch (error) {
			trait.log(T_Debug.remote, this.traits_errorMessage + error);
		}
	}

	async trait_remember_persistentCreate(trait: Trait) {
		try {
			const fields = await this.traits_table.create(trait.fields);
			const id = fields['id'];	//	// need for update, delete and traits_byHID (to get parent from relationship)
			trait.setID(id);
			trait.persistence.already_persisted = true;
			h.trait_remember(trait);
		} catch (error) {
			trait.log(T_Debug.remote, this.traits_errorMessage + error);
		}
	}

	static readonly _____RELATIONSHIPS: unique symbol;

	async relationships_fetch_all() {
		h.relationships_forget_all();
		try {
			const records = await this.relationships_table.select().all()

			for (const record of [...records]) {
				const id = record.id as string;
				const order = record.fields.order as number;
				const parents = record.fields.parent as (string[]);
				const children = record.fields.child as (string[]);
				const kind = record.fields.kindPredicate as T_Predicate;
				h.relationship_remember_runtimeCreateUnique(DB_Name.airtable, id, kind, parents[0], children[0], [order, 0], T_Create.isFromPersistent);
			}
		} catch (error) {
			alert(this.relationships_errorMessage + error);
		}
	}

	static readonly _____RELATIONSHIP: unique symbol;

	async relationship_remember_persistentCreate(relationship: Relationship) {
		if (!!relationship && !relationship.persistence.already_persisted) {
			try {
				const fields = await this.relationships_table.create(relationship.fields);	// insert with temporary id
				const id = fields['id'];																										// grab permanent id
				relationship.setID(id);
				relationship.persistence.already_persisted = true;
				h.relationships_refreshKnowns();
			} catch (error) {
				relationship.log(T_Debug.remote, this.relationships_errorMessage + error);
			}
		}
	}

	async relationship_persistentUpdate(relationship: Relationship) {
		this.relationships_table.update(relationship.id, relationship.fields);
	}

	async relationship_persistentDelete(relationship: Relationship) {
		try {
			h.relationships = u.strip_invalid_Identifiables(h.relationships) as Array<Relationship>;
			h.relationships_refreshKnowns(); // do first so UX updates quickly
			await this.relationships_table.destroy(relationship.id);
		} catch (error) {
			relationship.log(T_Debug.remote, this.relationships_errorMessage + error);
		}
	}

	static readonly _____ANCILLARY: unique symbol;

	async predicates_fetch_all() {
		try {
			const records = await this.predicates_table.select().all()

			for (const record of [...records]) {
				const fields = record.fields;
				const id = record.id as string; // do not yet need this
				const kind = fields.kind as T_Predicate;
				const isBidirectional = fields.isBidirectional as boolean ?? false;
				h.predicate_remember_runtimeCreate(id, kind, isBidirectional);
			}

		} catch (error) {
			alert('Error in Predicates:' + error);
		}
	}

	async access_fetch_all() {
		try {
			const records = await this.access_table.select().all()
			for (const record of [...records]) {
				const id = record.id as string; // do not yet need this
				const kind = record.fields.kind as string;
				h.access_runtimeCreate(id, kind);
			}

		} catch (error) {
			alert('Error in Access:' + error);
		}
	}

	async users_fetch_all() {
		try {
			const records = await this.users_table.select().all()

			for (const record of [...records]) {
				const id = record.id as string; // do not yet need this
				h.user_runtimeCreate(id, record.fields.name as string, record.fields.email as string, record.fields.phone as string);
			}

		} catch (error) {
			alert('Error in Users:' + error);
		}
	}

}
