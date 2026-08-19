// What one thing the mouse did, as a value. ⟵di
//
// A press, a release, a second press, a press held down, a movement — each arrives here as one
// small object saying which of those it was, which element it landed on, and the browser's own
// event behind it. Whatever answers a press is handed one of these rather than the raw event,
// so nothing downstream has to know how a double press was told apart from two single ones.

export default class S_Mouse {
	element: HTMLElement | null;    // nothing means it came from the app rather than an element
	event: MouseEvent | null;       // nothing means it was worked out rather than sent by the browser
	isRepeat: boolean;
	isDouble: boolean;
	isMove: boolean;
	isLong: boolean;
	isDown: boolean;
	isUp: boolean;
	clicks = 0;

	constructor(event: MouseEvent | null, element: HTMLElement | null, isDown: boolean, isUp: boolean,
		isDouble: boolean = false, isLong: boolean = false, isMove: boolean = false, isRepeat: boolean = false) {
		this.isDouble = isDouble;
		this.isRepeat = isRepeat;
		this.element = element;
		this.isDown = isDown;
		this.isLong = isLong;
		this.isMove = isMove;
		this.event = event;
		this.isUp = isUp;
	}

	//                                                                            down,  up,    double,         long,  move,  repeat

	static empty (event: MouseEvent | null = null)                              { return new S_Mouse(event, null,    false, true); }
	static up    (event: MouseEvent | null, element: HTMLElement | null)        { return new S_Mouse(event, element, false, true); }
	static down  (event: MouseEvent | null, element: HTMLElement | null)        { return new S_Mouse(event, element, true,  false); }
	static long  (event: MouseEvent | null, element: HTMLElement | null)        { return new S_Mouse(event, element, false, false, false,          true); }
	static repeat(event: MouseEvent | null, element: HTMLElement | null)        { return new S_Mouse(event, element, false, false, false,          false, false, true); }
	static double(event: MouseEvent | null, element: HTMLElement | null)        { return new S_Mouse(event, element, false, false, true,           false); }
	static clicks(event: MouseEvent | null, element: HTMLElement | null, how_many: number) { return new S_Mouse(event, element, false, false, how_many > 1, false); }

	get notRelevant(): boolean { return !this.isDown && !this.isUp && !this.isDouble && !this.isLong && !this.isMove && !this.isRepeat; }

	/** What it was, in words, for the log. */
	get description(): string {
		const states: string[] = [];
		if (this.isUp)     { states.push('up'); }
		if (this.isDown)   { states.push('down'); }
		if (this.isLong)   { states.push('long'); }
		if (this.isMove)   { states.push('move'); }
		if (this.isDouble) { states.push('double'); }
		if (this.isRepeat) { states.push('repeat'); }
		return states.length === 0 ? 'nothing' : states.join(', ');
	}

}
