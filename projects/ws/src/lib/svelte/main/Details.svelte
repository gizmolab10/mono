<script lang='ts'>
	import { e, g, k, x, Point, search, features, show } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Detail } from '../../ts/common/Global_Imports';
	import Banner_Hideable from '../details/Banner_Hideable.svelte';
	import D_Preferences from '../details/D_Preferences.svelte';
	import D_Selection from '../details/D_Selection.svelte';
	import D_Actions from '../details/D_Actions.svelte';
	import D_Header from '../details/D_Header.svelte';
	import D_Traits from '../details/D_Traits.svelte';
	import Separator from '../draw/Separator.svelte';
	import D_Data from '../details/D_Data.svelte';
	import D_Tags from '../details/D_Tags.svelte';
	import { T_Graph } from '../../ts/common/Global_Imports';
	const { w_t_graph, w_show_search_controls } = show;
	const width = k.width.details;
	const { w_t_search } = search;
	const { w_count_details } = e;
	const { w_ancestry_forDetails } = x;	
	const { w_index: w_found } = x.si_found;
	const { w_description: w_grabs_description } = x.si_grabs;
	const { w_description: w_tags_description } = x.si_thing_tags;
	const { w_description: w_traits_description } = x.si_thing_traits;

	$: secondary_isVisible = $w_show_search_controls || $w_t_graph == T_Graph.tree;
	$: details_top = g.controls_boxHeight + (secondary_isVisible ? g.controls_boxHeight - 5 : 0);
	$: details_height = g.windowSize.height - details_top;

	$: {
		const _ = `${$w_found}
		:::${$w_t_search}
		:::${$w_tags_description}
		:::${$w_grabs_description}
		:::${$w_traits_description}
		:::${$w_ancestry_forDetails}`;
		$w_count_details++;
	}

</script>

{#key $w_count_details}
	<div class='details-stack'
		style='
			left:3px;
			display:flex;
			overflow-y: auto;
			position:absolute;
			top:{details_top}px;
			scrollbar-width: none;          /* Firefox */
			flex-direction:column;
			-ms-overflow-style: none;  
			z-index:{T_Layer.details};
			width:{k.width.details - 6}px;
			height:{details_height}px;'>
		<Banner_Hideable t_detail={T_Detail.header}>
			<D_Header/>
		</Banner_Hideable>
		{#if features.has_every_detail}
			<Banner_Hideable t_detail={T_Detail.preferences}>
				<D_Preferences/>
			</Banner_Hideable>
		{/if}
		<Banner_Hideable t_detail={T_Detail.actions}>
			<D_Actions/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Detail.selection}>
			<D_Selection/>
		</Banner_Hideable>
		{#if features.has_every_detail}
			<Banner_Hideable t_detail={T_Detail.tags}>
				<D_Tags/>
			</Banner_Hideable>
			<Banner_Hideable t_detail={T_Detail.traits}>
				<D_Traits/>
			</Banner_Hideable>
		{/if}
		<Banner_Hideable t_detail={T_Detail.data}>
			<D_Data/>
		</Banner_Hideable>
	</div>
{/key}
<Separator name='right-of-details'
	isHorizontal={false}
	has_double_fillet={true}
	margin={k.details_margin}
	thickness={k.thickness.separator.main}
	corner_radius={k.radius.fillets.thick}
	length={details_height + 6.5}
	origin={new Point(k.width.details - 2, details_top - 2.5)}
/>

<style>
	.details-stack::-webkit-scrollbar {
		display: none;                /* Chrome, Safari, Opera */
	}

	.details-stack > :global(*) {
		flex-shrink: 0;
	}
</style>
