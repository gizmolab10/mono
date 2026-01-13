<script lang='ts'>
	import { T_Edit, T_Layer, T_Timer, T_Trait, T_Hit_Target, T_Mouse_Detection } from '../../ts/common/Global_Imports';
	import { e, g, h, k, u, x, core, hits, show, files, debug, colors, search, signals } from '../../ts/common/Global_Imports';
	import { controls, elements, databases, Seriously_Range } from '../../ts/common/Global_Imports';
	import { S_Mouse, S_Element, S_Component } from '../../ts/common/Global_Imports';
	import DB_Filesystem from '../../ts/database/DB_Filesystem';
	import { T_Database } from '../../ts/database/DB_Common';
	import { onMount, onDestroy, tick } from 'svelte';
	import { get } from 'svelte/store';
	export let s_title!: S_Element;
	export let fontSize = `${k.font_size.common}px`;
	const { w_s_hover } = hits;
	const ancestry = s_title.ancestry;
	const thing = ancestry?.thing;
	const { w_thing_color } = colors;
	const padding = `1px 0px 0px 0px`;
	const g_widget = ancestry.g_widget;
	const s_widget = g_widget.s_widget;
	const input_height = k.height.dot + 2;
	const { w_items: w_grabbed } = x.si_grabs;
	const { w_items: w_expanded } = x.si_expanded;
	const { w_mouse_location, w_mouse_button_down } = e;
	const { w_s_title_edit, w_ancestry_focus, w_thing_title, w_thing_fontFamily } = x;
	let title_width = (thing?.width_ofTitle ?? 0) + title_extra();
	let title_binded = thing?.title ?? k.empty;
	let layout_timer: number | null = null;
	let element: HTMLElement | null = null;
	let title_prior = thing?.title;
	let s_component: S_Component;
	let color = s_widget.color;
	let trigger = k.empty;
	let ghost = null;
	let input = null;
	let left = 0;
	let top = 0;

	function isEditing(): boolean { return ancestry?.isEditing ?? false; }
	function hasHTMLFocus(): boolean { return document.activeElement === input; }
	function isStopping(): boolean { return $w_s_title_edit?.ancestry_isStopping(ancestry) ?? false; }
	function isPercolating(): boolean { return $w_s_title_edit?.ancestry_isPercolating(ancestry) ?? false; }
	function title_extra(): number { return (controls.inTreeMode && isEditing()) ? 2.2 : 0; }
	function hasChanges() { return title_prior != title_binded; }

	s_component = signals.handle_anySignal_atPriority(0, ancestry, T_Hit_Target.title, (t_signal, ancestry) => {
		updateInputWidth();
	});

	onMount(() => {
		debug.log_build(`TITLE ${ancestry?.title}`);
		if (!!element) {
			s_widget.set_html_element(element);
		}
		// Both s_title and s_widget need the handler since either might be selected
		s_title.handle_s_mouse = handle_s_mouse;
		s_widget.handle_s_mouse = handle_s_mouse;
		s_title.mouse_detection = T_Mouse_Detection.none;
		setup_doubleClick_forwarding();
		setTimeout(() => {
			updateInputWidth();
			if (isEditing()) {
				applyRange_fromThing_toInput();
				elements.element_set_focus_to(input);
			}
		}, 100);
		return () => s_component.disconnect();
	});

	function setup_doubleClick_forwarding() {
		s_title.doubleClick_callback = (s_mouse: S_Mouse) => {
			if (s_widget.doubleClick_callback) {
				s_widget.doubleClick_callback(s_mouse);
			}
		};
	}

	$: if (s_widget.doubleClick_callback) {
		setup_doubleClick_forwarding();
	}

	onDestroy(() => {
		hits.delete_hit_target(s_widget);
		hits.delete_hit_target(s_title);
	});

	$: if (!!input) {
		s_title.set_html_element(input);
	}

	$: {
		const _ = $w_s_title_edit;
		if (!!input) {
			title_width = (thing?.width_ofTitle ?? 0) + title_extra();
			color = s_widget.color;
		}
	}

	$: {
		const reactives = `${$w_thing_color}
			:::${$w_mouse_button_down}
			:::${$w_ancestry_focus?.id}
			:::${$w_s_hover?.id ?? 'null'}
			:::${u.descriptionBy_titles($w_grabbed)}
			:::${u.descriptionBy_titles($w_expanded)}`;
		if (reactives != trigger) {
			const isFocus = ancestry?.isFocus ?? false;
			const isEditingNow = ancestry?.isEditing ?? false;
			const isGrabbed = ancestry?.isGrabbed ?? false;
			const adjust = controls.inRadialMode && isFocus;
			top = (isGrabbed ? 0.4 : 0) - (adjust ? isGrabbed ? 2.5 : 2 : 0);
			color = s_widget.color;
			left = adjust ? 1.5 : 0.8;
			trigger = reactives;
		}
	}

	$: {
		const s_text_edit = $w_s_title_edit;
		if (hasHTMLFocus() && !s_text_edit) {
			stopEdit();
		} else if (!!input && !!s_text_edit) {
			if (s_text_edit.ancestry.id_thing == ancestry.id_thing) {
				input.value = ancestry.title;
			}
			if (s_text_edit.ancestry.equals(ancestry)) {
				switch (s_text_edit.t_edit) {
					case T_Edit.stopping:
						stopEdit();
						break;
					case T_Edit.editing:
						if (!hasHTMLFocus() && input) {
							input.focus({ preventScroll: true });
							applyRange_fromThing_toInput();
						}
						break;
				}
			}
		}
	}

	function handle_s_mouse(s_mouse: S_Mouse): boolean {
		if (s_mouse.isDown) {
			if (!!ancestry) {
				if (get(databases.w_t_database) === T_Database.filesystem) {
					if (ancestry.isRoot && !h.db.hasFolder) {
						// if root without folder selected - trigger folder picker
						h.db.selectFolder().then(() => {
							databases.w_data_updated.set(Date.now());
						});
						return true;
					}
					// Always grab in filesystem mode
					ancestry.grabOnly();
					// Try to show preview if file is previewable
					if (thing && !ancestry.hasChildren && h.db instanceof DB_Filesystem && h.db.isPreviewable(thing.title)) {
						files.show_previewOf_file(thing.id);
					}
					return true;
				} else if (isEditing()) {
					extractRange_fromInput_toThing();
				} else {
					if (!!$w_s_title_edit && $w_s_title_edit.isActive) {
						$w_s_title_edit.stop_editing();
						$w_s_title_edit = null;
					}
					if (!ancestry.isGrabbed) {
						ancestry.grab_forShift(false);
					} else if (ancestry.isEditable && !!input) {
						// Only start editing if this is not a deferred single-click from double-click timer
						// When the timer fires, doubleClick_fired is set to true, so check that
						const isDeferredClick = hits.doubleClick_fired;
						if (!isDeferredClick) {
							setTimeout(() => {
								ancestry.startEdit();
								thing_setSelectionRange_fromMouseLocation();
								// Focus directly - reactive statement will also try, but this ensures it happens
							if (input && !hasHTMLFocus()) {
								input.focus({ preventScroll: true });
							}
							applyRange_fromThing_toInput();
							}, 1);
						}
					}
				}
			}
			return true;
		}
		return false;
	}

	$: wrapper_style = `
		cursor: pointer;
		position: absolute;
		width: ${title_width}px;
		height: ${k.height.row}px;
		top: ${g_widget.origin_ofTitle.y}px;
		left: ${g_widget.origin_ofTitle.x}px;
	`.removeWhiteSpace();

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
				title_prior = thing?.title;
			}
			await tick();
			if (!!$w_s_title_edit && $w_s_title_edit.actively_refersTo(ancestry)) {
				debug.log_edit(`STOPPING ${ancestry.title}`);
				$w_s_title_edit.stop_editing();
				$w_s_title_edit = null;
			}
		}
	}

	function extractRange_fromInput_toThing() {
		if (!!input && !!$w_s_title_edit) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			debug.log_edit(`EXTRACT RANGE ${start} ${end}`);
			$w_s_title_edit.thing_setSelectionRange(new Seriously_Range(start, end));
		}
	}

	function applyRange_fromThing_toInput() {
		const range = $w_s_title_edit?.thing_selectionRange;
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

	function handle_cut_paste(event) {
		extractRange_fromInput_toThing();
	}

	function handle_focus(event) {
		u.consume_event(event);
		setTimeout(() => {
			if (!!ancestry && !!input && (!isEditing() || !ancestry.isGrabbed)) {
				input.blur();
			}
		}, 10);
	}

	function handle_blur(event) {
		if (!!ancestry && !isEditing() && hasHTMLFocus()) {
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
	}

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
				case 'tab': u.consume_event(event); stop_andPersist(); h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
			}
			extractRange_fromInput_toThing();
		}
	}

	function updateInputWidth() {
		if (!!input && !!ghost) {
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
			layout_timer = setTimeout(() => {
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

<div class='title-wrapper'
	bind:this={element}
	style={wrapper_style}>
	<span class='ghost'
		bind:this={ghost}
		style='left:-9999px;
			white-space: pre;
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
		id={s_component?.id}
		on:blur={handle_blur}
		on:focus={handle_focus}
		on:input={handle_input}
		bind:value={title_binded}
		on:cut={handle_cut_paste}
		on:paste={handle_cut_paste}
		class='title-input'
		on:keydown={handle_key_down}
		on:mouseover={(event) => { u.consume_event(event); }}
		style='
			border: none;
			top: {top}px;
			outline: none;
			color: {color};
			white-space: pre;
			left: {left - 2}px;
			position: absolute;
			padding: {padding};
			font-size: {fontSize};
			width: {title_width}px;
			z-index: {T_Layer.text};
			height: {input_height}px;
			{k.prevent_selection_style};
			background-color: transparent;
			font-family: {$w_thing_fontFamily};
			cursor: {isEditing() ? "text" : "pointer"};'/>
</div>
