import { DB_Common, T_Database } from './DB_Common';
import { DB_Firebase }           from './DB_Firebase';
import { DB_Test }               from './DB_Test';

class S_Databases {
	db: DB_Common = new DB_Test();

	private cache: Record<string, DB_Common> = {};

	// ————————————————————————————————————————— Query string routing

	apply_queryStrings(queryStrings: URLSearchParams): void {
		const type = queryStrings.get('db') ?? T_Database.firebase;
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
}

export const databases = new S_Databases();
