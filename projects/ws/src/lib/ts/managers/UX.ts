import { S_Items, T_Search, T_Startup, S_Alteration, S_Title_Edit } from '../common/Global_Imports';
import type { S_Recent } from '../state/S_Recent';
import { g, h, core, u, hits, debug, radial, busy } from '../common/Global_Imports';
import { details, controls, databases, features } from '../common/Global_Imports';
import { Tag, Thing, Trait, Ancestry } from '../common/Global_Imports';
import { get, writable, derived, type Readable } from 'svelte/store';
import Identifiable from '../runtime/Identifiable';
import { show } from '../managers/Visibility';
import { search } from '../managers/Search';

type Identifiable_S_Items_Pair<T = Identifiable, U = S_Items<T>> = [T, U | null];

export default class S_UX {
	w_ancestry_forDetails! : Readable<Ancestry | null>;
	w_ancestry_focus!	   : Readable<Ancestry | null>;

	// New recents system (Phase 1)
	w_focus_new!           : Readable<Ancestry | null>;
	w_grabs_new!           : Readable<Ancestry[]>;
	w_depth_new!           : Readable<number>;
	si_recents_new         = new S_Items<S_Recent>([]);

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
	dragDotJustClicked     = false;  // Prevent Widget from double-handling drag dot clicks

	parents_focus!: Ancestry;
	prior_focus!: Ancestry;

