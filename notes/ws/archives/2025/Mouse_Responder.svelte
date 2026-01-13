<script lang='ts'>
	import { Point, T_Layer, T_Timer, S_Mouse, S_Element } from '../../ts/common/Global_Imports';
	import { e, g, k, s, u, hits, debug, elements } from '../../ts/common/Global_Imports';
	import type { Handle_Result } from '../../ts/types/Types';
	import { onMount, onDestroy } from 'svelte';
	export let handle_s_mouse: Handle_Result<S_Mouse> = () => false;
	export let s_element: S_Element = S_Element.empty();
	export let font_size = `${k.font_size.info}px`;
	export let origin: Point | null = null;
	export let center: Point | null = null;
	export let detect_doubleClick = false;
	export let detect_autorepeat = false;
	export let detect_longClick = false;
	export let height = k.height.button;
	export let detect_mouseDown = true;
	export let width = k.height.button;
	export let detect_mouseUp = true;
	export let position = 'absolute';
	export let zindex = T_Layer.dot;
	export let cursor = 'pointer';
	export let align_left = true;
	export let name = 'generic';
	export let style = k.empty;
    const { w_mouse_location } = e;
	const { w_thing_fontFamily } = s;
	const s_mouse = elements.s_mouse_forName(name);
	const mouse_timer = e.mouse_timer_forName(name);
	const mouse_responder_number = elements.next_mouse_responder_number;
	let element: HTMLElement | null = null;

	//////////////////////////////////////////////////////////////
	//															//
	//	required: width, height, name,							//
	//		handle_s_mouse closure (*),							//
	//  	center or origin (one must remain null)				//
	//															//
	//	(*)	handle_s_mouse: mouse info relevant to caller:		//
	//		down, up, double, long & hover						//
	//															//
	//	sets html_element in s_element for hover detection		//
	//															//
	//////////////////////////////////////////////////////////////
	
	onDestroy(() => {
		hits.delete_hit_target(s_element); // Remove from rbush
	});

	onMount(() => {
		if (!!s_element && s_element instanceof S_Element) {
			s_element.handle_s_mouse = handle_s_mouse;
			s_element.set_html_element(element);
		}
		setupStyle();
	});

	$: {
		const _ = `${origin?.description}:::${center?.description}`;
		setupStyle();
	}

	function reset() {	// tear down
		s_mouse.clicks = 0;
		mouse_timer.reset();
	}

	function handle_pointerUp(event: MouseEvent) {
		if (detect_mouseUp) {
			reset();
			handle_s_mouse(S_Mouse.up(event, element));
		}
	}

	function setupStyle() {
		if (style.length == 0) {
			style = `
				width: ${width}px;
				z-index: ${zindex};
				height: ${height}px;
				position: ${position};
				font-size: ${font_size};
				font-family: ${$w_thing_fontFamily};
				`.removeWhiteSpace();
		}
		if (!!cursor) {
			style = `${style} cursor: ${cursor};`;
		}
		if (!origin && !center) {
			style = `${style} top: 0px; left: 0px;`;
		} else {
			const x = origin?.x ?? center?.x - width / 2;
			const y = origin?.y ?? center?.y - height / 2;
			const alignment = align_left ? 'left: ' : 'right: ';
			style = `${style} ${alignment}${x}px; top: ${y}px;`;
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_autorepeat) {

			// autorepeat overrides all other clicks

			mouse_timer.autorepeat_start(mouse_responder_number, () => {
				const isDown = !mouse_timer.hasTimer_forID(T_Timer.repeat);
				// set isDown false to prevent autorepeating for non-repeating actions
				handle_s_mouse(isDown ? S_Mouse.down(event, element) : S_Mouse.repeat(event, element));
			});
		} else {
			if (detect_mouseDown && (s_mouse.clicks == 0 || !detect_doubleClick)) {
				handle_s_mouse(S_Mouse.down(event, element));
			}
			s_mouse.clicks += 1;
			if (detect_doubleClick) {
				mouse_timer.timeout_start(T_Timer.double, () => {
					if (mouse_timer.hasTimer_forID(T_Timer.double) && s_mouse.clicks == 2) {
						reset();
						handle_s_mouse(S_Mouse.double(event, element));
					}
				});
			}
			if (detect_longClick) {
				mouse_timer.timeout_start(T_Timer.long, () => {
					if (mouse_timer.hasTimer_forID(T_Timer.long)) {
						reset();
						s_mouse.clicks = 0;
						handle_s_mouse(S_Mouse.long(event, element));
					}
				});
			}
		}
	}

</script>

<div class='mouse-responder' name={name}
	on:pointerdown={handle_pointerDown}
	on:pointerup={handle_pointerUp}
	bind:this={element}
	style={style}>
	<slot/>
</div>
