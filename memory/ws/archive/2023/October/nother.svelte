<script lang='ts'>
	import { noop, onMount } from '../../ts/common/GlobalImports';
	let { onSingle, onDouble, onLong } = $props();
    const threshold = 200;				// one fifth of a second
	let button = $state(null);
    let detect;

	onMount( () => {
		button.addEventListener('dblclick', onDouble);
	});

	function handleContextMenu(event) {
		event.preventDefault(); 		// Prevent the default context menu on right-
	}

	function handleMouseDown() {
		detect = new Date().getTime() + threshold;
	}

	function handleMouseUp() {
		if (detect <= new Date().getTime()) {
			onLong();
		} else {
			onSingle();
        }
	}

</script>

<button
	bind:this={button}
	onblur={noop()}
	onfocus={noop()}
	onkeypress={noop()}
    onmouseup={handleMouseUp}
    onmousedown={handleMouseDown}
    oncontextmenu={handleContextMenu}>
</button>
