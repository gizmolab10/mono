import { g, h, k, u, x, show, debug, search, controls, features, svgPaths, databases, components } from '../common/Global_Imports';
import { T_Graph, T_Create, T_Kinship, T_Predicate, T_Alteration, T_Hit_Target } from '../common/Global_Imports';
import { Rect, Size, Point, Thing, Direction, Predicate, Relationship } from '../common/Global_Imports';
import { S_Items, S_Component, S_Title_Edit } from '../common/Global_Imports';
import { G_Widget, G_Cluster, G_TreeLine } from '../common/Global_Imports';
import type { Dictionary, Integer } from '../types/Types';
import { T_Database } from '../database/DB_Common';
import { G_Paging } from '../geometry/G_Paging';
import { get, Writable } from 'svelte/store';
import Identifiable from './Identifiable';

export default class Ancestry extends Identifiable {
	g_widgets: Dictionary<G_Widget> = {};
	t_database: string;
	kind: string;

	// id => ancestry (path) string 
	//   "   composed of ids of each relationship
	// NOTE: first relationship's parent is always the root
	//   "   kind is from the last relationship
	//    all children are of that kind of predicate

	constructor(t_database: string, path: string = k.root, kind: string = T_Predicate.contains) {
		super(path);
		this.kind = kind;
		this.t_database = t_database;
	}
	
	static readonly _____TRAVERSE: unique symbol;

	traverse(apply_closureTo: (ancestry: Ancestry) => boolean, t_kinship: T_Kinship = T_Kinship.children, visited: string[] = []) {
		const id = this.thing?.id;
		if (!!id && !visited.includes(id) && !apply_closureTo(this)) {
			for (const progeny of this.ancestries_createUnique_forKinship(t_kinship)) {
				progeny.traverse(apply_closureTo, t_kinship, [...visited, id]);
			}
		}
	}

	async async_traverse(apply_closureTo: (ancestry: Ancestry) => Promise<boolean>, t_kinship: T_Kinship = T_Kinship.children, visited: string[] = []) {
		const id = this.thing?.id;
		if (!!id && !visited.includes(id)) {
			try {
				if (!await apply_closureTo(this)) {
					for (const progeny of this.ancestries_createUnique_forKinship(t_kinship)) {
						await progeny.async_traverse(apply_closureTo, t_kinship, [...visited, id]);
					}
				}
			} catch (error) {
				console.error('Error during async_traverse:', error);
			}
		}
	}
	
	static readonly _____GEOMETRY: unique symbol;

	get g_widget():			 G_Widget { return this.g_widget_for_t_graph(get(show.w_t_graph)); }
	get g_paging():	  G_Paging | null { return this.g_cluster?.g_paging_forAncestry(this) ?? null; }
	get g_cluster(): G_Cluster | null { return this.g_widget.g_cluster ?? null; }

	g_widget_for_t_graph(t_graph: T_Graph): G_Widget {
		let g_widget = this.g_widgets[t_graph];
		if (!g_widget) {
			g_widget = G_Widget.empty(this);
			this.g_widgets[t_graph] = g_widget;
		}
		return g_widget;
	}
	
	static readonly _____FOCUS: unique symbol;

	get isFocus(): boolean { return get(x.w_ancestry_focus)?.equals(this) ?? false; }
	becomeFocus(): boolean { return x.becomeFocus(this); }

	get depth_below_focus(): number {
		const focus = get(x.w_ancestry_focus);
		if (!!focus) {
			return Math.abs(this.depth - focus.depth);
		}
		return 0;
	}

	get isVisible_accordingTo_depth_below_focus(): boolean {
		const depth_limit = this.depth_limit;
		if (!!depth_limit) {
			return this.depth_below_focus < depth_limit;
		}
		return true;
	}

	reveal_toFocus() {
		const parentAncestry = this.parentAncestry;
		if (!!parentAncestry && !parentAncestry.isFocus) {
			if (!this.ancestors.some(a => a.isFocus)) {
				// if focus is not among ancestors, change the focus to parent
				parentAncestry.becomeFocus();
			}
			parentAncestry.reveal_toFocus();
			parentAncestry.expand();
		}
	}

	static readonly _____THINGS: unique symbol;

	get thing():  Thing | null { return h?.thing_forAncestry(this) ?? null; }
	get si_children(): S_Items<Thing> { return new S_Items<Thing>(this.children); }
	get children():  Array<Thing> { return h?.things_forAncestries(this.childAncestries) ?? []; }
	get ancestors(): Array<Thing> { return h?.things_forAncestry(this) ?? []; }
	get parents():  Array<Thing> { return this.thing?.parents ?? []; }

	thingAt(back: number): Thing | null {			// 1 == last
		const relationship = this.relationshipAt(back);
		if (!!relationship && !this.isRoot) {
			return relationship.child;
		}
		return h.root;	// N.B., h.root is wrong immediately after switching db type
	}

