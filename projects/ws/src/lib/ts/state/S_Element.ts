import { S_Hit_Target, T_Hit_Target, T_Control } from '../common/Global_Imports';
import { e, k, colors, elements } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import { styles } from '../managers/Styles';
import S_Snapshot from './S_Snapshot';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	//	single point of truth for			//
	//	  stroke, fill, cursor & border of	//
	//	  buttons, segments & widget dots	//
	//	  grabbed, expanded					//
	//										//
	//////////////////////////////////////////

export default class S_Element extends S_Hit_Target {
	defaultDisabledColor = '#999999'
	color_background = 'white';
	isDisabled = false;
	isSelected = false;
	isInverted = false;		// means color for hover == as though not hovering (and vice versa)
	subtype = k.empty;
	isFocus = false;
	name = k.empty;

	constructor(identifiable: Identifiable, type: T_Hit_Target, subtype: string) {
		super(type, identifiable);
		this.name = elements.name_from(identifiable, type, subtype);
		this.subtype = subtype;
		if (this.isADot) { 
			this.color_background = subtype == T_Control.search ? 'transparent' : get(colors.w_background_color);
		}
	}

	get snapshot():		 S_Snapshot { return new S_Snapshot(this); }
	get color_isInverted(): boolean { return this.isInverted != this.isHovering; }
	get asTransparent():	boolean { return this.isDisabled || this.subtype == T_Control.details; }
	get show_help_cursor(): boolean { return get(e.w_control_key_down) && this.type == T_Hit_Target.action; }
	get cursor():			 string { return (this.isHovering && !this.isDisabled) ? this.show_help_cursor ? 'help' : this.hoverCursor : this.defaultCursor; }
	get disabledTextColor(): string { return colors.special_blend(this.color_background, this.defaultDisabledColor, 0.3) ?? this.defaultDisabledColor; }
	get description():		 string { return `${this.isHovering ? 'in' : 'out '} '${this.name}'`; }	
	get thing_color():		 string { return this.ancestry.thing?.color ?? k.empty; }
	
	get fill(): string {
		if (this.asTransparent) {
			return 'transparent';
		} else if (this.isADot) {
			return this.dotColors_forElement.fill;
		} else if (this.isAControl) {
			return this.buttonColors_forElement.fill;
		} else if (this.ancestry.isGrabbed) {
			return this.thing_color;
		} else {
			return this.color_isInverted ? this.hoverColor : this.isSelected ? 'lightblue' : this.color_background;
		}
	}
		
	get stroke(): string {
		if (this.isADot) {
			return this.dotColors_forElement.stroke;
		} else if (this.isAControl) {
			return this.buttonColors_forElement.stroke;
		} else if (this.isDisabled) {
			return this.disabledTextColor;
		} else {
			return this.color_isInverted ? this.color_background : this.element_color;
		}
	}
	
	get svg_outline_color(): string {
		if (this.isADot) {
			return this.dotColors_forElement.svg_outline_color;
		}
		// Non-dot elements don't use svg_outline_color
		return k.empty;
	}
	
	get border(): string {
		const color = this.thing_color;
		if (!!color) {
			if (this.ancestry.isEditing) {
				return `dashed ${color} 1px`;
			}
			if (this.ancestry.isFocus && !this.ancestry.isGrabbed) {
				return `solid ${color} 1px`;
			}
			if (this.isHovering) {
				return `solid ${colors.ofBackgroundFor(color)} 1px`;
			}
		}
		return 'solid transparent 1px';
	}

	private get dotColors_forElement(): ReturnType<typeof styles.get_dotColors_for> {
		return styles.get_dotColors_for(this.snapshot, this.element_color, this.thing_color, this.color_background, this.hoverColor);
	}
	
	private get buttonColors_forElement(): ReturnType<typeof styles.get_buttonColors_for> {
		return styles.get_buttonColors_for(this.snapshot, this.element_color, this.color_background, this.hoverColor, this.disabledTextColor, 0, false, this.thing_color);
	}

}
