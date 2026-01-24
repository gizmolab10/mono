import { k, Thing, Ancestry, Seriously_Range } from '../common/Global_Imports';

export enum T_Edit {
	percolating	= 'percolating',
	stopping	= 'stopping',
	editing		= 'editing',
	done		= 'done',
}

export default class S_Title_Edit {
	t_edit = T_Edit.editing;
	ancestry: Ancestry;
	title = k.empty
	
	// singleton (store)
	// t_edit is source of truth for all editing
	// ancestry.thing is source of truth for selection range
	
	set_isEditing() { this.t_edit = T_Edit.editing; }
	get thing(): Thing | null { return this.ancestry.thing; }
	constructor(ancestry: Ancestry) { this.ancestry = ancestry; }
	get isActive(): boolean { return this.t_edit != T_Edit.done; }
	stop_editing() { this.t_edit = T_Edit.done; this.thing?.set_isDirty(); }
	get description(): string { return `${this.t_edit} ${this.thing?.title}`; }
	refersTo(ancestry: Ancestry): boolean { return this.ancestry.equals(ancestry); }
	get thing_selectionRange(): Seriously_Range | undefined { return this.thing?.selectionRange; }
	actively_refersTo(ancestry: Ancestry): boolean { return this.refersTo(ancestry) && this.isActive; }
	inactively_refersTo(ancestry: Ancestry): boolean { return this.refersTo(ancestry) && !this.isActive; }
	ancestry_isEditing(ancestry: Ancestry | null): boolean { return this.isAncestry_inState(ancestry, T_Edit.editing); }
	ancestry_isStopping(ancestry: Ancestry | null): boolean { return this.isAncestry_inState(ancestry, T_Edit.stopping); }
	ancestry_isPercolating(ancestry: Ancestry | null): boolean { return this.isAncestry_inState(ancestry, T_Edit.percolating); }
	thing_setSelectionRange_fromOffset(offset: number) { this.thing_setSelectionRange(new Seriously_Range(offset, offset)); }

	thing_setSelectionRange(range: Seriously_Range) {
		if (!!this.thing) {
			this.thing.selectionRange = range;
		}
	}
	
	// ///////////////////////////////////////////
	//											//
	// single source of truth for editing state //
	//											//
	// ///////////////////////////////////////////

	// created by ancestry start edit
	// widget reacts to changes too it
	// title editor calls blur if isEditStopping is true
	// ancestry props that reference this object: {isEditing, isEditStopping, isEditPercolating}

	isAncestry_inState(ancestry: Ancestry | null, t_edit: string) {
		return (!ancestry || (!this.ancestry.equals(ancestry))) ? false : (this.t_edit == t_edit);
	}

	setState_temporarilyTo_whileApplying(t_edit: T_Edit, apply: () => void) {
		const saved = this.t_edit;
		this.t_edit = t_edit;
		apply();
		this.t_edit = saved;
	}

}