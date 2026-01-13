<script lang='ts'>
	import { T_Signal, T_Startup, T_Breadcrumbs, T_Hit_Target } from '../../ts/common/Global_Imports';
	import { show, debug, search, colors, signals, elements } from '../../ts/common/Global_Imports';
	import { Thing, Ancestry, S_Component} from '../../ts/common/Global_Imports';
	import { c, e, g, h, k, core, u, x } from '../../ts/common/Global_Imports';
	import Breadcrumb_Button from '../mouse/Breadcrumb_Button.svelte';
	import { onMount } from 'svelte';
	export let width = g.windowSize.width;
	export let centered: boolean = false;
	export let left: number = 28;
	const { w_t_startup } = core;
	const { w_t_search } = search;
	const { w_thing_color } = colors;
	const { w_t_breadcrumbs } = show;
	const { w_rect_ofGraphView } = g;
	const { w_items: w_grabbed } = x.si_grabs;
	const { w_s_title_edit, w_ancestry_focus, w_ancestry_forDetails } = x;
	let s_component: S_Component | null = null;
	let crumb_ancestries: Array<Ancestry> = [];
	let element: HTMLElement | null = null;
	let lefts: Array<number> = [];
	let size = k.height.button;
	let reattachments = 0;
	let trigger = 0;
	
	s_component = signals.handle_signals_atPriority([T_Signal.rebuild, T_Signal.reattach], 1, null, T_Hit_Target.breadcrumbs, (t_signal, value): S_Component | null => {
		update();
	});

	onMount(() => { return () => s_component.disconnect(); });

	$: {
		const _ = `${u.descriptionBy_titles($w_grabbed)}
		:::${$w_rect_ofGraphView.description}
		:::${$w_s_title_edit?.description}
		:::${$w_ancestry_forDetails?.id}
		:::${$w_ancestry_focus?.id}
		:::${x.si_found.w_index}
		:::${$w_t_breadcrumbs}
		:::${$w_thing_color}
		:::${$w_t_startup}
		:::${$w_t_search}`;
		update();
	}

	function s_breadcrumbAt(index: number): S_Widget | null {
		return crumb_ancestries[index].g_widget.s_widget ?? null;
	}

	function ancestries_forBreadcrumbs(): Array<Ancestry> {
		switch ($w_t_breadcrumbs) {
			case T_Breadcrumbs.recents:	  return x.si_recents.items.map(item => item[0]);
			case T_Breadcrumbs.selection: return $w_ancestry_forDetails.heritage;
			case T_Breadcrumbs.focus:	  return $w_ancestry_focus.heritage;
		}
	}

	function update() {
		if ($w_t_startup == T_Startup.ready) {				
			let encoded_counts = 0;				// encoded as one parent count per 2 digits (base 10) ... for triggering redraw
			let widths: Array<number> = [];		// for debugging
			const ancestries = ancestries_forBreadcrumbs();
			[crumb_ancestries, widths, lefts, encoded_counts] = g.layout_breadcrumbs(ancestries, centered, left, width);
			trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0];		// re-render HTML when this value changes
			reattachments += 1;
		}
	}

</script>

{#key trigger}
	<div class='breadcrumbs'
		id = {s_component.id}
		bind:this={element}
		style='
			left:7px;
			top:-5.5px;
			position:absolute;'>
		{#each crumb_ancestries as a, index}
			{#if index > 0}
				<div class='between-breadcrumbs'
					style='
						top:5px;
						position:absolute;
						color:{a.thing.color};
						left:{lefts[index] - size + 5.5}px;'>
					>
				</div>
			{/if}
			<div class='breadcrumb'
				style='
					top:0px;
					position:absolute;'>
				<Breadcrumb_Button
					left={lefts[index]}
					s_breadcrumb={s_breadcrumbAt(index)}/>
			</div>
		{/each}
	</div>
{/key}
