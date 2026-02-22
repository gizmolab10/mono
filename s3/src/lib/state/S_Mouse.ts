export class S_Mouse {
	element:  HTMLElement | null;
	event:    MouseEvent | null;
	isRepeat: boolean;
	isDouble: boolean;
	isMove:   boolean;
	isLong:   boolean;
	isDown:   boolean;
	isUp:     boolean;
	clicks = 0;

	constructor(
		event:    MouseEvent | null,
		element:  HTMLElement | null,
		isDown:   boolean,
		isUp:     boolean,
		isDouble: boolean  = false,
		isLong:   boolean  = false,
		isMove:   boolean  = false,
		isRepeat: boolean  = false,
	) {
		this.isDouble = isDouble;
		this.isRepeat = isRepeat;
		this.element  = element;
		this.isDown   = isDown;
		this.isLong   = isLong;
		this.isMove   = isMove;
		this.event    = event;
		this.isUp     = isUp;
	}

	//                                                                           down   up     double  long   move   repeat
	static empty (event: MouseEvent | null = null)                     { return new S_Mouse(event, null,    false, true); }
	static up    (event: MouseEvent | null, element: HTMLElement | null){ return new S_Mouse(event, element, false, true); }
	static down  (event: MouseEvent | null, element: HTMLElement | null){ return new S_Mouse(event, element, true,  false); }
	static long  (event: MouseEvent | null, element: HTMLElement | null){ return new S_Mouse(event, element, false, false, false,          true); }
	static repeat(event: MouseEvent | null, element: HTMLElement | null){ return new S_Mouse(event, element, false, false, false,          false, false, true); }
	static double(event: MouseEvent | null, element: HTMLElement | null){ return new S_Mouse(event, element, false, false, true,           false); }

	get notRelevant(): boolean { return !this.isDown && !this.isUp && !this.isDouble && !this.isLong && !this.isMove && !this.isRepeat; }

	get description(): string {
		const states: string[] = [];
		if (this.isUp)     states.push('up');
		if (this.isDown)   states.push('down');
		if (this.isLong)   states.push('long');
		if (this.isMove)   states.push('move');
		if (this.isDouble) states.push('double');
		if (this.isRepeat) states.push('repeat');
		return states.length === 0 ? 'empty mouse state' : states.join(', ');
	}
}
