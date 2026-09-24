// Something a caller built and hands to a separator, to stand on the line at one of three
// places. The element belongs to whoever built it; the separator only lends it a place.
//
// It is null until the browser has actually made the element, which is one drawing after the
// caller asks for it — so a separator takes only the ones that are there.

export enum T_Position {
	left,
	center,
	right,
}

export default class Action {
	element: HTMLElement | null = null;
	position = T_Position.left;
}
