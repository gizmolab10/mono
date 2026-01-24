import { c, e, g, k, x, show, search, g_graph_tree, Ancestry, Predicate, S_Alteration } from '../common/Global_Imports';
import { T_Focus, T_Graph, T_Kinship, T_Control, T_Alteration, T_Search_Preference } from '../common/Global_Imports';
import { get } from 'svelte/store';

class Controls {
	
	open_tabFor(url: string) { window.open(url, 'help-webseriously')?.focus(); }
	get inTreeMode(): boolean { return get(show.w_t_graph) == T_Graph.tree; }
	get inRadialMode(): boolean { return get(show.w_t_graph) == T_Graph.radial; }
	showHelp_home() { this.open_tabFor(c.isServerLocal ? k.help_url.local : k.help_url.remote); }

	togglePopupID(id: T_Control) {
		const same = get(show.w_id_popupView) == id
		show.w_id_popupView.set(same ? null : id);
	}

	showHelp_for(t_action: number, column: number) { 
		const page = e.help_page_forActionAt(t_action, column);
		const url = `${k.help_url.remote}/user_guide/${page}`;
		this.open_tabFor(url);
	}

	toggle_alteration(ancestry: Ancestry, t_alteration: T_Alteration, predicate: Predicate | null) {
		const isAltering = !!get(x.w_s_alteration);
		const s_alteration = isAltering ? null : new S_Alteration(ancestry, t_alteration, predicate);
		x.w_s_alteration.set(s_alteration);
	}
	
	handle_segmented_choices(segmented_name: string, choices: string[]) {
		switch (segmented_name) {
			case 'search': search.w_t_search_preferences.set(choices[0] as unknown as T_Search_Preference); break;
			case 'tree':   g_graph_tree.set_tree_types(choices as Array<T_Kinship>); break;
			case 'graph':  show.w_t_graph.set(choices[0] as unknown as T_Graph); break;
			case 'focus':  show.w_t_focus.set(choices[0] as unknown as T_Focus); break;
		}
	}

	toggle_graph_type() {
		switch (get(show.w_t_graph)) {
			case T_Graph.tree:   show.w_t_graph.set(T_Graph.radial); break;
			case T_Graph.radial: show.w_t_graph.set(T_Graph.tree);   break;
		}
		g.grand_sweep();
	}

}

export const controls = new Controls();