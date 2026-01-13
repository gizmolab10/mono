<script lang='ts'>
	import { g, k, core, u, x, hits, show, T_Layer, T_Detail, details } from '../../ts/common/Global_Imports';
	import Glows_Banner from '../mouse/Glows_Banner.svelte';
	import { tick } from 'svelte';
    export let t_detail: T_Detail;
	const { w_ancestry_forDetails } = x;
	const { w_t_details } = show;
	const s_banner_hideable = details.s_banner_hideables_dict_byType[t_detail];
	const { w_description, w_extra_titles } = s_banner_hideable?.si_items;
	let title = details.banner_title_forDetail(t_detail);
	let titles = [title, ...$w_extra_titles];
	let hideable_isVisible = true;
	let trigger = k.empty;

	update_hideable_isVisible();

	$: {
		const _ = `${$w_description}:::${$w_ancestry_forDetails?.id}`;
		update_banner_titles();
	}

	$: { 
		const _ = $w_t_details;
		update_hideable_isVisible();
		// hits.recalibrate();
	}

	function update_trigger() {}// trigger = `${titles.join(k.comma)}:::${hideable_isVisible}:::${$w_description}:::${$w_ancestry_forDetails?.id}`; }

	function update_banner_titles() {
		const new_title = details.banner_title_forDetail(t_detail);
		const new_titles = [new_title, ...$w_extra_titles];
		if (new_titles.join(k.comma) == titles.join(k.comma)) {
			// console.log(`no trigger: "${new_title}"`);
		} else {
			const prior_titles = titles;
			titles = new_titles;
			title = new_title;
			update_trigger();
			// console.log(`now: "${new_title}" description: "${$w_description}"`);
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

	async function toggle_hidden(t_detail: string) {
		let t_details = $w_t_details;
		if (t_details.includes(t_detail)) {
			t_details = u.remove_fromArray_byReference(t_detail, t_details);
		} else {
			t_details.push(t_detail);
		}
		$w_t_details = t_details;
		update_hideable_isVisible();
		await tick();
		hits.recalibrate();
	}

</script>

<div class='{titles[0]}-dynamic-container'
	style='
		width: 100%;
		height: auto;
		display: flex;
		position: relative;
		flex-direction: column;
		z-index:{T_Layer.stackable};
		background-color: transparent;'>
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
