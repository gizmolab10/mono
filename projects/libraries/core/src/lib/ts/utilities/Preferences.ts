import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

// The way a host reads and writes what a browser remembers between visits. Every key
// is saved under the host's own prefix, so two hosts in one browser never read each
// other's values. core holds no remembered value of any host's: the keys and the prefix
// are the host's, and this is only the way to read and write one.
//
// A host makes one instance with its prefix, or with a function answering it, for a library
// whose host sets the prefix after the instance is made. It hands the enum of its keys to
// nothing here — a key is any string. Storage can be handed in, so a test runs with no browser.

export type Storage_Like = {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
	length?: number;                          // how many keys, and the key at each place: what adopt
	key?(index: number): string | null;       // walks, the browser's storage having both
};

function browser_storage(): Storage_Like | null {
	return typeof localStorage === 'undefined' ? null : localStorage;
}

export class Preferences {
	constructor(private prefix: string | (() => string), private storage: Storage_Like | null = browser_storage()) {}

	/** The prefix as it is now: the one handed in, or what the function handed in answers. */
	private prefix_now(): string {
		return typeof this.prefix === 'function' ? this.prefix() : this.prefix;
	}

	/** The text saved under a key, as it was written. Nothing saved (or unreadable) reads as nothing. */
	read_text(key: string): string | null {
		try {
			return this.storage?.getItem(this.prefix_now() + key) ?? null;
		} catch {
			return null;
		}
	}

	/** Save text under a key, as it is. */
	write_text(key: string, value: string): void {
		try {
			this.storage?.setItem(this.prefix_now() + key, value);
		} catch (e) {
			console.warn(`Could not save the "${key}" setting:`, e);
		}
	}

	/** Read one saved setting as json. Nothing saved (or unreadable) reads as nothing. */
	read<T>(key: string): T | null {
		const raw = this.read_text(key);
		if (raw == null || raw == 'undefined') { return null; }
		try {
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	/** Save one setting as json. */
	write<T>(key: string, value: T): void {
		this.write_text(key, JSON.stringify(value));
	}

	/** Forget one setting. */
	remove(key: string): void {
		try {
			this.storage?.removeItem(this.prefix_now() + key);
		} catch {
			// Storage unavailable — nothing to forget.
		}
	}

	/** Forget every one of these settings. */
	clear(keys: Iterable<string>): void {
		for (const key of keys) { this.remove(key); }
	}

	/**
	 * Every value saved under another prefix comes under this one, where this one holds none for
	 * that key, and the old key goes either way: for a host that changed its prefix. Answers how
	 * many moved. Nothing moves with no storage, or with one that cannot walk its keys.
	 */
	adopt(old_prefix: string): number {
		const storage = this.storage;
		if (!storage || typeof storage.key !== 'function' || typeof storage.length !== 'number') { return 0; }
		let moved = 0;
		try {
			const found: string[] = [];
			for (let at = 0; at < storage.length; at++) {
				const key = storage.key(at);
				if (key !== null && key.startsWith(old_prefix)) { found.push(key); }
			}
			for (const key of found) {
				const own = this.prefix_now() + key.slice(old_prefix.length);
				const value = storage.getItem(key);
				if (value !== null && storage.getItem(own) === null) {
					storage.setItem(own, value);
					moved += 1;
				}
				storage.removeItem(key);
			}
		} catch (e) {
			console.warn(`Could not move the settings saved under "${old_prefix}":`, e);
		}
		return moved;
	}

	/**
	 * A value that remembers itself: starts at whatever was saved (or the fallback
	 * when nothing was), and saves again on every change.
	 */
	persistent<T>(key: string, fallback: T): Writable<T> {
		const saved = this.read<T>(key);
		const w = writable<T>(saved ?? fallback);
		w.subscribe((v) => this.write(key, v));
		return w;
	}
}
