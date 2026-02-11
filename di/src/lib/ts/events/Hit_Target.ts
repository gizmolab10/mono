import S_Hit_Target from '../state/S_Hit_Target';
import { T_Hit_Target, T_Mouse_Detection } from '../types/Enumerations';
import { hits } from '../managers/Hits';
import S_Mouse from '../state/S_Mouse';

export type Hit_Target_Options = {
	type?:          T_Hit_Target;
	id:             string;
	onpress?:       () => void;
	onrelease?:     () => void;
	onlong?:        (s_mouse: S_Mouse) => void;
	ondouble?:      (s_mouse: S_Mouse) => void;
	onautorepeat?:  () => void;
	hoverCursor?:   string;
};

export function hit_target(element: HTMLElement, options: Hit_Target_Options) {
	const type = options.type ?? T_Hit_Target.button;
	const target = new S_Hit_Target(type, options.id);

	wire(target, options);
	target.set_html_element(element);

	const unsubscribe = hits.w_s_hover.subscribe(hovering => {
		if (hovering?.id === target.id) {
			element.setAttribute('data-hitting', '');
		} else {
			element.removeAttribute('data-hitting');
		}
	});

	return {
		update(new_options: Hit_Target_Options) {
			wire(target, new_options);
			target.update_rect();
		},
		destroy() {
			unsubscribe();
			hits.delete_hit_target(target);
		}
	};

	function wire(target: S_Hit_Target, options: Hit_Target_Options) {
		let detection = T_Mouse_Detection.none;
		if (options.onautorepeat)              detection = T_Mouse_Detection.autorepeat;
		else if (options.onlong && options.ondouble) detection = T_Mouse_Detection.doubleLong;
		else if (options.onlong)               detection = T_Mouse_Detection.long;
		else if (options.ondouble)             detection = T_Mouse_Detection.double;
		target.mouse_detection = detection;

		if (options.ondouble)     target.doubleClick_callback = options.ondouble;
		if (options.onlong)       target.longClick_callback = options.onlong;
		if (options.onautorepeat) target.autorepeat_callback = options.onautorepeat;
		if (options.hoverCursor)  target.hoverCursor = options.hoverCursor;

		target.handle_s_mouse = (s_mouse: S_Mouse) => {
			if (s_mouse.isDown) options.onpress?.();
			if (s_mouse.isUp)   options.onrelease?.();
			return true;
		};
	}
}
