import { h, k, Thing, Predicate, G_Cluster } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';
import { G_Paging } from './G_Paging';

export class G_Pages {

	parent_pagings_dict: Dictionary<G_Paging> = {};
	child_pagings_dict: Dictionary<G_Paging> = {};
	thing_id = k.empty;

	// every Thing has a G_Pages
	//
	// two arrays of G_Paging (defined above)
	// 1) child: (to) children and relateds (more kinds later?)
	// 2) parent: (from) parents
	// each array has one index for each predicate kind
	// 
	// page == a subset of a too-long list
	// index == first of subset, and changes to show a different subset

	constructor(thing_id: string = k.empty) {
		this.thing_id = thing_id;
	}

	static create_fromDict(dict: Dictionary): G_Pages | null {
		const s_pages = new G_Pages(dict.thing_id);
		s_pages.child_pagings_dict = G_Paging.create_g_paging_dict_fromDict(dict.child_pagings_dict, true);
		s_pages.parent_pagings_dict = G_Paging.create_g_paging_dict_fromDict(dict.parent_pagings_dict, false);
		return s_pages;
	}

	get thing(): Thing | null { return h.thing_forHID(this.thing_id.hash()) ?? null; }
	g_paging_for(g_cluster: G_Cluster): G_Paging { return this.g_paging_forPredicate_toChildren(g_cluster.predicate, g_cluster.isCluster_ofChildren); }
	g_pagings_dict_forChildren(isCluster_ofChildren: boolean): Dictionary<G_Paging> { return isCluster_ofChildren ? this.child_pagings_dict : this.parent_pagings_dict; }

	add_g_paging(g_paging: G_Paging) {
		const g_pagings = this.g_pagings_dict_forChildren(g_paging.isCluster_ofChildren);
		g_pagings[g_paging.kind] = g_paging;
	}

	g_paging_forPredicate_toChildren(predicate: Predicate, isCluster_ofChildren: boolean): G_Paging {
		let g_pagings = this.g_pagings_dict_forChildren(isCluster_ofChildren);
		let g_paging = g_pagings[predicate.kind]
		if (!g_paging) {
			g_paging = new G_Paging();
			g_paging.kind = predicate.kind;
			g_paging.thing_id = this.thing_id;
			g_pagings[predicate.kind] = g_paging;
			g_paging.isCluster_ofChildren = isCluster_ofChildren;
		}
		return g_paging;
	}

}
