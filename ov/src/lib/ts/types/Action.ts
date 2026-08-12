export enum T_Position {
	left,
	center,
	right,
}

export default class Action {
	element: HTMLElement | null = null;
	position = T_Position.left
}
