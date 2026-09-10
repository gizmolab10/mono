<script lang='ts'>
	import { c, colors, hits, k, Point, S_Mouse } from '../../ts/common/Core';
	import { customizations } from '../../ts/common/Customizations';
	import { Panel } from '../../ts/common/Panel';

	// The host of panel's page. It does what every host owes — feeds the cursor to the hits
	// manager, pushes the colors onto the page, holds whether the details column is shown — and
	// hands Panel what goes in each region. One line in the operation view for now, drawn with
	// core's own sizes so the push from Constants to the page is proved the moment it opens.

	const { w_background_color, w_accent_color, w_hover_color, w_text_color } = colors;

	// Whenever any of the four theme colors changes, push all four onto the page so every
	// component can read them as plain style names. Nothing is remembered between visits yet,
	// so what is pushed is core's own defaults.
	$effect(() => {
		c.configure_reactive_colors($w_background_color, $w_accent_color, $w_hover_color, $w_text_color);
	});

	// Whether details shows at all is the hamburger's doing. Not remembered between visits yet.
	let show_details = $state(true);
</script>

<!-- The cursor is fed to the manager here and nowhere else: it asks which targets hold that point
     and hands the press to the one of highest precedence. A control that has moved over to it
     watches nothing itself. -->
<svelte:window
	onmousemove={(event) => hits.handle_mouse_movement_at(new Point(event.clientX, event.clientY))}
	onmousedown={(event) => hits.handle_s_mouse_at(new Point(event.clientX, event.clientY), S_Mouse.down(event, null))}
	onmouseup={(event) => hits.handle_s_mouse_at(new Point(event.clientX, event.clientY), S_Mouse.up(event, null))} />

{#snippet operation()}
	<div style:padding='{k.gap.fat}px' style:font-size='{k.font.normal}px'>mu is running.</div>
{/snippet}

<Panel name={customizations.name} details_shown={show_details} ontoggle={() => { show_details = !show_details; }} {operation} />
