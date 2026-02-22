import { Point, Size, Rect } from '../types/Coordinates';
import { k }                from '../common/Constants';

let _ctx: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D | null {
	if (!_ctx && typeof document !== 'undefined') {
		_ctx = document.createElement('canvas').getContext('2d');
	}
	return _ctx;
}

const dot_size      = k.height.dot;
const width_ofDrag  = dot_size * 2 - 4;

export class G_Widget {
	center:          Point;
	readonly width:  number;
	readonly height = k.height.row;

	readonly width_ofTitle:   number;
	readonly center_ofDrag:   Point;
	readonly origin_ofTitle:  Point;
	readonly boundingRect:    Rect;

	constructor(center: Point, title: string, showingReveal: boolean = false) {
		this.center        = center;
		this.width_ofTitle = G_Widget.measureTitleWidth(title);

		const width_ofReveal = showingReveal ? dot_size : 0;
		this.width = this.width_ofTitle + width_ofDrag + width_ofReveal - 1;

		this.center_ofDrag  = new Point(dot_size / 2 + 2, this.height / 2);
		this.origin_ofTitle = Point.x(dot_size + 5);
		this.boundingRect   = new Rect(this.origin, new Size(this.width, this.height));
	}

	static measureTitleWidth(title: string): number {
		const ctx = getContext();
		if (!ctx) return title.length * 8;
		ctx.font = `${k.font_size.common}px system-ui, sans-serif`;
		return ctx.measureText(title).width;
	}

	static widthFor(title: string): number {
		return G_Widget.measureTitleWidth(title) + width_ofDrag - 1;
	}

	get origin(): Point {
		return this.center.offsetByXY(-this.width / 2, -this.height / 2);
	}

	get center_ofReveal(): Point {
		return this.center.offsetByXY(this.width / 2 + 10, 0);
	}
}
