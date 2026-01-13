import { S_Items, T_Search, T_Startup, S_Alteration, S_Title_Edit } from '../common/Global_Imports';
import { g, h, core, u, hits, debug, radial } from '../common/Global_Imports';
import { details, controls, databases } from '../common/Global_Imports';
import { Tag, Thing, Trait, Ancestry } from '../common/Global_Imports';
import { get, writable, derived, type Readable } from 'svelte/store';
import Identifiable from '../runtime/Identifiable';
import { show } from '../managers/Visibility';
import { search } from '../managers/Search';

type Identifiable_S_Items_Pair<T = Identifiable, U = S_Items<T>> = [T, U | null];

export default class S_UX {
	w_ancestry_forDetails! : Readable<Ancestry | null>;
	w_ancestry_focus!	   : Readable<Ancestry | null>;

	w_s_title_edit		   = writable<S_Title_Edit | null>(null);
	w_s_alteration		   = writable<S_Alteration | null>();
	w_thing_title		   = writable<string | null>();
	w_relationship_order   = writable<number>(0);
	w_thing_fontFamily	   = writable<string>();

	si_recents			   = new S_Items<Identifiable_S_Items_Pair>([]);
	si_expanded			   = new S_Items<Ancestry>([]);
	si_grabs			   = new S_Items<Ancestry>([]);
	si_found			   = new S_Items<Thing>([]);
	private si_saved_grabs = new S_Items<Ancestry>([]);

	parents_focus!: Ancestry;
	prior_focus!: Ancestry;

	constructor() {
		this.w_ancestry_focus = derived(			// derived store AFTER si_recents is available
			[this.si_recents.w_items, this.si_recents.w_index],
			([items, index]) => {
				if (items.length === 0) {
					return h?.rootAncestry;			// fallback during initialization
				}
				const pair = items[index] as Identifiable_S_Items_Pair | undefined;
				const focus = pair?.[0] as Ancestry | null;
				return focus ?? h?.rootAncestry;
			}
		);
		this.w_ancestry_forDetails = derived(
			[
				search.w_t_search,
				this.si_found.w_index,
				this.si_found.w_items,
				show.w_show_search_controls,
				this.si_grabs.w_items,
				this.si_grabs.w_index,
				this.w_ancestry_focus
			],
			([t_search, foundIndex, foundItems, showSearchControls, grabsItems, grabsIndex, focus]) => {
				const row = foundIndex;				// First priority: search selected ancestry (if search is active)
				if (row !== null && showSearchControls && t_search === T_Search.selected) {
					const thing = foundItems[row];
					if (thing?.ancestry) {
						return thing.ancestry;
					}
				}
				if (grabsItems.length > 0) {		// Second priority: current grab
					const grab = grabsItems[grabsIndex] as Ancestry | null;
					if (grab) {
						return grab;
					}
				}
				if (focus) {						// Third priority: focus
					return focus;
				}
				return h?.rootAncestry;				// Fallback: root ancestry
			}
		);
	}

	//////////////////////////////
	//							//
	//	manage identifiables:	//
	//							//
	//	  grabs					//
	//	  focus					//
	//	  found					//
	//	  recents				//
	//	  expandeds				//
	//							//
	//////////////////////////////

	setup_subscriptions() {
		// Assert that si_recents is seeded before subscriptions are active
		// restore_focus() should have been called first to populate recents
		if (typeof console !== 'undefined' && console.assert) {
			console.assert(
				this.si_recents.length > 0,
				'si_recents should be seeded before setup_subscriptions() is called',
				{ recentsLength: this.si_recents.length }
			);
		}
		this.w_ancestry_focus.subscribe((ancestry: Ancestry | null) => {
			if (ancestry) {
				this.update_grabs_forSearch();
			}
		});
		databases.w_data_updated.subscribe((count: number) => {
			this.update_grabs_forSearch();
		});
		search.w_t_search.subscribe((state: number | null) => {
			this.update_grabs_forSearch();
		});
		this.si_found.w_index.subscribe((row: number | null) => {
			this.update_grabs_forSearch();
		});
		this.update_grabs_forSearch();
	}
	
	static readonly _____ANCESTRY: unique symbol;

	get ancestry_forDetails(): Ancestry | null { return get(this.w_ancestry_forDetails) ?? null; }
	
	grab_next_ancestry(next: boolean) {	// for next/previous in details selection banner
		if (get(search.w_t_search) > T_Search.off) {
			this.si_found.find_next_item(next);
		} else {
			this.si_grabs.find_next_item(next);
		}
		details.redraw();		// force re-render of details
	}
		
	static readonly _____FOCUS: unique symbol;

	ancestry_next_focusOn(next: boolean) {
		if (this.si_recents.find_next_item(next)) {		// w_ancestry_focus is now updated
			const [focus, grabs] = this.si_recents.item as [Ancestry, S_Items<Ancestry> | null];
			focus?.expand();
			if (!!grabs) {
				this.si_grabs = grabs;		// restores index as well as items
				for (const grab of grabs.items) {
					if (!!grab) {
						grab.ancestry_assureIsVisible();
					}
				}
			}
		}
	}

