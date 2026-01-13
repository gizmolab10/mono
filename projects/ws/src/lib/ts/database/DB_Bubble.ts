import { T_Thing, T_Graph, T_Create, T_Predicate, Ancestry, Hierarchy } from '../common/Global_Imports';
import { g, h, k, p, x, busy, show, debug, features } from '../common/Global_Imports';
import { T_Preference } from '../common/Global_Imports';
import { T_Persistence } from '../common/Enumerations';
import { DB_Name, T_Database } from './DB_Common';
import DB_Common from './DB_Common';
import { get } from 'svelte/store';

enum T_MID {	// type of message or identifier
	details,
	focus,
	grab,
	mode,
}

export default class DB_Bubble extends DB_Common {
	allow_response_to: boolean[] = [false, false, false, false];
	prior_id: string[] = [k.empty, k.empty];
	t_persistence = T_Persistence.remote;
	prior_grabbed_ids: string[] = [];
	t_database = T_Database.bubble;
	idBase = DB_Name.bubble;
	replace_hierarchy = false;
	will_send_events = false;
	invoke_wrapUp = true;

	async fetch_all() {
		await busy.temporarily_set_isFetching_while(async () => {
			window.addEventListener('message', this.handle_bubble_message);		// first prepare listener
			window.parent.postMessage({ type: 'listening' }, k.wildcard);		// tell bubble that we're listening
		});
		return false;
	}

	private handle_bubble_message = (e: Event) => {
		const event = e as MessageEvent;
		const properties_string = event.data.properties;
		if (!properties_string || properties_string.length == 0) {
			h.wrapUp_data_forUX();
		} else {
			const type = event.data.type;
			const bubble_properties = JSON.parse(properties_string);
			debug.log_bubble(type);
			switch (type) {
				case 'CHANGE_FOCUS':
					this.changeFocusTo(bubble_properties.id);
					break;
				case 'CHANGE_GRAB':
					this.changeGrabTo(bubble_properties.id);
					break;
				case 'CHANGE_GRAPH_MODE':
					show.w_t_graph.set(bubble_properties.in_radial_mode ? T_Graph.radial : T_Graph.tree);
					break;
				case 'REPLACE_HIERARCHY':
					this.replace_hierarchy = true;		// N.B. must happen BEFORE next UPDATE_PROPERTIES
					break;
				case 'UPDATE_PROPERTIES':
					if (this.replace_hierarchy) {
						this.replace_hierarchy = false;
						this.hierarchy = new Hierarchy(this);
					}
					this.extract_fromProperties(bubble_properties);
					break;
			}
			this.setup_to_send_events();
			p.writeDB_key(T_Preference.bubble, true);
		}
	}

	private createRelationship(parent_id: string, child_id: string, kind: T_Predicate, orders: Array<number>) {
		if (!!parent_id && !!child_id && parent_id != k.empty && parent_id != k.empty_id && child_id != k.empty && child_id != k.empty_id) {
			const id = parent_id + '-->' + kind + '-->' + child_id;
			h.relationship_remember_runtimeCreateUnique(h.db.idBase, id, kind, parent_id, child_id, orders, T_Create.isFromPersistent);
		}
	}

	private createThing(id: string, title: string, color: string, type: T_Thing) {
		if (id != null && title != null && color != null && type != null) {
			if (color == k.empty) {
				h.thing_remember_runtimeCreateUnique(h.db.idBase, id, title);
			} else {
				h.thing_remember_runtimeCreateUnique(h.db.idBase, id, title, color, type);
			}
		}
	}

	private changeGrabTo(id: string) {
		if (!!id) {
			const grab = h.thing_forHID(id.hash())?.ancestry;
			if (!!grab) {
				grab.grabOnly();
				grab.parentAncestry?.expand();
				grab.ancestry_assureIsVisible();
			}
		}
	}
	private changeFocusTo(id: string) {
		if (!!id) {
			const focus = h.thing_forHID(id.hash())?.ancestry;
			if (!!focus) {
				busy.temporarily_disable_focus_event_while(() => {
					focus.becomeFocus();
				});
			}
		}
	}

