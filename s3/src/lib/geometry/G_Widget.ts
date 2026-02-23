import { Point, Size, Rect } from '../types/Coordinates';
import { k }                from '../common/Constants';

export class G_Widget {
	center:          Point;
	readonly width:  number;
	readonly height = k.height.row;

	readonly width_ofTitle:   number;
	readonly center_ofDrag:   Point;
	readonly origin_ofTitle:  Point;
	readonly boundingRect:    Rect;

	private static _ctx: CanvasRenderingContext2D | null = null;
	private static readonly dot_size     = k.height.dot;
	private static readonly width_ofDrag = G_Widget.dot_size * 2 - 4;

	private static getContext(): CanvasRenderingContext2D | null {
		if (!G_Widget._ctx && typeof document !== 'undefined') {
			G_Widget._ctx = document.createElement('canvas').getContext('2d');
		}
		return G_Widget._ctx;
	}

	constructor(center: Point, title: string, showingReveal: boolean = false) {
		this.center        = center;
		this.width_ofTitle = G_Widget.measureTitleWidth(title);

		const width_ofReveal = showingReveal ? G_Widget.dot_size : 0;
		this.width = this.width_ofTitle + G_Widget.width_ofDrag + width_ofReveal - 1;

		this.center_ofDrag  = new Point(G_Widget.dot_size / 2 + 2, this.height / 2);
		this.origin_ofTitle = Point.x(G_Widget.dot_size + 5);
		this.boundingRect   = new Rect(this.origin, new Size(this.width, this.height));
	}

	static measureTitleWidth(title: string): number {
		const ctx = G_Widget.getContext();
		if (!ctx) return title.length * 8;
		ctx.font = `${k.font_size.common}px system-ui, sans-serif`;
		return ctx.measureText(title).width;
	}

	static widthFor(title: string, showingReveal: boolean = false): number {
		const revealWidth = showingReveal ? G_Widget.dot_size : 0;
		return G_Widget.measureTitleWidth(title) + G_Widget.width_ofDrag + revealWidth - 1;
	}

	get origin(): Point {
		return this.center.offsetByXY(-this.width / 2, -this.height / 2);
	}

	get center_ofReveal(): Point {
		return this.center.offsetByXY(this.width / 2 + 10, 0);
	}
}
