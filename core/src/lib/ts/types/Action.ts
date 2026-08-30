export enum T_Position {
	left,
	center,
	right,
}

export default class Action {
	element: HTMLElement | null = null;
	position = T_Position.left
	inset: string | null = null;   // a left-placed thing may stand in from the usual edge
	transparent = false;           // no mask of its own — the things inside mask the line for themselves
}
