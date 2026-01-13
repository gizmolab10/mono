import { c, e, k, p, u, hits, show, debug, g_graph_tree, g_graph_radial, signals, controls, features } from '../common/Global_Imports';
import { Rect, Size, Point, Thing, Ancestry } from '../common/Global_Imports';
import { G_Widget, T_Graph, T_Preference } from '../common/Global_Imports';
import { get, writable } from 'svelte/store';

export default class Geometry {

	static readonly _____TREE: unique symbol;

	w_depth_limit			= writable<number>(3);
	w_branches_areChildren	= writable<boolean>(true);

	static readonly _____GRAPH_VIEW: unique symbol;

	w_user_graph_center		= writable<Point>();
	w_user_graph_offset		= writable<Point>();
	w_rect_ofGraphView		= writable<Rect>();
	w_scale_factor			= writable<number>(1);

	restore_preferences() {
		this.w_depth_limit.set(p.read_key(T_Preference.levels) ?? 12);
		this.update_rect_ofGraphView();	// needed for set_scale_factor
		this.set_scale_factor(p.read_key(T_Preference.scale) ?? 1);
		this.renormalize_user_graph_offset();	// must be called after apply scale (which otherwise fubars offset)
		document.documentElement.style.setProperty('--css-body-width', this.windowSize.width.toString() + 'px');
	}

	static readonly _____GRAPHS: unique symbol;

	grand_build() {
		signals.signal_rebuildGraph_fromFocus();
	}
	
	grand_sweep() {
		this.layout();
		this.grand_build();
	}

	layout() {
		if (controls.inRadialMode) {
			g_graph_radial.layout();
		} else {
			g_graph_tree.layout();
		}
		// NB: set html element fails (in S_Component)
		// if id does not match, or exist yet
		signals.signal_reposition_widgets_fromFocus();
	}

	grand_adjust_toFit() {
		const graphView_size = get(this.w_rect_ofGraphView).size;
		const layout_size = this.rect_ofAllWidgets.size;
		const scale_factor = layout_size.best_ratio_to(graphView_size);
		const new_size = layout_size.dividedEquallyBy(scale_factor);
		const new_offset = get(this.w_user_graph_offset).dividedEquallyBy(scale_factor);
		// also detect if layout is really needed by difference from prior center and offset
		this.w_user_graph_center.set(new_size.asPoint.dividedInHalf);
		this.w_user_graph_offset.set(new_offset);
		this.set_scale_factor(scale_factor);
		this.layout();
	}

	static readonly _____WIDGETS: unique symbol;

	get rect_ofAllWidgets(): Rect { return u.get_rect_ofGraphDrawing_forAll_g_widgets(this.all_g_widgets); }

	get all_g_widgets(): G_Widget[] {
		if (controls.inRadialMode) {
			return g_graph_radial.visible_g_widgets;
		} else {
			return g_graph_tree.visible_g_widgets;
		}
	}

	static readonly _____RECT_OF_GRAPH_VIEW: unique symbol;

	get center_ofGraphView(): Point { return get(this.w_rect_ofGraphView).size.asPoint.dividedInHalf; }

	update_rect_ofGraphView() {
		// respond to changes in: window size & details visibility
		const secondary_below_primary_controls = features.allow_tree_mode && (get(show.w_show_search_controls) || (get(show.w_t_graph) == T_Graph.tree));
		const y = (this.controls_boxHeight) * (secondary_below_primary_controls ? 2 : 1) - 5;	// below primary and secondary controls
		const x = get(show.w_show_details) ? k.width.details : 5;							// right of details
		const origin_ofGraphView = new Point(x, y);
		const size_ofGraphView = this.windowSize.reducedBy(origin_ofGraphView).reducedBy(Point.square(k.thickness.separator.main - 1));
		const rect = new Rect(origin_ofGraphView, size_ofGraphView);
		debug.log_mouse(`GRAPH View ====> ${rect.description}`);
		this.w_rect_ofGraphView.set(rect);													// emits a signal, to adjust the graph location
	}

	static readonly _____USER_OFFSET: unique symbol;
	
	renormalize_user_graph_offset() { this.set_user_graph_offsetTo(this.persisted_user_offset); }
	get user_offset_toGraphDrawing(): Rect { return this.rect_ofAllWidgets.offsetBy(get(this.w_user_graph_offset)); }
	get mouse_distance_fromGraphCenter(): number { return this.mouse_vector_ofOffset_fromGraphCenter()?.magnitude ?? 0; }
	get mouse_angle_fromGraphCenter(): number | null { return this.mouse_vector_ofOffset_fromGraphCenter()?.angle ?? null; }

	get persisted_user_offset(): Point {
		const point = p.read_key(T_Preference.user_offset) ?? {x:0, y:0};
		return new Point(point.x, point.y);
	}

	mouse_vector_ofOffset_fromGraphCenter(offset: Point = Point.zero): Point | null {
		const scaled_mouse_location = get(e.w_mouse_location_scaled);
		return this.vector_fromScaled_mouseLocation_andOffset_fromGraphCenter(scaled_mouse_location, offset);
	}

