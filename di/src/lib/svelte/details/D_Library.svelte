<script lang='ts'>
	import { hit_target } from '../../ts/events/Hit_Target';
	import { scenes } from '../../ts/managers';
</script>

<div class='settings'>
	<button class='action-btn' use:hit_target={{ id: 'import', onpress: () => scenes.import_from_file() }}>import</button>
	<button class='action-btn' use:hit_target={{ id: 'export', onpress: () => scenes.export_to_file() }}>export</button>
	<button class='action-btn' use:hit_target={{ id: 'reset', onpress: () => { scenes.clear(); location.reload(); } }}>reset</button>
</div>

<style>
	.settings {
		display : flex;
		gap     : 6px;
	}

	.action-btn {
		border        : 0.5px solid currentColor;
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		background    : white;
		padding       : 0 8px;
		border-radius : 10px;
		font-size     : 11px;
		height        : 20px;
	}

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}
</style>
