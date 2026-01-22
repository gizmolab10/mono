import { T_Kinship, T_Focus, T_Detail, T_Breadcrumbs, T_Counts_Shown } from '../common/Global_Imports';
import { T_Graph, T_Preference, T_Cluster_Pager, T_Auto_Adjust_Graph } from '../common/Global_Imports';
import { c, g, h, k, u, x, show, debug, radial, Ancestry, databases, S_Items } from '../common/Global_Imports';
import type { S_Recent } from '../state/S_Recent';
import { get } from 'svelte/store';

class Enum_Spec {
	constructor(public enum_type: object | null, public defaultValue: any) {}
}

type Enum_Spec_ByType = { [type: string]: Enum_Spec };
export const def = (key: T_Preference): any => spec_dict_byType[key]?.defaultValue ?? null;

const spec_dict_byType: Enum_Spec_ByType = {
	[T_Preference.auto_adjust]:     new Enum_Spec(T_Auto_Adjust_Graph, null),
	[T_Preference.paging_style]:    new Enum_Spec(T_Cluster_Pager,     T_Cluster_Pager.sliders),
	[T_Preference.breadcrumbs]:     new Enum_Spec(T_Breadcrumbs,       T_Breadcrumbs.selection),
	[T_Preference.show_countsAs]:   new Enum_Spec(T_Counts_Shown,      T_Counts_Shown.numbers),
	[T_Preference.tree]:            new Enum_Spec(T_Kinship,           T_Kinship.children),
	[T_Preference.focus]:           new Enum_Spec(T_Focus,             T_Focus.dynamic),
	[T_Preference.graph]:           new Enum_Spec(T_Graph,             T_Graph.tree),
	[T_Preference.countDots]:       new Enum_Spec(null,                []),
	[T_Preference.show_details]:    new Enum_Spec(null,                false),
	[T_Preference.show_related]:    new Enum_Spec(null,                false),
	[T_Preference.other_databases]: new Enum_Spec(null,                false),
	[T_Preference.thing]:           new Enum_Spec(null,                'default'),
	[T_Preference.font]:            new Enum_Spec(null,                'Times New Roman'),
	[T_Preference.detail_types]:    new Enum_Spec(null,                [T_Detail.actions, T_Detail.data]),
};

export class Preferences {

	get focus_key(): string { return get(g.w_branches_areChildren) ? T_Preference.focus_forChildren : T_Preference.focus_forParents; }
	get expanded_key(): string { return get(g.w_branches_areChildren) ? T_Preference.expanded_children : T_Preference.expanded_parents; }

	apply_queryStrings(queryStrings: URLSearchParams) {
		const paging_style = queryStrings.get('paging_style');
		const levels = queryStrings.get('levels');
		if (!!levels) {
			g.w_depth_limit.set(Number(levels));
		}
		if (!!paging_style) {
			show.w_t_cluster_pager.set(paging_style == 'sliders' ? T_Cluster_Pager.sliders : T_Cluster_Pager.steppers);
		}
		this.restore_preferences();
	}

	static readonly _____READ_WRITE: unique symbol;

	dump() 									 { console.log(localStorage); }
	get_forKey	   (key: string): any | null { return this.parse(localStorage[key]); }
	readDB_key	   (key: string): any | null { const dbKey = this.db_keyFor(key); return !dbKey ? null : this.get_forKey(dbKey); }
	writeDB_key<T> (key: string, value: T)	 { const dbKey = this.db_keyFor(key); if (!!dbKey) { this.write_key(dbKey, value); } }

	write_key<T> (key: string, value: T) {
		const object = u.stringify_object(value as object);
		if (!!object) {
			if (object.length > 3000000) {
				console.warn(`too large for localStorage: ${key} ${object.length} bytes`);
			} else {
				localStorage[key] = object;
			}
		}
	}

	writeDB_keyPairs_forKey<T>(key: string, sub_key: string, value: T): void {	// pair => key, sub_key
		const dbKey = this.db_keyFor(key);
		if (!!dbKey) {
			const sub_keys: string[] = this.get_forKey(dbKey) ?? [];
			const pair = this.keyPair_for(dbKey, sub_key);
			this.write_key(pair, value);			// first store the value by key pair
			if (sub_keys.length == 0 || !sub_keys.includes(sub_key)) {
				sub_keys.push(sub_key);
				this.write_key(dbKey, sub_keys);								// then store they sub key by key
			}
		}
	}

