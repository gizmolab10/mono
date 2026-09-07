import { k, u, get, Point, Ancestry, Predicate, TreeLayout, ChildMapRect, ClusterLayout } from '../common/GlobalImports';
import { s_layout_asClusters } from '../state/State';
import { h } from '../db/DBDispatch';

export default class Layout {
	childMapRects: Array<ChildMapRect> = [];
	clusterLayouts: Array<ClusterLayout> = [];

	constructor(focusAncestry: Ancestry, origin: Point) {
		let childAncestries = focusAncestry.childAncestries;
		if (get(s_layout_asClusters)) {
			this.cluster_layout(focusAncestry, childAncestries, Predicate.contains, origin, true);
			for (const predicate of h.predicates) {
				let oneAncestries = focusAncestry.thing?.oneAncestries_for(predicate) ?? [];
				this.cluster_layout(focusAncestry, oneAncestries, predicate, origin, false);
			}
		} else {
			let sum = -focusAncestry.visibleProgeny_height() / 2; // start out negative and grow positive
			for (const childAncestry of childAncestries) {
				const tree_layout = new TreeLayout(sum, focusAncestry, childAncestry, origin);
				this.childMapRects = u.concatenateArrays(this.childMapRects, tree_layout.childMapRects);
				sum += tree_layout.childHeight;
			}
		}
	}

	cluster_layout(cluster_ancestry: Ancestry, ancestries: Array<Ancestry>, predicate: Predicate | null, origin: Point, points_out: boolean) {
		const clusterLayout = new ClusterLayout(cluster_ancestry, ancestries, predicate, points_out);
		const clusterMaps = clusterLayout.childMapRects(origin);
		this.childMapRects = u.concatenateArrays(this.childMapRects, clusterMaps);
		this.clusterLayouts.push(clusterLayout);
	}
}