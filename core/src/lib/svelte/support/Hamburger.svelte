<script lang='ts'>
	import { svg_paths } from '../../ts/utilities';
	import { hit_target } from '../../ts/events';
	import { k } from '../../ts/common';

	// The three-bar button. It hands the whole of itself to the one manager: its name, what a
	// press does, and what to show while the cursor is on it. It carries no press handler, no
	// hover rule and no hint of its own.
	//
	// What it does and what it is called belong to the host, handed in — core keeps no state.
	// So does how it looks: the host's own stylesheet reaches it by the two class names below.

	let { id, onpress, label, tip = null, size = k.size.big }: {
		id      : string;            // what this button is called, said once by whoever draws it
		onpress : () => void;        // what a press does; the host's own
		label   : string;            // what a screen reader says it is
		tip?    : string | null;     // what to show while the cursor is on it; nothing, where there is nothing to say
		size?   : number;            // how wide and tall the drawing stands
	} = $props();
</script>

<button class='hamburger-button' aria-label={label}
	use:hit_target={{ id, onpress, tip }}>
	<svg class='hamburger-icon' viewBox='0 0 {size} {size}' width={size} height={size} aria-hidden='true'>
		<path d={svg_paths.hamburger(size)} />
	</svg>
</button>
