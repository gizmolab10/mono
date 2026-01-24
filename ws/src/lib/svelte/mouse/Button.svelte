<script lang='ts'>
	import { e, g, k, x, hits, Point, colors } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Mouse_Detection } from '../../ts/common/Global_Imports';
	import { S_Mouse, S_Element } from '../../ts/common/Global_Imports';
	import { onMount } from 'svelte';
	export let mouse_detection: T_Mouse_Detection = T_Mouse_Detection.none;
	export let handle_s_mouse: (s_mouse: S_Mouse) => boolean;
	export let s_button: S_Element = S_Element.empty();
	export let center: Point | null | undefined = null;
	export let font_size = k.font_size.common;
	export let border_color = colors.border;
	export let origin: Point | null = null;
	export let padding = '0px 6px 1px 6px';
	export let height = k.height.button;
	export let width = k.height.button;
	export let border_thickness = 0.5;
	export let color = colors.default;
	export let position = 'absolute';
	export let zindex = T_Layer.dot;
	export let align_left = true;
	export let style = k.empty;
	export let name = k.empty;
	const { w_control_key_down } = e;
	const { w_thing_fontFamily } = x;
	const { w_background_color } = colors;
	const { w_s_hover, w_autorepeat } = hits;
	const { w_rect_ofGraphView, w_user_graph_offset } = g;
	let wrapper_style = k.empty;
	let button_style = style;
	let element: HTMLElement;
	let border = k.empty;

	//////////////////////////////////////////
	//										//
	//	adds: border_thickness & style		//
	//										//
	//	container owns S_Element:			//
	//	  (stroke, fill & cursor)			//
	//	  calls intercept_handle_s_mouse	//
	//	  to update them					//
	//										//
	//////////////////////////////////////////

	onMount(() => {
		recompute_style();
		// Set handler on mount as fallback (element might be available immediately)
		if (!!element && !!s_button && handle_s_mouse) {
			s_button.set_html_element(element);
			const current_handle = handle_s_mouse;
			s_button.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
				if (s_mouse.isDown && !!s_mouse.event) {
					if (s_button.detects_autorepeat) {
						s_button.autorepeat_event = s_mouse.event;
						s_button.autorepeat_isFirstCall = true;
					} else if (!s_button.detects_longClick && !s_button.detects_doubleClick) {
						current_handle(s_mouse);
						recompute_style();
					}
					return true;
				} else if (s_mouse.isUp && !!s_mouse.event) {
					reset();
					current_handle(s_mouse);
					recompute_style();
					return true;
				}
				return false;
			};
		}
		return () => {
			hits.delete_hit_target(s_button);
		};
	});

	// important for components with {#key} blocks
	// Set element and handler together to ensure both are set
	// Create handler inline to capture current handle_s_mouse prop value
	// Reference handle_s_mouse to ensure Svelte tracks it for reactive updates
	$: if (!!element && !!s_button) {
		s_button.set_html_element(element);
		// Create new handler function that captures current handle_s_mouse
		// This ensures handler updates when handle_s_mouse prop changes (e.g., inline arrow functions)
		const current_handle = handle_s_mouse;
		if (current_handle) {
			s_button.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
				if (s_mouse.isDown && !!s_mouse.event) {
					if (s_button.detects_autorepeat) {
						s_button.autorepeat_event = s_mouse.event;
						s_button.autorepeat_isFirstCall = true;
					} else if (!s_button.detects_longClick && !s_button.detects_doubleClick) {
						current_handle(s_mouse);
						recompute_style();
					}
					return true;
				} else if (s_mouse.isUp && !!s_mouse.event) {
					reset();
					current_handle(s_mouse);
					recompute_style();
					return true;
				}
				return false;
			};
		} else {
			s_button.handle_s_mouse = undefined;
		}
	}

	// in case mouse_detection changes
	$: if (!!s_button && !!element) {
		s_button.mouse_detection = mouse_detection;
		if (s_button.detects_autorepeat && !s_button.autorepeat_callback) {
		s_button.autorepeat_callback = () => {
				if (!s_button.autorepeat_event) return;
			// First call is the initial down, subsequent calls are repeats
				const s_mouse_event = s_button.autorepeat_isFirstCall 
					? S_Mouse.down(s_button.autorepeat_event, s_button.html_element!)
					: S_Mouse.repeat(s_button.autorepeat_event, s_button.html_element!);
				s_button.autorepeat_isFirstCall = false; // Next call will be a repeat
			handle_s_mouse(s_mouse_event);
			recompute_style();
		};
		s_button.autorepeat_id = 0;
		} else if (!s_button.detects_autorepeat) {
		s_button.autorepeat_callback = undefined;
		}
		if (s_button.detects_longClick) {
			s_button.longClick_callback = (s_mouse: S_Mouse) => {
				handle_s_mouse(s_mouse);
				recompute_style();
			};
		} else {
			s_button.longClick_callback = undefined;
		}
	}

	recompute_style();

	$: {
		const _ = `${$w_user_graph_offset.description}
			:::${$w_rect_ofGraphView.description}
			:::${$w_s_hover?.id ?? 'null'}
			:::${$w_background_color}
			:::${$w_control_key_down}
			:::${s_button.isDisabled}
			:::${s_button.isInverted}
			:::${s_button.isGrabbed}
			:::${s_button.isEditing}
			:::${s_button.fill}`;
		recompute_style();
	}

	function reset() {
		s_button.autorepeat_event = undefined;
		s_button.autorepeat_isFirstCall = true;
	}

	function intercept_handle_s_mouse(s_mouse: S_Mouse): boolean {
		if (!handle_s_mouse) {
			return false;
		}
		if (s_mouse.isDown && !!s_mouse.event) {
			if (s_button.detects_autorepeat) {
				// Capture the event on s_button (survives component recreation)
				s_button.autorepeat_event = s_mouse.event;
				s_button.autorepeat_isFirstCall = true;
			} else if (!s_button.detects_longClick && !s_button.detects_doubleClick) {
				// Normal button — fire immediately on down
					handle_s_mouse(s_mouse);
					recompute_style();
				}
			// Long-click and double-click timing handled centrally by Hits.ts
			return true;
		} else if (s_mouse.isUp && !!s_mouse.event) {
			reset();
			handle_s_mouse(s_mouse);
			recompute_style();
			return true;
		}
		return false;
	}
	
	function recompute_style() {
		color = s_button.stroke;
		if (wrapper_style.length == 0) {
			wrapper_style = `
				cursor: pointer;
				user-select: none;
				width: ${width}px;
				z-index: ${zindex};
				height: ${height}px;
				position: ${position};
				font-family: ${$w_thing_fontFamily};
			`.removeWhiteSpace();
			if (!origin && !center) {
				wrapper_style = `${wrapper_style} top: 0px; left: 0px;`;
			} else {
				const x = origin?.x ?? center?.x - width / 2;
				const y = origin?.y ?? center?.y - height / 2;
				const alignment = align_left ? 'left: ' : 'right: ';
				wrapper_style = `${wrapper_style} ${alignment}${x}px; top: ${y}px;`;
			}
		}
		if (style.length == 0) {
			border_color = colors.border;
			const border_attributes = border_thickness == 0 ? 'none' : `${border_thickness}px solid ${border_color}`;
			border = `border:${border_attributes}`;
			button_style=`
				top:0px;
				left:0px;
				${border};
				display: flex;
				color:${color};
				width:${width}px;
				z-index:${zindex};
				user-select: none;
				padding:${padding};
				height:${height}px;
				text-align: center;
				align-items: center;
				position:${position};
				justify-content: center;
				font-size:${font_size}px;
				cursor:${s_button.cursor};
				border-radius:${height / 2}px;
				background-color:${s_button.fill};
				font-family:${$w_thing_fontFamily};
			`.removeWhiteSpace();
		}
	}

</script>

{#key $w_background_color, button_style}
	<div class='button-wrapper'
		style={wrapper_style}
		bind:this={element}
		name={name}>
		<button class='button'
			style={button_style}
			name={'button-for-' + name}>
			<slot/>
		</button>
	</div>
{/key}
