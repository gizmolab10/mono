import { tu } from '../utilities/Testworthy_Utilities';
import '../common/Extensions';

export enum T_Quadrant {
	upperRight = 'ur',	// 				0 ... quarter
	upperLeft  = 'ul',	//		  quarter ... half
	lowerLeft  = 'll',	//			 half ... three_quarters
	lowerRight = 'lr',	// three_quarters ... full
}

export enum T_Orientation {
	right = 'right',
	left  = 'left',
	down  = 'down',
	up    = 'up',
}

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

	static radians_from_degrees(degrees: number):	   number { return Math.PI / 180 * degrees; }

	static angle_from_name(name: string): number | null {
		switch (name) {
			case 'up':				return -Math.PI / 2;
			case 'down':			return Math.PI / 2;
			case 'right': case '>': return Math.PI;
			case 'left':  case '<': return 0;
		}
		return null;
	}

	static orientation_from_name(name: string): T_Orientation | null {
		switch (name) {
			case 'up':				return T_Orientation.up;
			case 'down':			return T_Orientation.down;
			case 'right': case '>': return T_Orientation.right;
			case 'left':  case '<': return T_Orientation.left;
		}
		return null;
	}

	get angle_points_down(): boolean { return this.orientation_ofAngle == T_Orientation.down; }
	get quadrant_basis_angle(): number { return tu.basis_angle_ofType_Quadrant(this.quadrant_ofAngle); }

	get angle_slants_forward(): boolean {
		const quadrant = this.quadrant_ofAngle;
		return [T_Quadrant.lowerRight, T_Quadrant.upperLeft].includes(quadrant);
	}

	get angle_points_right(): boolean {
		switch(this.quadrant_ofAngle) {
			case T_Quadrant.lowerRight: return true;
			case T_Quadrant.upperRight: return true;
			default: return false;
		}
	}

	get angle_points_up(): boolean {
		switch(this.quadrant_ofAngle) {
			case T_Quadrant.upperLeft: return true;
			case T_Quadrant.upperRight: return true;
			default: return false;
		}
	}

	get orientation_ofAngle(): T_Orientation {
		let quadrant = this.quadrant_ofAngle;
		// isFirstEighth first of two half quadrants, counting counter-clockwise
		const isFirstEighth = this.angle.normalize_between_zeroAnd(Angle.quarter) < (Angle.quarter / 2);
		switch (quadrant) {		// going counter-clockwise
			case T_Quadrant.upperRight: return isFirstEighth ? T_Orientation.right : T_Orientation.up;
			case T_Quadrant.upperLeft:  return isFirstEighth ? T_Orientation.up    : T_Orientation.left;
			case T_Quadrant.lowerLeft:  return isFirstEighth ? T_Orientation.left  : T_Orientation.down;
			case T_Quadrant.lowerRight: return isFirstEighth ? T_Orientation.down  : T_Orientation.right;
		}
	}

	get quadrant_ofAngle(): T_Quadrant {
	
		// angles begin at 3 o'clock & rotate up (counter-clockwise)
		// ending in lowerRight quadrant (this is also the default)
	
		const normalized = this.angle.angle_normalized();
		let quadrant = T_Quadrant.lowerRight;
		if (normalized.isBetween(0,				Angle.quarter,		  true)) { quadrant = T_Quadrant.upperRight; }
		if (normalized.isBetween(Angle.quarter, Angle.half,			  true)) { quadrant = T_Quadrant.upperLeft; }
		if (normalized.isBetween(Angle.half,	Angle.three_quarters, true)) { quadrant = T_Quadrant.lowerLeft; }
		return quadrant;
	}

	get octant_ofAngle(): number {
		const normalized = this.angle.angle_normalized();
		let test_angle = Angle.sixteenth;
		for (let i = 0; i < 8; i++) {
			if (normalized < test_angle) {
				return i;
			}
			test_angle += Angle.eighth;
		}
		return 0;
	}

	get cursor_forAngle(): string {
		if (!!this.angle) {
			const octant = this.octant_ofAngle;
			switch (octant % 4) {
				case 0: return 'ns-resize';
				case 1: return 'nwse-resize';
				case 2: return 'ew-resize';
				case 3: return 'nesw-resize';
			}
		}
		return '';
	}

}

export enum Direction {
	up = Angle.three_quarters,
	down = Angle.quarter,
	right = Angle.half,
	left = Angle.zero,
}
