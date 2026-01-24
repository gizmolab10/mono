<script>
	import { Point } from "../../ts/common/GlobalImports";
	import { exemplar } from '../../ts/data/Exemplar';
	import Widget from '../widget/Widget.svelte';
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
		<li class='help-li'>A <b>selected</b> item is surrounded with a border and the color of its dots are reversed (as illustrated above).
		<li class='help-li'>To <b>add a child</b> item to it (and begin editing the child), tap the <i>Space</i> key.
		<li class='help-li'>To <b>duplicate</b> an item (and begin to edit the duplicate), tap the <i>D</i> key.
		<li class='help-li'>To <b>delete</b> it, tap the <i>Delete</i> key.
		<li class='help-li'>To <b>move</b> it, hold the <i>Option</i> key down and tap an arrow key.
		<li class='help-li'>To add a <b>line</b>, tap the <i>Hyphen</i> key.
		<li class='help-li'>The buttons above the graph indicates the location of the <b>selected</b> item within the hierarchy. They are called <b>breadcrumbs</b> (like Hansel and Grettle left behind to find their way home).
	</ul>
</div>