	constructor() {
		this.w_ancestry_focus = derived(
			[this.si_recents.w_items, this.si_recents.w_index, this.si_recents_new.w_item],
			([items, index, newItem]) => {
				// Phase 4: use new system when flag is on
				if (features.use_new_recents && newItem?.focus) {
					return newItem.focus;
				}
				// Old system fallback
				if (items.length === 0) {
					return h?.rootAncestry;
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

		// New recents system derived stores (Phase 1)
		this.w_focus_new = derived(
			this.si_recents_new.w_item,
			(item) => item?.focus ?? null
		);
		this.w_grabs_new = derived(
			this.si_recents_new.w_item,
			(item) => item?.si_grabs?.items ?? []
		);
		this.w_depth_new = derived(
			this.si_recents_new.w_item,
			(item) => item?.depth ?? 0
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

		// Reactive snapshot: when state differs from current snapshot, push new one
		if (features.use_new_recents) {
			// Sync si_grabs FROM snapshot when it changes
			this.si_recents_new.w_item.subscribe((snapshot: S_Recent | null) => {
				if (snapshot) {
					const currentGrabIds = this.si_grabs.items.map(a => a.id).join(',');
					const snapshotGrabIds = snapshot.si_grabs.items.map(a => a.id).join(',');
					if (currentGrabIds !== snapshotGrabIds) {
						console.log(`[RECENTS] sync grabs from snapshot: [${snapshot.si_grabs.items.map(a => a.title).join(', ')}]`);
						this.si_grabs.items = [...snapshot.si_grabs.items];
						this.si_grabs.index = snapshot.si_grabs.index;
					}
				}
			});
		}
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

	// Phase 3: navigate new recents system
	recents_go(next: boolean) {
		if (busy.isRendering) return;  // Skip if still rendering previous navigation
		if (this.si_recents_new.length === 0) return;
		
		busy.isRendering = true;
		console.log(`[RECENTS] recents_go(${next}), length=${this.si_recents_new.length}`);
		
		if (this.si_recents_new.find_next_item(next)) {
			const snapshot = this.si_recents_new.item;
			console.log(`[RECENTS] navigated to snapshot:`, snapshot?.focus?.title, snapshot?.si_grabs?.items?.map(a => a.title));
			if (snapshot) {
				// Grabs sync automatically via w_item subscription
				// Focus comes from w_ancestry_focus (derived from si_recents_new.item)
				
				// Just expand and ensure visible
				snapshot.focus?.expand();
				for (const grab of snapshot.si_grabs.items) {
					grab?.ancestry_assureIsVisible();
				}
				
				// Apply depth
				g.w_depth_limit.set(snapshot.depth);
				
				g.grand_build();
				details.redraw();
			}
		}
		
		// Allow next navigation after paint
		requestAnimationFrame(() => {
			busy.isRendering = false;
		});
	}

	becomeFocus(ancestry: Ancestry): boolean {
		const priorFocus = get(this.w_ancestry_focus);
		const changed = !priorFocus || !ancestry.equals(priorFocus);
		if (changed) {
			const pair: Identifiable_S_Items_Pair = [ancestry, this.si_grabs];
			this.si_recents.remove_all_beyond_index();
			this.si_recents.push(pair);
			
			if (features.use_new_recents) {
				// Create snapshot with new focus and push
				const si_grabs_clone = new S_Items<Ancestry>([...this.si_grabs.items]);
				si_grabs_clone.index = this.si_grabs.index;
				const snapshot: S_Recent = { focus: ancestry, si_grabs: si_grabs_clone, depth: get(g.w_depth_limit) };
				console.log(`[RECENTS] becomeFocus push: focus=${ancestry.title}, grabs=[${this.si_grabs.items.map(a => a.title).join(', ')}]`);
				this.si_recents_new.push(snapshot);
			}
			
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

	assure_grab_isVisible() {
		const ancestry = get(this.w_ancestry_forDetails);
		if (!!ancestry) {
			ancestry.ancestry_assureIsVisible();
			g.grand_build();
			details.redraw();
		}
	}

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
			if (features.use_new_recents) {
				// Create snapshot with new grabs and push - sync subscription updates si_grabs
				const focus = get(this.w_ancestry_focus) ?? ancestry;
				const si_grabs_new = new S_Items<Ancestry>([ancestry]);
				const snapshot: S_Recent = { focus, si_grabs: si_grabs_new, depth: get(g.w_depth_limit) };
				console.log(`[RECENTS] grabOnly push: focus=${focus.title}, grabs=[${ancestry.title}]`);
				this.si_recents_new.push(snapshot);
			} else {
				this.si_grabs.items = [ancestry];
			}
			h?.stop_alteration();
			debug.log_grab(`  GRAB ONLY '${ancestry.title}'`);
		}
	}

	grab(ancestry: Ancestry) {
		if (!radial.isDragging) {
			let items = [...(this.si_grabs.items ?? [])];
			// Use equals() instead of reference equality
			const index = items.findIndex(a => a.equals(ancestry));
			if (items.length != 0 && (index != -1) && (index != items.length - 1)) {
				items.splice(index, 1);
			}
			// Only push if not already at end
			const lastIndex = items.findIndex(a => a.equals(ancestry));
			if (lastIndex === -1) {
				items.push(ancestry);
			}
			
			if (features.use_new_recents) {
				// Create snapshot with new grabs and push - sync subscription updates si_grabs
				const focus = get(this.w_ancestry_focus) ?? ancestry;
				const si_grabs_new = new S_Items<Ancestry>(items);
				const snapshot: S_Recent = { focus, si_grabs: si_grabs_new, depth: get(g.w_depth_limit) };
				console.log(`[RECENTS] grab push: focus=${focus.title}, grabs=[${items.map(a => a.title).join(', ')}]`);
				this.si_recents_new.push(snapshot);
			} else {
				this.si_grabs.items = items;
			}
			debug.log_grab(`  GRAB '${ancestry.title}'`);
			h?.stop_alteration();
		}
	}

	ungrab(ancestry: Ancestry) {
		if (!radial.isDragging) {
			let grabbed = [...(this.si_grabs.items ?? [])];
			const rootAncestry = h?.rootAncestry;
			this.w_s_title_edit?.set(null);
			// Use equals() instead of reference equality
			const index = grabbed.findIndex(a => a.equals(ancestry));
			if (index != -1) {				// only splice grabbed when item is found
				grabbed.splice(index, 1);		// 2nd parameter means remove one item only
			}
			if (grabbed.length == 0) {
				grabbed.push(rootAncestry);
			}
			if (grabbed.length == 0 && controls.inTreeMode) {
				grabbed = [rootAncestry];
			} else {
				h?.stop_alteration(); // do not show editingActions for root
			}
			
			if (features.use_new_recents) {
				// Create snapshot with new grabs and push - sync subscription updates si_grabs
				const focus = get(this.w_ancestry_focus) ?? rootAncestry;
				const si_grabs_new = new S_Items<Ancestry>(grabbed);
				const snapshot: S_Recent = { focus, si_grabs: si_grabs_new, depth: get(g.w_depth_limit) };
				console.log(`[RECENTS] ungrab push: focus=${focus.title}, grabs=[${grabbed.map(a => a.title).join(', ')}]`);
				this.si_recents_new.push(snapshot);
			} else {
				this.si_grabs.items = grabbed;
			}
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
