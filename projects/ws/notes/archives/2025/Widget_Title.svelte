<script lang='ts'>
	import { e, g, h, k, s, u, x, hits, debug, colors, search, signals, controls, elements, databases } from '../../ts/common/Global_Imports';
	import { T_Search, T_Layer, T_Hit_Target, T_Edit } from '../../ts/common/Global_Imports';
	import { S_Mouse, S_Element, S_Component } from '../../ts/common/Global_Imports';
	import { Rect, Seriously_Range } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { onMount } from 'svelte';
	export let s_title!: S_Element;
	export let fontSize = `${k.font_size.common}px`;
	const ancestry = s_title.ancestry;
	const thing = ancestry?.thing;
    const { w_mouse_location } = e;
	const { w_ancestry_focus } = s;
	const { w_thing_color } = colors;
	const padding = `1px 0px 0px 0px`;
	const g_widget = ancestry.g_widget;
	const s_widget = g_widget.s_widget;
	const input_height = k.height.dot + 2;
	const { w_items: w_grabbed } = x.si_grabs;
	const { w_items: w_expanded } = x.si_expanded;
	const { w_thing_title, w_thing_fontFamily, w_s_title_edit } = s;
	let title_width = (thing?.width_ofTitle ?? 0) + title_extra();
	let title_binded = thing?.title ?? k.empty;
	let layout_timer: number | null = null;
	let title_component: S_Component;
	let title_prior = thing?.title;
	let s_component: S_Component;
	let color = s_widget.color;
	let layoutPending = false;
	let reattachments = 0;
	let trigger = k.empty;
	let ghost = null;
	let input = null;
	let left = 0;
	let top = 0;
	
	function isHit():		  boolean { return false }
	function hasFocus():	  boolean { return document.activeElement === input; }
	function isEditing():	  boolean { return $w_s_title_edit?.ancestry_isEditing(ancestry) ?? false; }
	function isStopping():	  boolean { return $w_s_title_edit?.ancestry_isStopping(ancestry) ?? false; }
	function isPercolating(): boolean { return $w_s_title_edit?.ancestry_isPercolating(ancestry) ?? false; }
	function title_extra():	   number { return (controls.inTreeMode && isEditing()) ? 2.2 : 0; }
	function hasChanges()	 		  { return title_prior != title_binded; }
	function handle_mouse_up() 		  { clearClicks(); }

	s_component = signals.handle_anySignal_atPriority(0, ancestry, T_Hit_Target.title, (t_signal, ancestry) => {
		updateInputWidth();
	});

	onMount(() => {
		debug.log_build(`TITLE ${ancestry?.title}`);
		setTimeout(() => {
			updateInputWidth();
			if (isEditing()) {
				applyRange_fromThing_toInput();
				elements.element_set_focus_to(input);
			}
		}, 100);
		return () => s_component.disconnect();
	});

	const _____REACTIVES: unique symbol = Symbol('REACTIVES');

	$: {
		if (!!input) {
			const s_title = s_widget.s_title;
			s_title.set_html_element(input);
		}
	}

	$: {
		const _ = $w_s_title_edit;
		if (!!input) {
			const isEditing = ancestry?.isEditing ?? false;
			const isGrabbed = ancestry?.isGrabbed ?? false;
			title_width = (thing?.width_ofTitle ?? 0) + title_extra();
			color = s_widget.colorFor_grabbed_andEditing(isGrabbed, isEditing);
		}
	}

	$: {
		const reactives = `${$w_thing_color}
			:::${$w_ancestry_focus?.id}
			:::${u.descriptionBy_titles($w_grabbed)}
			:::${u.descriptionBy_titles($w_expanded)}`;
		if (reactives != trigger) {
			const isFocus = ancestry?.isFocus ?? false;
			const isEditing = ancestry?.isEditing ?? false;
			const isGrabbed = ancestry?.isGrabbed ?? false;
			const adjust = controls.inRadialMode && isFocus;
			top = (isGrabbed ? 0.4 : 0) - (adjust ? isGrabbed ? 2.5 : 2 : 0);
			color = s_widget.colorFor_grabbed_andEditing(isGrabbed, isEditing);
			left = adjust ? 1.5 : 0.8;
			trigger = reactives;
		}
	}

	$: {
		const s_text_edit = $w_s_title_edit;
		if (hasFocus() && !s_text_edit) {
			stopEdit();
		} else if (!!input && !!s_text_edit) {
			if (s_text_edit.ancestry.id_thing == ancestry.id_thing) {
				input.value = ancestry.title;	// consistently update titles of widgets of things with multiple parents
			}
			if (s_text_edit.ancestry.equals(ancestry)) {

				//////////////////////////////////////////////////////
				//													//
				//			handle w_s_title_edit state				//
				//													//
				//////////////////////////////////////////////////////

				switch (s_text_edit.t_edit) {
					case T_Edit.stopping:
						stopEdit();
						break;
					case T_Edit.editing:
						if (!hasFocus()) {
							elements.element_set_focus_to(input);
							applyRange_fromThing_toInput();
						}
						break;
				}
			}
		}
	}

	function debug_log_connection_state(prefix: string) {
		if (!!s_component) {
			s_component.debug_log_connection_state(prefix);
		} else {
			debug.log_component(`S_Component is null for ${ancestry?.titles}`);
		}
	}

	const _____EDIT: unique symbol = Symbol('EDIT');

	function stopEdit() {
		debug.log_edit(`STOP ${title_binded}`);
		$w_s_title_edit = null;
		input?.blur();
		g.layout();
	}

	async function stop_andPersist() {
		if (!!thing && !!input && !!ancestry && isEditing() && !isPercolating()) {
			debug.log_edit(`INVOKING BLUR ${ancestry.title}`);
			input.blur();
			if (hasChanges()) {
				debug.log_edit(`PERSISTING ${thing?.title}`);
				await databases.db_now.thing_persistentUpdate(thing);
				title_prior = thing?.title;			// so hasChanges will be correct next time
			}
			u.onNextTick(() => {		// prevent Panel's enter key handler call to start edit from actually starting
				if (!!$w_s_title_edit && $w_s_title_edit.actively_refersTo(ancestry)) {
					debug.log_edit(`STOPPING ${ancestry.title}`);
					$w_s_title_edit.stop_editing();
					$w_s_title_edit = null;	// inform Widget
				}
			});
		}
	}

	const _____RANGE: unique symbol = Symbol('RANGE');

	function extractRange_fromInput_toThing() {
		if (!!input && !!$w_s_title_edit) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			debug.log_edit(`EXTRACT RANGE ${start} ${end}`);
			$w_s_title_edit.thing_setSelectionRange(new Seriously_Range(start, end));
		}
	}

	function applyRange_fromThing_toInput() {
		const range = $w_s_title_edit.thing_selectionRange;
		if (!!range && !!input) {
			const end = range.end;
			const start = range.start;
			input.setSelectionRange(start, end);
			debug.log_edit(`APPLY RANGE ${start} ${end}`);
		}
	}

	function thing_setSelectionRange_fromMouseLocation() {
		if (!!input && !!$w_s_title_edit && !isPercolating()) {
			const location = $w_mouse_location;
			if (!!location && g.scaled_rect_forElement(input)?.contains(location)) {
				const offset = u.convert_windowOffset_toCharacterOffset_in(location.x, input);
				debug.log_edit(`CURSOR OFFSET ${offset}`);
				$w_s_title_edit.thing_setSelectionRange_fromOffset(offset);
				$w_s_title_edit.set_isEditing();
			}
		}
	}

	const _____HANDLERS: unique symbol = Symbol('HANDLERS');

	function handle_forComponent(s_mouse: S_Mouse): boolean { return false; }
	
	function handle_cut_paste(event) {
		extractRange_fromInput_toThing();
	}

	function handle_focus(event) {
		u.consume_event(event);
		if (!isEditing()) {
			input.blur();
		}
	}

	function handle_blur(event) {
		if (!!ancestry && !isEditing() && hasFocus()) {
			stop_andPersist();
			debug.log_edit(`H BLUR ${title_binded}`);
			updateInputWidth();
			g.layout();
			search.update_search();
		}
	}

	function handle_input(event) {
		const title = event.target.value;
		if (!!thing && (!!title || title == k.empty)) {
			thing.title = title_binded = title;
			title_updatedTo(title);
		}
	};

	function handle_key_down(event) {
		if (!!thing && !!ancestry && isEditing() && canAlterTitle(event)) {
			const key = event.key.toLowerCase();
			debug.log_key(`H KEY ${key}`);
			switch (key) {	
				case 'arrowup':
				case 'arrowdown':
				case 'arrowleft':
				case 'arrowright': break;
				case 'enter': u.consume_event(event); stop_andPersist(); break;
				case 'tab':	  u.consume_event(event); stop_andPersist(); h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
			}
			extractRange_fromInput_toThing();
		}
	}

	function handle_s_mouse(s_mouse: S_Mouse) {
		if (!!ancestry && !s_mouse.notRelevant) {
			if (isEditing()) {
				extractRange_fromInput_toThing();
			} else if (s_mouse.isDown) {
				if (!!$w_s_title_edit && $w_s_title_edit.isActive) {
					$w_s_title_edit.stop_editing();		// stop prior edit, wait for it to percolate (below with setTimeout)
					$w_s_title_edit = null;
				}
				if (!ancestry.isGrabbed) {
					ancestry.grab_forShift(event.shiftKey);
				} else if (ancestry.isEditable && !!input) {
					setTimeout(() => {
						ancestry.startEdit();
						thing_setSelectionRange_fromMouseLocation();
						elements.element_set_focus_to(input);
						applyRange_fromThing_toInput();
					}, 1);
				}
			}
		}
	}

	const _____TITLE: unique symbol = Symbol('TITLE');

	function updateInputWidth() {
		if (!!input && !!ghost) { // ghost only exists to provide its width (in pixels)
			title_width = ghost.scrollWidth + title_extra();
		}
	}

	function canAlterTitle(event) {
		let canAlter = (event instanceof KeyboardEvent) && !event.altKey && !event.shiftKey && !event.code.startsWith("Cluster_Label");
		if (canAlter && event.metaKey) {
			canAlter = false;
		}
		return canAlter;
	}

	function title_updatedTo(title: string | null) {
		const prior = $w_thing_title;
		if (prior != title && !!$w_s_title_edit) {
			extractRange_fromInput_toThing();
			$w_thing_title = title;
			debug.log_edit(`TITLE ${title}`);
			$w_s_title_edit.title = title;
			if (layout_timer !== null) {
				clearTimeout(layout_timer);
			}
			// Debounce: only layout after typing pauses
			layout_timer = setTimeout(() => {
				// Use requestAnimationFrame to ensure we don't interrupt any ongoing rendering
				requestAnimationFrame(() => {
					layout_timer = null;
					if ($w_s_title_edit) {
						$w_s_title_edit.setState_temporarilyTo_whileApplying(T_Edit.percolating, () => {
							g.layout();
						});
					}
				});
			}, 400);
			
			debug.log_edit(`UPDATED ${$w_s_title_edit.description}`);
		}
	}

