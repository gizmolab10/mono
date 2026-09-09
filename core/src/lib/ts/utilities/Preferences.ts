import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

// The way a host reads and writes what a browser remembers between visits. Every key
// is saved under the host's own prefix, so two hosts in one browser never read each
// other's values. core holds no remembered value of any host's: the keys and the prefix
// are the host's, and this is only the way to read and write one.
//
// A host makes one instance with its prefix, and hands the enum of its keys to nothing
// here — a key is any string. Storage can be handed in, so a test runs with no browser.

export type Storage_Like = {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
};

function browser_storage(): Storage_Like | null {
	return typeof localStorage === 'undefined' ? null : localStorage;
}

export class Preferences {
	constructor(private prefix: string, private storage: Storage_Like | null = browser_storage()) {}

	/** The text saved under a key, as it was written. Nothing saved (or unreadable) reads as nothing. */
	read_text(key: string): string | null {
		try {
			return this.storage?.getItem(this.prefix + key) ?? null;
		} catch {
			return null;
		}
	}

	/** Save text under a key, as it is. */
	write_text(key: string, value: string): void {
		try {
			this.storage?.setItem(this.prefix + key, value);
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
			this.storage?.removeItem(this.prefix + key);
		} catch {
			// Storage unavailable — nothing to forget.
		}
	}

	/** Forget every one of these settings. */
	clear(keys: Iterable<string>): void {
		for (const key of keys) { this.remove(key); }
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