	becomeFocus(ancestry: Ancestry): boolean {
		const priorFocus = get(this.w_ancestry_focus);
		const changed = !priorFocus || !ancestry.equals(priorFocus);
		if (changed) {
			const pair: Identifiable_S_Items_Pair = [ancestry, this.si_grabs];
			this.si_recents.remove_all_beyond_index();
			this.si_recents.push(pair);
			x.w_s_alteration.set(null);
			ancestry.expand();
			hits.recalibrate();
		}
		return changed;
	}

	update_forFocus() {
		let focus = get(this.w_ancestry_focus) ?? h.rootAncestry;
		if (get(g.w_branches_areChildren)) {
			this.parents_focus = focus;
			focus = this.prior_focus;
		} else {
			this.prior_focus = focus;
			const details = this.ancestry_forDetails;
			focus = this.parents_focus ?? (details ?? null);
		}
		focus?.becomeFocus();
	}
	
	static readonly _____GRABS: unique symbol;

	save_grabs(save: boolean = true) {
		if (save) {
			this.si_saved_grabs.items = [...this.si_grabs.items];
			this.si_saved_grabs.index = this.si_grabs.index;
		} else if (this.si_saved_grabs.length > 0) {
			this.si_grabs.items = this.si_saved_grabs.items;
			this.si_grabs.index = this.si_saved_grabs.index;
			this.si_saved_grabs.reset();
		}
	}

	grabOnly(ancestry: Ancestry) {
		if (!radial.isDragging) {
			this.si_grabs.items = [ancestry];
			h?.stop_alteration();
			debug.log_grab(`  GRAB ONLY '${ancestry.title}'`);
		}
	}

	grab(ancestry: Ancestry) {
		if (!radial.isDragging) {
			let items = this.si_grabs.items ?? [];
			if (!!items) {
				const index = items.indexOf(ancestry);
				if (items.length != 0 && (index != -1) && (index != items.length - 1)) {
					items.splice(index, 1);
				}
				items.push(ancestry);
			}
			this.si_grabs.items = items;
			debug.log_grab(`  GRAB '${ancestry.title}'`);
			h?.stop_alteration();
		}
	}

	ungrab(ancestry: Ancestry) {
		if (!radial.isDragging) {
			let grabbed = this.si_grabs.items ?? [];
			const rootAncestry = h?.rootAncestry;
			this.w_s_title_edit?.set(null);
			if (!!grabbed) {
				const index = grabbed.indexOf(ancestry);
				if (index != -1) {				// only splice grabbed when item is found
					grabbed.splice(index, 1);		// 2nd parameter means remove one item only
				}
				if (grabbed.length == 0) {
					grabbed.push(rootAncestry);
				}
			}
			if (grabbed.length == 0 && controls.inTreeMode) {
				grabbed = [rootAncestry];
			} else {
				h?.stop_alteration(); // do not show editingActions for root
			}
			this.si_grabs.items = grabbed;
			debug.log_grab(`  UNGRAB '${ancestry.title}'`);
		}
	}

	update_grabs_forSearch() {
		if (get(core.w_t_startup) == T_Startup.ready && get(search.w_t_search) != T_Search.off && this.si_found.length > 0) {
			let ancestries = this.si_found.items.map((found: Thing) => found.ancestry).filter(a => !!a) ?? [];
			ancestries = u.strip_hidDuplicates(ancestries);
			if (this.si_grabs.descriptionBy_sorted_IDs != u.descriptionBy_sorted_IDs(ancestries)) {
				this.si_grabs.items = ancestries;
			}
		}
	}

	static readonly _____TRAITS: unique symbol;
	
	//////////////////////////////////////////////////////////////////////
	//																	//
	//	traits are managed by Things									//
	//	si_thing_traits is the list of traits for ancestry_forDetails	//
	//	trait is the current trait (independent of ancestry_forDetails)	//
	//																	//
	//////////////////////////////////////////////////////////////////////

	select_next_thingTrait(next: boolean) { this.si_thing_traits.find_next_item(next); }
	get trait(): Trait | null { return h.si_traits.item as Trait | null; }
	get thing_trait(): Trait | null { return this.si_thing_traits?.item as Trait | null; }
	get si_thing_traits(): S_Items<Trait> { return this.ancestry_forDetails?.thing?.si_traits ?? new S_Items<Trait>([]); }
	
	select_next_trait(next: boolean) {
		const si_traits = h.si_traits;
		if (!!si_traits && si_traits.find_next_item(next)) {
			const ancestry = si_traits.item?.owner?.ancestry;
			if (!!ancestry && ancestry.ancestry_assureIsVisible()) {
				g.grand_build();
				details.redraw();
			}
		}
	}
	
	static readonly _____TAGS: unique symbol;

	select_next_thing_tag(next: boolean) { this.si_thing_tags.find_next_item(next); }
	get si_thing_tags(): S_Items<Tag> { return this.ancestry_forDetails?.thing?.si_tags ?? new S_Items<Tag>([]); }

}

export const x = new S_UX();
