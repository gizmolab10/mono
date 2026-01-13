import { k, h, p, x, core, show, Thing, details, Ancestry, databases, features } from "../common/Global_Imports";
import { T_Search, T_Startup, T_Preference, T_Search_Preference } from "../common/Global_Imports";
import { Search_Node } from '../types/Search_Node';
import { get, writable } from 'svelte/store';

class Search {
	use_AND_logic: boolean			= false; // for multi-word searches
	search_words: string[]			= []; // for multi-word searches
	search_text: string | null		= null;
	private root_node: Search_Node	= new Search_Node();
	w_search_results_found			= writable<number>(0);
	w_search_results_changed		= writable<number>(0);		// re-render the search results when changed
	w_t_search						= writable<T_Search>();		// observed by search_results, controls, and panel
	w_t_search_preferences			= writable<T_Search_Preference>();

	constructor() {
		setTimeout(() => {
			this.setup();
			if (!!databases) {
				databases.w_t_database.subscribe((database) => {
					this.setup();
				});
			}
		}, 1);
	}

	setup_defaults() {
		this.w_t_search.set(T_Search.off);
		this.w_t_search_preferences.set(T_Search_Preference.title);
	}

	activate() {
		x.save_grabs();
		show.w_show_search_controls.set(true);
		this.search_for(this.search_text);
	}

	deactivate() {
		x.save_grabs(false);
		this.w_search_results_found.set(0);
		this.w_t_search.set(T_Search.off);
		show.w_show_search_controls.set(false);
		details.redraw();		// force re-render of details
	}

	private setup() {
		if (features && features.allow_search && p) {
			core.w_t_startup.subscribe((startup: T_Startup) => {
				if (startup == T_Startup.ready) {
					this.search_text = p.readDB_key(T_Preference.search_text);
					this.buildIndex(h.things);
					this.w_search_results_changed.set(Date.now());
				}
			});
		}
	}

	get selected_row(): number | null { return x.si_found.index; }

	set selected_row(row: number) {
		x.si_found.index = row;
		this.w_t_search.set(T_Search.selected);
	}

	get selected_ancestry(): Ancestry | null {
		const row = this.selected_row;
		if (row !== null && !!get(show.w_show_search_controls)) {
			const thing = x.si_found.items[row];
			return thing?.ancestry ?? null;
		}
		return null;
	}

	update_search() {
		const text = this.search_text?.toLowerCase()?.trim();
		if (!!text) {
			this.buildIndex(h.things);
			this.update_search_for(text);
		}
	}

	next_row(up: boolean) {
		const row = this.selected_row;
		if (row !== null) {
			const count = x.si_found.items.length;	// stupid, but it works
			this.selected_row = row.increment(up, count);
			// also make sure the row is visible
		}
	}

	deactivate_focus_and_grab() {
		const ancestry = this.selected_ancestry;
		if (!!ancestry) {
			ancestry.becomeFocus();
			ancestry.grab();
		}
		this.deactivate();
	}

	search_for(query: string | null | undefined) {
		this.search_text = query?.toLowerCase()?.trim() ?? null;
		const before = this.results_fingerprint;
		if (!this.search_text || this.search_text.length == 0) {
			this.search_words = [];
			x.si_found.reset();
			this.w_search_results_found.set(0);
			this.w_t_search.set(T_Search.enter);
		} else {
			// Split once here
			this.search_words = this.search_text.split(/\s+/).filter(w => w.length > 0);
			
			// Pass the words array and the intersect flag
			x.si_found.items = this.root_node.search_for(this.search_words, this.use_AND_logic);
			const show_results = x.si_found.items.length > 0;
			this.w_search_results_found.set(x.si_found.items.length);
			this.w_t_search.set(show_results ? T_Search.results : T_Search.enter);
		}
		if (before !== this.results_fingerprint) {
			x.si_found.index = -1;
		}
		this.w_search_results_changed.set(Date.now());
	}
	
	update_search_for(query: string) {
		this.search_text = query;
		if (query.length > 0) {
			const lowercase = query.toLowerCase().trim();
			this.search_words = lowercase.split(/\s+/).filter(w => w.length > 0);
			x.si_found.items = this.root_node.search_for(this.search_words, this.use_AND_logic);
		} else {
			this.search_words = [];
			x.si_found.reset();
		}
	}

	static readonly _____PRIVATE: unique symbol;

	private get results_fingerprint(): string { return !x.si_found.items ? k.empty : x.si_found.items.map((result: Thing) => result.id).join('|'); }

	private buildIndex(things: Array<Thing>) {
		this.root_node = new Search_Node();
		for (const thing of things) {
			const title = thing.title.toLowerCase();
			const words = title.split(' ');
			for (const word of words) {
				// Insert the full word and all its suffixes
				for (let i = 0; i < word.length; i++) {
					const suffix = word.slice(i);
					this.root_node.insert_wordFor(suffix, thing);
				}
			}
		}
	}

}

export const search = new Search();
