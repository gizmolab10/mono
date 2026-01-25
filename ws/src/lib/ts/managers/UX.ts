import { S_Items, T_Search, S_Alteration, S_Title_Edit } from '../common/Global_Imports';
import { g, h, debug, radial, busy } from '../common/Global_Imports';
import { Tag, Thing, Trait, Ancestry } from '../common/Global_Imports';
import { get, writable, derived, type Readable } from 'svelte/store';
import { details, controls } from '../common/Global_Imports';
import type { S_Recent } from '../types/Types';
import { show } from '../managers/Visibility';
import { search } from '../managers/Search';

export default class S_UX {
	w_si_grabs!			   : Readable<S_Items<Ancestry> | null>;
	w_ancestry_forDetails! : Readable<Ancestry | null>;
	w_ancestry_focus!	   : Readable<Ancestry | null>;
	w_grabs!               : Readable<Ancestry[]>;
	w_grabIndex!           : Readable<number>;

	w_s_title_edit		   = writable<S_Title_Edit | null>(null);
	w_s_alteration		   = writable<S_Alteration | null>();
	w_rubberband_grabs	   = writable<Ancestry[]>([]);  // Live grabs during rubberband (bypasses history)
	w_thing_title		   = writable<string | null>();
	w_relationship_order   = writable<number>(0);
	w_thing_fontFamily	   = writable<string>();

	si_expanded			   = new S_Items<Ancestry>([]); 
	si_recents			   = new S_Items<S_Recent>([]);
	si_found			   = new S_Items<Thing>([]);
	dragDotJustClicked     = false;  // Prevent Widget from double-handling drag dot clicks

	parents_focus!: Ancestry;
	prior_focus!: Ancestry;

