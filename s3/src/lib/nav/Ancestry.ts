import { T_Thing, T_Predicate }  from '../common/Enumerations';
import { databases }             from '../db/Databases.svelte';
import { ux }                    from '../state/ux.svelte';
import type { Thing }            from '../entities/Thing';
import type { Integer }          from '../types/Types';
import '../common/Extensions';

export class Ancestry {
	readonly id:  string;
	readonly hid: Integer;

	constructor(id: string = '') {
		this.id  = id;
		this.hid = id.hash();
	}

	// ————————————————————————————————————————— Cache (static)

	private static cache = new Map<Integer, Ancestry>();

	static remember_createUnique(path: string = ''): Ancestry {
		const hid      = path.hash();
		const existing = Ancestry.cache.get(hid);
		if (existing) return existing;
		const ancestry = new Ancestry(path);
		Ancestry.cache.set(hid, ancestry);
		return ancestry;
	}

	static forget(ancestry: Ancestry): void {
		Ancestry.cache.delete(ancestry.hid);
	}

	static forget_all(): void {
		Ancestry.cache.clear();
	}

	static readonly root = Ancestry.remember_createUnique('');

	// ————————————————————————————————————————— Identity

	get isRoot(): boolean { return this.id === ''; }

	equals(other: Ancestry | null | undefined): boolean {
		return !!other && this.id === other.id;
	}

	// ————————————————————————————————————————— Thing lookup

	get thing(): Thing | undefined {
		if (this.isRoot) {
			for (const t of databases.hierarchy.things.values()) {
				if (t.t_thing === T_Thing.root) return t;
			}
			return undefined;
		}
		const parts     = this.id.split('/');
		const lastRelId = parts[parts.length - 1];
		const rel       = databases.hierarchy.relationships.get(lastRelId);
		if (!rel) return undefined;
		return databases.hierarchy.things.get(rel.idChild);
	}

	// ————————————————————————————————————————— Structure

	get depth(): number {
		if (this.isRoot) return 0;
		return this.id.split('/').length;
	}

	get hasChildren(): boolean {
		const t = this.thing;
		if (!t) return false;
		return databases.hierarchy.children_of(t.id).length > 0;
	}

	get parentAncestry(): Ancestry {
		if (this.isRoot) return this;
		const parts = this.id.split('/');
		parts.pop();
		return Ancestry.remember_createUnique(parts.join('/'));
	}

	get branchAncestries(): Ancestry[] {
		const t = this.thing;
		if (!t) return [];
		const children = databases.hierarchy.children_of(t.id);
		const result: Ancestry[] = [];
		for (const child of children) {
			for (const rel of databases.hierarchy.relationships.values()) {
				if (rel.idParent === t.id && rel.idChild === child.id && rel.kind === T_Predicate.contains) {
					const childPath = this.isRoot ? rel.id : `${this.id}/${rel.id}`;
					result.push(Ancestry.remember_createUnique(childPath));
					break;
				}
			}
		}
		return result;
	}

	get sibling_ancestries(): Ancestry[] {
		return this.parentAncestry.branchAncestries;
	}

	get siblingIndex(): number {
		return this.sibling_ancestries.findIndex(a => a.id === this.id);
	}

	// ————————————————————————————————————————— Navigation

	ancestry_createUnique_byStrippingBack(back: number): Ancestry {
		if (back === 0) return this;
		const parts = this.id.split('/');
		if (back >= parts.length) return Ancestry.remember_createUnique('');
		return Ancestry.remember_createUnique(parts.slice(0, parts.length - back).join('/'));
	}

	incorporates(other: Ancestry | null): boolean {
		if (!other) return false;
		if (other.isRoot) return true;
		return this.id === other.id || this.id.startsWith(other.id + '/');
	}

	// ————————————————————————————————————————— Expansion

	get isExpanded(): boolean { return ux.isExpanded(this); }

	// ————————————————————————————————————————— Depth limit

	get depth_within_focus_subtree(): number {
		const focus = ux.ancestry_focus;
		if (!focus) return 0;
		return this.depth - focus.depth;
	}

	get isVisible_accordingTo_depth_within_focus_subtree(): boolean {
		return this.depth_within_focus_subtree < ux.global_depth_limit;
	}

	get hidden_by_depth_limit(): boolean {
		return !this.isVisible_accordingTo_depth_within_focus_subtree
			&& this.isExpanded
			&& this.hasChildren;
	}

	get children_hidden_by_depth_limit(): boolean {
		return this.depth_within_focus_subtree >= (ux.global_depth_limit - 5)
			&& this.isExpanded
			&& this.hasChildren;
	}

	// ————————————————————————————————————————— Visibility

	get shows_children(): boolean {
		return this.isExpanded && this.hasChildren && this.isVisible_accordingTo_depth_within_focus_subtree;
	}

	get shows_branches(): boolean {
		return this.shows_children;
	}
}