	things_childrenFor(kind: string): Array<Thing> {
		const relationships = h.relationships_ofKind_forParents_ofThing(kind, true, this.thing);
		let children: Array<Thing> = [];
		if (!this.isRoot && !!relationships) {
			for (const relationship of relationships) {
				const parent = relationship.parent;
				if (!!parent) {
					children.push(parent);
				}
			}
		}
		return children;
	}

	static readonly _____RELATIONSHIPS: unique symbol;
	
	get relationship():			 Relationship | null { return this.relationshipAt(); }
	get count_ofParents():					  number { return this.parentRelationships.length; }
	get relevantRelationships_count():		  number { return this.relevantRelationships.length; }
	get hasRelationships():					 boolean { return this.hasParents || this.hasChildren; }
	get hasRelevantRelationships():			 boolean { return this.relevantRelationships.length > 0; }
	get relevantRelationships(): Array<Relationship> { return this.relationships_forChildren(true); }
	get relationship_hids():		  Array<Integer> { return this.relationship_ids.map(i => i.hash()); }
	get parentRelationships():	 Array<Relationship> { return h.relationships_ofKind_forParents_ofThing(this.kind, true, this.thing); }
	get childRelationships():	 Array<Relationship> { return h.relationships_ofKind_forParents_ofThing(this.kind, false, this.thing); }
	get relationship_ids():			  Array <string> { return this.isRoot ? [] : this.pathString.split(k.separator.generic); }

	get relationships(): Array<Relationship> {
		const relationshipHIDs = this.relationship_hids.map(hid => h.relationship_forHID(hid)) ?? [];
		return u.strip_invalid(relationshipHIDs);
	}

	count_ofChilcren(forChildren: boolean):						  number { return this.relationships_forChildren(forChildren).length; }
	relationshipAt(back: number = 1):				 Relationship | null { return h.relationship_forHID(this.idAt(back).hash()) ?? null; }
	relationships_forChildren(forChildren: boolean): Array<Relationship> { return forChildren ? this.childRelationships : this.parentRelationships; }

	static readonly _____SVG: unique symbol;

	svgPathFor_tiny_outer_dot_pointTo_child(pointsTo_child: boolean): string | null {
		const in_radial_mode = controls.inRadialMode;
		const tiny_outer_dots_count = this.count_ofChilcren(pointsTo_child);
		const isVisible_forChild = this.hasChildren && show.children_dots && (in_radial_mode ? true : !this.isExpanded);
		const isVisible_inRadial = pointsTo_child ? isVisible_forChild : this.hasParents && (this.isBidirectional ? show.related_dots : show.parent_dots);
		const show_tiny_outer_dots = in_radial_mode ? isVisible_inRadial : (isVisible_forChild || this.hidden_by_depth_limit);
		return !show_tiny_outer_dots ? null : svgPaths.tiny_outer_dots_circular(k.tiny_outer_dots.diameter, tiny_outer_dots_count as Integer, this.points_right);
	}

	static readonly _____BIDIRECTIONALS: unique symbol;
	
	get isBidirectional(): boolean { return this.predicate?.isBidirectional ?? false; }

	get bidirectional_ancestries(): Array<Ancestry> {
		let ancestries: Array<Ancestry> = []
		if (!!h) {
			for (const predicate of h.predicates) {
				if (predicate.isBidirectional) {
					const parents = h.ancestries_create_forThing_andPredicate(this.thing, predicate);
					if (!!parents) {	// each of the parents is bidirectional TO this ancestry's thing
						ancestries = u.uniquely_concatenateArrays_ofIdentifiables(ancestries, parents) as Array<Ancestry>;
					}
				}
			}
		}
		return ancestries;
	}

	get g_lines_forBidirectionals(): Array<G_TreeLine> {
		let found: Array<G_TreeLine> = [];
		const depth = this.depth + 1;
		for (const bidirectional of this.bidirectional_ancestries) {
			const others = bidirectional.thing?.ancestries;
			if (!!others) {
				for (const other of others) {
					if (other.isVisible && other.depth > depth && other.pathString != bidirectional.pathString) {
						const g_line = this.g_line_bidirectionaTo(other);
						found.push(g_line);
					}
				}
			}
		}
		return found;
	}

	g_line_bidirectionaTo(other: Ancestry) : G_TreeLine {
		const g_line = new G_TreeLine(this, other, true);
		const offset_x = -(k.height.line + k.height.dot / 2);
		const extent = other.g_widget.absolute_center_ofDrag;
		const origin = this.g_widget.absolute_center_ofReveal;
		const rect = Rect.createExtentRect(origin, extent).offsetByX(offset_x).offsetByXY(-0.5, 0);
		g_line.set_curve_type_forHeight(rect.height);
		g_line.rect = rect;
		return g_line;
	}

	static readonly _____VISIBILITY: unique symbol;

	get depth_limit():				   number { return get(g.w_depth_limit) ?? 0; }
	get halfHeight_ofVisibleSubtree(): number { return this.height_ofVisibleSubtree() / 2; }
	get halfSize_ofVisibleSubtree():     Size { return this.size_ofVisibleSubtree.dividedInHalf; }
	get size_ofVisibleSubtree():	     Size { return new Size(this.visibleSubtree_width(), this.height_ofVisibleSubtree()); }
	get hidden_by_depth_limit():	  boolean { return !this.isVisible_accordingTo_depth_below_focus && this.isExpanded && this.hasChildren && controls.inTreeMode; }

