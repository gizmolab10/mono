<script lang='ts'>
	import { ux } from '../../state/ux.svelte';

	function handle_depth(event: Event) {
		const target = event.target as HTMLInputElement;
		ux.global_depth_limit = parseInt(target.value);
	}
</script>

<div class='preferences'>
	<div class='pref-row'>
		<label class='pref-label' for='depth-slider'>depth</label>
		<input
			id       = 'depth-slider'
			type     = 'range'
			min      = '1'
			max      = '12'
			value    = {ux.global_depth_limit}
			oninput  = {handle_depth}
			class    = 'slider'
		/>
		<span class='pref-value'>{ux.global_depth_limit}</span>
	</div>
</div>

<style>
	.preferences {
		padding : 6px 8px;
	}

	.pref-row {
		display     : flex;
		align-items : center;
		gap         : 8px;
	}

	.pref-label {
		font-size   : 10px;
		color       : #777;
		font-family : system-ui, sans-serif;
		min-width   : 36px;
		text-align  : right;
	}

	.slider {
		flex       : 1;
		height     : 4px;
		appearance : none;
		background : #444;
		outline    : none;
		cursor     : pointer;
	}

	.slider::-webkit-slider-thumb {
		appearance       : none;
		width            : 12px;
		height           : 12px;
		background       : #999;
		border-radius    : 50%;
		cursor           : pointer;
	}

	.pref-value {
		font-size   : 10px;
		color       : #aaa;
		font-family : system-ui, sans-serif;
		min-width   : 16px;
		text-align  : center;
	}
</style>
