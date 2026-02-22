import { Point, Size } from '../types/Coordinates';
import { T_Tree_Line } from '../common/Enumerations';
import { k }           from '../common/Constants';

export class G_TreeLine {
	readonly start       : Point;
	readonly end         : Point;
	readonly t_curve     : T_Tree_Line;
	readonly linePath    : string;
	readonly stroke_width = k.thickness.stroke;

	constructor(start: Point, end: Point) {
		this.start = start;
		this.end   = end;

		const dy = end.y - start.y;
		this.t_curve = dy > 1  ? T_Tree_Line.down
		             : dy < -1 ? T_Tree_Line.up
		             :           T_Tree_Line.flat;

		this.linePath = this.compute_path();
	}

	// ————————————————————————————————————————— SVG positioning

	get svg_origin(): Point {
		return new Point(
			Math.min(this.start.x, this.end.x),
			Math.min(this.start.y, this.end.y)
		);
	}

	get svg_size(): Size {
		const w = Math.abs(this.end.x - this.start.x);
		const h = Math.abs(this.end.y - this.start.y);
		return new Size(Math.max(w, 1), Math.max(h, 1));
	}

	// ————————————————————————————————————————— Path generation

	private compute_path(): string {
		const w = Math.abs(this.end.x - this.start.x);
		const h = Math.abs(this.end.y - this.start.y);

		switch (this.t_curve) {
			case T_Tree_Line.flat:
				return `M0 0.5 L${w} 0.5`;
			case T_Tree_Line.down:
				return `M0 0 A ${w} ${h} 0 0 0 ${w} ${h}`;
			case T_Tree_Line.up:
				return `M0 ${h} A ${w} ${h} 0 0 1 ${w} 0`;
		}
	}
}
