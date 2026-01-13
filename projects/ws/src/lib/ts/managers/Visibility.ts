import { T_Breadcrumbs, T_Counts_Shown, T_Cluster_Pager, T_Auto_Adjust_Graph } from '../common/Global_Imports';
import { T_Focus, T_Graph, T_Detail, T_Kinship, T_Startup, T_Preference } from '../common/Global_Imports';
import { g, k, p, x, core, g_graph_tree } from '../common/Global_Imports';
import { def } from '../common/Enumerations';
import type { Dictionary } from '../types/Types';
import { get, writable } from 'svelte/store';

const P = T_Preference;

export class Visibility {
	w_t_auto_adjust_graph	= writable<T_Auto_Adjust_Graph | null>(def(P.auto_adjust));
	w_t_cluster_pager		= writable<T_Cluster_Pager>(def(P.paging_style));
	w_t_details				= writable<Array<T_Detail>>(def(P.detail_types));
	w_t_countDots			= writable<Array<T_Kinship>>(def(P.countDots));
	w_t_breadcrumbs			= writable<T_Breadcrumbs>(def(P.breadcrumbs));
	w_t_trees				= writable<Array<T_Kinship>>(def(P.tree));
	w_t_directionals		= writable<boolean[]>([false, true]);
	w_t_focus				= writable<T_Focus>(def(P.focus));
	w_t_graph				= writable<T_Graph>(def(P.graph));

	w_show_countsAs			= writable<T_Counts_Shown>(def(P.show_countsAs));
	w_show_other_databases	= writable<boolean>(def(P.other_databases));
	w_show_related			= writable<boolean>(def(P.show_related));
	w_show_details			= writable<boolean>(def(P.show_details));
	w_show_save_data_button	= writable<boolean>(false);
	w_show_catalist_details = writable<boolean>(false);
	w_show_search_controls	= writable<boolean>(false);

	w_id_popupView			= writable<string | null>();
	debug_cursor			= false;

	constructor() {
		core.w_t_startup.subscribe((t_startup: T_Startup) => {
			if (t_startup == T_Startup.ready) {
				this.w_t_details.subscribe((t_details: Array<T_Detail>) => {
					x.update_grabs_forSearch();
				});
				this.w_show_details.subscribe(() => {
					g.update_rect_ofGraphView();
					g.layout();
				});
			}
		});
	}

	apply_queryStrings(queryStrings: URLSearchParams) {
		const levels = queryStrings.get('levels');
		const hiddenNames = queryStrings.get('hide')?.split(k.comma) ?? [];
		const visibleNames = queryStrings.get('show')?.split(k.comma) ?? [];
		const hidden = Object.fromEntries(hiddenNames.map(s => [s, false]) ?? {});
		const visible = Object.fromEntries(visibleNames.map(s => [s, true]) ?? {});
		const keyedFlags: Dictionary<boolean> = {...visible, ...hidden};
		if (!!levels) {
			g.w_depth_limit.set(Number(levels));
		}
        for (const [name, flag] of Object.entries(keyedFlags)) {
			switch (name) {
				case 'details':
					this.w_show_details.set(flag);
					break;
				case 'related':
					this.w_show_related.set(flag);
					break;
				case 'parents':
					const mode = flag ? T_Kinship.parents : T_Kinship.children;
					g_graph_tree.set_tree_types([mode]);
					break;
			}
		}
	}

	isShowing_countDots_ofType(t_counts: T_Kinship): boolean { return get(this.w_t_countDots).includes(T_Kinship[t_counts]) }
	get children_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.children); }
	get related_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.related); }
	get parent_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.parents); }
	get isDynamic_focus(): boolean { return get(this.w_t_focus) == T_Focus.dynamic; }
	get isStatic_focus(): boolean { return get(this.w_t_focus) == T_Focus.static; }

	toggle_show_other_databases() {
		const other_databases = !get(this.w_show_other_databases)
		p.write_key(T_Preference.other_databases, other_databases);
		this.w_show_other_databases.set(other_databases);
	}

	restore_preferences() {
		this.w_t_countDots         .set(p.read_key(T_Preference.countDots));
		this.w_show_details        .set(p.read_key(T_Preference.show_details));
		this.w_show_related        .set(p.read_key(T_Preference.show_related));
		this.w_show_other_databases.set(p.read_key(T_Preference.other_databases));
		this.w_t_graph             .set(p.read_key(T_Preference.graph));
		this.w_t_focus             .set(p.read_key(T_Preference.focus));
		this.w_t_trees             .set(p.read_key(T_Preference.tree));
		this.w_show_countsAs       .set(p.read_key(T_Preference.show_countsAs));
		this.w_t_details           .set(p.read_key(T_Preference.detail_types));
	}
	
	reactivity_subscribe() {
		function writeAnd_reactTo(t_preference: T_Preference, flag: any) {
			p.write_key(t_preference, flag);
			g.layout();
		}
		this.w_show_details.subscribe((flag: any) => {
			writeAnd_reactTo(T_Preference.show_details, flag);
		});
		this.w_show_related.subscribe((flag: any) => {
			writeAnd_reactTo(T_Preference.show_related, flag);
		});
		this.w_t_graph.subscribe((flag: any) => {
			writeAnd_reactTo(T_Preference.graph, flag);
		});
		this.w_t_focus.subscribe((flag: any) => {
			writeAnd_reactTo(T_Preference.focus, flag);
		});
    }
}

export const show = new Visibility();