import { k, u, get, Rect, Point, svgPaths, Quadrant } from '../common/GlobalImports';
import { s_graphRect, s_cluster_arc_radius } from '../state/ReactiveState';

export default class Divider_MapRect extends Rect {
	line_tip = Point.zero;
	index = 0;
	angle = 0;

	constructor(index: number, angle: number) {
		super();
		this.index = index;
		this.angle = angle;
		this.line_tip = Point.fromPolar(get(s_cluster_arc_radius), angle);
	}
}