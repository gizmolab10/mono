import { Point }    from '../types/Coordinates';
import { k }        from '../common/Constants';
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
		const branches = ancestry.branchAncestries;
		if (branches.length === 0 || depth <= 0) return k.height.row;
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
		let y         = this.parentCenter.y - total / 2;
		return heights.map(h => {
			const center = new Point(x, y + h / 2);
			y += h;
			return center;
		});
	}

	get branchItems(): Array<{ branch: Ancestry; center: Point }> {
		const branches = this.ancestry.branchAncestries;
		const centers  = this.centers;
		return branches.map((branch, i) => ({ branch, center: centers[i] }));
	}
}
