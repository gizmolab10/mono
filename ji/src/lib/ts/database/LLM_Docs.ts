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
// `quiet` (passed by the heartbeat) does the read without logging, so an idle tick every
// few seconds doesn't flood the log; the one-off refreshes (store switch, add/remove) log.
export async function refresh_llm_docs(quiet = false): Promise<void> {
	const mine = ++sequence;
	w_llm_docs_loading.set(true);
	try {
		const docs = await anything_llm.get_documents(quiet);
		if (mine === sequence) {
			w_llm_docs.set(docs);
			if (!quiet) { debug.log(`AI documents: the workspace holds ${docs.length}.`); }
		} else if (!quiet) {
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

// More than one thing wants this running — the AI store while it is the active one, and the
// chat while it is on screen. They are counted rather than switched, so whichever leaves first
// does not take the beat away from the other.
let asked_for = 0;

export function start_llm_heartbeat(): void {
	asked_for += 1;
	if (heartbeat !== null) { return; }
	debug.log('AI connection: heartbeat on — checking every 8 seconds.');
	heartbeat = setInterval(() => { refresh_llm_docs(true); }, 8000);
}

export function stop_llm_heartbeat(): void {
	asked_for = Math.max(0, asked_for - 1);
	if (asked_for > 0 || heartbeat === null) { return; }
	clearInterval(heartbeat);
	heartbeat = null;
	debug.log('AI connection: heartbeat off — nothing is watching the connection now.');
}
