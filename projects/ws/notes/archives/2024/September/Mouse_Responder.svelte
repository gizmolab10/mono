<script lang='ts'>
	import { run } from 'svelte/legacy';

	import { k, u, ux, Rect, Size, Point, ZIndex, onMount, onDestroy } from '../../ts/common/Global_Imports';
	import { Mouse_State, Timer_Type, Timer_State } from '../../ts/common/Global_Imports';
	import { s_mouse_location, s_mouse_up_count } from '../../ts/state/Reactive_State';
	interface Props {
		detectHit_closure?: () => {flag: boolean} | null;
		closure?: any;
		height?: any;
		width?: any;
		detect_doubleClick?: boolean;
		detect_longClick?: boolean;
		detect_mouseDown?: boolean;
		detect_mouseUp?: boolean;
		position?: string;
		zindex?: any;
		center: Point | null;
		cursor?: string;
		align_left?: boolean;
		name?: string;
		children?: import('svelte').Snippet;
	}

	let {
		detectHit_closure = null,
		closure = (mouse_state) => {},
		height = k.default_buttonSize,
		width = k.default_buttonSize,
		detect_doubleClick = true,
		detect_longClick = true,
		detect_mouseDown = true,
		detect_mouseUp = true,
		position = 'absolute',
		zindex = ZIndex.dots,
		center,
		cursor = 'pointer',
		align_left = true,
		name = 'generic',
		children
	}: Props = $props();
	const timer_state = ux.timer_state_forName(name);	// persist across destroy/recreate
	const mouse_state = $state(ux.mouse_state_forName(name));	// "
	let mouse_up_count = $state($s_mouse_up_count);
	let style = $state(k.empty);
	let mouse_button = $state();

	//////////////////////////////////////////
	//										//
	//	handles: click counts, moves & up	//
	//										//
	//	requires: center, width, height,	//
	//		closure & name					//
	//										//
	//	mutates three ts state classes:		//
	//		UX_State, Mouse_State &			//
	//		Element_State					//
	//										//
	//////////////////////////////////////////

	onMount(() => {
		setupStyle();
		if (!!mouse_button) {
			mouse_button.addEventListener('pointerup', handle_pointerUp);
			mouse_button.addEventListener('pointerdown', handle_pointerDown);
			return () => {
				mouse_button.removeEventListener('pointerup', handle_pointerUp);
				mouse_button.removeEventListener('pointerdown', handle_pointerDown);
			}
		}
	});




	function handle_pointerUp(event) {
		if (detect_mouseUp && (!!timer_state.mouse_longClick_timer)) {

			// tear down timers and call closure

			reset();
			closure(Mouse_State.up(event, mouse_button));
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_mouseDown && mouse_state.clicks == 0) {

			// call down closure

			closure(downState(true));
		}
		mouse_state.clicks += 1;
		if (detect_doubleClick) {

			// setup timer to call double-click closure

			timer_state.setTimeout(Timer_Type.double, () => {
				if (mouse_state.clicks == 2) {
					reset();
					closure(downState(false, true, false));
				}
			});
		}
		if (detect_longClick) {

			// setup timer to call long-click closure

			timer_state.setTimeout(Timer_Type.long, () => {
				reset();
				closure(downState(false, false, true));
			});
		}
	}

	function downState(isDown: boolean, isDouble: boolean = false, isLong: boolean = false): Mouse_State {
		const state = mouse_state.copy;
		state.isUp = !isDown && !isDouble && !isLong;
		state.element = mouse_button;
		state.isDouble = isDouble;
		state.isLong = isLong;
		state.isHover = false;
		state.isDown = isDown;
		state.event = event;
		return state;
	}

	function setupStyle() {
		style = `cursor: ${cursor}; width: ${width}px; height: ${height}px; position: ${position}; z-index: ${zindex};`;
		if (!!center) {
			const x = center.x - width / 2;
			const horizontal = align_left ? `left: ${x}` : `right: ${-x}`;
			style = `${style} ${horizontal}px; top: ${center.y - height / 2}px;`;
		}
	}

	function reset() {	// tear down
		timer_state.reset();
		mouse_state.clicks = 0;
	}

	run(() => {
		const _ = center;
		setupStyle();
	});
	run(() => {	// hover and movement
		if (!!mouse_button && !!$s_mouse_location) {
			let isHit = false;
			if (!detectHit_closure) {			// is mouse inside this element's bounding rect
				isHit = Rect.rect_forElement_contains(mouse_button, $s_mouse_location);
			} else {							// if this element's hover shape is not its bounding rect
				isHit = detectHit_closure();	// use hover shape
			}
			if (mouse_state.isHover != isHit) {
				mouse_state.isHover = isHit;
				mouse_state.isOut = !isHit;		// called far too often
				closure(Mouse_State.hover(null, mouse_button, isHit));	// pass a null event
			}
		}
	});
	run(() => {	// mouse up
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			if (detect_mouseUp && timer_state.hasTimer) {

				// tear down timers and call closure

				reset();
				closure(Mouse_State.up(null, mouse_button));
			}
		}
	});
</script>

<div class='mouse-responder' id={name}
	bind:this={mouse_button}
	style={style}>
	{@render children?.()}
</div>
