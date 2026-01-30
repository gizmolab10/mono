<script lang='ts'>
	import { g, h, k, u, x, core, hits, show, colors, search, elements } from '../../ts/common/Global_Imports';
	import { Point, T_Search, T_Banner, T_Hit_Target } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Button from './Button.svelte';
	export let center = Point.zero;
	export let s_breadcrumb;
	export let left = 0;
	const { w_s_hover } = hits;
	const { w_depth_limit } = g;
	const borderStyle = '1px solid';
	const { w_thing_color, w_background_color } = colors;
	const { w_grabs, w_thing_fontFamily, w_ancestry_forDetails } = x;
	let thing = s_breadcrumb.ancestry.thing;
	let title = thing.breadcrumb_title ?? k.empty;
	let s_element = elements.s_element_for(s_breadcrumb.ancestry, T_Hit_Target.button, title);
	let colorStyles = s_breadcrumb.background;
	let name = `crumb: ${title ?? 'unknown'}`;
	let ancestry = s_breadcrumb.ancestry;
	let width = u.getWidthOf(title) + 15;
	let border = s_breadcrumb.border;
	let color = s_breadcrumb.color;
	let reattachments = 0;
	let style = k.empty;

	center = new Point(left + width / 2, 14);
	updateColors();

	$: {
		const _ = `${$w_background_color}:::${$w_s_hover?.id ?? 'null'}`;
		updateColors();
	}

	$: {
		if (!!thing && thing.id == $w_thing_color?.split(k.separator.generic)[0]) {
			updateColors();
		}
	}

	$: {
		// Check if this ancestry is in the grabbed items array
		const isGrabbed = $w_grabs.some(g => g && g.equals(ancestry));
		const _ = `${$w_grabs.length}:::${isGrabbed}`;
		updateColors();
	}
	
	function updateColors() {
		if (!!thing &&!!s_element) {
			colorStyles = s_breadcrumb.background;
			color = s_breadcrumb.stroke;
			border = s_element.border;
			updateStyle();
		}
		reattachments += 1;
	}

	function updateStyle() {
		style=`
			${colorStyles};
			cursor:pointer;
			color:${color};
			white-space:pre;
			border:${border};
			border-radius: 1em;
			padding:1px 6px 1px 6px;
			font: ${k.font_size.common}px ${$w_thing_fontFamily};
		`.removeWhiteSpace();
	}

	function adjust_focus() {
		if (ancestry.becomeFocus() && $w_ancestry_forDetails.hidden_by_depth_limit) {
			// adjust level to make selection visible
			$w_depth_limit = $w_ancestry_forDetails.depth_within_focus_subtree;
		}
	}

	function handle_s_mouse(s_mouse) {
		if (!!h && h.hasRoot && s_mouse.isDown) {
			const event = s_mouse.event;
			search.deactivate();
			if (event.metaKey || ancestry.depth_within_focus_subtree < 0) {
				adjust_focus();
			} else if (event.shiftKey) {
				ancestry.toggleGrab();
			} else {
				ancestry.grabOnly();
			}
		}
	}

</script>

{#key reattachments + $w_background_color}
	<Button
		name={name}
		style={style}
		width={width}
		center={center}
		position='absolute'
		s_button={s_element}
		handle_s_mouse={handle_s_mouse}>
		{title}
	</Button>
{/key}