	private extract_fromProperties(bubble_properties: any) {
		let b_zoom_scale, b_depth_limit, b_inRadialMode, b_show_details,
			b_ids, b_root, b_focus, b_titles, b_colors, b_parent_ids, b_related_ids,
			b_override_focus_and_mode, b_override_zoom_scale, b_override_depth_limit, 
			b_erase_user_preferences, b_suppress_tree_mode;
		try {
			const has_bubble = p.readDB_key(T_Preference.bubble) ?? false; // true after first launch
			b_override_focus_and_mode = bubble_properties.override_focus_and_mode || !has_bubble;
			b_override_depth_limit = bubble_properties.override_depth_limit || !has_bubble;
			b_override_zoom_scale = bubble_properties.override_zoom_scale || !has_bubble;
			b_erase_user_preferences = bubble_properties.erase_user_preferences;
			b_suppress_tree_mode = bubble_properties.suppress_tree_mode;
			b_inRadialMode = bubble_properties.in_radial_mode;
			b_show_details = bubble_properties.show_details;
			b_depth_limit = bubble_properties.depth_limit;
			b_zoom_scale = bubble_properties.zoom_scale;
			b_related_ids = bubble_properties.related;
			b_parent_ids = bubble_properties.parents;
			b_colors = bubble_properties.colors;
			b_titles = bubble_properties.titles;
			b_focus = bubble_properties.focus;
			b_root = bubble_properties.root;
			b_ids = bubble_properties.ids;
		} catch (err) {
			console.warn('[DB_Bubble] Could not parse bubble_properties:', err);
		}
		h.predicate_defaults_remember_runtimeCreate();
		if (!!b_ids && !!b_titles && !!b_colors && !!b_parent_ids && !!b_related_ids) {
			for (let i = 0; i < b_titles.length; i++) {
				const related_ids = b_related_ids[i].split(k.separator.generic);
				const parent_ids = b_parent_ids[i].split(k.separator.generic);
				const remove_these = new RegExp(`[${k.space}${k.quote}]`, 'g');
				const title = b_titles[i];
				const color = b_colors[i];
				const id = b_ids[i];
				const type = (id == b_root) ? T_Thing.root : T_Thing.generic;
				this.createThing(id, title, color, type);
				if (!!parent_ids && parent_ids.length > 0) {
					for (let parent_id of [...parent_ids]) {
						parent_id = parent_id.replaceAll(remove_these, '');
						this.createRelationship(parent_id, id, T_Predicate.contains, [1, 1]);
					}
				}
				if (!!related_ids && related_ids.length > 0) {
					for (let related_id of [...related_ids]) {
						related_id = related_id.replaceAll(remove_these, '');
						this.createRelationship(id, related_id, T_Predicate.isRelated, [1, 1]);
					}
				}
			}
		}
		if (!!b_root) {
			const root = h.thing_forHID(b_root.hash());
			if (!!root) {
				root.t_thing = T_Thing.root;
				h.root = root;
			}
		}
		if (this.invoke_wrapUp) {
			this.invoke_wrapUp = false;
			h.wrapUp_data_forUX(); // create ancestries and tidy up
		} else {
			h.ancestries_assureAll_createUnique();
			busy.signal_data_redraw();
		}
		if (!!b_override_depth_limit) {
			g.w_depth_limit.set(b_depth_limit);
		}
		if (!!b_override_zoom_scale) {
			g.w_scale_factor.set(b_zoom_scale);
		}
		if (!!b_suppress_tree_mode) {
			features.allow_tree_mode = false;
			show.w_t_graph.set(T_Graph.radial);
		}
		if (!!b_override_focus_and_mode) {
			if (!b_suppress_tree_mode) {
				show.w_t_graph.set(b_inRadialMode ? T_Graph.radial : T_Graph.tree);
			}
			if (!!b_focus) {
				this.changeFocusTo(b_focus);
			}
		}
		show.w_show_details.set(!!b_show_details);
	}

