import { g, h, k, u, x, Point, radial, Ancestry, Predicate } from '../common/Global_Imports';
import { G_Widget, G_Cluster, T_Kinship } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';
import { G_Paging } from './G_Paging';
import { get } from 'svelte/store';

export default class G_RadialGraph {
	g_parent_clusters: Dictionary<G_Cluster> = {};		// includes related
	g_child_clusters: Dictionary<G_Cluster> = {};

	destructor() {
		Object.values(this.g_parent_clusters).forEach(cluster => cluster.destructor());
		Object.values(this.g_child_clusters).forEach(cluster => cluster.destructor());
		this.g_parent_clusters = {};
		this.g_child_clusters = {};
	}

	static readonly _____LAYOUT: unique symbol;

	//////////////////////////////////////////////////
	// layout widgets, cluster lines, & paging arcs //
	//////////////////////////////////////////////////

	layout() {
		this.destructor();
		this.layout_forChildren_cluster(true);
		this.layout_forChildren_cluster(false);
		this.layout_focus();
		this.layout_forPaging();
	}

	layout_focus() {
		const ancestry = get(x.w_ancestry_focus);
		const g_focus = ancestry?.g_widget;
		if (!!g_focus && !!ancestry?.thing) {
			const width_ofTitle = ancestry.thing.width_ofTitle;
			const width_ofWidget = width_ofTitle + 13;
			const x = - 1 - (width_ofWidget / 2);
			const y = -10;
			const origin_ofWidget = g.center_ofGraphView.offsetByXY(x, y);
			g_focus.layout();
			g_focus.offset_ofWidget = Point.zero;
			g_focus.width_ofWidget = width_ofWidget + 5;
			g_focus.location_ofRadial = origin_ofWidget;
			g_focus.origin_ofRadial = origin_ofWidget.offsetByX(-width_ofTitle);	// adjust for printing
		}
	}

	layout_forChildren_cluster(isCluster_ofChildren: boolean) {
		const focus_ancestry = get(x.w_ancestry_focus);
		if (!!focus_ancestry) {
			if (isCluster_ofChildren) {
				let childAncestries = focus_ancestry.ancestries_createUnique_forKinship(T_Kinship.children);
				this.assignAncestries_toClusterFor(childAncestries, Predicate.contains, true);
			} else {
				for (const predicate of [...h?.predicates ?? []]) {
					const ancestries = focus_ancestry.ancestries_createUnique_forKinship(predicate.kinship_forChildren_cluster(false));
					this.assignAncestries_toClusterFor(ancestries, predicate, false);
				}
			}
		}	
	}

	static readonly _____CLUSTERS: unique symbol;

	get g_clusters(): Array<G_Cluster> {
		return u.concatenateArrays(Object.values(this.g_parent_clusters), Object.values(this.g_child_clusters));
	}

	get g_clusters_forPaging(): Array<G_Cluster> {
		return this.g_clusters.filter(cluster => cluster.ancestries.length > 0);
	}

	get g_cluster_atMouseLocation(): G_Cluster | null {
		for (const g_cluster of [...this.g_clusters]) {
			if (g_cluster.isMouse_insideThumb) {
				return g_cluster;
			}
		}
		return null;
	}

	private g_cluster_forPredicate_toChild(predicate: Predicate, isCluster_ofChildren: boolean) : G_Cluster {
		const g_clusters = isCluster_ofChildren ? this.g_child_clusters : this.g_parent_clusters;;
		let g_cluster = g_clusters[predicate.kind];
		if (!g_cluster) {
			g_cluster = new G_Cluster(predicate, isCluster_ofChildren);
			g_clusters[predicate.kind] = g_cluster;
		}
		return g_cluster;
	}

	static readonly _____ANCESTRIES: unique symbol;

	get total_ancestries(): number {
		return this.g_clusters.reduce((sum, cluster) => sum + cluster.total_widgets, 0);
	}

	private assignAncestries_toClusterFor(ancestries: Array<Ancestry> | null, predicate: Predicate | null, isCluster_ofChildren: boolean) {
		if (!!predicate && !!ancestries) {
			const g_cluster = this.g_cluster_forPredicate_toChild(predicate, isCluster_ofChildren);
			g_cluster.setAncestries(ancestries);
			for (const ancestry of [...ancestries]) {
				ancestry.g_widget.g_cluster = g_cluster;
			}
		}
	}

	static readonly _____NECKLACE: unique symbol;

	get visible_g_widgets(): G_Widget[] {
		let array: G_Widget[] = this.g_necklace_widgets;
		const g_focus = get(x.w_ancestry_focus)?.g_widget;
		if (!!g_focus) {
			array.push(g_focus);
		}
		return array
	}

	get g_necklace_widgets(): G_Widget[] {
		let g_widgets: G_Widget[] = [];
		for (const g_cluster of [...this.g_clusters]) {
			if (!!g_cluster) {
				for (const g_widget of [...g_cluster.g_cluster_widgets]) {
					g_widgets.push(g_widget);
				}
			}
		}
		return g_widgets;
	}

	static readonly _____PAGING: unique symbol;

	g_paging_forPredicate_toChildren(predicate: Predicate, isCluster_ofChildren: boolean): G_Paging | null {
		const g_thing_pages = radial.g_pages_forThingID(get(x.w_ancestry_focus)?.thing?.id);
		return g_thing_pages?.g_paging_forPredicate_toChildren(predicate, isCluster_ofChildren) ?? null;
	}

	layout_forPaging() {
		const radius = get(radial.w_resize_radius);
		const angle_per_widget = 40 / radius;			// Limit show so arc spread never exceeds 180°
		const maximum_portion = Math.floor(Math.PI / angle_per_widget);
		let remaining_toShow = Math.ceil(Math.pow(radius, 1.5) / k.height.row);
		if (this.total_ancestries > remaining_toShow || this.total_ancestries > maximum_portion) {
			let clusters = this.g_clusters_forPaging;
			clusters.sort((a, b) => a.total_widgets - b.total_widgets);		// sort clusters by widgets count, smallest first
			while (clusters.length > 0 && remaining_toShow > 0) {
				const portion = Math.min(Math.ceil(remaining_toShow / clusters.length), maximum_portion);
				const cluster = clusters[0];
				const show = Math.min(portion, cluster.total_widgets);
				remaining_toShow -= show;
				cluster.widgets_shown = show;
				clusters.shift();
			}
		}
		for (const g_cluster of [...this.g_clusters_forPaging]) {
			g_cluster.layout_forPaging();
		}
	}

}

export const g_graph_radial = new G_RadialGraph();
