import { Point } from '../types/Coordinates';
import { k }     from '../common/Constants';

let _ctx: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D | null {
	if (!_ctx && typeof document !== 'undefined') {
		_ctx = document.createElement('canvas').getContext('2d');
	}
	return _ctx;
}

export class G_Widget {
	center: Point;
	readonly width:  number;
	readonly height = k.height.row;

	constructor(center: Point, title: string) {
		this.center = center;
		this.width  = G_Widget.widthFor(title);
	}

	static measureTitleWidth(title: string): number {
		const ctx = getContext();
		if (!ctx) return title.length * 8;
		ctx.font = `${k.font_size.common}px system-ui, sans-serif`;
		return ctx.measureText(title).width;
	}

	static widthFor(title: string): number {
		return G_Widget.measureTitleWidth(title) + 10;
	}

	get origin(): Point {
		return this.center.offsetByXY(-this.width / 2, -this.height / 2);
	}

	get center_ofReveal(): Point {
		return this.center.offsetByXY(this.width / 2 + 10, 0);
	}
}
