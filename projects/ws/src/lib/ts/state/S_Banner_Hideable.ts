import { x, S_Items, T_Detail } from '../common/Global_Imports';

export class S_Banner_Hideable {
	slot_isVisible = false;
    t_detail!: T_Detail;
	hasBanner = false;
	isBottom = false;

	constructor(t_detail: T_Detail) {
		this.hasBanner = t_detail !== T_Detail.header;
		this.isBottom = t_detail === T_Detail.data;
		this.t_detail = t_detail;
    }

	get si_items(): S_Items<any> {
		switch (this.t_detail) {
			case T_Detail.selection: return x.si_grabs;
			case T_Detail.tags:		 return x.si_thing_tags;
			case T_Detail.traits:	 return x.si_thing_traits;
			default:				 return S_Items.dummy;
		}
	}
}
