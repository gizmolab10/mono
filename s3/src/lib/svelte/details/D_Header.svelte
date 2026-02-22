<script lang='ts'>
	import { ux }     from '../../state/ux.svelte';
	import { colors } from '../../colors/Colors.svelte';

	let ancestry = $derived(ux.ancestry_forDetails);
	let thing    = $derived(ancestry?.thing ?? null);
	let bg       = $derived(thing?.color ?? colors.separator);
	let title    = $derived(thing?.title ?? '');
	let lume     = $derived(colors.luminance_ofColor(bg));
	let fg       = $derived(lume > 0.45 ? '#222' : '#fff');
</script>

{#if thing}
	<div
		class                  = 'header'
		style:background-color = {bg}
		style:color            = {fg}>
		<span class='title'>{title.length > 30 ? title.slice(0, 30) + '…' : title}</span>
	</div>
{/if}

<style>
	.header {
		display         : flex;
		align-items     : center;
		justify-content : center;
		height          : 24px;
		padding         : 0 8px;
		font-size       : 12px;
		font-weight     : 500;
		font-family     : system-ui, sans-serif;
	}

	.title {
		overflow      : hidden;
		text-overflow : ellipsis;
		white-space   : nowrap;
	}
</style>
