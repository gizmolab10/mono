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
		<li class='help-li'>To <b>edit</b> an item, click on its text (try it on the item above).
		<li class='help-li'>Or, if it is <b>selected</b>, tap the <i>Enter</i> key.
		<li class='help-li'>When you finish editing, tap the <i>Enter</i> key [again] to save your changes.
	</ul>
</div>
