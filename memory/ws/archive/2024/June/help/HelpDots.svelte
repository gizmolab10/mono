<script>
	import { Point } from "../../ts/common/GlobalImports";
	import { exemplar } from '../../ts/data/Exemplar';
	import Widget from '../widget/Widget.svelte';

	export function title(isSelected) {
		return isSelected ? 'How the <b>Dots</b> work' : 'Dots';
	}
</script>

<style>
	@import '../../../styles/Help.css';
</style>

<div>
	<div class='centered-container'>
		<Widget ancestry={exemplar.oneAncestry}/>
	</div>
	<br>
	<br>
	<ul class='help-ul'>
		<li class='help-li'>Click the dots (to right and left of each item) to display the items in the child [<b>browse right</b>] or parent list [<b>browse left</b>], respectively.
		<li class='help-li'>Hold the <i>Shift</i> key as you click to <b>add or remove</b> that item from the set of <b>selected</b> items.
		<li class='help-li'>The dots on the left side are for <b>selecting</b> an item or <b>browsing left</b>. On that dot, long hold (for half a second) the mouse down (or touch) to focus on that item.
		<li class='help-li'>The dots on the right side let you <b>browse to the right</b>. On that dot, long hold (for half a second) the mouse down (or touch) to reveal the editing tools (try it above).
		<li class='help-li'><b>Hovering</b> over a dot will reverse its color (try it above).
	</ul>
</div>
