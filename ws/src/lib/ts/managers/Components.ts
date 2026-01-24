import { Ancestry, S_Component, T_Hit_Target } from '../common/Global_Imports';
import type { Integer, Dictionary } from '../types/Types';

export class Components {
	private components_dict_byType_andHID: Dictionary<Dictionary<S_Component>> = {};
	private _dummy!: S_Component;

	//////////////////////////////////////////////////////////////////
	//																//
	//				  state managed outside svelte					//
	//																//
	// debug logging												//
	// signal management											//
	// (?) style construction (by type and hid)						//
	// (?) unique id assignment (of html elements) for DOM lookups	//
	//																//
	//////////////////////////////////////////////////////////////////

	static readonly _____REGISTER: unique symbol;

	private component_register(s_component: S_Component) {
		const type = s_component.type;
		const hid = s_component.hid;
		if (!!hid && !!type) {
			const array = this.components_dict_byType_andHID;
			const dict = array[type] ?? {};
			dict[hid] = s_component;
			array[type] = dict;
		}
	}

	static readonly _____CREATE: unique symbol;

	get dummy(): S_Component {
		if (!this._dummy) {
			this._dummy = new S_Component(null, T_Hit_Target.none);
		}
		return this._dummy;
	}

	component_forAncestry_andType(ancestry: Ancestry | null, type: T_Hit_Target): S_Component | null {
		const dict = this.components_byHID_forType(type);
		return dict[ancestry?.hid ?? -1 as Integer] ?? null;
	}

	component_forAncestry_andType_createUnique(ancestry: Ancestry | null, type: T_Hit_Target): S_Component | null {
		let s_component: S_Component | null = this.component_forAncestry_andType(ancestry, type);
		if (!s_component) {
			s_component = new S_Component(ancestry, type);
			if (!!s_component) {
				this.component_register(s_component);
			}
		}
		return s_component;
	}

	private components_byHID_forType(type: string): { [hid: Integer]: S_Component } {
		let dict = this.components_dict_byType_andHID[type];
		if (!dict) {
			dict = {};
			this.components_dict_byType_andHID[type] = dict;
		}
		return dict;
	}

}

export const components = new Components();
