<script lang="ts">
	import { ZIndex, transparentize } from '../../ts/common/GlobalImports';
	import { Popper } from 'svelte-popperjs';
	let { color, children } = $props();
</script>

<style>

	#tooltip {
		font-size: 8px;
		padding: 4px 8px;
		position: absolute;
		visibility: visible;
		border-radius: 1em;
	}

	#arrow,
	#arrow::before {
		width: 8px;
		height: 8px;
		content: '';
		position: absolute;
		background: inherit;
		visibility: visible;
		transform: rotate(45deg)
	}

	#arrow {
		visibility: hidden;
	}
	#arrow::after {
		visibility: visible;
	}

	#tooltip[data-popper-placement^='top'] > #arrow {
		bottom: -4px;
	}

	#tooltip[data-popper-placement^='bottom'] > #arrow {
		top: -4px;
	}

	#tooltip[data-popper-placement^='left'] > #arrow {
		right: -4px;
	}

	#tooltip[data-popper-placement^='right'] > #arrow {
		left: -4px;
	}

</style>

<div>
	<div id='tooltip' role='tooltip'
		style='
			color: {color};
			border: {color};
			z-index: {ZIndex.frontmost};
			background: {transparentize(color, 0.8)};
	'>
		{@render children?.()}
		<div id='arrow' data-popper-arrow></div>
	</div>
</div>
