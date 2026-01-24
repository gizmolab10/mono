import { G_Widget, G_Cluster_Pager, S_Rotation, T_Predicate, T_Cluster_Pager } from '../common/Global_Imports';
import { g, k, u, x, show, debug, colors, radial, signals } from '../common/Global_Imports';
import { Point, Angle, Ancestry, Predicate } from '../common/Global_Imports';
import { G_Paging } from './G_Paging';
import { get } from 'svelte/store';

//////////////////////////////////////////
//										//
//	for ONE cluster (there are three)	//
//										//
//	assumes ancestries are				//
//		already paged to fit			//
//										//
//	computes:							//
//		positions of arc, thumb & label	//
//		svg paths for arc & thumb		//
//		geometry for each widget		//
//		angle for fork & label			//
//										//
//////////////////////////////////////////

export default class G_Cluster {
	g_cluster_pager = new G_Cluster_Pager(false);
	g_thumbArc = new G_Cluster_Pager(true);
	ancestries_shown: Array<Ancestry> = [];
	g_cluster_widgets: G_Widget[] = [];
	ancestries: Array<Ancestry> = [];
	color = colors.default_forThings;
	isCluster_ofChildren: boolean;
	arc_in_lower_half = false;
	label_center = Point.zero;
	cluster_title = k.empty;
	predicate: Predicate;
	center = Point.zero;
	widgets_shown = 0;
	total_widgets = 0;
	isPaging = false;

	// heavy lifting for positioning everything in one cluster

	destructor() { this.ancestries = []; }
	constructor(predicate: Predicate, isCluster_ofChildren: boolean) {
		this.isCluster_ofChildren = isCluster_ofChildren;
		this.predicate = predicate;
		radial.w_resize_radius.subscribe((radius: number) => {
			if (this.g_cluster_pager.outside_arc_radius != radius) {
				this.layout();		// do not set_paging_index (else expand will hang)
			}
		})
	}

	static readonly _____CLUSTER: unique symbol;

	layout() {
		if (this.ancestries_shown.length > 0) {
			debug.log_build(`layout (${this.ancestries_shown.length} shown)  ${this.direction_kind}`);
			this.widgets_shown = this.ancestries_shown.length;
			this.isPaging = this.widgets_shown < this.total_widgets;
			this.center = get(g.w_rect_ofGraphView).size.asPoint.dividedInHalf;
			this.color = colors.opacitize(get(x.w_ancestry_focus)?.thing?.color ?? this.color, 0.2);
			this.g_cluster_pager.angle_ofCluster = this.angle_ofCluster;
			this.g_cluster_pager.layout();
			this.layout_cluster_widgets();
			this.g_cluster_pager.layout_forkTip(this.center);
			this.layout_label();
			this.layout_thumb_angles();
			this.update_label_forIndex();
			signals.signal_reposition_widgets_fromFocus();
		}
	}
	
	get angle_ofCluster(): number {
		// returns one of three angles: 1) children_angle 2) opposite+tweak 3) opposite-tweak
		const tweak = 2 * Math.PI / 3;					// equilateral distribution
		const children_angle = get(radial.w_rotate_angle);
		const raw = this.predicate.isBidirectional ?
			children_angle + tweak :
			this.isCluster_ofChildren ? children_angle :		// one directional, use global
			children_angle - tweak;
		return raw ?? 0;
	}

	static readonly _____OTHER: unique symbol;

	get titles(): string { return this.ancestries.map(a => a.title).join(', '); }
	get description(): string { return `(${this.cluster_title}) ${this.titles}`; }
	get kind(): string { return this.predicate?.kind.unCamelCase().lastWord() ?? k.empty; }
	get name(): string { return `${get(x.w_ancestry_focus)?.title ?? 'unknown'}-cluster-${this.direction_kind}`; }

	get isMouse_insideThumb(): boolean {
		const offset = Point.square(-radial.ring_radius);
		const mouse_vector = g.mouse_vector_ofOffset_fromGraphCenter(offset);
		return this.isPaging && !!mouse_vector && mouse_vector.isContainedBy_path(this.g_thumbArc.svgPathFor_arcSlider);
	}

	setAncestries(ancestries: Array<Ancestry>) {
		this.total_widgets = this.widgets_shown = ancestries.length;
		this.ancestries = ancestries;
	}

	static readonly _____LABEL: unique symbol;

