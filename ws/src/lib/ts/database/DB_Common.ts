import { Tag, Trait, Thing, Hierarchy, Predicate, Relationship, Persistable } from '../common/Global_Imports';
import { c, h, p, x, busy, core, debug, features, databases } from '../common/Global_Imports';
import { T_Thing, T_Startup, T_Persistable } from '../common/Global_Imports';
import { T_Persistence } from '../common/Enumerations';
import type { Dictionary } from '../types/Types';

export enum T_Database {
	filesystem = 'filesystem',
	firebase   = 'firebase',
	airtable   = 'airtable',
	unknown	   = 'unknown',
	bubble	   = 'bubble',
	dgraph     = 'dgraph',
	local	   = 'local',
	test	   = 'test',
	docs       = 'docs',
}

export enum	DB_Name {
	filesystem = 'Filesystem',
	airtable   = 'Airtable',
	unknown    = 'Unknown',
	firebase   = 'Public',
	bubble     = 'Bubble',
	dgraph     = 'DGraph',
	bulks      = 'Bulks',
	local      = 'Local',
	test       = 'Test',
	docs       = 'Docs',
}

// CRUD API --> for all databases

export default class DB_Common {
	t_persistence = T_Persistence.none;
	t_database = T_Database.unknown;
	idBase = DB_Name.unknown;
	hierarchy!: Hierarchy;
	load_time = 'busy...';
	load_start_time = -1;
	
	setup_remote_handlers() {}
	apply_queryStrings(queryStrings: URLSearchParams) {}
	get displayName(): string { return this.t_database; }
	get details_forStorage(): Object { return ['fetch', this.load_time]; }
	get isStandalone(): boolean { return this.t_database != T_Database.bubble; }
	get isRemote(): boolean { return this.t_persistence == T_Persistence.remote; }
	get isPersistent(): boolean { return this.t_persistence != T_Persistence.none; }
	async hierarchy_fetch_forID(idBase: string) {}	// support for browsing multiple firebase bulks
	
	async fetch_all(): Promise<boolean> { return this.fetch_all_fromLocal(); }
	async remove_all() { this.remove_all_fromLocal(); }

	async thing_becomeFocus(thing: Thing) {}
	async thing_persistentUpdate(thing: Thing) { this.persist_all(); }
	async thing_persistentDelete(thing: Thing) { this.persist_all(); }
	async thing_remember_persistentCreate(thing: Thing) { h.thing_remember(thing); this.persist_all(); }
	
	async predicate_persistentUpdate(predicate: Predicate) { this.persist_all(); }
	async predicate_persistentDelete(predicate: Predicate) { this.persist_all(); }
	async predicate_remember_persistentCreate(predicate: Predicate) { h.predicate_remember(predicate); this.persist_all(); }

	async relationship_persistentUpdate(relationship: Relationship) { this.persist_all(); }
	async relationship_persistentDelete(relationship: Relationship) { this.persist_all(); }
	async relationship_remember_persistentCreate(relationship: Relationship) { h.relationship_remember_ifValid(relationship); this.persist_all(); }

	async trait_persistentUpdate(trait: Trait) { this.persist_all(); }
	async trait_persistentDelete(trait: Trait) { this.persist_all(); }
	async trait_remember_persistentCreate(trait: Trait) { h.trait_remember(trait); this.persist_all(); }

	async tag_persistentUpdate(tag: Tag) { this.persist_all(); }
	async tag_persistentDelete(tag: Tag) { this.persist_all(); }
	async tag_remember_persistentCreate(tag: Tag) { h.tag_remember(tag); this.persist_all(); }
	
	remove_all_fromLocal() {
		if (this.isPersistent) {
			for (const t_persistable of Persistable.t_persistables) {
				p.writeDB_key(t_persistable.toLowerCase(), null);
			}
		}
	}

