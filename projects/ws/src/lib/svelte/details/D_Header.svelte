<script lang='ts'>
	import { c, g, k, core, u, x, hits, debug, search, colors, elements } from '../../ts/common/Global_Imports';
	import { Ancestry, T_Detail, S_Widget } from '../../ts/common/Global_Imports';
	const { w_items: w_grabbed } = x.si_grabs;
	const { w_index: w_found } = x.si_found;
	const { w_ancestry_forDetails } = x;
	const { w_thing_color } = colors;
	const { w_s_hover } = hits;
    let reattachments = 0;
	let color = colors.default;
	let ancestry: Ancestry | null = null;
	let background_color = 'transparent';

	$: {
	const _ = `${$w_found}
		:::${$w_s_hover}
		:::${$w_thing_color}
		:::${u.descriptionBy_titles($w_grabbed)}`;
		ancestry = $w_ancestry_forDetails;
		if (!!ancestry) {
			color = 'white';
			background_color = ancestry.thing?.color ?? 'transparent';
			reattachments += 1;
		}
	}

</script>

{#key reattachments}
	<div style='
		top:0px;
		height:20px;
		display:flex;
		color:{color};
		white-space:pre;
		position:relative;
		text-align:center;
		align-items:center;
		justify-content:center;
		width:{k.width.details}px;
		font-size:{k.font_size.common}px;
		background-color:{background_color};'>
		{ancestry?.thing?.title.clipWithEllipsisAt(30) ?? k.empty}
	</div>
{/key}
