<script lang='ts'>
	let {
		title,
		onclick,
		thickness = 2,
		length    = 41,
		vertical  = false,
	}: {
		title?     : string;
		onclick?   : () => void;
		thickness? : number;
		length?    : number;
		vertical?  : boolean;
	} = $props();

	let radius = $derived(thickness * 3.2);
	let width  = $derived(radius * 2 + thickness);	// applies only to vertical
	let rpx    = $derived(`${radius}px`); 
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if vertical}
	<div class='v-wrap' style:width='{width}px' style:height={length ? `${length}px` : undefined} style:margin='-4px -13px -4px -9px' onclick={onclick}>
		<div class='separator' class:clickable={!!onclick} style:gap='{thickness}px'>
			<div class='flare' style:height={rpx} style:border-radius='0 0 {rpx} {rpx}'></div>
			{#if title}<span class='title'>{title}</span>{/if}
			<div class='flare' style:height={rpx} style:border-radius='{rpx} {rpx} 0 0'></div>
		</div>
	</div>
{:else}
	<div class='separator' class:clickable={!!onclick} style:gap='{thickness}px' style:margin='0 -8px' onclick={onclick}>
		<div class='flare' style:height={rpx} style:border-radius='0 0 {rpx} {rpx}'></div>
		{#if title}<span class='title'>{title}</span>{/if}
		<div class='flare' style:height={rpx} style:border-radius='{rpx} {rpx} 0 0'></div>
	</div>
{/if}

<style>
	.separator {
		display        : flex;
		flex-direction : column;
		background     : var(--accent);
	}

	.v-wrap {
		z-index        : 0;
		container-type : size;
		align-self     : stretch;
	}

	.v-wrap .separator {
		top       : 50%;
		left      : 50%;
		width     : 100cqh;
		position  : relative;
		transform : translate(-50%, -50%) rotate(90deg);
	}

	.clickable {
		cursor : pointer;
	}

	.clickable:hover .title {
		opacity : 1;
	}

	.flare {
		background : var(--bg);
	}

	.title {
		opacity        : 0.6;
		font-size      : 10px;
		padding        : 0 4px;
		letter-spacing : 0.5px;
		text-align     : center;
		white-space    : nowrap;
	}
</style>