	readDB_keyPairs_forKey(key: string): Array<any> {
		let values: Array<any> = [];
		const dbKey = this.db_keyFor(key);
		if (!!dbKey) {
			const sub_keys: string[] = this.get_forKey(dbKey) ?? [];
			for (const sub_key of sub_keys) {
				const value = this.get_forKey(this.keyPair_for(dbKey, sub_key));
				if (!!value) {												// ignore undefined or null
					values.push(value);
				}
			}
		}
		return values;
	}

	read_key(key: T_Preference): any {
		const spec   = spec_dict_byType[key];
		const stored = this.get_forKey(key);
		if (stored !== null) {
			if (!spec || !spec.enum_type) {
				return stored;
			}
			if (Object.values(spec.enum_type).includes(stored)) {
				return stored;
			}
		}
		const defaultValue = spec?.defaultValue ?? null;
		if (defaultValue !== null) {
			this.write_key(key, defaultValue);
		}
		return defaultValue;
	}
	
	static readonly _____RESTORE: unique symbol;

	restore_paging() { radial.createAll_thing_pages_fromDict(this.readDB_key(T_Preference.paging)); }

	restore_recents() {
		// Read focus and grabs from localStorage, create initial snapshot, push to si_recents
		function ids_forDB(array: Array<Ancestry>): string { return u.ids_forDB(array).join(', '); }
		
		// Read grabs
		let grabs: Ancestry[] = [];
		if (c.eraseDB > 0) {
			c.eraseDB -= 1;
			grabs = !!h.rootAncestry ? [h.rootAncestry] : [];
		} else {
			grabs = this.ancestries_readDB_key(T_Preference.grabbed);
			debug.log_grab(`  READ (${get(databases.w_t_database)}): "${ids_forDB(grabs)}"`);
		}
		
		// Read focus
		let focus = h?.rootAncestry ?? null;
		if (c.eraseDB > 0) {
			c.eraseDB -= 1;
		} else {
			const focusPath = p.readDB_key(this.focus_key) ?? p.readDB_key('focus');
			if (!!focusPath) {
				const focusAncestry = h?.ancestry_remember_createUnique(focusPath) ?? null;
				if (!!focusAncestry) {
					focus = focusAncestry;
				}
			}
		}
		
		// Validate focus
		if (!!focus && !focus.thing) {
			const lastGrabbedAncestry = grabs.length > 0 ? grabs[grabs.length - 1]?.parentAncestry : null;
			if (lastGrabbedAncestry) {
				focus = lastGrabbedAncestry;
			}
		}
		
		// Fallback to root
		if (!focus) {
			focus = h?.rootAncestry ?? null;
		}
		
		// Create and push initial snapshot
		if (!!focus) {
			const si_grabs = new S_Items<Ancestry>([...grabs]);
			si_grabs.index = grabs.length > 0 ? grabs.length - 1 : 0;
			const snapshot: S_Recent = { focus, si_grabs, depth: get(g.w_depth_limit) };
			x.si_recents.push(snapshot);
			focus.expand();
		}
		
		// Set up persistence subscriptions
		setTimeout(() => {
			x.w_grabs.subscribe((array: Array<Ancestry>) => {
				if (array.length > 0) {
					this.ancestries_writeDB_key(array, T_Preference.grabbed);
					debug.log_grab(`  WRITING (${get(databases.w_t_database)}): "${ids_forDB(array)}"`);
				}
			});
		}, 100);
		
		x.w_ancestry_focus.subscribe((ancestry: Ancestry | null) => {
			p.writeDB_key(this.focus_key, !ancestry ? null : ancestry.pathString);
		});
	}
		
	restore_expanded() {
		if (c.eraseDB > 0) {
			c.eraseDB -= 1;
			x.si_expanded.reset();
		} else {
			const expanded = p.ancestries_readDB_key(this.expanded_key) ?? p.ancestries_readDB_key('expanded');	// backwards compatible with 'expanded' key
			debug.log_expand(`  READ (${get(databases.w_t_database)}): "${u.ids_forDB(expanded)}"`);
			x.si_expanded.items = expanded;
		}
		setTimeout(() => {
			x.si_expanded.w_items.subscribe((array: Array<Ancestry> | null) => {
				if (!!array && array.length > 0) {
					debug.log_expand(`  WRITING (${get(databases.w_t_database)}): "${u.ids_forDB(array)}"`);
					p.ancestries_writeDB_key(array, this.expanded_key);
				}
			});
		}, 100);
	}

