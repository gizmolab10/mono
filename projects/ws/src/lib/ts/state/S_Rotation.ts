import { k, x, Point, Angle, colors, radial, Ancestry, g_graph_radial } from '../common/Global_Imports';
import { T_Hit_Target, T_Radial_Zone } from '../common/Global_Imports';
import S_Component from './S_Component';

// for rotating (paging thumb and ring)

export default class S_Rotation extends S_Component {
	active_angle: number | null = null;		// current angle (at location of mouse MOVE)
	basis_angle: number | null = null;		// starting angle (where mouse went DOWN)
	fill_color = 'transparent';
	cluster_name: string | null = null;		// for paging type: name of the cluster this belongs to

	constructor(type: T_Hit_Target = T_Hit_Target.rotation) {
		super(null, type);
		this.contains_point = this.does_contain_point;
		setTimeout(() => {
			this.reset();
		}, 1);
		x.w_ancestry_focus.subscribe((ancestry: Ancestry | null) => {
			this.identifiable = ancestry;
			this.update_fill_color();
		});
	}

	get hover_cursor():	  string { return 'alias'; }
	get isDragging():	 boolean { return !!this.basis_angle; }		// user has clicked and is dragging
	get isHighlighted(): boolean { return (this.isHovering || this.isDragging); }
	get active_cursor():  string { return new Angle(this.active_angle!).cursor_forAngle; }
	get color():		  string { return this.ancestry?.thing?.color ?? colors.default_forThings; }
	get stroke_opacity(): number { return this.isHovering ? k.opacity.cluster.hover : k.opacity.none; }
	get fill_opacity():	  number { return this.isHovering ? k.opacity.cluster.armature : k.opacity.cluster.faint; }
	get cursor():		  string { return this.isDragging ? this.active_cursor : this.isHovering ? this.hover_cursor : k.cursor_default; }
	get thumb_opacity():  number { return this.isDragging ? k.opacity.cluster.active : this.isHovering ? k.opacity.cluster.active : k.opacity.cluster.thumb; }
	reset()						 { this.basis_angle = this.active_angle = null; this.update_fill_color(); }
	update_fill_color()			 { this.fill_color = colors.opacitize(this.color, this.fill_opacity) }

	does_contain_point(point: Point | null): boolean {
		let result = false;
		if (!!point) {
			const ring_zone = radial.ring_zone_atScaled(point);
			// For paging type, verify the mouse is actually over THIS cluster's thumb
			if (this.type == T_Hit_Target.paging) {
				const g_cluster = g_graph_radial.g_cluster_atMouseLocation;
				result = !!g_cluster && g_cluster.s_paging === this;
			} else if (this.ring_zone_matches_type(ring_zone)) {
				result = true;
			}
		}
		return result;
	}

	ring_zone_matches_type(ring_zone: T_Radial_Zone): boolean {
		return (ring_zone == T_Radial_Zone.rotate && this.type == T_Hit_Target.rotation) ||
			(ring_zone == T_Radial_Zone.resize && this.type == T_Hit_Target.resizing) ||
			(ring_zone == T_Radial_Zone.paging && this.type == T_Hit_Target.paging);
	}
	
}
