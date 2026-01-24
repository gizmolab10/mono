import { T_Hit_Target } from '../types/Enumerations';
import S_Component from '../state/S_Component';
import type { Dictionary } from '../types/Types';

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

	// ===== REGISTER =====

	private component_register(s_component: S_Component) {
		const type = s_component.type;
		const hid = s_component.hid;
		if (hid !== null && !!type) {
			const array = this.components_dict_byType_andHID;
			const dict = array[type] ?? {};
			dict[hid] = s_component;
			array[type] = dict;
		}
	}

	// ===== CREATE =====

	get dummy(): S_Component {
		if (!this._dummy) {
			this._dummy = new S_Component(null, T_Hit_Target.none);
		}
		return this._dummy;
	}

	component_forHID_andType(hid: number | null, type: T_Hit_Target): S_Component | null {
		const dict = this.components_byHID_forType(type);
		return dict[hid ?? -1] ?? null;
	}

	component_forHID_andType_createUnique(hid: number | null, type: T_Hit_Target): S_Component {
		let s_component: S_Component | null = this.component_forHID_andType(hid, type);
		if (!s_component) {
			s_component = new S_Component(hid, type);
			if (!!s_component) {
				this.component_register(s_component);
			}
		}
		return s_component;
	}

	private components_byHID_forType(type: string): { [hid: number]: S_Component } {
		let dict = this.components_dict_byType_andHID[type];
		if (!dict) {
			dict = {};
			this.components_dict_byType_andHID[type] = dict;
		}
		return dict;
	}

	// ===== CLEANUP =====

	component_remove(s_component: S_Component) {
		const type = s_component.type;
		const hid = s_component.hid;
		if (hid !== null && !!type) {
			const dict = this.components_dict_byType_andHID[type];
			if (dict) {
				delete dict[hid];
			}
		}
	}

	reset() {
		this.components_dict_byType_andHID = {};
	}

}

export const components = new Components();
