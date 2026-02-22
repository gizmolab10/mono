<script lang='ts'>
	import { colors }    from '../../colors/Colors.svelte';
	import { k }         from '../../common/Constants';
	import Tree_Graph    from '../tree/Tree_Graph.svelte';
	import Details       from '../details/Details.svelte';

	let width  = $state(window.innerWidth);
	let height = $state(window.innerHeight);

	const gap    = k.thickness.separator.main;
	const radius = gap * 3;

	const controlsHeight = 32;
	let mainHeight = $derived(height - controlsHeight - gap * 3);

	function handleResize() {
		width  = window.innerWidth;
		height = window.innerHeight;
	}
</script>

<svelte:window onresize={handleResize} />

<div
	class                  = 'panel'
	style:width            = '{width}px'
	style:height           = '{height}px'
	style:padding          = '{gap}px'
	style:--gap            = '{gap}px'
	style:--radius         = '{radius}px'
	style:--details-width  = '{k.width.details}px'
	style:background-color = {colors.separator}>

	<!-- Controls bar -->
	<div
		class                  = 'region controls'
		style:height           = '{controlsHeight}px'
		style:background-color = {colors.background}>
	</div>

	<!-- Main area -->
	<div class='main' style:height='{mainHeight}px' style:margin-top='{gap}px'>
		<!-- Details region -->
		<div
			class                  = 'region details'
			style:background-color = {colors.background}>
			<Details />
		</div>

		<!-- Graph region -->
		<div
			class                  = 'region graph'
			style:background-color = {colors.background}>
			<Tree_Graph />
		</div>
	</div>
</div>

<style>
	.panel {
		top         : 0;
		left        : 0;
		position    : fixed;
		font-family : system-ui, sans-serif;
		box-sizing  : border-box;
	}

	.main {
		display  : flex;
		overflow : hidden;
		gap      : var(--gap);
	}

	.region {
		overflow      : hidden;
		position      : relative;
		border-radius : var(--radius);
	}

	.controls {
		width : 100%;
	}

	.details {
		width     : var(--details-width);
		min-width : var(--details-width);
	}

	.graph {
		flex : 1;
	}
</style>
