import { DB_Common, T_Database } from './DB_Common';
import { DB_Firebase }           from './DB_Firebase';
import { DB_Test }               from './DB_Test';
import { ux }                    from '../state/ux.svelte';

const DB_STORAGE_KEY = 's3-database';

class S_Databases {
	db = $state<DB_Common>(new DB_Test());

	private cache: Record<string, DB_Common> = {};

	// ————————————————————————————————————————— Hierarchy shorthand

	get hierarchy() { return this.db.hierarchy; }

	// ————————————————————————————————————————— Query string routing

	apply_queryStrings(queryStrings: URLSearchParams): void {
		const saved = localStorage.getItem(DB_STORAGE_KEY);
		const type  = queryStrings.get('db') ?? saved ?? T_Database.firebase;
		this.db = this.db_forType(type);
	}

	// ————————————————————————————————————————— Factory

	db_forType(type: string): DB_Common {
		const cached = this.cache[type];
		if (cached) return cached;

		let db: DB_Common;
		switch (type) {
			case T_Database.firebase: db = new DB_Firebase(); break;
			case T_Database.test:     db = new DB_Test();     break;
			default:                  db = new DB_Test();     break;
		}

		this.cache[type] = db;
		return db;
	}

	// ————————————————————————————————————————— Startup

	async setup(): Promise<void> {
		const queryStrings = new URLSearchParams(window.location.search);
		this.apply_queryStrings(queryStrings);
		this.db.apply_queryStrings(queryStrings);
		await this.db.hierarchy_setup_fetch_andBuild();
	}

	// ————————————————————————————————————————— Switch database

	async change_database(t_database: T_Database): Promise<void> {
		if (this.db.t_database === t_database) return;
		localStorage.setItem(DB_STORAGE_KEY, t_database);
		this.db = this.db_forType(t_database);
		if (this.db.has_fetched) {
			const { rootAncestry } = await import('../nav/Ancestry');
			ux.becomeFocus(rootAncestry);
		} else {
			await this.db.hierarchy_setup_fetch_andBuild();
		}
	}
}

export const databases = new S_Databases();
