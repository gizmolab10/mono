<script lang='ts'>
	import { run } from 'svelte/legacy';

	import { k, u, Point, ZIndex } from '../../ts/common/GlobalImports';
	interface Props {
		onClick?: any;
		hover_closure?: any;
		position?: string;
		center?: any;
		cursor?: string;
		border?: string;
		color?: string;
		height?: number;
		width?: number;
		children?: import('svelte').Snippet;
	}

	let {
		onClick = (event, isLong) => {},
		hover_closure = (flag) => {},
		position = 'absolute',
		center = new Point(),
		cursor = 'pointer',
		border = 'none',
		color = 'gray',
		height = 16,
		width = 16,
		children
	}: Props = $props();
	let isListening = $state(false);
	let isTiming = $state(false);
	let labelButton = $state();
	let clickTimer = $state();

	function handle_mouse_out(event) { hover_closure(false); }
	function handle_mouse_over(event) { hover_closure(true); }
	function handle_click(event) { if (!isTiming) { onClick(event, false); } }

	function clearTimer() {
		isTiming = false;
		clearTimeout(clickTimer);
	}

	run(() => {
		// if mouse is held down, timeout will fire
		// if not, handle_click will fire
		if (!!labelButton && !isListening) {
			isListening = true;
			labelButton.addEventListener('pointerup', (event) => { clearTimer(); });
			labelButton.addEventListener('pointerdown', (event) => {
				clearTimer();
				isTiming = true;
				clickTimer = setTimeout(() => {
					if (isTiming) {
						clearTimer();
						onClick(event, true);
					}
				}, k.threshold_longClick);
			});
		}
	});

</script>

<button class='label-button'
	onblur={u.ignore}
	onfocus={u.ignore}
	bind:this={labelButton}
	onclick={handle_click}
	onmouseout={handle_mouse_out}
	onmouseover={handle_mouse_over}
	style='
		color: {color};
		cursor: {cursor};
		border: {border};
		width: {width}px;
		height: {height}px;
		position: {position};
		z-index: {ZIndex.dots};
		background-color: transparent;
		top: {center.y - height / 2}px;
		left: {center.x - width / 2}px;'>
	{@render children?.()}
</button>
