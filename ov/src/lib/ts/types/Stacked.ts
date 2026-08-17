import type { Snippet } from 'svelte';
import type Action from './Action';

// One section of a stack: what it shows, the word riding the line above it, and whether it is
// put away.
//
// The gap belongs to the stack, so a section names no gap and no line of its own. What it shows
// is plain markup: a section that answers a press does so itself, the way every other control
// already does. A section that is itself a stack holds subsections.

// Who draws the separator at a stack's foot. The stack itself, and only where its last fold
// needs something to end against; whatever stands below it, always; or nobody at all — in which
// case a last fold has nothing to end against and comes down to its own separator and nothing else.
export type T_Foot = 'stack' | 'below' | 'none';

export type Stacked = {
	rides?       : Action[] | null;	// Things standing on the separator above it, each at its own end or middle
	subsection   : Snippet;			// What this section shows. Nothing is drawn while it is folded
	folded?      : boolean;			// Folded: nothing is drawn, and the two separators around it become one
};
