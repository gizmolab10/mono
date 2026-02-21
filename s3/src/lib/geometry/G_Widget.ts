import { Point } from '../types/Coordinates';

export class G_Widget {
	center: Point;
	readonly width  = 120;
	readonly height = 16;

	constructor(center: Point) {
		this.center = center;
	}

	get origin(): Point {
		return this.center.offsetByXY(-this.width / 2, -this.height / 2);
	}

	get center_ofReveal(): Point {
		return this.center.offsetByXY(this.width / 2 + 10, 0);
	}
}
