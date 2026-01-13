<script lang="ts">
    import { noop } from '../../ts/common/GlobalImports';
	interface Props {
		title?: string;
		onSingle: any;
		onDouble: any;
		onLong: any;
	}

	let {
		title = '',
		onSingle,
		onDouble,
		onLong
	}: Props = $props();
	let clickCount = 0;
	let clickTimer;
	const doubleClickThreshold = 200;				// one fifth of a second
	const longClickThreshold = 1000;

	function handleSingleClick() {
		clickCount++;

		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				onSingle();
			}
			clickCount = 0;
		}, doubleClickThreshold);
	}

	function handleDoubleClick() {
		clearTimeout(clickTimer);
		clickCount = 0;
		onDouble();
	}

	function handleLongClick() {
		clearTimeout(clickTimer);
		clickCount = 0;
		onLong();
	}

	function handleContextMenu(event) {
		event.preventDefault(); 		// Prevent the default context menu on right-
	}
    
</script>

<button
	onblur={noop()}
	onfocus={noop()}
	onkeypress={noop()}
    onclick={handleSingleClick}
    onmousedown={handleLongClick}
    ondblclick={handleDoubleClick}
    oncontextmenu={handleContextMenu}>
	{title}
</button>
