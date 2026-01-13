import { k, get, Point, Angle, Quadrant, Predicate, Ancestry } from '../common/Global_Imports';
import { s_ring_angle, s_ancestry_focus, s_cluster_arc_radius } from '../state/Reactive_State';

//	angle & vector for fork & thumb

export default class Arc_Angles {
	focus_ancestry: Ancestry = get(s_ancestry_focus);
	straddles_positive_x_axis = false;
	ancestries: Array<Ancestry> = [];
	fork_angle_leansForward = false;
	fork_angle_pointsRight = false;
	thumb_center = Point.zero;
	outside_ring_radius = 0;
	inside_arc_radius = 0;
	predicate: Predicate;
	points_out: boolean;
	isPaging = false;
	thumb_angle = 0;
	start_angle = 0;
	fork_angle = 0;
	end_angle = 0;
	total = 0;
	shown = 0;

	destructor() { this.ancestries = []; }

	constructor(total: number, ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean) {
		this.shown = ancestries.length;
		this.ancestries = ancestries;
		this.points_out = points_out;
		this.predicate = predicate;
		this.total = total;
		this.setup();
		s_cluster_arc_radius.subscribe((radius: number) => {
			if (this.outside_ring_radius != radius) {
				this.setup();
				this.set_page_index(0);		// reset page state
			}
		})
	}

	setup() {
		this.isPaging = this.shown != this.total;
		this.outside_ring_radius = get(s_cluster_arc_radius);
		this.inside_arc_radius = this.outside_ring_radius - k.scroll_arc_thickness * 2;
		setTimeout(() => {	// superclass must create start and end angles first
			this.straddles_positive_x_axis = this.start_angle.straddles_positive_x_axis(this.end_angle);
			this.update_thumb_angle_andCenter();
		}, 1)
	}

	center_at(radius: number, angle: number): Point { return Point.square(this.outside_ring_radius).offsetBy(Point.fromPolar(radius, angle)); }
	get page_index(): number { return this.focus_ancestry.thing?.page_states?.index_for(this.points_out, this.predicate) ?? 0; }
	get thumb_arc_radius(): number { return this.inside_arc_radius + k.scroll_arc_thickness / 2; }
	get spread_angle(): number { return this.end_angle - this.start_angle; }
	get maximum_page_index(): number { return this.total - this.shown; }

	set_page_index(index: number) {
		this.focus_ancestry.thing?.page_states.set_page_index_for(index, this);
		this.update_thumb_angle_andCenter();
	}
	
	adjust_indexFor_mouse_angle(mouse_angle: number) {
		const fork_Angle = new Angle(this.fork_angle);
		const quadrant = fork_Angle.quadrant_ofAngle;
		let movement_angle = this.start_angle - mouse_angle;
		let spread_angle = this.spread_angle;
		if (this.straddles_positive_x_axis) {
			movement_angle = movement_angle.normalized_angle();
			spread_angle = (this.start_angle - this.end_angle).normalized_angle();
		} else {
			switch (quadrant) {
				case Quadrant.lowerRight:
				case Quadrant.upperLeft: movement_angle = this.end_angle - mouse_angle; break;
				case Quadrant.upperRight: movement_angle = mouse_angle - this.start_angle; break;
				case Quadrant.lowerLeft: spread_angle = this.start_angle - this.end_angle; break;
			}
		}
		let fraction = movement_angle / spread_angle;
		if (this.straddles_positive_x_axis) {
			if (fraction > 6) {
				fraction = 0;
			} else if (fraction > 1) {
				fraction = 1;
			}
		}
		if (fraction < 1) {
			const index = fraction.bump_towards(0, 1, 0.01) * this.maximum_page_index;
			this.set_page_index(index);
		}
	}

	advance(isForward: boolean) {
		const sign = isForward ? 1 : -1;
		const showing = this.shown;
		const index = this.page_index.increment_by_assuring(showing * sign, this.total);
		this.set_page_index(index);
	}
	
	static readonly $_ANGLES_$: unique symbol;

	update_thumb_angle_andCenter() {
		this.thumb_angle = this.updated_thumb_angle;
		this.thumb_center = this.center_at(this.thumb_arc_radius, this.thumb_angle).offsetByXY(15, 15);
	}

	forkAngle_for(predicate: Predicate, points_out: boolean): number | null {
		// returns one of three angles: 1) necklace_angle 2) opposite+ 3) opposite-tweak
		const tweak = Math.PI / 10 * 3;			// 54 degrees: added or subtracted -> opposite
		const necklace_angle = get(s_ring_angle);
		const opposite = necklace_angle + Angle.half;
		const raw = predicate.isBidirectional ?
			opposite - tweak :
			points_out ? necklace_angle :	// one directional, use global
			opposite + tweak;
		return (-raw).normalized_angle();
	}

	detect_grab_start_end(index: number, fork_y: number, max: number, child_angle: number) {
		// detect and grab start and end
		if (index == 0) {
			if (fork_y > 0) {
				this.start_angle = child_angle;
			} else {
				this.end_angle = child_angle;
			}
		} else if (index == max) {
			if (fork_y < 0) {
				this.start_angle = child_angle;
			} else {
				this.end_angle = child_angle;
			}
		}
	}

	angle_at_index(index: number, radius: number): number {

		// index:
		//	increases clockwise
		//	maximum is shown - 1
		//	constant vertical distribution
		// angle:
		//	avoids zenith and nadir
		//	increases counter-clockwise
		//	equally distributed around fork-angle

		const max = this.shown - 1;
		const row = (max / 2) - index;						// row centered around zero
		const radial = new Point(radius, 0);
		const rotated = radial.rotate_by(this.fork_angle);	// points at middle widget
		const fork_y = rotated.y;							// height of fork_angle, relative to center of clusters
		let y = fork_y + (row * k.row_height);				// distribute y around fork_y
		let y_isOutside = false;
		const absY = Math.abs(y);
		if (absY > radius) {
			y_isOutside = true;								// y is outside necklace
			y = -(y % radius) + radius * y / absY;			// swing around bottom / top --> back inside necklace
		}
		let child_angle = Math.asin(y / radius);			// arc-sin only defined (-90 to 90)
		if (y_isOutside == (rotated.x > 0)) {				// counter-clockwise for (x > 0) and (-radius < y < radius)
			child_angle = Angle.half - child_angle			// otherwise it's clockwise, so invert it
		}
		child_angle = child_angle.normalized_angle();
		this.detect_grab_start_end(index, fork_y, max, child_angle);
		return child_angle;									// angle at index
	}

	get updated_thumb_angle(): number {
		const fork_Angle = new Angle(this.fork_angle);
		const quadrant = fork_Angle.quadrant_ofAngle;
		let angle = (this.start_angle + this.end_angle) / 2;
		if (this.maximum_page_index > 0) {
			const fraction = this.page_index / this.maximum_page_index;
			if (fraction > 1) {
				angle = this.end_angle;
			} else {
				if (this.straddles_positive_x_axis) {
					let spread_angle = (this.start_angle - this.end_angle).normalized_angle();
					angle = angle = this.start_angle - (spread_angle * fraction);
				} else {
					let adjusted = this.spread_angle * fraction;
					angle = this.start_angle + adjusted;
					switch (quadrant) {
						case Quadrant.upperLeft:
						case Quadrant.lowerRight: angle = this.end_angle - adjusted; break;
					}
				}
				angle = angle.normalized_angle();
			}
		}
		return angle;
	}

}