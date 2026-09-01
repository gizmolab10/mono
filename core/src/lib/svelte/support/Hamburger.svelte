<script lang='ts'>
	import { svg_paths } from '../../ts/utilities';
	import { k } from '../../ts/common';

	// The three-bar button. What it does belongs to the host, handed in — core keeps no
	// state of its own — and so does how it looks: the host's own stylesheet reaches it
	// by the two class names below. What core owns is the drawn path and the markup.

	let { onpress, label, size = k.size.big }: {
		onpress : () => void;    // what a press does; the host's own
		label   : string;        // what a screen reader says it is
		size?   : number;        // how wide and tall the drawing stands
	} = $props();
</script>

<button class='hamburger-button' aria-label={label} type='button' onclick={onpress}>
	<svg class='hamburger-icon' viewBox='0 0 {size} {size}' width={size} height={size} aria-hidden='true'>
		<path d={svg_paths.hamburger(size)} />
	</svg>
</button>
