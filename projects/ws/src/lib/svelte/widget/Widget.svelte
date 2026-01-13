<script lang='ts'>
	import { T_Layer, T_Timer, T_Trait, T_Signal, T_Hit_Target, T_Mouse_Detection } from '../../ts/common/Global_Imports';
	import { G_Widget, S_Mouse, S_Element, S_Component } from '../../ts/common/Global_Imports';
	import { e, g, k, u, x, hits, show, debug, colors } from '../../ts/common/Global_Imports';
	import { controls, signals, elements, components } from '../../ts/common/Global_Imports';
	import { Rect, Point } from '../../ts/common/Global_Imports';
	import Widget_Reveal from './Widget_Reveal.svelte';
	import { onMount, onDestroy, tick } from 'svelte';
	import Widget_Title from './Widget_Title.svelte';
	import Widget_Drag from './Widget_Drag.svelte';
	export let g_widget!: G_Widget;
	const s_widget = g_widget.s_widget;	// put me first
	const { w_s_hover } = hits;
	const { w_count_mouse_up } = e;
	const s_drag = s_widget.s_drag;
	const s_title = s_widget.s_title;
	const { w_thing_color } = colors;
	const ancestry = g_widget.ancestry;
	const s_reveal = s_widget.s_reveal;
	const { w_show_catalist_details } = show;
	const { w_items: w_grabbed } = x.si_grabs;
    const reveal_isAt_right = g_widget.reveal_isAt_right;
	const reveal_pointsTo_child = g_widget.pointsTo_child;
	const { w_s_title_edit, w_ancestry_focus } = x;
	let observer: MutationObserver | null = null;
	let width_ofWidget = g_widget.width_ofWidget;
	let mouse_up_count = $w_count_mouse_up;
	let element: HTMLElement | null = null;
	let border_radius = k.height.dot / 2;
	let revealCenter = Point.zero;
	let s_component: S_Component;
	let widget_style = k.empty;
	let showing_reveal = false;
	let reveal_id = k.unknown;
	let showing_drag = false;
	let trigger = k.empty;
	let height = 0;
	let left = 0;
	let top = 0;
	let thing;

	debug.log_draw(`WIDGET ${ancestry?.titles}`);
	setup_fromAncestry();		// this fails if ancestry's thing id is invalid
	final_layout();
	layout_maybe();

	s_component = signals.handle_anySignal_atPriority(1, ancestry, T_Hit_Target.widget, (t_signal, value): S_Component | null => {
		switch (t_signal) {
		case T_Signal.reattach:
				s_component?.debug_log_connection_state('Before reattachment');
				final_layout();
				(async () => {
					await tick();			// this is needed to ensure the element is connected
					s_component?.debug_log_connection_state('After reattachment');
				})();
			break;
		case T_Signal.reposition:
			layout_maybe();
			break;
		}
	});

	onMount(() => {
		if (!!element) {
			s_widget.set_html_element(element);
		}
		// Set up double-click detection on s_widget
		s_widget.mouse_detection = T_Mouse_Detection.none;
		s_widget.doubleClick_callback = (s_mouse: S_Mouse) => {
			const trait = ancestry.thing?.trait_forType(T_Trait.link);
			const link = trait?.text;
			if (!!link) {		// Thing has a link trait - open it instead of editing
				window.open(link, '_blank');
			} else {
				$w_show_catalist_details = true;
			}
		};
		return () => {
			debug.log_style('Widget unmounting for:', ancestry?.title);
			if (observer) observer.disconnect();
			s_component.disconnect();
		};
	});

	onDestroy(() => {
		hits.delete_hit_target(s_widget);
	});

	$: showing_drag = (!ancestry.isFocus || !controls.inRadialMode) && (!ancestry.isRoot || controls.inRadialMode);
	$: showing_reveal = (!ancestry.isFocus || !controls.inRadialMode) && (ancestry?.showsReveal_forPointingToChild(reveal_pointsTo_child));

	$: {
		const _ = `${$w_thing_color}
			:::${$w_ancestry_focus.id}
			:::${$w_s_hover?.id ?? 'null'}`;
		update_style();
	}

	$: {
		const reactives = `${$w_s_title_edit?.t_edit}:::${u.descriptionBy_titles($w_grabbed)}`;
		if (reactives != trigger && !!ancestry && s_widget.detect_ifState_didChange) {
			trigger = reactives;
			if (!(controls.inRadialMode && ancestry.isFocus)) {
				g_widget.layout();
			}
			final_layout();
			s_component.debug_log_connection_state('GRABBED STATE CHANGED');
		}
	}

	$: if (mouse_up_count != $w_count_mouse_up) {
		mouse_up_count = $w_count_mouse_up;
		if ($w_s_hover?.id === s_widget.id) {
			// Don't grab if we're waiting for a double-click - let the deferred single-click handle it
			const waitingForDoubleClick = hits.pending_singleClick_target === s_widget && 
				hits.click_timer.hasTimer_forID(T_Timer.double);
			if (!waitingForDoubleClick) {
				handle_mouseUp();
			}
		}
	}

	$: if (!!s_component && !!s_component.element && s_component.isComponentLog_enabled && false) {
		observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				const element = s_component?.element;
				if (mutation.type === 'attributes' && mutation.attributeName === 'style' && mutation.target === element) {
					debug.log_style('Style changed on widget div for', ancestry?.title + ':', element.style.cssText);
				}
			});
		});
		
		observer.observe(s_component?.element, { 
			attributes: true, 
			attributeFilter: ['style'],
			attributeOldValue: true
		});
		debug.log_style('Observer set up on widget div for:', ancestry?.title);
	}

	function z_index(): number {
		return (controls.inRadialMode && ancestry.isFocus) ? T_Layer.frontmost : T_Layer.widget;
	}

	function handle_mouseUp() {
		ancestry?.grab_forShift(false);
		update_style();
	}

	function layout_maybe() {
		if (s_widget.detect_ifState_didChange) {
			final_layout();
		}
	}

	function final_layout() {
		const hasExtra_onRight = !!ancestry && !ancestry.isExpanded && (ancestry.childRelationships.length > 3);
		const origin_ofWidget = g_widget.origin.offsetBy(g_widget.offset_ofWidget);
		s_widget.rect = g.scaled_rect_forElement(s_title.html_element);
		width_ofWidget = g_widget.width_ofWidget;
		height = k.height.row - 1.5;
		border_radius = height / 2;
		left = origin_ofWidget.x;
		top = origin_ofWidget.y;
		update_style();
	}

	function update_style() {
		widget_style = `
			top: ${top}px;
			left: ${left}px;
			cursor: pointer;
			position: absolute;
			height: ${height}px;
			z-index: ${z_index()};
			${s_widget.background};
			color: ${s_widget.color};
			border: ${s_widget.border};
			width: ${width_ofWidget - 5}px;
			border-radius: ${border_radius}px;
		`.removeWhiteSpace();
	}

	function setup_fromAncestry() {
		s_widget.detect_ifState_didChange;
		thing = ancestry?.thing;
		if (!ancestry) {
			console.warn('widget has no ancestry');
		} else if (!thing) {
			console.warn(`relationship (of ancestry of widget) has no child [${ancestry?.relationship?.id ?? k.unknown}]`);
		} else {
			const title = thing.title ?? thing.id ?? k.unknown;
			reveal_id = `reveal ${title} ${ancestry.id}`;
		}
	}
    
</script>

{#if s_widget}
	<div class='widget'
		id={s_component.id}
		bind:this={element}
		style={widget_style}
		on:keyup={u.ignore}
		on:keydown={u.ignore}>
		<div class='widget-components'
			style='
				left: {-3}px;
				height: {height}px;
				position: absolute;
				width: {width_ofWidget}px;
				z-index: {(controls.inRadialMode && ancestry.isFocus) ? T_Layer.frontmost : T_Layer.widget};
				top: {(controls.inRadialMode && ancestry.isFocus) ? -0.5 : -3}px;'>
			<Widget_Title
				s_title = {s_title}
				fontSize = {k.font_size.common}px/>
			{#if showing_drag}
				<Widget_Drag
					s_drag = {s_drag}
					reveal_isAt_right = {reveal_isAt_right}/>
			{/if}
			{#if showing_reveal}
				<Widget_Reveal
					s_reveal = {s_reveal}
					pointsTo_child = {reveal_pointsTo_child}/>
			{/if}
		</div>
	</div>
{/if}
