import { T_Direction } from '../common/Enumerations';
import Identifiable from '../runtime/Identifiable';
import { get, writable, derived, type Readable } from 'svelte/store';
import '../common/Extensions';

export default class S_Items<T> {
	static dummy =	 new S_Items<any>([]);	// for testing

	w_items =		 writable<Array<T>>([]);
	w_index =		 writable<number>(0);

	w_extra_titles!: Readable<string[]>;
    w_item!:		 Readable<T | null>;
	w_description!:	 Readable<string>;
	w_length!:		 Readable<number>;

	//////////////////////////////////////////////
	//											//
	//	manage a list of items, ...				//
	//	  get, set, reset, push, length			//
	//											//
	//	track the current item, ...				//
	//	  get, index (get & set), next			//
	//											//
	//	reactive stores (via x core)...			//
	//	  s elements, details, breadcrumbs,		//
	//	  results (25 files)					//
	//											//
	//	 const { w_item: grab } = x.si_grabs;	//
	//					 ^^^^					//
	//			 reactive store ($grab)			//
	//											//
	//////////////////////////////////////////////
	
	constructor(items: Array<T>) {
		this.setup();
		this.items = items;
	}

	private setup() {
		// Initialize w_length as a derived store from w_items
		this.w_length = derived(
			this.w_items,
			(items) => items.length
		);
		// Initialize w_extra_titles as a derived store from w_length
		this.w_extra_titles = derived(
			this.w_length,
			(length) => (length < 2) ? [] : [T_Direction.previous, T_Direction.next]
		);
		// Initialize w_item as a derived store AFTER w_items and w_index are available
		this.w_item = derived(
			[this.w_items, this.w_index],
			([items, index]) => items[index] ?? null
		);
		// Initialize w_description as a derived store from w_items and w_index
		this.w_description = derived(
			[this.w_items, this.w_index],
			([items, index]) => {
				const item = items[index] ?? null;
				const identifiable = item as unknown as Identifiable ?? null;
				const descriptionBy_sorted_IDs = items.map(item => (item as unknown as Identifiable)?.id ?? '').sort().join('|');
				return `id (@ ${index}): ${identifiable?.id ?? ''}   ids (${items.length}): ${descriptionBy_sorted_IDs}`;
			}
		);
		// Then can set items (which will trigger these derived stores to update)
	}

    set index(i: number) { this.w_index.set(i); }
	get index(): number { return get(this.w_index); }
	get item(): T | null { return get(this.w_item); }
	get length(): number { return get(this.w_length); }
	get items(): Array<T> { return get(this.w_items); }
	get identifiable(): Identifiable | null { return this.item as unknown as Identifiable ?? null; }
	get descriptionBy_sorted_IDs(): string { return this.items.map(item => (item as unknown as Identifiable)?.id ?? '').sort().join('|'); }
	
	set items(items: Array<T>) {
		const prior = this.index;
		const length = items.length;
		const index = (length === 0) ? 0 : prior.force_between(0, length - 1);
		this.w_items.set(items);
		this.index = index;
	}

	reset() {
		this.items = [];
		this.index = 0;		// do this last as it sets description
	}

	remove_all_beyond_index() {
		for (let i = this.index + 1; i < this.length; i++) {
			this.remove(this.items[i]);
		}
	}

	add_uniquely_from(from: S_Items<T> | null) {
		if (!!from) {
			for (const item of from.items) {
				if (!this.items.includes(item)) {
					this.push(item);
				}
			}	
		}
	}

	title(many: string, zero: string, one: string): string {
		if (this.length == 0) {
			return zero;
		} else if (this.length == 1) {
			return one;
		} else {
			return this.index.of_n_for_type(this.length, many, '');
		}
	}

	push(item: T) {
		const currentItems = this.items;
		let index = currentItems.indexOf(item);
		if (index == -1) {
			currentItems.push(item);
			this.items = currentItems;
			index = currentItems.length - 1;
		}
		this.index = index;
	}

	find_next_item(next: boolean): boolean {
		let attempts = this.length;
		while (attempts > 0) {
			this.index = this.index.increment(next, this.length);
			if (!!this.item) {
				return true;
			}
			attempts--;
		}
		return false;	// there are no items
	}

	remove(item: T) {
		const index = this.items.indexOf(item);
		if (index != -1) {
			const currentItems = [...this.items]; // Create a copy to avoid mutating the store value
			currentItems.splice(index, 1);
			this.items = currentItems; // Set items to trigger derived store updates
			if (currentItems.length == 0) {
				this.reset();
			} else if (index < this.index) {
				this.index -= 1;
			}
		}
	}

}
