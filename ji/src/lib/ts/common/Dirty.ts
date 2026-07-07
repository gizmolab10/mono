import { writable as svelte_writable, type Writable } from 'svelte/store';

// A write to any canvas-affecting input must signal that the canvas might be
// out of date. The render module knows how to mark itself stale, but this
// file can't import it (that would be a cycle). Instead we hold a callback:
// setup wires it to render.mark_stale, and the helpers below call it on
// every set or update.

let mark: () => void = () => {};

/** Called at setup time to hook the canvas-stale signal up to the renderer. */
export function register_stale_mark(fn: () => void): void { mark = fn; }

/** Wrap a Svelte writable so every set and update also marks the canvas out
 *  of date. Use this for stores that drive something the canvas shows. New
 *  canvas-affecting stores get coverage automatically when declared this way. */
export function make_stale<T>(inner: Writable<T>): Writable<T> {
	return {
		subscribe: inner.subscribe,
		set(v: T) { inner.set(v); mark(); },
		update(fn: (v: T) => T) { inner.update(fn); mark(); },
	};
}

/** Create a fresh Svelte writable that already marks the canvas out of date
 *  on every set and update. Equivalent to make_stale(writable(value)). */
export function stale_writable<T>(value: T): Writable<T> {
	return make_stale(svelte_writable<T>(value));
}
