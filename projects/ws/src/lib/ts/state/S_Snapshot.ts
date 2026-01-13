import { Ancestry, k, S_Element } from '../common/Global_Imports';

	//////////////////////////////////////
	//									//
	//  snapshot of s_element			//
	//	  occupying user's attention	//
	//	used by Styles manager			//
	//	  to compute colors				//
	//									//
	//////////////////////////////////////

export default class S_Snapshot {
	ancestry:	 Ancestry;
	isInverted:  boolean;
	isDisabled:  boolean;
	isSelected:  boolean;
	isHovering:  boolean;
	isGrabbed:   boolean;
	isEditing:   boolean;
	isFocus:     boolean;
	thing_color: string;
	subtype:     string;
	type:	     string;

	constructor(s_element: S_Element) {
		// snapshot the state of the element
		this.type		 = s_element.type;
		this.subtype	 = s_element.subtype;
		this.ancestry	 = s_element.ancestry;
		this.isDisabled  = s_element.isDisabled;
		this.isSelected  = s_element.isSelected;
		this.isInverted  = s_element.isInverted;
		this.isHovering  = s_element.isHovering;
		this.isFocus	 = this.ancestry.isFocus;
		this.isGrabbed   = this.ancestry.isGrabbed;
		this.isEditing   = this.ancestry.isEditing;
		this.thing_color = this.ancestry.thing?.color ?? k.empty;
	}

}

