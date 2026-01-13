
import { e, k, hits, colors, S_Snapshot, controls, T_Hit_Target } from '../common/Global_Imports';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	//	Color computation functions			//
	//	Centralized logic for computing		//
	//	colors based on component state		//
	//										//
	//////////////////////////////////////////

export default class Styles {

	//////////////////////////////////////////////////////////////////////
	//																	//
	//		NOTE:														//
	//																	//
	//	if the logic below seems fine, despite a bug suggesting the		//
	//	opposite, one likely cause: reactive logic is being triggered	//
	//	by the wrong set of variables. eg, ones that might be missing:	//
	//																	//
	//		$w_mouse_button_down										//
	//		$w_ancestry_focus											//
	//		$w_s_title_edit												//
	//		$w_expanded													//
	//		$w_grabbed													//
	//		$w_s_hover													//
	//																	//
	//////////////////////////////////////////////////////////////////////

	get_widgetColors_for(ss: S_Snapshot, thing_color: string, background_color: string): { color: string; background_color: string; border: string } {
		const medium = colors.background_special_blend(thing_color, k.opacity.medium);
		const faint = colors.background_special_blend(thing_color, k.opacity.faint);
		const isLight = colors.luminance_ofColor(thing_color) > 0.5;
		const isDown = get(e.w_mouse_button_down);
		const hover = get(hits.w_s_hover);
		const t_hover_target = hover?.type ?? null;
		let border = 'solid transparent 1px';
		let background = 'transparent';
		let color = thing_color;
		if (ss.isEditing) {
			background = background_color;
			border = `dashed ${thing_color} 1px`;
			color = isLight ? 'black' : thing_color;
		} else if (ss.isGrabbed) {
			color = 'white';
			background = thing_color;
			if (ss.isHovering && !isDown) {
				border = `dashed ${faint} 1px`;
			}
		} else if (ss.isFocus && !ss.isHovering) {
			color = thing_color;
			background = background_color;
			border = `solid ${thing_color} 1px`;
		} else if (ss.isHovering) {
			background = faint;
			border = this.border_for(t_hover_target, thing_color);
		} else if (t_hover_target === T_Hit_Target.drag && hover?.ancestry.id == ss.ancestry.id) {
			border = `solid ${medium} 1px`;
		}
		return { color, background_color: background, border };
	}

	get_dotColors_for(ss: S_Snapshot, element_color: string, thing_color: string, background_color: string, hoverColor: string): { fill: string; stroke: string; svg_outline_color: string } {
		const color_isInverted = (ss.isInverted ?? false) !== ss.isHovering;
		const isLight = colors.luminance_ofColor(thing_color) > 0.5;
		let outline: string;
		let stroke: string;
		let fill: string;
		if (color_isInverted) {
			fill = hoverColor;
			stroke = background_color;
		} else {
			fill = background_color;
			stroke = element_color;
		}
		if (!ss.isGrabbed && !ss.isEditing) {
			outline = thing_color;
		} else if (ss.isGrabbed && !ss.isEditing) {
			outline = background_color;
		} else {
			outline = isLight ? 'black' : hoverColor;
		}
		return { fill, stroke, svg_outline_color: outline };
	}

	get_buttonColors_for(ss: S_Snapshot, element_color: string, background_color: string, hoverColor: string, disabledTextColor: string, border_thickness: number, has_widget_context: boolean = false, thing_color: string = k.empty): { fill: string; stroke: string; border: string } {
		const border_style = (border_thickness <= 0) ? 'none' : `solid ${colors.border} ${border_thickness}px`;
		const color_isInverted = (ss.isInverted ?? false) !== ss.isHovering;
		let border: string;
		let stroke: string;
		let fill: string;
		if (ss.isDisabled) {
			fill = 'transparent';
		} else if (ss.isSelected) {
			fill = 'lightblue';
		} else if (color_isInverted) {
			fill = hoverColor;
		} else {
			fill = background_color;
		}
		if (ss.isDisabled) {
			stroke = disabledTextColor;
		} else if (color_isInverted) {
			stroke = background_color;
		} else {
			stroke = element_color;
		}
		if (has_widget_context && thing_color !== k.empty) {
			if (ss.isEditing) {
				border = `dashed ${thing_color} 1px`;
			} else if (ss.isFocus && controls.inRadialMode) {
				border = `solid ${thing_color} 1px`;
			} else {
				border = border_style;
			}
		} else {
			border = border_style;
		}
		return { fill, stroke, border };
	}

	background_for(t_hover_target: T_Hit_Target | null, background_color: string): string {
		if (t_hover_target === T_Hit_Target.reveal) {
			return 'transparent';
		}
		return background_color;
	}

	border_for(t_hover_target: T_Hit_Target | null, thing_color: string): string {
		if (thing_color === k.empty) {
			return 'solid transparent 1px';
		}
		let border_color: string;
		switch (t_hover_target) {
			case T_Hit_Target.title:  border_color = thing_color;													break;
			case T_Hit_Target.reveal: border_color = 'transparent';													break;
			case T_Hit_Target.drag:   border_color = colors.background_special_blend(thing_color, k.opacity.none);	break;
			default:				  border_color = colors.background_special_blend(thing_color, k.opacity.light); break;
		}
		return `solid ${border_color} 1px`;
	}

}

export const styles = new Styles();
