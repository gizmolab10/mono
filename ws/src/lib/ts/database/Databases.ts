import { k, p, core, busy, Hierarchy, T_Preference } from '../common/Global_Imports';
import { T_Persistence } from '../common/Enumerations';
import { T_Database } from '../database/DB_Common';
import type { Dictionary } from '../types/Types';
import DB_Common from '../database/DB_Common';
import { writable } from 'svelte/store';
import DB_Firebase from './DB_Firebase';
import DB_Airtable from './DB_Airtable';
import DB_Bubble from './DB_Bubble';
import DB_Local from './DB_Local';
import DB_Test from './DB_Test';
import DB_Docs from './DB_Docs';
import DB_Filesystem from './DB_Filesystem';
// import DB_DGraph from './DB_DGraph';

// each db has its own hierarchy
// when switching to another db
// w_hierarchy is set to its hierarchy

export default class Databases {
	private dbCache: Dictionary<DB_Common> = {};
	w_data_updated = writable<number>();
	w_t_database   = writable<string>();
	defer_persistence: boolean = false;
	db_now: DB_Common;

	apply_queryStrings(queryStrings: URLSearchParams) {
		let type = queryStrings.get('db');
		if (!!type) {
			this.db_now = this.db_forType(type);
		} else {
			type = p.read_key(T_Preference.db) ?? T_Database.firebase;
			if (type == 'firebase') { type = T_Database.firebase; }
			if (type == 'file') { type = T_Database.local; }
		}
		this.w_t_database.set(type!);
	}

	constructor() {
		let done = false;
		this.db_now = this.db_forType(T_Database.firebase);
		this.w_t_database.subscribe((type: string) => {
			if (!!type && (!done || (type && this.db_now.t_database != type))) {
				done = true;
				setTimeout( async () => {	// wait for hierarchy to be created
					await this.grand_change_database(type);
				}, 10);
			}
		});
	}

	async grand_change_database(type: string) {
		const db = this.db_forType(type);
		if (!!db) {
			this.db_now = db;
			let h = db.hierarchy;
			if (!h) {
				h = new Hierarchy(db);
				db.hierarchy = h;
			}
			p.write_key(T_Preference.db, type);
			core.w_hierarchy.set(h);
			this.w_t_database.set(type);
			await db.hierarchy_setup_fetch_andBuild();
			busy.signal_data_redraw();
		}
	}

	db_change_toNext(forward: boolean) { this.w_t_database.set(this.db_next_get(forward)); }
	isRemote(t_persistence: T_Persistence): boolean { return t_persistence == T_Persistence.remote; }
	isPersistent(t_persistence: T_Persistence): boolean { return t_persistence != T_Persistence.none; }

	db_next_get(forward: boolean): T_Database {
		switch (this.db_now.t_database) {
			case T_Database.local:      return forward ? T_Database.firebase   : T_Database.filesystem;
			case T_Database.firebase:   return forward ? T_Database.airtable   : T_Database.local;
			case T_Database.airtable:   return forward ? T_Database.dgraph     : T_Database.firebase;
			case T_Database.dgraph:     return forward ? T_Database.test       : T_Database.airtable;
			case T_Database.test:       return forward ? T_Database.docs       : T_Database.dgraph;
			case T_Database.docs:       return forward ? T_Database.filesystem : T_Database.test;
			case T_Database.filesystem: return forward ? T_Database.local      : T_Database.docs;
			default:                    return forward ? T_Database.local      : T_Database.test;
		}
	}

	db_forType(t_database: string): DB_Common {
		if (!this.dbCache[t_database]) {
			switch (t_database) {
				case T_Database.firebase: this.dbCache[t_database] = new DB_Firebase(); break;
				case T_Database.airtable: this.dbCache[t_database] = new DB_Airtable(); break;
				case T_Database.bubble:   this.dbCache[t_database] = new DB_Bubble(); break;
				case T_Database.local:    this.dbCache[t_database] = new DB_Local(); break;
				case T_Database.test:     this.dbCache[t_database] = new DB_Test(); break;
				case T_Database.docs:       this.dbCache[t_database] = new DB_Docs(); break;
				case T_Database.filesystem: this.dbCache[t_database] = new DB_Filesystem(); break;
				// default:   this.dbCache[t_database] = new DB_DGraph(); break;
			}
		}
		return this.dbCache[t_database];
	}

	get startupExplanation(): string {
		const type = this.db_now.t_database;
		let from = k.empty;
		switch (type) {
			case T_Database.firebase: from = `, from ${this.db_now.idBase}`; break;
			case T_Database.test:	  return k.empty;
		}
		return `(loading your ${type} data${from})`;
	}

}

export const databases = new Databases();