	assure_isVisible_within(ancestries: Array<Ancestry>) {
		if (!!this.predicate && controls.inRadialMode) {
			const index = u.indexOf_withMatchingThingID_in(this, ancestries);
			const g_paging = this.g_cluster?.g_paging;
			if (!!g_paging && !g_paging.index_isVisible(index)) {
				return g_paging.update_index_toShow(index);		// change paging
			}
		}
		return false;
	}

	ancestry_assureIsVisible(): boolean {
		if (!this.isVisible) {
			if (controls.inTreeMode) {
				const depth_limit = this.depth_limit;
				const focusAncestry = this.ancestry_createUnique_byStrippingBack(depth_limit);
				focusAncestry?.becomeFocus();
				this.reveal_toFocus();
			} else {
				this.parentAncestry?.becomeFocus();
				this.assure_isVisible_within(this.sibling_ancestries);
			}
			return true;
		}
		return false
	}

	get isVisible(): boolean {
		let isVisible = false;
		if (controls.inRadialMode) {
			const parent = this.parentAncestry;
			const childIsFocus = get(x.w_ancestry_focus)?.parentAncestry == this;
			const thisIsVisible = this.g_paging?.index_isVisible(this.siblingIndex) ?? true;
			const parentIsFocus = !!parent && parent.isFocus && thisIsVisible;
			isVisible = this.isFocus || childIsFocus || parentIsFocus;
		} else {
			const focus = get(x.w_ancestry_focus) ?? null;
			const visible = this.isVisible_accordingTo_depth_below_focus;
			const incorporates = this.incorporates(focus);
			const expanded = this.isAllExpanded_fromRootTo(focus);
			isVisible = incorporates && expanded && visible;
		}
		return isVisible;
	}

	height_ofVisibleSubtree(visited: string[] = []): number {
		const thing = this.thing;
		if (!!thing && !visited.includes(this.id)) {
			if (this.shows_branches) {
				let height = 0;
				for (const branchAncestry of this.branchAncestries) {
					height += branchAncestry.height_ofVisibleSubtree([...visited, this.id]);
				}
				return Math.max(height, k.height.row);
			}
			return k.height.row;
		}
		return 0;
	}

	visibleSubtree_width(visited: string[] = []): number {
		const thing = this.thing;
		if (!!thing) {
			const id = this.id;
			let width = thing.width_ofTitle + 6;
			if (!visited.includes(id) && this.shows_branches) {
				let subtreeWidth = 0;
				for (const branchAncestry of this.branchAncestries) {
					const branchWidth = branchAncestry.visibleSubtree_width([...visited, id]);
					if (subtreeWidth < branchWidth) {
						subtreeWidth = branchWidth;
					}
				}
				width += subtreeWidth + k.height.line + k.height.dot;
			}
			return width;
		}
		return 0;
	}

	visibleSubtree_ancestries(visited: string[] = []): Array<Ancestry> {
		let ancestries: Array<Ancestry> = [];
		if (this.isVisible) {
			ancestries.push(this);
		}
		const thing = this.thing;
		if (!!thing) {
			if (!visited.includes(this.pathString) && this.shows_branches) {
				for (const childAncestry of this.childAncestries) {
					const progeny = childAncestry.visibleSubtree_ancestries([...visited, this.pathString]);
					ancestries = [...ancestries, ...progeny];
				}
			}
		}
		return ancestries;
	}

	static readonly _____EDIT: unique symbol;

	get isEditing(): boolean { return get(x.w_s_title_edit)?.ancestry_isEditing(this) ?? false; }

	get isEditable(): boolean {
		const isExternals = this.thing?.isExternals ?? true;
		const isBulkAlias = this.thing?.isBulkAlias ?? true;	// missing thing, return not editable
		const canEdit = (!this.isRoot || databases.db_now.t_database != T_Database.firebase);
		return canEdit && features.allow_title_editing && !isExternals && !isBulkAlias;
	}

	startEdit() {
		const s_text_edit = get(x.w_s_title_edit);
		if (this.isEditable && (!s_text_edit || !s_text_edit.ancestry_isEditing(this))) {
			x.w_s_title_edit?.set(new S_Title_Edit(this));
			debug.log_edit(`SETUP ${this.title}`);
		}
		this.grabOnly();
	}

	static readonly _____MOVE_UP: unique symbol;

	persistentMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean): [boolean, boolean] {
		if (this.isCluster_ofChildren) {													// trees and radials
			return this.persistentMoveUp_forChild_maybe(up, SHIFT, OPTION, EXTREME);
		} else if (this.isBidirectional) {												// radials
			return this.persistentMoveUp_forBidirectional_maybe(up, SHIFT, OPTION, EXTREME);
		} else {																		// parents
			return this.persistentMoveUp_forParent_maybe(up, SHIFT, OPTION, EXTREME);
		}
	}

	persistentMoveUp_forChild_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean): [boolean, boolean] {
		const parentAncestry = this.parentAncestry;
		let needs_graphRelayout = false;
		let needs_graphRebuild = false;
		if (!!parentAncestry) {
			const siblings = parentAncestry.children ?? [];
			const length = siblings.length;
			const thing = this?.thing;
			if (length == 0) {		// friendly for first-time users
				h.ancestry_rebuild_runtimeBrowseRight(this, up, SHIFT, EXTREME, true);
			} else if (!!thing) {
				let grabAncestry: Ancestry | null = this;
				const fromOrder = siblings.indexOf(thing);
				const toOrder = fromOrder.increment(!up, length);
				if (!OPTION) {
					grabAncestry = parentAncestry.ancestry_createUnique_byAddingThing(siblings[toOrder]);
					if (!!grabAncestry) {
						grabAncestry.grab_forShift(SHIFT);
						needs_graphRelayout = true;
					}
				} else if (features.allow_graph_editing) {
					needs_graphRebuild = true;
					this.reorder_within(this.sibling_ancestries, up);
				}
				if (!!grabAncestry) {
					if (controls.inRadialMode) {
						needs_graphRebuild = grabAncestry.assure_isVisible_within(this.sibling_ancestries) || needs_graphRebuild;	// change paging
					// } else if (!parentAncestry.isFocus && !grabAncestry.isVisible) {
					// 	needs_graphRebuild = parentAncestry.becomeFocus() || needs_graphRebuild;
					}
				}
			}
		}
		return [needs_graphRebuild, needs_graphRelayout];
	}

	persistentMoveUp_forParent_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean): [boolean, boolean] {
		const sibling_ancestries = get(x.w_ancestry_focus)?.ancestries_createUnique_forKinship(T_Kinship.parents);
		let needs_graphRelayout = false;
		let needs_graphRebuild = false;
		if (!!sibling_ancestries) {
			let grabAncestry: Ancestry | null = this;
			if (!OPTION) {
				const fromOrder = u.indexOf_withMatchingThingID_in(this, sibling_ancestries);
				const toOrder = fromOrder.increment(!up, sibling_ancestries.length);
				grabAncestry = sibling_ancestries[toOrder];
				if (!!grabAncestry) {
					grabAncestry.grab_forShift(SHIFT);
					needs_graphRelayout = true;
				}
			} else if (features.allow_graph_editing) {
				needs_graphRebuild = true;
				this.reorder_within(sibling_ancestries, up);
			}
			if (!!grabAncestry) {
				needs_graphRebuild = grabAncestry.assure_isVisible_within(sibling_ancestries) || needs_graphRebuild;
			}
		}
		return [needs_graphRebuild, needs_graphRelayout];
	}

	persistentMoveUp_forBidirectional_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean): [boolean, boolean] {
		const sibling_ancestries = get(x.w_ancestry_focus)?.ancestries_createUnique_forKinship(T_Kinship.related) ?? [];
		let needs_graphRelayout = false;
		let needs_graphRebuild = false;
		if (!!sibling_ancestries) {
			let grabAncestry: Ancestry | null = this;
			if (!OPTION) {
				const fromOrder = u.indexOf_withMatchingThingID_in(this, sibling_ancestries);
				const toOrder = fromOrder.increment(!up, sibling_ancestries.length);
				grabAncestry = sibling_ancestries[toOrder];
				if (!!grabAncestry) {
					grabAncestry.grab_forShift(SHIFT);
					needs_graphRelayout = true;
				}
			} else if (features.allow_graph_editing) {
				needs_graphRebuild = true;
				this.reorder_within(sibling_ancestries, up);
			}
			if (!!grabAncestry && !!this.predicate) {
				needs_graphRebuild = grabAncestry.assure_isVisible_within(sibling_ancestries) || needs_graphRebuild;
			}
		}
		return [needs_graphRebuild, needs_graphRelayout];
	}
	
	static readonly _____ORDER: unique symbol;
	
	get order(): number { return this.relationship?.order_forPointsTo(this.isCluster_ofChildren) ?? -12345; }
	
	order_setTo(order: number) {
		this.relationship?.order_setTo_forPointsTo(order, this.isCluster_ofChildren);
	}

	reorder_within(ancestries: Array<Ancestry>, up: boolean) {
		u.ancestries_orders_normalize(ancestries);
		const length = ancestries.length;
		const fromOrder = ancestries.indexOf(this);
		const toOrder = fromOrder.increment(!up, length);
		const wrapped = up ? (fromOrder == 0) : (fromOrder + 1 == length);
		const nudge = ((wrapped == up) ? 1 : -1) * k.halfIncrement;		// avoid duplicated orders
		this.order_setTo(toOrder + nudge);
		u.ancestries_orders_normalize(ancestries);
	}

	order_normalizeRecursive(visited: string[] = []) {
		const id = this.id;
		const childAncestries = this.childAncestries;
		if (!visited.includes(id) && childAncestries && childAncestries.length > 1) {
			u.ancestries_orders_normalize(childAncestries);
			for (const childAncestry of childAncestries) {
				childAncestry.order_normalizeRecursive([...visited, id]);
			}
		}
	}

	static readonly _____EXPAND: unique symbol;
	
	expand() { return this.expanded_setTo(true); }
	collapse() { return this.expanded_setTo(false); }
	toggleExpanded() { return this.expanded_setTo(!this.isExpanded); }
	get shows_branches(): boolean { return get(g.w_branches_areChildren) ? this.shows_children : !this.isRoot; }
	get shows_children(): boolean { return this.isExpanded && this.hasChildren && this.isVisible_accordingTo_depth_below_focus; }
	get isExpanded(): boolean { return this.isRoot || this.includedInStore_ofAncestries(x.si_expanded.w_items); }

	remove_fromGrabbed_andExpanded() {
		this.collapse();
		this.ungrab();
	}
	
	get isAllProgeny_expanded(): boolean {
		let allExpanded = true;
		this.traverse(ancestry => {
			if (!ancestry.isExpanded) {
				allExpanded = false;
				return true;
			}
			return false;
		});
		return allExpanded;
	}

	isAllExpanded_fromRootTo(targetAncestry: Ancestry | null): boolean {
		// visit ancestors until encountering either {targetAncestry, an unexpanded parent}
		if (!!targetAncestry && !this.equals(targetAncestry)) {
			const parentAncestry = this.parentAncestry;			// visit parent of ancestry
			if (!parentAncestry || !parentAncestry.isExpanded) {
				return false;	// stop when no ancestor [root] or not expanded
			} else if (!!parentAncestry && !parentAncestry.isAllExpanded_fromRootTo(targetAncestry)) {
				return false;
			}
		}
		return true;
	}
	
	expanded_setTo(expand: boolean) {
		let mutated = false;
		const matchesDB = this.t_database == get(databases.w_t_database);
		if (matchesDB && (!this.isRoot || expand) && this.isExpanded != expand) {
			x.si_expanded.w_items.update((a: Array<Ancestry> | null) => {
				let array = a ?? [];
				if (!!array) {
					const index = array.map(a => a.pathString).indexOf(this.pathString);
					const found = index != -1;
					if (expand && !found) {		// only add if not already added
						array.push(this);
						mutated = true;
					}
					if (found && !expand) {		// only remove found item
						array.splice(index, 1);	// 1 means 'remove one item only'
						mutated = true;
					}
				}
				return array;
			});
		}
		return mutated;
	}

	static readonly _____GRAB: unique symbol;
	
	grab() { x.grab(this); }
	ungrab() { x.ungrab(this); }
	grabOnly() { x.grabOnly(this); }

	get isGrabbed(): boolean {
		const grabs = x.si_grabs.w_items ?? [] as Array<Ancestry> | null;
		return this.includedInStore_ofAncestries(grabs)
			|| (search.selected_ancestry?.equals(this) ?? false);		// so details can show the user-selected search result
	}

	toggleGrab() {
		if (this.isGrabbed) {
			this.ungrab();
		} else {
			this.grab();
		}
	}

	grab_forShift(SHIFT: boolean) {
		if (SHIFT) {
			this.grab();
		} else {
			this.grabOnly();
		}
	}

	static readonly _____ALTERATION: unique symbol;

	get alteration_isAllowed(): boolean {
		const s_alteration = get(x.w_s_alteration);
		const predicate = s_alteration?.predicate;
		if (!!s_alteration && !!predicate) {
			const from_ancestry = s_alteration.ancestry;
			const from_thing = from_ancestry?.thing;
			const to_thing = this.thing;
			if (!!to_thing && !!from_thing && to_thing.hid != from_thing.hid && !from_ancestry.equals(this)) {
				const isBidirectional = predicate.isBidirectional;
				const isFrom_anAncestor = isBidirectional ? false : to_thing.parentIDs.includes(from_thing.id);
				const isParent_ofFrom = this.thing_isImmediateParentOf(from_ancestry, predicate.kind);
				const isProgeny_ofFrom = this.isAProgenyOf(from_ancestry);
				const isAdding = s_alteration.t_alteration == T_Alteration.add;
				const creates_cycle = isParent_ofFrom || isProgeny_ofFrom || isFrom_anAncestor;
				const canAlter = isAdding ? !creates_cycle : isParent_ofFrom;
				return canAlter
			}
		}
		return false;
	}

	static readonly _____OTHER_ANCESTRIES: unique symbol;

	get sibling_ancestries(): Array<Ancestry> { return this.parentAncestry?.childAncestries ?? []; }
	get parentAncestry():	  Ancestry | null { return this.ancestry_createUnique_byStrippingBack(1); }
	get childAncestries():    Array<Ancestry> { return this.ancestries_createUnique_forKinship(T_Kinship.children) ?? []; }
	get branchAncestries():   Array<Ancestry> { return get(g.w_branches_areChildren) ? this.childAncestries : this.parentAncestries; }

	get parentAncestries(): Array<Ancestry> {
		let ancestries = this.thing?.ancestries ?? [];
		ancestries = ancestries.map(a => a.parentAncestry).filter(a => !!a).filter(a => !a.equals(this) && a.depth < this.depth);
		return ancestries;
	}

	get heritage(): Array<Ancestry> {
		let ancestry: Ancestry | null = this;
		const ancestries: Array<Ancestry> = [ancestry];
		let depth = this.depth;
		while (depth > 0) {
			ancestry = ancestry?.ancestry_createUnique_byStrippingBack(1) ?? null;
			if (!!ancestry) {
				ancestries.push(ancestry);
				depth--;
			}
		}
		return ancestries.reverse();
	}

	get ancestry_ofFirst_visibleChild(): Ancestry {
		const childAncestries = this.childAncestries;
		const first = childAncestries[0]
		if (controls.inRadialMode) {
			const g_paging = this.g_paging
			const maybe = g_paging?.ancestry_atIndex(childAncestries);
			if (!!maybe) {
				return maybe;
			}
		}
		return first;
	}

	visibleParentAncestries(back: number = 1): Array<Ancestry> {
		const ancestries: Array<Ancestry> = [];
		const parents = this.parentAncestries;
		for (const parent of parents) {
			const ancestor = parent.ancestry_createUnique_byStrippingBack(back);
			if (!!ancestor && ancestor.isVisible) {
				ancestries.push(parent);
			}
		}
		return ancestries;
	}

	ancestry_ofNextSibling(increment: boolean): Ancestry | null {
		const array = this.sibling_ancestries;
		const index = array.map(a => a.pathString).indexOf(this.pathString);
		if (index != -1) {
			let siblingIndex = index.increment(increment, array.length)
			if (index == 0) {
				siblingIndex = 1;
			}
			return array[siblingIndex];
		}
		return null;
	}

	ancestry_createUnique_byAddingThing(thing: Thing | null): Ancestry | null {
		const hidParent = this.thing?.idBridging.hash();
		if (!!thing && !!hidParent) {
			const relationship = h.relationship_forPredicateKind_parent_child(T_Predicate.contains, hidParent, thing.hid);
			if (!!relationship) {
				return this.ancestry_createUnique_byAppending_relationshipID(relationship.id);
			}
		}
		return null;
	}

	ancestry_createUnique_byStrippingBack(back: number): Ancestry | null {
		const ids = this.relationship_ids;
		if (back == 0) {
			return this;
		} else if (ids.length == 0) {
			return null;
		}
		const stripped_ids = ids.slice(0, -back);
		if (stripped_ids.length == 0) {
			return h.rootAncestry;
		} else {
			return h.ancestry_remember_createUnique(stripped_ids.join(k.separator.generic));
		}
	}

	incorporates(ancestry: Ancestry | null): boolean {
		if (!!ancestry) {
			const ids = this.relationship_ids;
			const ancestryIDs = ancestry.relationship_ids;
			let index = 0;
			while (index < ancestryIDs.length) {
				if (ids[index] != ancestryIDs[index]) {
					return false;
				}
				index++;
			}
			return true;
		}
		return false;		
	}

	ancestry_createUnique_byAppending_relationshipID(id: string): Ancestry | null {
		if (this.isRoot) {
			return h.ancestry_remember_createUnique(id);
		} else {
			let ids = this.relationship_ids;
			ids.push(id);
			const ancestry = h.ancestry_remember_createUnique(ids.join(k.separator.generic));
			if (!!ancestry) {
				if (ancestry.containsMixedPredicates) {
					h.ancestry_forget(ancestry);
					return null;
				}
				if (ancestry.containsReciprocals) {
					h.ancestry_forget(ancestry);
					return null;
				}
			}
			return ancestry;
		}
	}

	ancestry_remember_createUnique_byAddingThing(thing: Thing | null, kind: T_Predicate = T_Predicate.contains): Ancestry | null {
		const parent = this.thing;
		let ancestry: Ancestry | null = null;
		if (!!thing && !!parent) {
			const changingBulk = parent.isBulkAlias || thing.idBase != h.db.idBase;
			const idBase = changingBulk ? thing.idBase : parent.idBase;
			const parentOrder = this.childAncestries?.length ?? 0;
			const relationship = h.relationship_remember_createUnique(idBase, Identifiable.newID(), kind, parent.idBridging, thing.id, 0, parentOrder, T_Create.getPersistentID);
			ancestry = this.ancestry_createUnique_byAppending_relationshipID(relationship.id);
			u.ancestries_orders_normalize(this.childAncestries);				// write new order values for relationships
			if (kind != T_Predicate.contains) {									// if isBidirectional, we need to create the reversed relationship
				const reversed = relationship?.reversed_remember_createUnique;	// do not persist, it is automatically recreated on all subsequennt launches
				if (!!reversed) {												// use relationship's id alone, since it is an isRelated kind
					h.ancestry_remember_createUnique(relationship.id, kind);			
				}
			}
		}
		return ancestry;
	}

	async ancestry_persistentCreateUnique_byAddingThing(thing: Thing | null, kind: T_Predicate = T_Predicate.contains): Promise<Ancestry | null | undefined> {
		const parent = this.thing;
		let ancestry: Ancestry | null = null;
		if (!!thing && !!parent) {
			const changingBulk = parent.isBulkAlias || thing.idBase != h.db.idBase;
			const idBase = changingBulk ? thing.idBase : parent.idBase;
			if (!thing.persistence.already_persisted) {
				await h.db.thing_remember_persistentCreate(thing);				// for everything below, need to await while thing.id is fetched from remote database
			}
			const parentOrder = this.childAncestries?.length ?? 0;
			const relationship = await h.relationship_remember_persistentCreateUnique(idBase, Identifiable.newID(), kind, parent.idBridging, thing.id, 0, parentOrder, T_Create.getPersistentID);
			ancestry = this.ancestry_createUnique_byAppending_relationshipID(relationship.id);
			u.ancestries_orders_normalize(this.childAncestries);				// write new order values for relationships
			if (kind != T_Predicate.contains) {									// if isBidirectional, we need to create the reversed relationship
				const reversed = relationship?.reversed_remember_createUnique;	// do not persist, it is automatically recreated on all subsequennt launches
				if (!!reversed) {												// use relationship's id alone, since it is an isRelated kind
					h.ancestry_remember_createUnique(relationship.id, kind);			
				}
			}
		}
		return ancestry;
	}

	ancestries_createUnique_forKinship(kinship: string | null): Array<Ancestry> {
		if (!!kinship) {
			switch (kinship) {
				case T_Kinship.related:  return this.thing?.ancestries_createUnique_forPredicate(Predicate.isRelated) ?? [];
				case T_Kinship.parents:  return this.thing?.ancestries_createUnique_forPredicate(Predicate.contains) ?? [];
				case T_Kinship.children: return this.ancestries_createUnique_forPredicate(Predicate.contains);
			}
		}
		return [];
	}

	ancestries_createUnique_forPredicate(predicate: Predicate | null): Array<Ancestry> {
		let ancestries: Array<Ancestry> = [];
		if (!!predicate) {
			const relationships = h.relationships_ofKind_forParents_ofThing(predicate.kind, false, this.thing);
			const isContains = predicate.kind == T_Predicate.contains;
			if (relationships.length > 0) {
				for (const relationship of relationships) {
					if (relationship.kind == predicate.kind) {
						let ancestry: Ancestry | null = null;
						if (isContains) {
							ancestry = this.ancestry_createUnique_byAppending_relationshipID(relationship.id); 	// add each relationship's id
						} else {
							ancestry = h.ancestry_remember_createUnique(relationship.id, predicate.kind);
						}
						if (!!ancestry) {
							ancestries.push(ancestry);									// and push onto the ancestries
						}
					}
				}
				if (isContains) {
					u.ancestries_orders_normalize(ancestries);						// normalize order of children only
				}
			}
		}
		return ancestries;
	}

	static readonly _____TITLES: unique symbol;

	get center_ofTitle():		Point | null { return this.rect_ofTitle?.center ?? null; }
	get title():				      string { return this.thing?.title ?? 'missing title'; }
	get abbreviated_title():		  string { return this.thing?.abbreviated_title ?? '?'; }
	get rect_ofTitle():			 Rect | null { return this.rect_ofComponent(this.titleComponent); }
	get titles():			  Array <string> { return this.ancestors?.map(a => `${!a ? 'null' : a.title}`) ?? []; }
	get titleComponent(): S_Component | null { return components.component_forAncestry_andType_createUnique(this, T_Hit_Target.title); }

	static readonly _____PREDICATES: unique symbol;

	get predicate(): Predicate | null { return h?.predicate_forKind(this.kind) ?? null; }
	showsCluster_forPredicate(predicate: Predicate): boolean { return this.hasParents_ofKind(predicate.kind) && this.hasThings(predicate); }

	hasThings(predicate: Predicate): boolean {
		switch (predicate.kind) {
			case T_Predicate.contains:  return this.thing?.hasParents_ofKind(predicate.kind) ?? false;
			case T_Predicate.isRelated: return this.hasRelationships;
			default:					return false;
		}
	}

	get containsMixedPredicates(): boolean {
		let kind: string | null = null;
		for (const relationship of this.relationships) {
			if (!kind) {
				kind = relationship.kind;
			}
			if (!!kind &&
				(kind != this.kind ||
				![kind, this.kind].includes(relationship.kind))) {
				return true;
			}
		}
		return false;
	}

	static readonly _____PROGENY: unique symbol;

	isChildOf(other: Ancestry):		 boolean { return this.id_thing == other.thingAt(2)?.id; }
	hasParents_ofKind(kind: string): boolean { return this.thing?.hasParents_ofKind(kind) ?? false; }
	get isCluster_ofChildren():		 boolean { return this.g_cluster?.isCluster_ofChildren ?? true }
	get hasParents():				 boolean { return this.parentRelationships.length > 0; }
	get hasChildren():				 boolean { return this.childRelationships.length > 0; }
	get lastChild():				   Thing { return this.children.slice(-1)[0]; }
	get firstChild():				   Thing { return this.children[0]; }

	get hasGrandChildren(): boolean {
		if (this.hasChildren) {
			for (const childAncestry of this.childAncestries) {
				if (childAncestry.hasChildren) {
					return true;
				}
			}
		}
		return false;
	}

	progeny_count(visited: string[] = []): number {
		let sum = 0;
		const id = this.thing?.id;
		if (!!id && !visited.includes(id)) {
			const children = this.childAncestries;
			for (const child of children) {
				sum += child.progeny_count([...visited, id]) + 1;
			}
		}
		return sum;
	}

	isAProgenyOf(ancestry: Ancestry): boolean {
		let isAProgeny = false;
		if (!ancestry.isBidirectional) {
			ancestry.traverse((progenyAncestry: Ancestry) => {
				if (this.equals(progenyAncestry)) {
					isAProgeny = true;
					return true;	// stop traversal
				}
				return false;
			})
		}
		return isAProgeny;
	}

	static readonly _____PROPERTIES: unique symbol;
	
	get isRoot():			  boolean { return this.pathString == k.root; }
	get hasSiblings():		  boolean { return this.sibling_ancestries.length > 1; }
	get isInvalid():		  boolean { return this.containsReciprocals || this.containsMixedPredicates; }
	get shows_reveal():		  boolean { return this.showsReveal_forPointingToChild(!(this.relationship?.isReversed ?? false)); }
	get description():		   string { return `${this.kind} "${this.thing?.t_thing ?? '-'}" ${this.titles.join(':')}`; }
	get pathString():		   string { return this.id; }
	get depth():			   number { return this.relationship_ids.length; }
	get direction_ofReveal():  number { return this.points_right ? Direction.right : Direction.left; }
	get siblingIndex():		   number { return this.sibling_ancestries.map(a => a.pathString).indexOf(this.pathString); }
	get idBridging():   string | null { return this.thing?.idBridging ?? null; }

	get points_right(): boolean {
		const hasVisibleChildren = this.isExpanded && this.hasChildren;
		const radial_points_right = this.g_widget?.reveal_isAt_right ?? true;
		return controls.inRadialMode ? radial_points_right : !hasVisibleChildren;
	}

	get id_thing(): string {
		if (this.isRoot) {
			return h?.idRoot ?? k.unknown;
		}
		return this.relationship?.idChild ?? k.unknown;
	}

	get svgPathFor_revealDot(): string {
		if (this.shows_reveal) {
			return svgPaths.fat_polygon(k.height.dot, this.direction_ofReveal);
		}
		return svgPaths.circle_atOffset(k.height.dot, k.height.dot - 1);
	}

	get containsReciprocals(): boolean {
		let idChild: string | null =  null;
		let idParent: string | null =  null;
		for (const relationship of this.relationships) {
			if ((!!idParent || idParent == k.empty) 
				&& (!!idChild || idChild == k.empty) 
				&& idParent == relationship.idChild 
				&& idChild == relationship.idParent) {
				return true;
			}
			idChild = relationship.idChild;
			idParent = relationship.idParent;
		}
		return false;
	}
	
	sharesAnID(ancestry: Ancestry | null):								   boolean { return !ancestry ? false : this.relationship_ids.some(id => ancestry.relationship_ids.includes(id)); }
	equals(ancestry: Ancestry | null | undefined):						   boolean { return super.equals(ancestry) && this.t_database == ancestry?.t_database; }
	includedInStore_ofAncestries(store: Writable<Array<Ancestry> | null>): boolean { return !!get(store) && this.includedInAncestries(get(store)!); }
	matchesStore(store: Writable<Ancestry | null>):						   boolean { return get(store)?.equals(this) ?? false; }
	rect_ofComponent(component: S_Component | null):				   Rect | null { return component?.rect ?? null; }

	showsReveal_forPointingToChild(pointsTo_child: boolean): boolean {
		const isBulkAlias = this.thing?.isBulkAlias ?? false;
		const hasParents = !pointsTo_child && this.count_ofParents > 0;
		const isBidirectional = this.predicate?.isBidirectional ?? true;
		const hasChildren = pointsTo_child && this.count_ofChilcren(true) > 0;
		if (controls.inRadialMode) {
			return !isBidirectional && !this.isFocus && (hasParents || hasChildren || isBulkAlias);
		}
		return !isBidirectional && (hasChildren || isBulkAlias);
	}

	thing_isImmediateParentOf(ancestry: Ancestry, kind: string): boolean {
		const id_thing = this.id_thing;
		if (id_thing != k.unknown) {
			const parents = ancestry.thing?.parents_ofKind(kind);
			return parents?.map(t => t.id).includes(id_thing) ?? false;
		}
		return false;
	}

	includedInAncestries(ancestries: Array<Ancestry> | undefined): boolean {
		const included = ancestries?.filter(a => {
			return this.equals(a);
		});
		return (included?.length ?? 0) > 0;
	}

	idAt(back: number = 1): string {	// default 1 == last
		const ids = this.relationship_ids;
		if (back > ids.length) {
			return k.root;
		}
		return ids.slice(-(Math.max(1, back)))[0];
	}

}
