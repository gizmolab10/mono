<script lang='ts'>
	import { scenes, stores } from '../../ts/managers';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Parts_Tab } from '../../ts/types/Enumerations';
	import { engine } from '../../ts/render';

	const { w_selection, w_tick, w_parts_tab } = stores;

	let selected_so = $derived($w_selection?.so ?? null);
	let is_root = $derived(!selected_so?.scene?.parent);
	function get_visible_label(_tick: number) { return selected_so?.visible === false ? 'hidden' : 'visible'; }
	let visible_label = $derived(get_visible_label($w_tick));

	function toggle_visible() {
		if (!selected_so) return;
		selected_so.visible = !selected_so.visible;
		stores.tick();
		scenes.save();
	}
</script>

{#if selected_so}
<div class='actions-row'>
	{#if !is_root}<button class='action-btn' use:hit_target={{ id: 'duplicate', onpress: () => engine.duplicate_selected() }}>duplicate</button>{/if}
	<div class='segmented'>
		<button class:active={$w_parts_tab === 'attributes'} onclick={() => w_parts_tab.set(T_Parts_Tab.attributes)}>attributes</button>
		<button class:active={$w_parts_tab === 'rotation'} onclick={() => w_parts_tab.set(T_Parts_Tab.rotation)}>angles</button>
		<button class:active={$w_parts_tab === 'repeater'} onclick={() => w_parts_tab.set(T_Parts_Tab.repeater)}>repeats</button>
	</div>
	<button class='action-btn action-far-right' use:hit_target={{ id: 'toggle-visible', onpress: toggle_visible }}>↔ {visible_label}</button>
</div>
{/if}

<style>
	.actions-row {
		display       : flex;
		gap           : 6px;
		margin-top    : 0px;
		margin-bottom : 5px;
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
		white-space   : nowrap;
	}

	.action-far-right {
		margin-left : auto;
	}

	.action-btn:disabled {
		opacity        : 0.3;
		cursor         : default;
		pointer-events : none;
	}

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	.segmented {
		display : flex;
		gap     : 0;
		margin  : 0 auto;
	}

	.segmented button {
		border        : 0.5px solid currentColor;
		background    : white;
		color         : inherit;
		font-size     : 11px;
		height        : 20px;
		padding       : 0 8px;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.segmented button:first-child {
		border-radius : 10px 0 0 10px;
	}

	.segmented button:last-child {
		border-radius : 0 10px 10px 0;
	}

	.segmented button:not(:first-child) {
		border-left : none;
	}

	.segmented button.active {
		background  : var(--accent);
		font-weight : 600;
	}

	.segmented button:hover:not(.active) {
		background : var(--bg);
	}
</style>
