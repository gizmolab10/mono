import { EmbeddedDoc } from '../types/DB_Records';
import { anything_llm } from './AnythingLLM';
import { debug } from '../common/Debug';
import { writable } from 'svelte/store';

// The documents AnythingLLM already holds for the active workspace — read over the
// network and kept here so every part of ji shows the same, correct number, not just
// whichever screen happened to fetch them. Filled whenever the AI store becomes active
// and after this browser adds or removes one; emptied on any other store.

export const w_llm_docs         = writable<EmbeddedDoc[]>([]);
export const w_llm_docs_loading = writable<boolean>(false);

// A running number so a slow read can't overwrite a newer one: each refresh takes the
// next number and only publishes if it's still the latest when its answer arrives.
let sequence = 0;

// Ask AnythingLLM what it holds now and publish the answer for everyone to read.
export async function refresh_llm_docs(): Promise<void> {
	const mine = ++sequence;
	w_llm_docs_loading.set(true);
	try {
		const docs = await anything_llm.get_documents();
		if (mine === sequence) {
			w_llm_docs.set(docs);
			debug.log(`AI documents: the workspace holds ${docs.length}.`);
		} else {
			debug.log(`AI documents: dropped a stale read of ${docs.length} — a newer read had started.`);
		}
	} finally {
		if (mine === sequence) { w_llm_docs_loading.set(false); }
	}
}

// Forget them — used when leaving the AI store; also cancels any read still in flight.
export function clear_llm_docs(): void {
	sequence++;
	w_llm_docs.set([]);
	w_llm_docs_loading.set(false);
}

// A heartbeat: while the AI store is active, quietly re-read every few seconds. It does
// double duty — a read that fails flips the connection to "lost" (so an idle drop is noticed
// even when nothing else is calling), and a later read that succeeds flips it back and clears
// the note. Started and stopped by the registry as the AI store comes and goes.
let heartbeat: ReturnType<typeof setInterval> | null = null;

export function start_llm_heartbeat(): void {
	if (heartbeat !== null) { return; }
	debug.log('AI connection: heartbeat on — checking every 8 seconds.');
	heartbeat = setInterval(() => { refresh_llm_docs(); }, 8000);
}

export function stop_llm_heartbeat(): void {
	if (heartbeat === null) { return; }
	clearInterval(heartbeat);
	heartbeat = null;
	debug.log('AI connection: heartbeat off (left the AI store).');
}