	private setup_to_send_events() {

		//////////////////////////////////////////////////////////
		//														//
		//	 	message types to send to bubble plugin			//
		//   see handle_webseriously_message in initialize.js	//
		//														//
		//	  debounce: only send if changed from prior value	//
		//														//
		//////////////////////////////////////////////////////////

		if (!this.will_send_events) {
			this.will_send_events = true;
			window.parent.postMessage({ type: 'trigger_an_event', trigger: 'ready' }, k.wildcard);
			show.w_t_graph.subscribe((graph_type: T_Graph) => {
				if (this.allow_response_to[T_MID.mode]) {
					window.parent.postMessage({ type: 'in_radial_mode', in_radial_mode: graph_type == T_Graph.radial }, k.wildcard);
					window.parent.postMessage({ type: 'trigger_an_event', trigger: 'mode_changed' }, k.wildcard);
				}
				this.allow_response_to[T_MID.mode] = true;
			});
			x.w_ancestry_focus.subscribe((ancestry: Ancestry | null) => {
				const focus_id = ancestry?.thing?.id ?? k.empty;
				if (!!focus_id && focus_id != this.prior_id[T_MID.focus] && busy.isFocusEventEnabled) {
					if (this.allow_response_to[T_MID.focus]) {
						this.prior_id[T_MID.focus] = focus_id;
						window.parent.postMessage({ type: 'focus_id', id: focus_id }, k.wildcard);
						window.parent.postMessage({ type: 'trigger_an_event', trigger: 'focus_changed' }, k.wildcard);			// post state first
					}
					this.allow_response_to[T_MID.focus] = true;
				}
			});
			show.w_show_catalist_details.subscribe((inform_bubble: boolean) => {
				if (!!inform_bubble) {
					show.w_show_catalist_details.set(false);
					const ancestries = get(x.si_grabs.w_items) as Array<Ancestry>;
					const grabbed_ids = ancestries.map((ancestry: Ancestry) => ancestry.thing?.id ?? k.empty);
					if (!!ancestries && grabbed_ids.join(', ') != this.prior_grabbed_ids.join(', ')) {
						if (this.allow_response_to[T_MID.grab]) {
							this.prior_grabbed_ids = grabbed_ids;
							window.parent.postMessage({ type: 'selected_ids', ids: grabbed_ids }, k.wildcard);
							window.parent.postMessage({ type: 'trigger_an_event', trigger: 'selection_changed' }, k.wildcard);
						}
						this.allow_response_to[T_MID.grab] = true;
					}
				}
			});
			x.si_grabs.w_items.subscribe((ancestries: Array<Ancestry>) => {
				const grabbed_ids = ancestries.map((ancestry: Ancestry) => ancestry.thing?.id ?? k.empty);
				if (!!ancestries && grabbed_ids.join(', ') != this.prior_grabbed_ids.join(', ')) {
					if (this.allow_response_to[T_MID.grab]) {
						this.prior_grabbed_ids = grabbed_ids;
						window.parent.postMessage({ type: 'selected_ids', ids: grabbed_ids }, k.wildcard);
						window.parent.postMessage({ type: 'trigger_an_event', trigger: 'selection_changed' }, k.wildcard);
					}
					this.allow_response_to[T_MID.grab] = true;
				}
			});
			x.w_ancestry_forDetails.subscribe((ancestry: Ancestry | null) => {
				const details_id = ancestry?.thing?.id ?? k.empty;
				if (!!details_id && details_id != this.prior_id[T_MID.details]) {
					if (this.allow_response_to[T_MID.details]) {
						this.prior_id[T_MID.details] = details_id;
						window.parent.postMessage({ type: 'details_id', id: details_id }, k.wildcard);
						window.parent.postMessage({ type: 'trigger_an_event', trigger: 'details_changed' }, k.wildcard);
					}
					this.allow_response_to[T_MID.details] = true;
				}
			});
		}
	}

}
