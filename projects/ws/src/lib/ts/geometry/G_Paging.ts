import { h, k, radial, Thing, Predicate, Ancestry } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';

export class G_Paging {

	// a page is a subset of a too-long list of things
	// widgets_shown == length of subset
	// thing id refers to "owner"
	// index == first of subset

	isCluster_ofChildren = false;
	thing_id = k.empty;
	widgets_shown = 0;
	total_widgets = 0;
	kind = k.empty;
	index = 0;			// this value changes when user moves paging arc [thumb] slider, or when widget needs to be visible and isn't

	constructor(index: number = 0, widgets_shown: number = 0, total_widgets: number = 0) {
		this.index = index.force_asInteger_between(0, total_widgets - widgets_shown);
		this.total_widgets = total_widgets;
		this.widgets_shown = widgets_shown;
	}

	get isPaging(): boolean { return this.widgets_shown < this.total_widgets; }
	get indexOf_followingPage(): number { return this.index + this.widgets_shown; }
	get maximum_paging_index(): number { return this.total_widgets - this.widgets_shown; }
	get thing(): Thing | null { return h.thing_forHID(this.thing_id.hash()) ?? null; }
	get predicate(): Predicate | null { return h.predicate_forKind(this.kind) ?? null; }
	get sub_key(): string { return `${this.thing_id}${k.separator.generic}${this.kind}${k.separator.generic}${this.isCluster_ofChildren}`; }
	ancestry_atIndex(ancestries: Array<Ancestry>): Ancestry { return ancestries[Math.round(this.index)]; }
	
	index_isVisible(index: number): boolean {
		return index.isBetween(this.index, this.indexOf_followingPage - 1, true);
	}

	addTo_paging_index_for(delta: number): boolean {
		return (delta == 0) ? false : this.update_index_toShow(this.index + delta);
	}

	update_index_toShow(index: number): boolean {
		const prior = this.index;
		if (index == this.indexOf_followingPage) {
			this.index = (this.index + 1).force_between(0, this.maximum_paging_index);		// increment index by 1
		} else {
			this.index = index.force_between(0, this.maximum_paging_index);					// force == wrap around
		}
		const changed = this.index != prior;
		if (changed) {
			radial.w_g_paging.set(this);
		}
		return changed;
	}

	onePage_from(widgets_shown: number, ancestries: Array<Ancestry>): Array<Ancestry> {
		this.total_widgets = ancestries.length;
		this.widgets_shown = widgets_shown;
		this.update_index_toShow(this.index);
		const index = Math.round(this.index);
		return ancestries.slice(index, index + widgets_shown);
	}

	static create_g_paging_fromDict(dict: Dictionary, isCluster_ofChildren: boolean): G_Paging {
		const g_paging = new G_Paging(dict.index ?? 0, dict.widgets_shown ?? 0, dict.total_widgets);
		g_paging.isCluster_ofChildren = isCluster_ofChildren;
		g_paging.thing_id = dict.thing_id;
		g_paging.kind = dict.kind;
		return g_paging;
	}

	static create_g_paging_dict_fromDict(dict: Dictionary, isCluster_ofChildren: boolean): Dictionary<G_Paging> {
		const result: Dictionary<G_Paging> = {}
		for (const [key, subdict] of Object.entries(dict)) {
			result[key] = this.create_g_paging_fromDict(subdict, isCluster_ofChildren);
		}
		return result;
	}

}
