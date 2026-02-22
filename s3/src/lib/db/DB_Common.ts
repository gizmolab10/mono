import { T_Persistence, T_Startup } from '../common/Enumerations';
import { startup }                  from '../state/startup.svelte';
import { store }                    from '../store/store.svelte';
import { ux }                       from '../state/ux.svelte';
import { rootAncestry }             from '../nav/Ancestry';

export enum T_Database {
	test      = 'test',
	firebase  = 'firebase',
	local     = 'local',
	unknown   = 'unknown',
}

export abstract class DB_Common {
	abstract t_persistence: T_Persistence;
	abstract t_database:    T_Database;
	abstract idBase:        string;

	// ————————————————————————————————————————— Fetch

	abstract fetch_all(): Promise<void>;

	// ————————————————————————————————————————— Persist (stubs for Phase 7+)

	async persistent_create_thing(_id: string):        Promise<void> {}
	async persistent_update_thing(_id: string):        Promise<void> {}
	async persistent_delete_thing(_id: string):        Promise<void> {}
	async persistent_create_relationship(_id: string): Promise<void> {}
	async persistent_update_relationship(_id: string): Promise<void> {}
	async persistent_delete_relationship(_id: string): Promise<void> {}
	async persistent_create_predicate(_id: string):    Promise<void> {}
	async persistent_create_trait(_id: string):        Promise<void> {}
	async persistent_update_trait(_id: string):        Promise<void> {}
	async persistent_delete_trait(_id: string):        Promise<void> {}
	async persistent_create_tag(_id: string):          Promise<void> {}
	async persistent_update_tag(_id: string):          Promise<void> {}
	async persistent_delete_tag(_id: string):          Promise<void> {}

	// ————————————————————————————————————————— Query strings (override in subclasses)

	apply_queryStrings(_queryStrings: URLSearchParams): void {}

	// ————————————————————————————————————————— Startup sequence

	async hierarchy_setup_fetch_andBuild(): Promise<void> {
		startup.t_startup = T_Startup.fetch;
		store.forget_all();
		await this.fetch_all();

		if (store.things.size === 0) {
			startup.t_startup = T_Startup.empty;
		} else {
			ux.becomeFocus(rootAncestry);
			startup.t_startup = T_Startup.ready;
		}
	}
}
