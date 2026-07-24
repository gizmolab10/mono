import '../common/Extensions';

export default class Angle {
	angle: number;								// angles begin at 3 o'clock & rotate up (counter-clockwise)

	constructor(angle: number) {
		this.angle = angle;
	}

	static zero = 0;							// far right (3 o'clock)
	static full = Math.PI * 2;					// same as (normalizes to) zero
	static half = Angle.full / 2;				// far left (9 o'clock)
	static quarter = Angle.full / 4;			// zenith (12 o'clock)
	static three_quarters = Angle.quarter * 3;	// nadir (6 o'clock)
	static sixteenth = Angle.full / 16;			// support octants
	static eighth = Angle.full / 8;

	static radians_from_degrees(degrees: number): number { return Math.PI / 180 * degrees; }

	/** atan2 with browser-Y flipped (y increases downward in browsers) */
	static angle_of(x: number, y: number): number { return Math.atan2(-y, x); }

	/** 2D rotation (counter-clockwise, browser-Y convention) */
	static rotate_xy(x: number, y: number, angle: number): [number, number] {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return [
			x * cos + y * sin,
			y * cos - x * sin	// reverse y for browsers
		];
	}

	static angle_from_name(name: string): number | null {
		switch (name) {
			case 'up':				return -Math.PI / 2;
			case 'down':			return Math.PI / 2;
			case 'right': case '>': return Math.PI;
			case 'left':  case '<': return 0;
		}
		return null;
	}

}

export enum Direction {
	up = Angle.three_quarters,
	down = Angle.quarter,
	right = Angle.half,
	left = Angle.zero,
}