	vector_fromScaled_mouseLocation_andOffset_fromGraphCenter(mouse_location: Point, offset: Point = Point.zero): Point | null {
		if (!!mouse_location) {
			const center_offset = get(this.w_user_graph_center).offsetBy(offset);
			const mouse_vector = center_offset.vector_to(mouse_location);
			debug.log_mouse(`offset  ${get(this.w_user_graph_offset).verbose}  ${mouse_vector.verbose}`);
			return mouse_vector;
		}
		return null
	}

	set_user_graph_offsetTo(user_offset: Point): boolean {
		// user_offset of zero centers the graph
		let changed = false;
		const current_offset = get(this.w_user_graph_offset);
		if (!!current_offset && current_offset.vector_to(user_offset).magnitude > 1) {
			p.write_key(T_Preference.user_offset, user_offset);								// persist user_offset
			changed = true;
		}
		const center_offset = get(this.w_rect_ofGraphView).center.offsetBy(user_offset);	// center of the graph in window coordinates
		this.w_user_graph_center.set(center_offset);										// w_user_graph_center: a signal change
		this.w_user_graph_offset.set(user_offset);											// w_user_graph_offset: a signal change
		debug.log_mouse(`USER ====> ${user_offset.verbose}  ${center_offset.verbose}`);
		if (changed) {
			setTimeout(() => {
				hits.recalibrate();
			}, 100);
		}
		return changed;
	}

	ancestry_isCentered(ancestry: Ancestry | null): boolean {
		const title_center = ancestry?.center_ofTitle;
		if (!!title_center) {
			const center = get(this.w_user_graph_center);
			const user_offset = get(this.w_user_graph_offset);
			const delta = title_center.vector_to(center).vector_to(user_offset).magnitude;
			return delta < 1;
		}
		return false;
	}

	ancestry_place_atCenter(ancestry: Ancestry | null) {
		const title_center = ancestry?.center_ofTitle;
		if (!!title_center) {
			const center = get(this.w_user_graph_center);
			const offset = title_center.vector_to(center);	// use this vector to set the user graph offset
			this.set_user_graph_offsetTo(offset);
		}
	}

	static readonly _____DETAILS: unique symbol;

	get glows_banner_height(): number { return get(c.w_device_isMobile) ? 32 : 20; }
	get controls_boxHeight(): number { return this.glows_banner_height + k.height.segmented; }

	static readonly _____BREADCRUMBS: unique symbol;

	get breadcrumbs_top(): number { return this.windowSize.height - this.controls_boxHeight; }

	layout_breadcrumbs(ancestries: Array<Ancestry>, centered: boolean, left: number, thresholdWidth: number): [Array<Ancestry>, Array<number>, Array<number>, number] {
		if (!ancestries) {
			return [[], [], [], 0];
		}
		const crumb_ancestries: Array<Ancestry> = [];
		const widths: Array<number> = [];
		let parent_widths = 0;						// encoded as one parent count per 2 digits (base 10) ... for triggering redraw
		let total = 0;								// determine how many crumbs will fit
		for (const a of ancestries.reverse()) {
			if (!!a.thing) {
				const width = u.getWidthOf(a.thing.breadcrumb_title) + 29;	// 29 px gap for separator character and button border
				if ((total + width) > thresholdWidth) {
					break;
				}
				total += width;
				widths.push(width);
				crumb_ancestries.push(a);
				debug.log_crumbs(`ONE ${width} ${a.thing.title}`);
				parent_widths = parent_widths * 100 + width;
			}
		}
		if (centered) {
			left += (thresholdWidth - total) / 2;
		}
		let lefts = [left];
		for (const width of widths.reverse()) {
			left += width;				// position of next crumb
			lefts.push(left);
		}
		return [crumb_ancestries.reverse(), widths.reverse(), lefts, parent_widths];
	}

	static readonly _____WINDOW: unique symbol;
	
	get windowScroll(): Point { return new Point(window.scrollX, window.scrollY); }
	get inner_windowSize(): Size { return new Size(window.innerWidth, window.innerHeight); }
	get windowSize(): Size { return this.inner_windowSize.dividedEquallyBy(get(this.w_scale_factor)); }

	static readonly _____SCALE_FACTOR: unique symbol;

	scaled_rect_forElement(element: HTMLElement | null): Rect | null {
		const scale_factor = get(this.w_scale_factor);
		const rect = Rect.rect_forElement(element);
		return !!rect ? rect.dividedEquallyBy(scale_factor) : null;
	}

	set_scale_factor(scale_factor: number) {
		// this.w_scale_factor.set(scale_factor);	// needed to edit things
		// p.write_key(T_Preference.scale, scale_factor);
		// const doc = document.documentElement;
		// doc.style.setProperty('zoom', scale_factor.toString());
		// doc.style.height = `${100 / scale_factor}%`;
		// doc.style.width = `${100 / scale_factor}%`;
		// this.update_rect_ofGraphView();
	}

}

export const g = new Geometry();