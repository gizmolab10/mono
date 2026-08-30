// What a thing under the cursor is, and what kinds of press it answers. ⟵di
//
// Every part of the app that the mouse can reach registers itself as one hit target, holding
// the rectangle it stands in. One place then answers the whole question of what is under the
// cursor, so no element has to watch its own hover and no two can disagree about who is pointed
// at. What each target does is its own; where each one is, and which is on top, is asked here.

/** What kind of thing it is. Where two overlap, the one earliest in this list is the one hit. */
export enum T_Hit_Target {
	control,  // button, segment, row, block
	section,  // an area occluded by controls or sections
	page,     // file contents
}

/**
 * Which kinds of press a target watches for. They are added together, so one target can watch
 * for a double press and a long one at once. Repeating is on its own: a thing that repeats while
 * held cannot also be waiting to see whether a second press arrives.
 */
export enum T_Mouse_Detection {
	autorepeat = 4,
	doubleLong = 3,
	double     = 1,
	long       = 2,
	none       = 0,
}

/** What the mouse is in the middle of, so a hover is not worked out while something is being dragged. */
export enum T_Drag {
	page  = 'page',
	none  = 'none',
}
