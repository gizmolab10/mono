import { Point } from '../types/Coordinates';
import type { Ancestry } from '../nav/Ancestry';

class S_TreeGraph {
	graph_width       = $state(0);
	graph_height      = $state(0);
	attached_branches = new Set<string>();

	get focus_center(): Point {
		return new Point(this.graph_width * 0.2, this.graph_height / 2);
	}

	update_size(width: number, height: number): void {
		this.graph_width  = width;
		this.graph_height = height;
	}

	reset_attached_branches(): void {
		this.attached_branches.clear();
	}

	branch_isAlready_attached(ancestry: Ancestry): boolean {
		if (this.attached_branches.has(ancestry.id)) return true;
		this.attached_branches.add(ancestry.id);
		return false;
	}

	grand_sweep(): void {
		this.reset_attached_branches();
	}
}

export const g_treeGraph = new S_TreeGraph();
