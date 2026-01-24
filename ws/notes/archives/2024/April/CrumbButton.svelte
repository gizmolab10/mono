<script lang='ts'>
	import { run } from 'svelte/legacy';

	import { k, u, Point, Thing, onMount, signals, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_path_focus } from '../../ts/state/State';
	import Button from '../buttons/Button.svelte';
	let { path } = $props();
	let colorStyles = k.empty;
	let cursorStyle = $state(k.empty);
	let thing: Thing = $state(path.thing);
	const borderStyle = '1px solid';
	let borderColor = k.color_background;
	let background_color = $state(k.color_background);
	let border = $state(`${borderStyle} ${borderColor}`);

	onMount(() => { updateColors(); });
	function isFocus(): boolean { return $s_path_focus.idThing == thing.id; }
	function handle_hover(isHovering) {
		const color = isHovering ? thing.color : borderColor
		border = `${borderStyle} ${color}`;
	}
	
	function updateColors() {
		if (!!thing) {
			if (isFocus) {
				background_color = transparentize(thing.color, 0.15);
			} else {
				background_color = k.color_background;
			}
			cursorStyle = !path.isGrabbed && path.hasChildRelationships ? 'cursor: pointer' : k.empty;
			borderColor = path.isGrabbed ? thing.color : k.color_background;
			border = `${borderStyle} ${borderColor}`;
		}
	};

	run(() => {
		thing = path.thing;
		updateColors();
	});

	function crumb_button_clicked(event) {
		if (dbDispatch.db.hasData) {
			path.grabOnly();
			if (path.becomeFocus()) {
				signals.signal_rebuildGraph_fromFocus();
			}
		}
	}

</script>

<Button
	click_closure={(event, isLong) => crumb_button_clicked(event)}
	hover_closure={(isHovering) => { handle_hover(isHovering); }}
	color={isFocus ? k.color_background : thing.color}
	background_color={background_color}
	center={new Point(8, 8)}
	position='relative'
	border={border}
	style='
		{cursorStyle};
		border-radius: 1em;'>
	<div style='padding:0px 0px 1px 0px; {cursorStyle};'>
		{thing?.title.injectElipsisAt()}
	</div>
</Button>
