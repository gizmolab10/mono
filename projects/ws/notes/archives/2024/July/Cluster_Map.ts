import { k, s, get, Rect, Point, Angle, IDLine, svgPaths, debugReact } from '../common/Global_Imports';
import { ElementType, Element_State, transparentize, Widget_MapRect } from '../common/Global_Imports';
import { s_graphRect } from '../state/Reactive_State';
import Arc_Angles from './Arc_Angles';

// for one cluster (there are three)
//
// assumes ancestries are already paged to fit
//
// computes:
//	svg paths & positions for arc pieces & thumb
//	angle & vector for fork & thumb
//	widget map rect for each child
//	position of label

export default class Cluster_Map extends Arc_Angles {
	widget_maps: Array<Widget_MapRect> = [];	// maximum a page's worth, will be combined into geometry.widget_maps
	thumb_element_state!: Element_State;
	cluster_title = k.empty;
	color = k.color_default;
	clusters_center!: Point;
	inside_ring_radius = 0;
	outside_arc_radius = 0;
	origin = Point.zero;
	center = Point.zero;
	label_tip!: Point;
	fork_tip!: Point;
	fork_backoff = 0;
	fork_radius = 0;

	setup() {
		super.setup();
		debugReact.log_layout(`Cluster_Map setup`);
		this.clusters_center = Point.square(this.outside_ring_radius);
		this.color = transparentize(this.focus_ancestry.thing?.color ?? this.color, 0.8);
		const fork_raw_radius = k.ring_thickness * this.fork_radius_multiplier(this.shown);
		this.fork_backoff = this.fork_adjustment(fork_raw_radius, this.inside_arc_radius);
		this.fork_radius = fork_raw_radius - this.fork_backoff;
		const semi_minor = this.inside_arc_radius / 2;
		const semi_major = this.inside_arc_radius - this.fork_radius - k.dot_size / 2;
		const ellipse_axes = new Point(semi_minor, semi_major);
		this.center = get(s_graphRect).size.dividedInHalf.asPoint;
		this.fork_angle = this.forkAngle_for(this.predicate, this.points_out) ?? 0;
		this.thumb_element_state = s.elementState_for(this.focus_ancestry, ElementType.advance, this.cluster_title);
		this.fork_tip = Point.fromPolar(this.inside_arc_radius - this.fork_radius, -this.fork_angle);
		this.fork_angle_leansForward = new Angle(this.fork_angle).angle_leansForward;
		this.fork_angle_pointsRight = new Angle(this.fork_angle).angle_pointsRight;
		this.label_tip = ellipse_axes.ellipse_coordiates_forAngle(this.fork_angle);
		this.outside_arc_radius = this.inside_arc_radius + k.scroll_arc_thickness;
		this.origin = this.clusters_center.negated.offsetBy(this.center)
		this.thumb_element_state.set_forHovering(this.color, 'pointer');
		this.widget_maps = [];
		if (this.shown > 0 && !!this.predicate) {
			const radius = this.outside_ring_radius;
			const rotated = new Point(radius + k.necklace_widget_padding, 0);
			const tweak = this.center.offsetByXY(2, -1.5);	// tweak so that drag dots are centered within the necklace ring
			const max = this.shown - 1;
			let index = 0;
			while (index < this.shown) {
				const child_index = this.fork_angle_pointsRight ? index : max - index;
				const ancestry = this.ancestries[child_index];
				const childAngle = this.angle_at_index(index, radius);
				const childOrigin = tweak.offsetBy(rotated.rotate_by(childAngle));
				const map = new Widget_MapRect(IDLine.flat, new Rect(), childOrigin, ancestry, this.focus_ancestry, childAngle); //, this.predicate.kind);
				this.widget_maps.push(map);
				index += 1;
			}
		}
		this.setup_cluster_title_forIndex();
	}

