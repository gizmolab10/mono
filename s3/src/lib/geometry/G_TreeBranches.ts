import { Point }       from '../types/Coordinates';
import { k }           from '../common/Constants';
import { G_TreeLine }  from './G_TreeLine';
import { G_Widget }    from './G_Widget';
import type { Ancestry } from '../nav/Ancestry';

export class G_TreeBranches {
	readonly ancestry    : Ancestry;
	readonly parentCenter: Point;
	readonly depth       : number;

	constructor(ancestry: Ancestry, parentCenter: Point, depth: number) {
		this.ancestry     = ancestry;
		this.parentCenter = parentCenter;
		this.depth        = depth;
	}

	static subtreeHeight(ancestry: Ancestry, depth: number): number {
		if (!ancestry.shows_branches || depth <= 0) return k.height.row;
		const branches = ancestry.branchAncestries;
		if (branches.length === 0) return k.height.row;
		let total = 0;
		for (const branch of branches) {
			total += G_TreeBranches.subtreeHeight(branch, depth - 1);
		}
		return total;
	}

	private static readonly lineGap = 20;

	get centers(): Point[] {
		const branches = this.ancestry.branchAncestries;
		if (branches.length === 0) return [];
		const parentTitle     = this.ancestry.thing?.title ?? '';
		const parentHalfWidth = G_Widget.widthFor(parentTitle) / 2;
		const leftEdgeX       = this.parentCenter.x + parentHalfWidth + G_TreeBranches.lineGap;
		const heights = branches.map(b => G_TreeBranches.subtreeHeight(b, this.depth - 1));
		const total   = heights.reduce((sum, h) => sum + h, 0);
		const delta   = (heights[heights.length - 1] - heights[0]) / 4;
		let y         = this.parentCenter.y - total / 2 + delta;
		return branches.map((branch, i) => {
			const childTitle     = branch.thing?.title ?? '';
			const childHalfWidth = G_Widget.widthFor(childTitle, branch.hasChildren) / 2;
			const center = new Point(leftEdgeX + childHalfWidth, y + heights[i] / 2);
			y += heights[i];
			return center;
		});
	}

	get origin_ofLine(): Point {
		const parentTitle     = this.ancestry.thing?.title ?? '';
		const parentHalfWidth = G_Widget.widthFor(parentTitle) / 2;
		return this.parentCenter.offsetByX(parentHalfWidth);
	}

	get branchItems(): Array<{ branch: Ancestry; center: Point; line: G_TreeLine }> {
		const branches = this.ancestry.branchAncestries;
		const centers  = this.centers;
		const trunk    = this.origin_ofLine;
		return branches.map((branch, i) => {
			const childTitle     = branch.thing?.title ?? '';
			const childHalfWidth = G_Widget.widthFor(childTitle, branch.hasChildren) / 2;
			return {
				branch,
				center: centers[i],
				line:   new G_TreeLine(trunk, new Point(centers[i].x - childHalfWidth, centers[i].y)),
			};
		});
	}
}