	constructor() {
		this.w_ancestry_focus = derived(
			this.si_recents.w_item,
			(item) => item?.focus ?? h?.rootAncestry
		);

		this.w_si_grabs = derived(
			[this.si_recents.w_item],
			([recent]) => {
				return recent?.si_grabs ?? null;
			}
		);

		this.w_grabs = derived(
			[this.si_recents.w_item, this.w_rubberband_grabs],
			([recent, rubberbandGrabs]) => {
				// Rubberband grabs take priority during drag
				if (rubberbandGrabs.length > 0) {
					return rubberbandGrabs;
				}
				return recent?.si_grabs?.items ?? [];
			}
		);

		this.w_grabIndex = derived(
			[this.si_recents.w_item, this.w_rubberband_grabs],
			([recent, rubberbandGrabs]) => {
				// During rubberband, index is last item
				if (rubberbandGrabs.length > 0) {
					return rubberbandGrabs.length - 1;
				}
				return recent?.si_grabs?.index ?? 0;
			}
		);

		this.w_ancestry_forDetails = derived(
			[
				search.w_t_search,
				this.si_found.w_index,
				this.si_found.w_items,
				show.w_show_search_controls,
				this.w_ancestry_focus,
				this.w_grabs,
				this.w_grabIndex
			],
			([t_search, foundIndex, foundItems, showSearchControls, focus, grabs, grabIndex]) => {
				// First priority: search selected ancestry (if search is active)
				const row = foundIndex;
				if (row !== null && showSearchControls && t_search === T_Search.selected) {
					const thing = foundItems[row];
					if (thing?.ancestry) {
						return thing.ancestry;
					}
				}
				// Second priority: current grab
				if (grabs.length > 0) {
					const grab = grabs[grabIndex] as Ancestry | null;
					if (grab) {
						return grab;
					}
				}
				// Third priority: focus
				if (focus) {
					return focus;
				}
				// Fallback: root ancestry
				return h?.rootAncestry;
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
		if (typeof console !== 'undefined' && console.assert) {
			console.assert(
				this.si_recents.length > 0,
				'si_recents should be seeded before setup_subscriptions() is called',
				{ recentsLength: this.si_recents.length }
			);
		}
	}
	
	static readonly _____ANCESTRY: unique symbol;

	get ancestry_forDetails(): Ancestry | null { return get(this.w_ancestry_forDetails) ?? null; }
	
	grab_next_ancestry(next: boolean) {	// for next/previous in details selection banner
		if (get(search.w_t_search) > T_Search.off) {
			this.si_found.find_next_item(next);
		} else {
			// Mutate recent's grabIndex directly (no new history entry)
			const recent = this.si_recents.item;
			if (recent?.si_grabs) {
				recent.si_grabs.find_next_item(next);
				// Force derived stores to re-derive by updating w_items to new array reference
				this.si_recents.w_items.update(items => [...items]);
			}
		}
		details.redraw();
	}
		
	static readonly _____FOCUS: unique symbol;

	recents_go(next: boolean) {
		if (busy.isRendering) return;
		if (this.si_recents.length === 0) return;
		
		busy.isRendering = true;
		
		if (this.si_recents.find_next_item(next)) {
			const recent = this.si_recents.item;
			if (recent) {
				recent.focus?.expand();
				for (const grab of recent.si_grabs.items) {
					grab?.ancestry_assureIsVisible();
				}
				g.w_depth_limit.set(recent.depth);
				g.grand_build();
				details.redraw();
			}
		}
		
		requestAnimationFrame(() => {
			busy.isRendering = false;
		});
	}

	becomeFocus(ancestry: Ancestry): boolean {
		const priorFocus = get(this.w_ancestry_focus);
		const changed = !priorFocus || !ancestry.equals(priorFocus);
		if (changed) {
			const currentGrabs = get(this.w_grabs);
			const currentIndex = get(this.w_grabIndex);
			const si_grabs_clone = new S_Items<Ancestry>([...currentGrabs]);
			si_grabs_clone.index = currentIndex;
			const recent: S_Recent = { focus: ancestry, si_grabs: si_grabs_clone, depth: get(g.w_depth_limit) };
			this.si_recents.push(recent);
			
			x.w_s_alteration.set(null);
			ancestry.expand();
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

	// For rubberband: update live grabs (bypasses history)
	setGrabs_forRubberband(ancestries: Ancestry[]) {
		this.w_rubberband_grabs.set(ancestries);
	}

	assure_grab_isVisible() {
		const ancestry = get(this.w_ancestry_forDetails);
		if (!!ancestry) {
			ancestry.ancestry_assureIsVisible();
			g.grand_build();
			details.redraw();
		}
	}

	grab_none() {
		if (!radial.isDragging) {
			const focus = get(this.w_ancestry_focus) ?? h.rootAncestry;
			const si_grabs_new = new S_Items<Ancestry>([]);
			const recent: S_Recent = { focus, si_grabs: si_grabs_new, depth: get(g.w_depth_limit) };
			this.si_recents.push(recent);
			h?.stop_alteration();
			debug.log_grab('  GRAB NONE');
		}
	}

	grabOnly(ancestry: Ancestry) {
		if (!radial.isDragging) {
			const focus = get(this.w_ancestry_focus) ?? ancestry;
			const si_grabs_new = new S_Items<Ancestry>([ancestry]);
			const recent: S_Recent = { focus, si_grabs: si_grabs_new, depth: get(g.w_depth_limit) };
			this.si_recents.push(recent);
			h?.stop_alteration();
			debug.log_grab(`  GRAB ONLY '${ancestry.title}'`);
		}
	}

	grab(ancestry: Ancestry) {
		if (!radial.isDragging) {
			const currentGrabs = get(this.w_grabs);
			let items = [...(currentGrabs ?? [])];
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
			
			const focus = get(this.w_ancestry_focus) ?? ancestry;
			const si_grabs_new = new S_Items<Ancestry>(items);
			si_grabs_new.index = items.length - 1;
			const recent: S_Recent = { focus, si_grabs: si_grabs_new, depth: get(g.w_depth_limit) };
			this.si_recents.push(recent);
			debug.log_grab(`  GRAB '${ancestry.title}'`);
			h?.stop_alteration();
		}
	}

	ungrab(ancestry: Ancestry) {
		if (!radial.isDragging) {
			const currentGrabs = get(this.w_grabs);
			let grabbed = [...(currentGrabs ?? [])];
			const rootAncestry = h?.rootAncestry;
			this.w_s_title_edit?.set(null);
			// Use equals() instead of reference equality
			const index = grabbed.findIndex(a => a.equals(ancestry));
			if (index != -1) {
				grabbed.splice(index, 1);
			}
			if (grabbed.length == 0) {
				grabbed.push(rootAncestry);
			}
			if (grabbed.length == 0 && controls.inTreeMode) {
				grabbed = [rootAncestry];
			} else {
				h?.stop_alteration();
			}
			
			const focus = get(this.w_ancestry_focus) ?? rootAncestry;
			const si_grabs_new = new S_Items<Ancestry>(grabbed);
			const recent: S_Recent = { focus, si_grabs: si_grabs_new, depth: get(g.w_depth_limit) };
			this.si_recents.push(recent);
			debug.log_grab(`  UNGRAB '${ancestry.title}'`);
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
