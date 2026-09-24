import { k, Rect, Size, Point, T_Tree_Line, svgPaths, Ancestry } from '../common/Global_Imports';

export default class G_TreeLine {
	t_curve: string = T_Tree_Line.flat;
	ancestry: Ancestry | null;	// main end of the line
	other_ancestry: Ancestry;	// other end of the line (N.B. main can be deeper!!)
	isBidirectional: boolean;
	points_atOther = true;
	origin = Point.zero;
	extent = Point.zero;
	linePath = k.empty;
	rect = Rect.zero;
	size = Size.zero;
	stroke_width = 1;
	name = k.empty;

	// scratchpad for one line drawn
	// from the "main" widget to its "other" {child OR bidirectional} widget

	constructor(ancestry: Ancestry | null, other_ancestry: Ancestry, isBidirectional: boolean = false) {
		this.name = ancestry?.title ?? k.empty;
		this.isBidirectional = isBidirectional;
		this.other_ancestry = other_ancestry;
		this.ancestry = ancestry;
	}

	get branchAncestry(): Ancestry | null { return this.points_atOther ? this.other_ancestry : this.ancestry; }
	get depth_ofLine(): number { return Math.max(this.ancestry?.depth ?? 0, this.other_ancestry.depth); }
		
	layout() {
		this.layout_svgPaths();
		this.update_name();
	}

	set_curve_type_forHeight(height: number) {
		if (height > 1) {
			this.t_curve = T_Tree_Line.down;
		} else if (height < -1) {
			this.t_curve = T_Tree_Line.up;
		} else {
			this.t_curve = T_Tree_Line.flat;
		}
	}

	static readonly _____INTERNAL: unique symbol;

	private update_name() {
		if (!!this.ancestry && !this.ancestry.equals(this.other_ancestry)) {
			this.name = `${this.ancestry.titles.join('.')}...${this.other_ancestry.titles.join('.')}`;
		}
	}
		
	private layout_svgPaths() {
		const lineOffset = new Point(-118.5, 1.5);
		let lineRect = this.rect.offsetBy(lineOffset).extend_widthBy(-4);
		switch (this.t_curve) {
			case T_Tree_Line.up:
				this.origin = lineRect.origin;
				this.extent = lineRect.extent.offsetByY(-1.5);
				break;
			case T_Tree_Line.down:
				this.origin = lineRect.bottomLeft.offsetByY(-0.5);
				this.extent = this.origin.offsetBy(lineRect.size.asPoint).offsetByY(0.5);
				break;
			case T_Tree_Line.flat:
				lineRect = lineRect.offsetByY(-1);
				this.origin = lineRect.centerLeft;
				this.extent = lineRect.centerRight;
				this.linePath = svgPaths.line(this.origin.vector_to(this.extent));
				break;
		}
		const vector = this.origin.vector_to(this.extent);
		this.size = vector.abs.asSize;
		if (this.t_curve != T_Tree_Line.flat) {
			const flag = (this.t_curve == T_Tree_Line.down) ? 0 : 1;
			const originY = this.t_curve == T_Tree_Line.down ? 0 : this.size.height;
			const extentY = this.t_curve == T_Tree_Line.up   ? 0 : this.size.height;
			this.linePath = `M0 ${originY} A ${this.size.description} 0 0 ${flag} ${this.size.width} ${extentY}`;
		}
	}

}