	restore_preferences() {
		show.w_t_auto_adjust_graph.set(this.read_key(T_Preference.auto_adjust));
		show.w_t_cluster_pager    .set(this.read_key(T_Preference.paging_style));
		show.w_t_breadcrumbs      .set(this.read_key(T_Preference.breadcrumbs));
		show.w_show_countsAs      .set(this.read_key(T_Preference.show_countsAs));
		x.w_thing_title           .set(this.read_key(T_Preference.thing));
		x.w_thing_fontFamily      .set(this.read_key(T_Preference.font));
		this.reactivity_subscribe()
	}
	
	static readonly _____ANCESTRIES: unique symbol;

	ancestries_writeDB_key(ancestries: Array<Ancestry>, key: string) {	// 2 keys use this {grabbed, expanded}
		const pathStrings = ancestries.map(a => a?.pathString ?? k.empty);			// array of pathStrings (of Relationship ids)
		this.writeDB_key(key, ancestries.length == 0 ? null : pathStrings);
	}

	ancestries_readDB_key(key: string): Array<Ancestry> {				// 2 keys use this {grabbed, expanded}
		const pathStrings = this.readDB_key(key);
		const length = pathStrings?.length ?? 0;
		let ancestries: Array<Ancestry> = [];
		if (length > 0) {
			for (const pathString of pathStrings) {
				const ancestry = h?.ancestry_isAssured_valid_forPath(pathString);
				if (!!ancestry) {
					ancestries.push(ancestry);
				}
			};
		}
		debug.log_preferences(`  ${key.toUpperCase()} ${ancestries.map(a => a.id)}`);
		return ancestries;
	}
	
	static readonly _____PRIMITIVES: unique symbol;

	db_keyFor	(key: string):			 string | null { const type = databases.db_now?.t_database; return !type ? null : this.keyPair_for(type, key); }
	keyPair_for	(key: string, sub_key: string):	string { return `${key}${k.separator.generic}${sub_key}`; }

	parse(key: string | null | undefined): any | null {
		if (!key || key == 'undefined') {
			return null;
		}		
		return JSON.parse(key);
	}

	preferences_reset() {
		const keys = Object.keys(T_Preference)
			.filter(key => isNaN(Number(key))) // Exclude numeric keys
			.map(key => T_Preference[key as keyof typeof T_Preference]);
		for (const key of keys) {
			if (key != 'local') {
				this.write_key(key, null);
			}
		}
	}
	
	static readonly _____SUBSCRIBE: unique symbol;

	reactivity_subscribe() {

		// VISIBILITY

		show.w_t_trees.subscribe((value) => {
			this.write_key(T_Preference.tree, value);
		});
		show.w_t_countDots.subscribe((value) => {
			this.write_key(T_Preference.countDots, value);
		});
		show.w_t_details.subscribe((value) => {
			this.write_key(T_Preference.detail_types, value);
		});
		show.w_t_cluster_pager.subscribe((paging_style: T_Cluster_Pager) => {
			this.write_key(T_Preference.paging_style, paging_style);
		});
		show.w_t_auto_adjust_graph.subscribe((auto_adjust: T_Auto_Adjust_Graph | null) => {
			this.write_key(T_Preference.auto_adjust, auto_adjust);
		});
		show.w_t_breadcrumbs.subscribe((breadcrumbs: T_Breadcrumbs) => {
			this.write_key(T_Preference.breadcrumbs, breadcrumbs);
		});
		show.w_show_countsAs.subscribe((counts_shown: T_Counts_Shown) => {
			this.write_key(T_Preference.show_countsAs, counts_shown);
		});
		
		// OTHER

		g.w_depth_limit.subscribe((depth: number) => {
			this.write_key(T_Preference.levels, depth);
		});

		show.reactivity_subscribe();
	}

}

export const p = new Preferences();
