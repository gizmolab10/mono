import { T_Hit_Target } from '../types/Enumerations';
import S_Hit_Target from '../state/S_Hit_Target';
import type { Dictionary } from '../types/Types';

export class Components {
	private components_dict_byType_andHID: Dictionary<Dictionary<S_Hit_Target>> = {};

	// ===== REGISTER =====

	private component_register(s_hit_target: S_Hit_Target) {
		const type = s_hit_target.type;
		const hid = s_hit_target.hid;
		if (hid !== null && !!type) {
			const array = this.components_dict_byType_andHID;
			const dict = array[type] ?? {};
			dict[hid] = s_hit_target;
			array[type] = dict;
		}
	}

	// ===== CREATE =====

	component_forHID_andType(hid: number | null, type: T_Hit_Target): S_Hit_Target | null {
		const dict = this.components_byHID_forType(type);
		return dict[hid ?? -1] ?? null;
	}

	component_forHID_andType_createUnique(hid: number | null, type: T_Hit_Target): S_Hit_Target {
		let s_hit_target: S_Hit_Target | null = this.component_forHID_andType(hid, type);
		if (!s_hit_target) {
			s_hit_target = new S_Hit_Target(type, String(hid ?? 'no-hid'));
			this.component_register(s_hit_target);
		}
		return s_hit_target;
	}

	private components_byHID_forType(type: string): { [hid: number]: S_Hit_Target } {
		let dict = this.components_dict_byType_andHID[type];
		if (!dict) {
			dict = {};
			this.components_dict_byType_andHID[type] = dict;
		}
		return dict;
	}

	// ===== CLEANUP =====

	component_remove(s_hit_target: S_Hit_Target) {
		const type = s_hit_target.type;
		const hid = s_hit_target.hid;
		if (hid !== null && !!type) {
			const dict = this.components_dict_byType_andHID[type];
			if (dict) {
				delete dict[hid];
			}
		}
	}

}

export const components = new Components();
