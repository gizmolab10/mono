<script lang='ts'>
	import { T_Detail }  from '../../common/Enumerations';
	import { colors }    from '../../colors/Colors.svelte';

	const STORAGE_KEY = 's3-detail-visibility';

	function load_visibility(): Record<string, boolean> {
		try   { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); }
		catch { return {}; }
	}

	let {
		t_detail,
		children,
	}: {
		t_detail: T_Detail;
		children: import('svelte').Snippet;
	} = $props();

	let hasBanner = $derived(t_detail !== T_Detail.header);
	let title     = $derived(T_Detail[t_detail]);

	let isVisible = $state(load_visibility()[T_Detail[t_detail]] ?? true);

	function toggle() {
		isVisible = !isVisible;
		const saved = load_visibility();
		saved[T_Detail[t_detail]] = isVisible;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
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
