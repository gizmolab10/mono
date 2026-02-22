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

	private persistTimer: ReturnType<typeof setTimeout> | null = null;

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

	// ————————————————————————————————————————— Persist all dirty entities

	schedule_persist(): void {
		if (this.persistTimer) clearTimeout(this.persistTimer);
		this.persistTimer = setTimeout(() => {
			this.persist_all();
			this.persistTimer = null;
		}, 800);
	}

	async persist_all(): Promise<void> {
		for (const t of store.things.values()) {
			if (!t.persistence.isDirty) continue;
			await (t.already_persisted ? this.persistent_update_thing(t.id) : this.persistent_create_thing(t.id));
			t.set_isDirty(false);
		}
		for (const r of store.relationships.values()) {
			if (!r.persistence.isDirty) continue;
			await (r.already_persisted ? this.persistent_update_relationship(r.id) : this.persistent_create_relationship(r.id));
			r.set_isDirty(false);
		}
		for (const p of store.predicates.values()) {
			if (!p.persistence.isDirty) continue;
			await this.persistent_create_predicate(p.id);
			p.set_isDirty(false);
		}
		for (const t of store.traits.values()) {
			if (!t.persistence.isDirty) continue;
			await (t.already_persisted ? this.persistent_update_trait(t.id) : this.persistent_create_trait(t.id));
			t.set_isDirty(false);
		}
		for (const g of store.tags.values()) {
			if (!g.persistence.isDirty) continue;
			await (g.already_persisted ? this.persistent_update_tag(g.id) : this.persistent_create_tag(g.id));
			g.set_isDirty(false);
		}
	}

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
			await this.persist_all();
			ux.becomeFocus(rootAncestry);
			startup.t_startup = T_Startup.ready;
		}
	}
}