	private layout_label() {		// rotate text tangent to arc, at center of arc
		const angle = this.g_cluster_pager.angle_ofFork;
		const ortho = this.arc_in_lower_half ? Angle.three_quarters : Angle.quarter;
		const tweak = [10, 7, -17.4, -22.4][u.convert_toNumber([this.arc_in_lower_half, this.show_forks])];
		const label_radius = radial.ring_radius + tweak;
		this.label_center = this.center.offsetBy(Point.fromPolar(label_radius, angle));
		this.g_cluster_pager.label_text_angle = this.show_forks ? ortho - angle : Math.PI / 2;
	}
	
	private update_label_forIndex() {
		let title =  `${this.total_widgets} ${this.direction_kind}`;
		if (this.isPaging) {
			const index = this.paging_index_ofFocus;
			const middle = (this.widgets_shown < 2) ? k.empty : `-${index + this.widgets_shown}`;
			title = `${this.total_widgets} ${this.direction_kind} (${index + 1}${middle})`
		}
		this.cluster_title = title;
	}
	
	static readonly _____PAGING: unique symbol;

	get maximum_paging_index():	  number { return this.total_widgets - this.widgets_shown; }
	get paging_index_ofFocus():	  number { return Math.round(this.g_focusPaging?.index ?? 0); }
	get s_paging():			  S_Rotation { return radial.s_paging_forName_ofCluster(this.name); }
	get g_focusPaging(): G_Paging | null { 
		const focus = get(x.w_ancestry_focus);
		return focus ? this.g_paging_forAncestry(focus) : null;
	}
	get show_forks():			 boolean { return get(show.w_t_cluster_pager) == T_Cluster_Pager.sliders; }
	get g_paging():		 G_Paging | null { return this.g_paging_forPredicate_toChildren(this.predicate, this.isCluster_ofChildren); }

	g_paging_forPredicate_toChildren(predicate: Predicate, isCluster_ofChildren: boolean): G_Paging | null {
		const g_pages = radial.g_pages_forThingID(get(x.w_ancestry_focus)?.thing?.id);
		return g_pages?.g_paging_forPredicate_toChildren(predicate, isCluster_ofChildren) ?? null;
	}

	g_paging_forAncestry(ancestry: Ancestry): G_Paging | null {
		const g_pages = radial.g_pages_forThingID(ancestry.thing?.id);
		return g_pages?.g_paging_for(this) ?? null;
	}

	layout_forPaging() {
		const g_paging = this.g_paging;
		if (!!g_paging) {
			const points_right = new Angle(this.angle_ofCluster).angle_points_right;
			const onePage_ofAncestries = g_paging.onePage_from(this.widgets_shown, this.ancestries);
			this.ancestries_shown = points_right ? onePage_ofAncestries.reverse() : onePage_ofAncestries;	
			this.layout();
			let angle = this.g_cluster_pager.spread_angle;
			if (angle < 0) {
				angle = -angle;
			}
			return angle;
		}
		return 0;
	}
	
	adjust_paging_index_byAdding_angle(delta_angle: number) {
		const paging = this.g_focusPaging;
		if (!!paging) {
			const max_index = this.maximum_paging_index;
			const spread_angle = -this.g_cluster_pager.spread_angle;
			const sensitivity_multiplier = Math.PI * spread_angle * 5 / Math.min(18, (max_index ** .5));
			const delta_fraction = delta_angle * sensitivity_multiplier / spread_angle;
			const delta_index = delta_fraction * max_index;			// convert rotation delta to index delta
			const adjusted = paging.addTo_paging_index_for(delta_index) ?? false;	// add index delta to index
			this.layout_thumb_angles();
			if (adjusted) {
				this.update_label_forIndex();
			}
			return adjusted || delta_index != 0;
		}
		return false;
	}

	static readonly _____ANGLES: unique symbol;
	
	private get isSingular(): boolean { return this.total_widgets == 1; }
	private get isParental(): boolean { return !this.isCluster_ofChildren && !this.predicate?.isBidirectional; }
	private get radial_vector_ofFork(): Point { return Point.fromPolar(radial.ring_radius, this.angle_ofCluster); }
	private get direction_kind(): string { return this.isParental ? this.isSingular ? 'parent' : 'parents' : this.isCluster_ofChildren ? this.isSingular ? 'child' : 'children' : this.kind; }

