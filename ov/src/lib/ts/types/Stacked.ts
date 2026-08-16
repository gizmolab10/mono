import type { Snippet } from 'svelte';
import type Action from './Action';

// One section of a stack: what it shows, the word riding the line above it, and whether it is
// put away.
//
// The gap belongs to the stack, so a section names no gap and no line of its own. What it shows
// is plain markup: a section that answers a press does so itself, the way every other control
// already does. A section that is itself a stack holds subsections.

export type Stacked = {
	rides?    : Action[] | null;	// Things standing on the line above it, each at its own end or middle
	holds     : Snippet;			// What this section shows. Nothing is drawn while it is folded
	folded?   : boolean;			// Put away: nothing is drawn, and the two lines around it become one
};
