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

	get centers(): Point[] {
		const branches = this.ancestry.branchAncestries;
		if (branches.length === 0) return [];
		const x       = this.parentCenter.x + 150;
		const heights = branches.map(b => G_TreeBranches.subtreeHeight(b, this.depth - 1));
		const total   = heights.reduce((sum, h) => sum + h, 0);
		const delta   = (heights[heights.length - 1] - heights[0]) / 4;
		let y         = this.parentCenter.y - total / 2 + delta;
		return heights.map(h => {
			const center = new Point(x, y + h / 2);
			y += h;
			return center;
		});
	}

	get origin_ofLine(): Point {
		const parentTitle     = this.ancestry.thing?.title ?? '';
		const parentHalfWidth = G_Widget.widthFor(parentTitle) / 2;
		return this.parentCenter.offsetByX(parentHalfWidth + 5);
	}

	get branchItems(): Array<{ branch: Ancestry; center: Point; line: G_TreeLine }> {
		const branches = this.ancestry.branchAncestries;
		const centers  = this.centers;
		const trunk    = this.origin_ofLine;
		return branches.map((branch, i) => {
			const childTitle     = branch.thing?.title ?? '';
			const childHalfWidth = G_Widget.widthFor(childTitle) / 2;
			return {
				branch,
				center: centers[i],
				line:   new G_TreeLine(trunk, new Point(centers[i].x - childHalfWidth, centers[i].y)),
			};
		});
	}
}
