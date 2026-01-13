import { S_Mouse, S_Widget, S_Element, S_Hit_Target, S_Component } from '../common/Global_Imports';
import { T_Control, T_Hit_Target } from '../common/Global_Imports';
import { colors, Ancestry } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import type { Dictionary, Integer } from '../types/Types';

export default class Elements {
	private s_element_dict_byType_andID: Dictionary<Dictionary<S_Element>> = {};
	private s_widget_dict_byAncestryID: Dictionary<S_Widget> = {};
	private s_control_dict_byType: Dictionary<S_Element> = {};
	private s_element_dict_byName: Dictionary<S_Element> = {};
	private s_mouse_dict_byName: Dictionary<S_Mouse> = {};
	mouse_responder_number = 0;
	s_focus!: S_Element;

	//////////////////////////////////////
	//									//
	//	state managed outside svelte	//
	//									//
	//  allows svelte components to be	//
	//	  deleted by their own event	//
	//	  handling						//
	//									//
	//	used by: Button, Close_Button,	//
	//	  Radial & Radial_Cluster,		//
	//	  Widget_Drag, Widget_Title,	//
	//	  Controls, Focus				//
	//									//
	//////////////////////////////////////

	name_from(identifiable: Identifiable, type: T_Hit_Target, subtype: string): string { return `${type}(${subtype}) (id '${identifiable.id}')`; }

	get next_mouse_responder_number(): number {
		this.mouse_responder_number += 1;
		return this.mouse_responder_number;
	}

	static readonly _____LOOKUP: unique symbol;

	s_mouse_forName(name: string): S_Mouse { return this.assure_forKey_inDict(name, this.s_mouse_dict_byName, () => S_Mouse.empty()); }
	
	s_element_forName_andType(name: string, type: T_Hit_Target, subtype: string): S_Element {
		return this.assure_forKey_inDict(name, this.s_element_dict_byID_forType(type), () => this.s_element_for(new Identifiable(), type, subtype));
	}

	s_control_forType(t_control: T_Control): S_Element {
		let s_control = this.s_control_dict_byType[t_control];
		if (!s_control) {
			const hover_color = t_control == T_Control.details ? 'white' : colors.default;
			s_control = this.s_element_for(new Identifiable(t_control), T_Hit_Target.control, t_control);
			s_control.set_forHovering(hover_color, 'pointer');
			this.s_control_dict_byType[t_control] = s_control;
		}
		return s_control;
	}

	element_set_focus_to(html_element: HTMLElement | null, on: boolean = true) {
		if (!!html_element) {
			const s_element = this.s_elements.filter(s_element => s_element.html_element == html_element)[0];
			this.s_element_set_focus_to(s_element, on);
		}
	}

	s_element_set_focus_to(s_element: S_Element | null, on: boolean = true) {
		if (!!s_element) {
			if (!on) {
				s_element.html_element?.blur();
				s_element.isFocus = false;
			} else {
				for (const se of this.s_elements) {
					if (se != s_element) {
						this.s_element_set_focus_to(se, false);		// assure that even untracked focus is cleared
					} else {
						s_element.html_element?.focus({ preventScroll: true });
						this.s_focus = s_element;
						s_element.isFocus = true;
					}
				}
			}
		}
	}

	static readonly _____CREATE: unique symbol;

	s_element_for(identifiable: Identifiable | null, type: T_Hit_Target, subtype: string): S_Element {
		const realIdentifiable = identifiable ?? new Identifiable()
		const name = this.name_from(realIdentifiable, type, subtype);
		return this.assure_forKey_inDict(name, this.s_element_dict_byName, () => new S_Element(realIdentifiable, type, subtype));
	}

	s_widget_forAncestry(ancestry: Ancestry): S_Widget {
		const id = ancestry.id;
		if (!id) {
			console.warn(`ancestry ${ancestry.title} has no id`);
		}
		return this.assure_forKey_inDict(id, this.s_widget_dict_byAncestryID, () => new S_Widget(ancestry));
	}

	assure_forKey_inDict<T>(key: string, dict: Dictionary, closure: () => T): T {
		let result = dict[key];
		if (!result) {
			result = closure();
			if (!!result) {
				dict[key] = result;
			}
		}
		return result;
	}

	static readonly _____INTERNALS: unique symbol;

	private get s_elements(): S_Element[] { return Object.values(this.s_element_dict_byName); }

	private s_element_dict_byID_forType(type: T_Hit_Target): Dictionary<S_Element> {
		let s_element_dict = this.s_element_dict_byType_andID[type];
		if (!s_element_dict) {
			s_element_dict = {};
			this.s_element_dict_byType_andID[type] = s_element_dict;
		}
		return s_element_dict;
	}

}

export const elements = new Elements();
