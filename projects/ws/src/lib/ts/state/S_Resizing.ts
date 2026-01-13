import { k, colors, T_Hit_Target, T_Radial_Zone } from '../common/Global_Imports';
import S_Rotation from './S_Rotation';

// for resizing necklace

export default class S_Resizing extends S_Rotation {
	basis_radius: number | null = null;		// distance from arc radius to location of mouse DOWN
	
	constructor() {
		super(T_Hit_Target.resizing);
	}

	get hover_cursor(): string { return 'all-scroll'; }
	get isDragging():  boolean { return !!this.basis_radius; }
	reset()					   { super.reset(); this.basis_radius = null; }
	get fill_opacity(): number { return this.isHovering ? k.opacity.cluster.armature : k.opacity.cluster.faint; }
	update_fill_color()		   { this.fill_color = this.isHighlighted ? colors.opacitize(this.color, this.fill_opacity) : 'transparent'; }

	ring_zone_matches_type(ring_zone: T_Radial_Zone): boolean {
		return ring_zone == T_Radial_Zone.resize && this.type == T_Hit_Target.resizing;
	}

}