	get thumb_radius(): number { return k.scroll_arc_thickness * 0.8; }
	get titles(): string { return this.ancestries.map(a => a.title).join(', '); }
	get description(): string { return `${this.predicate.kind}  ${this.titles}`; }
	get fork_center(): Point { return this.center_at(this.inside_arc_radius, -this.fork_angle); }
	get fork_svgPaths(): string[] { return [this.fork_svgPath(false), this.fork_svgPath(true)]; }
	get thumb_svgPath(): string { return svgPaths.circle(this.thumb_center, this.thumb_radius); }
	get gap_svgPath(): string { return svgPaths.circle(this.fork_center, this.fork_radius - 0.5); }
	get single_svgPath(): string { return svgPaths.circle(this.fork_center, this.fork_radius - 0.5); }

	fork_radius_multiplier(shown: number): number { return (shown > 3) ? 0.6 : (shown > 1) ? 0.3 : 0.15; }

	set_page_index(index: number) {
		super.set_page_index(index);
		this.setup_cluster_title_forIndex();
	}

	setup_cluster_title_forIndex() {
		let separator = k.space;
		let quantity = `${this.total}`;
		const index = Math.round(this.page_index);
		let shortened = this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
		if (this.isPaging) {
			separator = '<br>';
			quantity = `${index + 1} - ${index + this.shown} (of ${quantity})`;
		}
		if (!this.predicate?.isBidirectional) {
			shortened = this.points_out ? shortened : 'contained by';
			this.cluster_title = `${shortened}${separator}${quantity}`;
		} else {
			this.cluster_title = `${quantity}${separator}${shortened}`;
		}
	}
	
	static readonly $_SVGS_$: unique symbol;

	get main_svgPaths(): Array<string> {
		const angle_leansForward = new Angle(this.fork_angle).angle_leansForward;
		const big_inner_svgPath = this.big_svgPath(this.inside_arc_radius, angle_leansForward);
		return [big_inner_svgPath];
	}

	get outer_svgPaths(): Array<string> {
		const angle_leansForward = new Angle(this.fork_angle).angle_leansForward;
		const big_outer_svgPath = this.big_svgPath(this.outside_arc_radius, angle_leansForward);
		const end_small_svgPath = this.small_svgPath(this.end_angle, angle_leansForward, false);
		const start_small_svgPath = this.small_svgPath(this.start_angle, angle_leansForward, true);
		return [start_small_svgPath, big_outer_svgPath, end_small_svgPath];
	}

	big_svgPath(radius: number, angle_leansForward: boolean) {
		return svgPaths.arc(this.clusters_center, radius, 1, 
			angle_leansForward ? this.end_angle : this.start_angle,
			angle_leansForward ? this.start_angle : this.end_angle);
	}

	fork_adjustment(fork_radius: number, inside_arc_radius: number): number {
		const ratio = fork_radius / inside_arc_radius / 2;
		const fork_angle = Math.asin(ratio) * 2;
		const delta = inside_arc_radius * (1 - Math.cos(fork_angle));
		return delta / Math.sqrt(1.5);
	}

	fork_svgPath(forwards: boolean) {
		const fork_radius = this.fork_radius;
		const angle = -this.fork_angle;
		const y = fork_radius * (forwards ? -1 : 1);
		const x = this.inside_arc_radius - fork_radius - this.fork_backoff;
		const origin = new Point(x, y).rotate_by(angle);
		return svgPaths.arc(origin.offsetBy(this.clusters_center), fork_radius, 1,
			angle + (forwards ? Angle.quarter : 0),
			angle - (forwards ? 0 : Angle.quarter));
	}

	small_svgPath(arc_angle: number, tiltsUp: boolean, advance: boolean) {
		const center = Point.square(this.outside_ring_radius);
		const small_arc_radius = k.ring_thickness / 6;
		const clockwise = tiltsUp == advance;
		const ratio = clockwise ? -1 : 1;
		const distanceTo_small_arc_center = this.inside_arc_radius + small_arc_radius;
		const small_arc_angle_start = (arc_angle + (Math.PI * ratio)).normalized_angle();
		const small_arc_angle_end = (arc_angle + (Math.PI * (ratio - 1))).normalized_angle();
		const small_arc_center = center.offsetBy(Point.fromPolar(distanceTo_small_arc_center, arc_angle));
		return svgPaths.arc(small_arc_center, small_arc_radius, clockwise ? 0 : 1, small_arc_angle_start, small_arc_angle_end);
	}

}