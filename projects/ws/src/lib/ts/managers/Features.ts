import { k, show, T_Theme, T_Cluster_Pager, T_Counts_Shown } from '../common/Global_Imports';

export class Features {

	theme = T_Theme.standalone;

	has_zoom_controls	 = false;	// NB: hidden until implemented
	has_details_button 	 = true;
	has_every_detail	 = true;

	allow_graph_editing	 = true;
	allow_title_editing	 = true;
	allow_h_scrolling	 = true;
	allow_tree_mode		 = true;
	allow_autoSave		 = true;
	allow_search		 = true;

	apply_queryStrings(queryStrings: URLSearchParams) {
        const themeOptions	 = queryStrings.get('theme')?.split(k.comma) ?? [];
        const disableOptions = queryStrings.get('disable')?.split(k.comma) ?? [];
		for (const disableOption of disableOptions) {
			switch (disableOption) {
				case 'editGraph':			this.allow_graph_editing = false; break;
				case 'editTitles':			this.allow_title_editing = false; break;
				case 'details':				this.has_details_button	 = false; break;
				case 'horizontalScrolling': this.allow_h_scrolling	 = false; break;
				case 'tree_mode':			this.allow_tree_mode	 = false; break;
				case 'auto_save':			this.allow_autoSave		 = false; break;
				case 'search':				this.allow_search		 = false; break;
			}
		}
		for (const themeOption of themeOptions) {
			switch (themeOption) {
				case 'bubble':
					show.w_t_cluster_pager.set(T_Cluster_Pager.sliders);
					show.w_show_countsAs  .set(T_Counts_Shown.numbers);
					this.theme				 = T_Theme.bubble;
					this.allow_graph_editing = false;
					this.allow_title_editing = false;
					this.allow_h_scrolling	 = false;
					this.allow_autoSave		 = false;
					this.has_every_detail	 = false;
					this.has_details_button  = false;
					break;
			}
		}
    }

}

export const features = new Features();
