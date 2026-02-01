<script lang='ts'>
	import { g, k, u, x, core, hits, show, details } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Detail, T_Direction } from '../../ts/common/Global_Imports';
	import Glows_Banner from '../mouse/Glows_Banner.svelte';
    export let t_detail: T_Detail;
	const { w_t_details } = show;
	const isSelection = (t_detail === T_Detail.selection);
	const { w_ancestry_forDetails, w_grabs, w_grabIndex } = x;
	const s_banner_hideable = details.s_banner_hideables_dict_byType[t_detail];
	const si_items = isSelection ? null : s_banner_hideable?.si_items;
	const { w_description, w_extra_titles: w_extra_titles_from_si } = si_items ?? {};
	let title = details.banner_title_forDetail(t_detail);
	let hideable_isVisible = true;
	let trigger = k.empty;
	let titles = [title];

	update_hideable_isVisible();

	$: {
		const grabs = $w_grabs ?? [];
		const grabIndex = $w_grabIndex ?? 0;
		const _ = `${$w_description}:::${$w_ancestry_forDetails?.id}:::${grabs.length}:::${grabIndex}`;
		// Compute extra_titles: for selection use grabs, for others use si_items
		const extra = isSelection 
			? (grabs.length > 1 ? [T_Direction.previous, T_Direction.next] : [])
			: ($w_extra_titles_from_si ?? []);
		update_banner_titles(grabs, grabIndex, extra);
	}

	$: { 
		const _ = $w_t_details;
		update_hideable_isVisible();
	}

	function update_trigger() {
		setTimeout(() => hits.recalibrate(), 1)
	}

	function update_banner_titles(grabs: any[], grabIndex: number, extra_titles: string[]) {
		const new_title = details.banner_title_forDetail(t_detail, grabs, grabIndex);
		const new_titles = [new_title, ...extra_titles];
		if (new_titles.join(k.comma) != titles.join(k.comma)) {
			const prior_titles = titles;
			titles = new_titles;
			title = new_title;
			update_trigger();
		}
	}

	function update_hideable_isVisible() {
		let isVisible = true;
		if (s_banner_hideable?.hasBanner) {	// d_header has no banner
			isVisible = $w_t_details?.includes(T_Detail[t_detail]) ?? false;
		}
		if (isVisible != hideable_isVisible) {
			hideable_isVisible = isVisible;
			update_trigger();
		}
	}

	function toggle_hidden(t_detail: string) {
		let t_details = $w_t_details;
		if (t_details.includes(t_detail)) {
			t_details = u.remove_fromArray_byReference(t_detail, t_details);
		} else {
			t_details.push(t_detail);
		}
		$w_t_details = t_details;
		update_hideable_isVisible();
	}

</script>

<div class='{titles[0]}-dynamic-container'
	style='
		width: 100%;
		height: auto;
		display: flex;
		position: relative;
		flex-direction: column;
		z-index:{T_Layer.stackable};'>
	{#key trigger}
		{#if s_banner_hideable?.hasBanner}
			<div class='banner'
				style='
					top: 0px;
					width: 100%;
					display: flex;
					cursor: pointer;
					align-items: stretch;
					height: {g.glows_banner_height}px;'>
					<Glows_Banner
						titles={titles}
						width={k.width.details}
						toggle_hidden={toggle_hidden}
						banner_id={T_Detail[t_detail]}
						font_size={k.font_size.banners}
						isSelected={hideable_isVisible}
						height={g.glows_banner_height}/>
			</div>
		{/if}
		{#if hideable_isVisible}
			<div class='hideable'
				style='
					z-index:{T_Layer.hideable};'>
				<slot />
			</div>
		{/if}
	{/key}
</div>
