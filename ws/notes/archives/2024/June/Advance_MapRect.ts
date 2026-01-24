import { k, s, get, Rect, Size, Point, Ancestry, Predicate, ElementType, ElementState } from '../common/GlobalImports'
	import { s_clusters } from '../state/ReactiveState';

export default class Advance_MapRect extends Rect {
	elementState: ElementState;
	predicate: Predicate;
	points_out: boolean;
	isForward: boolean;
	ancestry: Ancestry;
	subtype = k.empty;
	isVisible = true;
	upper_limit = 0;
	title = 'r';

	constructor(ancestry: Ancestry, predicate: Predicate, upper_limit: number, points_out: boolean, isForward: boolean) {
		super(Point.zero, new Size(0, 200));
		this.upper_limit = upper_limit;
		this.points_out = points_out;
		this.predicate = predicate;
		this.isForward = isForward;
		this.ancestry = ancestry;
		this.subtype = this.compute_subtype();
		this.elementState = this.compute_elementState();
		this.title = this.predicate.isBidirectional ? 'r' : this.points_out ? 'c' : 'p';
		this.origin.x = (this.subtype.length + 16) * k.debug_size - 600;	// move rect (this)
		this.update_isVisible();
	}

	compute_subtype() {
		const effect = this.isForward ? 'forward-unto-dawn' : 'backward';
		const relation = this.points_out ? 'children' : 'parentisis';
		const subtype = `${this.predicate.kind}-${relation}-${effect}`;
		return subtype;
	}

	compute_elementState() {
		const state = s.elementState_for(this.ancestry, ElementType.advance, this.subtype);
		state.set_forHovering(this.ancestry.thing?.color ?? 'red', 'transparent');
		state.color_background = 'transparent';
		state.defaultCursor = 'pointer';
		state.hoverCursor = 'pointer';
		return state;
	}

	update_isVisible() {
		this.isVisible = true;
		const index = get(s_clusters).index_for(this.points_out, this.predicate)
		if (index == this.upper_limit && this.isForward) {
			this.isVisible = false;
		}
		if (index == 0 && !this.isForward) {
			this.isVisible = false;
		}
	}

}