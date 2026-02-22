<script lang='ts'>
	import { T_Detail }  from '../../common/Enumerations';
	import { colors }    from '../../colors/Colors.svelte';

	let {
		t_detail,
		children,
	}: {
		t_detail: T_Detail;
		children: import('svelte').Snippet;
	} = $props();

	let hasBanner = $derived(t_detail !== T_Detail.header);
	let title     = $derived(T_Detail[t_detail]);

	let isVisible = $state(true);

	function toggle() {
		isVisible = !isVisible;
	}
</script>

{#if hasBanner}
	<button
		class    = 'banner'
		onclick  = {toggle}
		style:background-color = {colors.banner}>
		<span class='banner-title'>{title}</span>
		<span class='banner-arrow'>{isVisible ? '▾' : '▸'}</span>
	</button>
{/if}

{#if isVisible}
	<div class='hideable'>
		{@render children()}
	</div>
{/if}

<style>
	.banner {
		display          : flex;
		align-items      : center;
		justify-content  : space-between;
		width            : 100%;
		padding          : 3px 8px;
		border           : none;
		cursor           : pointer;
		font-size        : 10px;
		font-family      : system-ui, sans-serif;
		color            : #888;
		text-transform   : capitalize;
	}

	.banner:hover {
		color : #ccc;
	}

	.banner-title {
		font-weight : 500;
	}

	.banner-arrow {
		font-size : 9px;
	}

	.hideable {
		width : 100%;
	}
</style>
