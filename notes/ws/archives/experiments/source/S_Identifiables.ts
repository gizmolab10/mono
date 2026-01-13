import { writable, type Writable } from 'svelte/store';

export default class S_Identifiables<T> {

	// for browsing through traits & tags and recents

	items: Array<T> = [];
	w_index_ofItem: Writable<number>;

	constructor(items: Array<T>) {
		this.set_items(items);
		this.w_index_ofItem = writable(0);
	}

	set_items(items: Array<T>) { this.items = items; }
	get item(): T | null { return this.items[this.index_ofItem] ?? null; }

    set index_ofItem(value: number) {
        this.w_index_ofItem.set(value);
    }

    get index_ofItem(): number {
        let value = 0;
        this.w_index_ofItem.subscribe(v => value = v)();
        return value;
    }

	push(item: T) {
		let index = this.items.indexOf(item);
		if (index == -1) {
			this.items.push(item);
			index = this.items.length - 1;
		}
		this.index_ofItem = index;
	}

	find_next_item(next: boolean): boolean {
		let index = this.items.length;
		while (index > 0) {		// prevent infinite loop if no item is found
			this.index_ofItem = this.index_ofItem.increment(next, this.items.length);
			if (!!this.item) {
				return true;
			}
			index--;
		}
		return false;
	}
}