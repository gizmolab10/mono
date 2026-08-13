import { T_Hit_Target, T_Mouse_Detection } from '../types/Hit_Targets';
import type { Point } from '../types/Coordinates';
import S_Hit_Target from './S_Hit_Target';
import type S_Mouse from './S_Mouse';
import { hits } from './Hits';

// One element told to answer the cursor, said in one place. ⟵di
//
// An element wearing this makes its target, hands over its own rectangle, and is stamped
// `data-hit` while the cursor is on it — so the styling asks the stamp rather than the browser's
// own `:hover`, and the one manager is the only thing that decides which target is under the
// cursor. Going off screen takes the target with it.

export type Hit_Target_Options = {
	contains_point?: (point: Point | null) => boolean;   // a shape of its own, where its rectangle is the wrong question
	ondouble?      : (s_mouse: S_Mouse) => void;         // two presses in quick succession
	onlong?        : (s_mouse: S_Mouse) => void;         // held down a while
	onautorepeat?  : () => void;                         // held down, and repeating while it is
	onrelease?     : () => void;                         // the press let go
	onpress?       : () => void;                         // the press made
	hoverCursor?   : string;                             // what the cursor becomes over it
	tip?           : string | null;                      // the words shown while the cursor is on it
	type?          : T_Hit_Target;                       // control, section or page; a control by default
	id             : string;                             // what this one is called, said once
};

export function hit_target(element: HTMLElement, options: Hit_Target_Options) {
	const target = new S_Hit_Target(options.type ?? T_Hit_Target.control, options.id);

	wire(target, options);
	target.set_html_element(element);

	// The manager holds one target — whichever the cursor is on. The stamp goes on while that is
	// ours and comes off otherwise, so nothing in the styling has to know any of this.
	const stop_watching = hits.w_s_hover.subscribe((hovering) => {
		if (hovering?.hasSameID_as(target)) {
			element.setAttribute('data-hit', '');
		} else {
			element.removeAttribute('data-hit');
		}
	});

	return {
		update(fresh: Hit_Target_Options) {
			wire(target, fresh);
			target.update_rect();
		},
		destroy() {
			stop_watching();
			hits.delete_hit_target(target);
		},
	};

	/** What this target watches for, and what it does about each. Said again whenever the options do. */
	function wire(one: S_Hit_Target, said: Hit_Target_Options) {
		if (said.onautorepeat)            { one.mouse_detection = T_Mouse_Detection.autorepeat; }
		else if (said.onlong && said.ondouble) { one.mouse_detection = T_Mouse_Detection.doubleLong; }
		else if (said.onlong)             { one.mouse_detection = T_Mouse_Detection.long; }
		else if (said.ondouble)           { one.mouse_detection = T_Mouse_Detection.double; }
		else                              { one.mouse_detection = T_Mouse_Detection.none; }

		if (said.ondouble)       { one.doubleClick_callback = said.ondouble; }
		if (said.onlong)         { one.longClick_callback   = said.onlong; }
		if (said.onautorepeat)   { one.autorepeat_callback  = said.onautorepeat; }
		if (said.hoverCursor)    { one.hoverCursor          = said.hoverCursor; }
		one.tip = said.tip ?? null;                      // said again every time, since these words change
		if (said.contains_point) { one.contains_point       = said.contains_point; }

		one.handle_s_mouse = (s_mouse: S_Mouse) => {
			if (s_mouse.isDown) { said.onpress?.(); }
			if (s_mouse.isUp)   { said.onrelease?.(); }
			return true;
		};
	}
}
