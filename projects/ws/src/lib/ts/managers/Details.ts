import { T_Search, T_Detail, T_Direction, T_Storage_Need } from '../common/Global_Imports';
import { S_Banner_Hideable } from '../state/S_Banner_Hideable';
import { x, show, search } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';
import { get } from 'svelte/store';

class Details {
	s_banner_hideables_dict_byType: Dictionary<S_Banner_Hideable> = {};
	t_storage_need = T_Storage_Need.direction;
	show_properties = false;

	constructor() {
		for (const t_detail of Object.values(T_Detail) as T_Detail[]) {
			this.s_banner_hideables_dict_byType[t_detail] = new S_Banner_Hideable(t_detail);
		}
	}
		
	details_toggle_visibility() { show.w_show_details.update(n => !n); }
		
	static readonly _____BANNERS: unique symbol;

	redraw() {
		// e.w_count_details.update(n => n + 1); 	// force re-render of details
		// hits.recalibrate();
	}

	select_next(banner_id: string, selected_title: string) {
		const next = T_Direction.next === selected_title as unknown as T_Direction;	// unknown defeats ts type check
		const t_detail = T_Detail[banner_id as keyof typeof T_Detail];
		switch (t_detail) {
			case T_Detail.traits:	 x.select_next_thingTrait(next); break;
			case T_Detail.tags:  	 x.select_next_thing_tag(next); break;
			case T_Detail.selection: x.grab_next_ancestry(next); break;
		}
	}

	banner_title_forDetail(t_detail: T_Detail): string {
		const si_items = this.s_banner_hideables_dict_byType[t_detail].si_items;
		let title = T_Detail[t_detail];
		switch (t_detail) {
			case T_Detail.tags:
				title = si_items.title('tag', 'tags', title);
				break;
			case T_Detail.traits:
				title = si_items.title('trait', 'traits', title);
				break;
			case T_Detail.selection:
				const si_found = x.si_found;
				const row	   = si_found.index;
				const found    = si_found.length;
				const grabbed  = si_items.items;
				if (row != null && !!found && found > 1 && get(search.w_t_search) != T_Search.off) {
					title = si_found.title('search result', 'focus', title);
				} else if (!!grabbed) {
					title = si_items.title('selected', 'focus', title); break;
				}
				break;
			default:
				break;
		}
		return title;
	}

}

export const details = new Details();
