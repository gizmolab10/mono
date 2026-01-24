<script lang='ts'>
	import { g, h, k, s, u, hits, colors, search, elements } from '../../ts/common/Global_Imports';
	import { Point, T_Search, T_Banner, T_Hit_Target } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Button from './Button.svelte';
	export let center = Point.zero;
	export let s_breadcrumb;
	export let left = 0;
	const { w_s_hover } = hits;
	const borderStyle = '1px solid';
	const { w_thing_fontFamily } = s;
	const { w_thing_color, w_background_color } = colors;
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
	
	function updateColors() {
		if (!!thing &&!!s_element) {
			colorStyles = `background-color: ${s_breadcrumb.fill}`;
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

	function handle_s_mouse(s_mouse) {
		if (!!h && h.hasRoot && s_mouse.isUp) {
			search.deactivate();
			if (ancestry.becomeFocus()) {
				g.grand_build();
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