	private update_arc_angles(index: number, max: number, child_angle: number) {
		// index increases & angle decreases clockwise
		if (index == max) {
			this.g_cluster_pager.start_angle = child_angle;
		}
		if (index == 0) {
			this.g_cluster_pager.end_angle = child_angle;
		}
	}

	layout_cluster_widgets() {
		this.g_cluster_widgets = [];
		if (this.widgets_shown > 0 && !!this.predicate) {
			const center = this.center.offsetByXY(0.5, -1);			// tweak so that drag dots are centered within the rotation ring
			const factor = 1;//this.predicate.kind == T_Predicate.contains ? this.isCluster_ofChildren ? 0 : 1 : 2;
			const inset = (factor + 3) * k.thickness.radial.ring / 6;
			const radial_vector = Point.x(radial.ring_radius + inset);
			const radial_vector_ofFork = this.radial_vector_ofFork;				// points at middle widget (of cluster)
			const fork_points_right = radial_vector_ofFork.x > 0;
			const fork_points_down = radial_vector_ofFork.y < 0;
			let index = 0;
			while (index < this.widgets_shown) {
				const adjusted_index = fork_points_right ? (this.widgets_shown - index - 1) : index;
				const ancestry = this.ancestries_shown[adjusted_index];
				const angle = this.angle_at_index(adjusted_index);
				const points_right = new Angle(angle).angle_points_right;
				const rotated_origin = center.offsetBy(radial_vector.rotate_by(angle));
				const g_widget = ancestry.g_widget;
				g_widget.layout_necklaceWidget(rotated_origin, points_right);
				this.g_cluster_widgets.push(g_widget);
				index += 1;
			}
			this.g_cluster_pager.finalize_angles();
			this.arc_in_lower_half = fork_points_down;
		}
	}

	private angle_at_index(index: number): number {

		// index:
		//	increases clockwise
		//	constant vertical distribution
		//	maximum is 1 subtracted from shown
		// angle:
		//	avoids zenith and nadir
		//	increases counter-clockwise
		//	widgets distributed half-and-half around fork-angle

		const max = this.widgets_shown - 1;
		const row = (max / 2) - index;						// row goes from minus to plus (equally divided around fork_y)
		const radius = radial.ring_radius;
		const radial_vector = this.radial_vector_ofFork;	// points at cluster's middle widget
		const row_height = k.height.dot - 3.2;
		let y = radial_vector.y + (row * row_height);		// distribute y equally around fork_y
		let y_isOutside = false;
		const absY = Math.abs(y);
		if (absY > radius) {
			y_isOutside = true;								// y is outside rotation ring
			y = radius * (y / absY) - (y % radius);			// swing around (bottom | top) --> back inside rotation
		}
		let child_angle = Math.asin(y / radius);			// arc-sin only defined (-90 to 90) [ALSO: negate angles so things advance clockwise]
		if (y_isOutside != (radial_vector.x > 0)) {			// counter-clockwise if (x is positive AND y is outside) OR (x is negative AND y is inside)
			child_angle = Angle.half - child_angle			// otherwise it's clockwise, so invert it
		}
		this.update_arc_angles(index, max, child_angle);
		return child_angle;									// angle at index
	}

	private layout_thumb_angles() {

		// a tad complex, because:
		// 1. start & end are sometimes reversed (hasNegative_spread)
		// 2. arc can straddle nadir when fork y is outside of ring

		if (this.total_widgets > 0) {	// avoid division by zero
			const spread_angle = this.g_cluster_pager.spread_angle;
			const hasNegative_spread = spread_angle < 0
			const inverter = hasNegative_spread ? 1 : -1;
			const otherInverter = (hasNegative_spread == this.g_cluster_pager.arc_straddles_nadir) ? -1 : 1;
			const arc_spread = this.g_cluster_pager.arc_straddles_nadir ? (-spread_angle).angle_normalized() : spread_angle;
			const increment = arc_spread / this.total_widgets * inverter;
			const arc_start = this.g_cluster_pager.start_angle * otherInverter;
			const start = arc_start + (increment * this.paging_index_ofFocus);
			const end = start + (increment * this.widgets_shown);
			const angle = (start + end) / 2;
			this.g_thumbArc.angle_ofCluster = angle;
			this.g_thumbArc.start_angle = start;
			this.g_thumbArc.end_angle = end;
			this.g_thumbArc.layout();
		}
	}

}
