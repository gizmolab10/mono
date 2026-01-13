import { controls, Size, Point, Ancestry, T_Graph } from '../common/Global_Imports';

export default class G_TreeBranches {
	show_child_branches = true;
	origin_ofLine = Point.zero;
	ancestry: Ancestry;
	size = Size.zero;

	// scratchpad for widgets, size_ofSubtree.height and center

	constructor(ancestry: Ancestry, show_child_branches: boolean = true) {
		this.show_child_branches = show_child_branches;
		this.ancestry = ancestry;
	}
		
	layout() {
		const ancestry = this.ancestry;
		const g_widget = ancestry.g_widget;
		if (controls.inTreeMode && !!ancestry && !!g_widget && (ancestry.isExpanded || ancestry.isRoot)) {
			let width = 0;
			const branchAncestries = ancestry.branchAncestries;
			const halfHeight = ancestry.halfHeight_ofVisibleSubtree;
			const origin_ofWidget = g_widget.origin_ofWidget.offsetByXY(1, halfHeight + 1);
			let height = -halfHeight;		// start out negative and grow positive
			for (const ancestry_ofBranch of [...branchAncestries]) {
				if (ancestry_ofBranch.depth > ancestry.depth) {
					const g_widget_ofBranch = ancestry_ofBranch.g_widget;
					g_widget_ofBranch.layout_subtree_for(height, origin_ofWidget, T_Graph.tree)
					width = Math.max(width, g_widget_ofBranch.width_ofWidget);
					height += g_widget_ofBranch.size_ofSubtree.height;
				}
			}
			this.size = new Size(width, height + halfHeight);
			this.origin_ofLine = origin_ofWidget.offsetByXY(25, 1.2);
		}
	}

}