	async persist_all(force: boolean = false) {
		if (!force && (databases.defer_persistence || !features.allow_autoSave)) {
			busy.signal_data_redraw();
		} else {
			busy.isPersisting = true;
			busy.signal_data_redraw();
			for (const t_persistable of Persistable.t_persistables) {
				await this.persistAll_identifiables_ofType_maybe(t_persistable, force);
			}
			if (this.t_database != T_Database.airtable) {
				busy.isPersisting = false;
				busy.signal_data_redraw();
			} else {
				// kludge to wait for airtable to catch up
				let interval = setInterval(() => {
					if (!h.isDirty) {
						busy.isPersisting = false;
						busy.signal_data_redraw();
						clearInterval(interval);
					}
				}, 100);
			}
		}
	}

	// code common to all persisting actions
	async persistAll_identifiables_ofType_maybe(t_persistable: T_Persistable, force: boolean = false) {
		const identifiables = h.persistables_forKey(t_persistable);
		if (this.isRemote) {				// db firebase and airtable, both are persistent
			for (const identifiable of identifiables) {
				if (identifiable.persistence.isDirty || force) {
					await identifiable.persist();
					identifiable.set_isDirty(false);
				}
			}
		} else if (this.isPersistent) {		// db local only, db test is not persistent
			p.writeDB_key(t_persistable.toLowerCase(), identifiables);
			for (const identifiable of identifiables) {
				identifiable.set_isDirty(false);
			}
		}
	}

	async fetch_all_fromLocal(): Promise<boolean> {
		await busy.temporarily_set_isFetching_while(async () => {
			for (const t_persistable of Persistable.t_persistables) {
				const array = p.readDB_key(t_persistable.toLowerCase()) as Array<Dictionary>;
				if (!!array) {
					for (const dict of array) {
						h.extract_objects_ofType_fromDict(t_persistable, dict);
					}
				} else if (!this.isRemote && this.isStandalone) {			// no such persistable, create empty hierarchy
					switch (t_persistable) {
						case T_Persistable.predicates:
							h.predicate_defaults_remember_runtimeCreate();
							break;
						case T_Persistable.things:
							h.thing_remember_runtimeCreateUnique(this.idBase, Thing.newID(), 'click here to edit this title', 'limegreen', T_Thing.root);
							break;
					}
				}
			}
		});
		return true;
	}

	async hierarchy_setup_fetch_andBuild() {
		this.apply_queryStrings(c.queryStrings);
		if (!h) {
			core.w_hierarchy.set(new Hierarchy(this));
		}
		core.w_t_startup.set(T_Startup.fetch);
		if (!h.hasRoot) {
			await this.hierarchy_create_fastLoad_or_fetch_andBuild();
		} else {
			h.ancestries_assureAll_createUnique();
			h.restore_fromPreferences();
			core.w_t_startup.set(T_Startup.ready);		// so search will refresh its index
			x.setup_subscriptions();
		}
	}
	
	async hierarchy_create_fastLoad_or_fetch_andBuild() {
		if (c.eraseDB > 0) {
			c.eraseDB -= 1;
			await this.remove_all();	// start fresh
		}
		h.forget_all();
		if (debug.fast_load) {
			await this.fetch_all_fromLocal();	// needs to set needs save && adjust ids during save
			if (h.hasRoot) {
				if (!this.isRemote) {
					await h.wrapUp_data_forUX();
				} else {
					this.setup_remote_handlers();
					await this.persist_all();
				}
				return;
			}
		}
		this.load_start_time = new Date().getTime();
		this.load_time = 'busy...';
		if (await this.fetch_all()) {
			await h.wrapUp_data_forUX();
		}
	}
	
	update_load_time() {
		const startTime = this.load_start_time;
		if (startTime != -1) {
			this.load_start_time = -1;
			const duration = (new Date().getTime()) - startTime;
			if (Math.abs(duration) > 100) {
				const adjusted = Math.trunc(duration / 100) / 10;
				const isInteger = adjusted == Math.trunc(adjusted);
				const suffix = (isInteger && (adjusted == 1)) ? '' : 's';
				const places = isInteger ? 0 : 1;
				const time = (duration / 1000).toFixed(places);
				this.load_time = `took ${time} second${suffix}`;
			} else if (h.hasRoot) {
				this.load_time = 'instantaneous';
			} else {
				this.load_time = 'incomplete';
			}
		}
	}

}
