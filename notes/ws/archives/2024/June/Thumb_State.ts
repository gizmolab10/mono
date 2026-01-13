import { k, get, Point, svgPaths, Page_State, Element_State } from '../common/Global_Imports';
import { s_cluster_arc_radius } from '../state/Reactive_State';

export default class Thumb_State {
	thumb_state!: Element_State;
	page_state: Page_State;
	outer_arc_radius = 0;
	thumb_angle = 0;

	constructor(page_state: Page_State) {
		this.page_state = page_state;
		this.outer_arc_radius = get(s_cluster_arc_radius);
	}

	set_index(index: number) { this.page_state.set_index_to(index); }
	get thumb_radius(): number { return k.scroll_arc_thickness * 0.9; };
	get inner_arc_radius(): number { return this.outer_arc_radius - k.scroll_arc_thickness * 2; }
	get thumb_arc_radius(): number { return this.inner_arc_radius + k.scroll_arc_thickness / 2; };
	get thumb_svgPath(): string { return svgPaths.circle(this.thumb_center, this.thumb_radius); };

	get thumb_center(): Point {
		const offset = Point.fromPolar(this.thumb_arc_radius, this.thumb_angle);
		return Point.square(this.outer_arc_radius).offsetBy(offset).offsetByXY(15, 15);
	}

	compute_thumb_angle(shown: number, start_angle: number, end_angle: number) {
		const fraction = this.page_state.index / shown;
		const angular_spread = end_angle - start_angle
		this.thumb_angle = start_angle + (angular_spread * fraction);
	}

}