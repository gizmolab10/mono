<script lang='ts'>
	import { colors }    from '../../colors/Colors.svelte';
	import { k }         from '../../common/Constants';
	import { ux }        from '../../state/ux.svelte';
	import Tree_Graph    from '../tree/Tree_Graph.svelte';

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

	function handleKeydown(event: KeyboardEvent) {
		const grabbed = ux.grabs[ux.grabs.length - 1] ?? ux.ancestry_focus;
		if (!grabbed) return;

		switch (event.key) {
			case 'ArrowUp': {
				event.preventDefault();
				const siblings = grabbed.sibling_ancestries;
				const index    = grabbed.siblingIndex;
				if (index > 0) ux.grabOnly(siblings[index - 1]);
				break;
			}
			case 'ArrowDown': {
				event.preventDefault();
				const siblings = grabbed.sibling_ancestries;
				const index    = grabbed.siblingIndex;
				if (index < siblings.length - 1) ux.grabOnly(siblings[index + 1]);
				break;
			}
			case 'ArrowLeft': {
				event.preventDefault();
				const parent = grabbed.parentAncestry;
				if (!parent.isRoot || grabbed.depth > 1) ux.grabOnly(parent);
				break;
			}
			case 'ArrowRight': {
				event.preventDefault();
				const branches = grabbed.branchAncestries;
				if (branches.length > 0) {
					if (!grabbed.isExpanded) {
						ux.expand(grabbed);
					}
					ux.grabOnly(branches[0]);
				}
				break;
			}
			case '/': {
				event.preventDefault();
				ux.becomeFocus(grabbed);
				break;
			}
			case 'Escape': {
				event.preventDefault();
				ux.grab_none();
				break;
			}
			case '[': {
				event.preventDefault();
				ux.recents_go(false);
				break;
			}
			case ']': {
				event.preventDefault();
				ux.recents_go(true);
				break;
			}
		}
	}
</script>

<svelte:window onresize={handleResize} onkeydown={handleKeydown} />

<div
	class                  = 'panel'
	style:width            = '{width}px'
	style:height           = '{height}px'
	style:padding          = '{gap}px'
	style:--gap            = '{gap}px'
	style:--radius         = '{radius}px'
	style:background-color = {colors.separator}>

	<!-- Controls bar -->
	<div
		class                  = 'region controls'
		style:height           = '{controlsHeight}px'
		style:background-color = {colors.background}>
	</div>

	<!-- Main area -->
	<div class='main' style:height='{mainHeight}px' style:margin-top='{gap}px'>
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

	.graph {
		flex : 1;
	}
</style>