</script>

<style lang='scss'>
	input:focus {
		outline: none;
	}
</style>

{#key reattachments}
	<Mouse_Responder
		width={title_width}
		s_element={s_widget}
		height={k.height.row}
		handle_s_mouse={handle_s_mouse}
		name={'ghost_' + s_component.id}
		origin={g_widget.origin_ofTitle}>
		<span class='ghost-{title_binded}'
			bind:this={ghost}
			style='left:-9999px;
				white-space: pre;					/* Preserve whitespace to accurately measure the width */
				padding: {padding};
				position: absolute;
				visibility: hidden;
				font-size: {fontSize};
				font-family: {$w_thing_fontFamily};'>
			{title_binded}
		</span>
		<input
			type='text'
			name='title'
			bind:this={input}
			id = {s_component.id}
			on:blur={handle_blur}
			on:focus={handle_focus}
			on:input={handle_input}
			bind:value={title_binded}
			on:cut={handle_cut_paste}
			on:paste={handle_cut_paste}
			class='title-{title_binded}'
			on:keydown={handle_key_down}
			on:mouseover={(event) => { u.consume_event(event); }}
			style='
				border : none;
				top : {top}px;
				outline : none;
				color : {color};
				white-space : pre;
				left : {left - 2}px;
				position : absolute;
				padding : {padding};
				font-size : {fontSize};
				width : {title_width}px;
				z-index : {T_Layer.text};
				height : {input_height}px;
				{k.prevent_selection_style};
				background-color : transparent;
				font-family : {$w_thing_fontFamily};
				cursor: {isEditing() ? 'text' : 'pointer'};'/>
	</Mouse_Responder>
{/key}
