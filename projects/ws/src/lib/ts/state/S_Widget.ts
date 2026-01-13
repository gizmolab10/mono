import { Ancestry, S_Element, T_Hit_Target } from '../common/Global_Imports';
import { k, colors, elements } from '../common/Global_Imports';
import { styles } from '../managers/Styles';
import S_Snapshot from './S_Snapshot';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	// widgets, titles, dots & breadcrumbs	//
	//	 use this to preserve state			//
	//	 across reattachment				//
	//										//
	// computes color, background, border	//
	//										//
	//	responds to grab, edit,	focus,		//	
	//	hover & expand						//
	//										//
	//////////////////////////////////////////

export default class S_Widget extends S_Element {
	last_snapshot: S_Snapshot;
	s_reveal:	   S_Element;
	s_title: 	   S_Element;
	s_drag:  	   S_Element;

	constructor(ancestry: Ancestry) {
		super(ancestry, T_Hit_Target.widget, k.empty);
		this.s_drag   = elements.s_element_for(ancestry, T_Hit_Target.drag, k.empty);
		this.s_title  = elements.s_element_for(ancestry, T_Hit_Target.title, k.empty);
		this.s_reveal = elements.s_element_for(ancestry, T_Hit_Target.reveal, k.empty);
		this.last_snapshot = this.snapshot;
	}

	get stroke():			string { return this.color; }
	get fill():				string { return this.background_color; }
	get color():			string { return this.widget_colors.color; }
	get border():			string { return this.widget_colors.border; }
	get background_color(): string { return this.widget_colors.background_color; }
	get background():		string { return `background-color: ${this.background_color}`; }

	get widget_colors(): { color: string; background_color: string; border: string } {
		return styles.get_widgetColors_for(this.snapshot, this.thing_color, get(colors.w_background_color));
	}

	get detect_ifState_didChange(): boolean {
		const didChange = 
			this.last_snapshot.isEditing != this.ancestry.isEditing || 
			this.last_snapshot.isGrabbed != this.ancestry.isGrabbed ||
			this.last_snapshot.isFocus != this.ancestry.isFocus;
		this.last_snapshot = this.snapshot;
		return didChange;
	}

}
