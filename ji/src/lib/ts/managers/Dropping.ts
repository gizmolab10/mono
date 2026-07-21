import { writable } from 'svelte/store';

// What a drop in progress looks like to the rest of the app. The saving happens
// in Drop; this is only what the screen needs to show it, plus the one way the
// saving can stop and ask a person a question.
//
// The question is a promise the saving waits on: the strip on screen shows the two
// files, the person picks, and the answer wakes the saving back up. Nothing is
// saved or removed until then.

// What to do when a file with this name is already held.
export enum T_Keep {
	old  = 'old',      // leave what's stored, throw away the dropped one
	new  = 'new',      // take the dropped one's words and bytes into the stored row
	both = 'both',     // keep both, the new one under a numbered name
}

// One file's facts, as shown side by side in the question.
export interface Drop_Side {
	size?  : number;
	date?  : number | null;
}

export interface Drop_Question {
	name         : string;
	stored       : Drop_Side;
	dropped      : Drop_Side;
	offer_repeat : boolean;                                   // second question onward: offer to answer the rest the same way
	answer       : (keep: T_Keep, repeat: boolean) => void;
}

// Something the drop needs to say, with nothing to choose — a refusal, say. It
// waits on OK the same way a question does, so the saving never talks over itself.
export interface Drop_Message {
	message : string;
	answer  : () => void;
}

export const w_drop_message  = writable<Drop_Message | null>(null);
export const w_drop_total    = writable<number>(0);           // how many things the drop holds, folders and skips included
export const w_drop_captured = writable<number>(0);           // how many have been dealt with so far
export const w_drop_question = writable<Drop_Question | null>(null);

export function drop_started(total: number): void {
	w_drop_total.set(total);
	w_drop_captured.set(0);
	w_drop_question.set(null);
	w_drop_message.set(null);
}

export function drop_captured(): void {
	w_drop_captured.update((n) => n + 1);
}

// Back to blank — the strip shows nothing until the next drop.
export function drop_finished(): void {
	w_drop_total.set(0);
	w_drop_captured.set(0);
	w_drop_question.set(null);
	w_drop_message.set(null);
}

// Say one thing and wait for OK. Used where a browser alert used to interrupt.
export function drop_tells(message: string): Promise<void> {
	return new Promise((resolve) => {
		w_drop_message.set({
			message,
			answer: () => { w_drop_message.set(null); resolve(); },
		});
	});
}

// Show the question and wait for the person to answer it.
export function drop_asks(name: string, stored: Drop_Side, dropped: Drop_Side, offer_repeat: boolean): Promise<{ keep: T_Keep; repeat: boolean }> {
	return new Promise((resolve) => {
		w_drop_question.set({
			name, stored, dropped, offer_repeat,
			answer: (keep, repeat) => {
				w_drop_question.set(null);
				resolve({ keep, repeat });
			},
		});
	});
}
