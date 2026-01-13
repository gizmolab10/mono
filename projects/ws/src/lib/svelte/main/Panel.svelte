<script lang='ts'>
	import { c, e, g, h, k, core, u, x, show, busy, debug, colors, search, elements, databases } from '../../ts/common/Global_Imports';
	import { Rect, Size, Point, Thing, Ancestry, Hierarchy, Direction } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Search, T_Banner, T_Control, T_Startup } from '../../ts/common/Global_Imports';
	import Secondary_Controls from '../controls/Secondary_Controls.svelte';
	import Primary_Controls from '../controls/Primary_Controls.svelte';
	import Search_Results from '../search/Search_Results.svelte';
	import { T_Database } from '../../ts/database/DB_Common';
	import BuildNotes from './BuildNotes.svelte';
	import Spinner from '../draw/Spinner.svelte';
	import Search from '../search/Search.svelte';
	import Details from './Details.svelte';
	import Import from './Import.svelte';
	import Preview from './Preview.svelte';
	import Box from '../draw/Box.svelte';
	import Graph from './Graph.svelte';
	import { onMount } from 'svelte';
	const { w_t_startup } = e;
	const { w_rect_ofGraphView } = g;
	const { w_t_database } = databases;
	const { w_separator_color } = colors;
	const { w_search_results_found } = search;
	const spinner_title = 'Loading your data...';
	const offset_toIntersection = new Point(-4, 8);
	const { w_id_popupView, w_show_details } = show;
    const half_thickness: number = k.thickness.separator.main / 2;
	let spinner_rect = Rect.zero;
	let reattachments = 0;
	let spinnerAngle = 0;

	setup_spinner_rect();
	function ignore_wheel(event) { u.consume_event(event); }
	function handle_spinner_angle(event) { spinnerAngle = event.detail.angle; }

	$: {
		const _ = `${$w_rect_ofGraphView.description}
		:::${$w_t_database}
		:::${$w_t_startup}`;
		setup_spinner_rect();
		if (!!h && h.isAssembled) {
			debug.log_draw(`PANEL`);
			reattachments += 1;
		}
	}

	function setup_spinner_rect() {
		const size = $w_rect_ofGraphView.size
		const title_width = u.getWidthOf(spinner_title) + 35;
		const diameter = Math.min(size.height, size.width) / 4;
		const square = Size.square(Math.max(diameter, title_width));
		const center = size.asPoint.dividedInHalf;
		spinner_rect = Rect.createCenterRect(center, square);
	}

</script>

{#key reattachments}
	<Box name='panel'
		width={g.windowSize.width}
		thickness={k.thickness.separator.main}
		height={g.windowSize.height + 0.5}
		corner_radius={k.radius.fillets.thick}>
		<div class='panel'
			style='
				top: 0px;
				left: 0px;
				position: fixed;
				on:wheel={ignore_wheel}
				{k.prevent_selection_style};
				width: {g.windowSize.width}px;
				height: {g.windowSize.height}px;'>
			{#if $w_id_popupView == T_Control.builds}
				<BuildNotes/>
			{:else if $w_id_popupView == T_Control.import}
				<Import/>
			{:else if $w_id_popupView == T_Control.preview}
				<Preview/>
			{:else}
				<Primary_Controls/>
				{#if $w_show_details}
					<Details/>
				{/if}
				<Secondary_Controls/>
				<div class='main'
					style='
						position: fixed;
						z-index: {T_Layer.graph};
						top: {$w_rect_ofGraphView.origin.y}px;
						left: {$w_rect_ofGraphView.origin.x}px;
						width: {$w_rect_ofGraphView.size.width}px;
						height: {$w_rect_ofGraphView.size.height}px;'>
					{#if busy.isDatabaseBusy && h.db.isRemote}
						{#key spinner_rect.description}
							<div class='data-spinner'
								style='
									opacity: 0.5;
									position: absolute;
									top: {spinner_rect.origin.y}px;
									left: {spinner_rect.origin.x}px;
									font-size: {k.font_size.common}px;'>
								<Spinner
									speed='3s'
									strokeWidth={6}
									angle={spinnerAngle}
									title={spinner_title}
									number_of_dashes={19}
									stroke={$w_separator_color}
									on:angle={handle_spinner_angle}
									diameter={spinner_rect.size.width}/>
							</div>
						{/key}
					{:else if $w_search_results_found}
						<Search_Results/>
					{:else }
						<Graph/>
					{/if}
				</div>
			{/if}
		</div>
	</Box>
{/key}
