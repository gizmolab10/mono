<script lang='ts'>
	import type { Ancestry } from '../../nav/Ancestry';
	import { G_Widget }      from '../../geometry/G_Widget';
	import type { Point }    from '../../types/Coordinates';
	import { colors }        from '../../colors/Colors.svelte';
	import { ux }            from '../../state/ux.svelte';
	import Widget_Drag       from './Widget_Drag.svelte';
	import Widget_Title      from './Widget_Title.svelte';
	import Widget_Reveal     from './Widget_Reveal.svelte';

	let { ancestry, center }: {
		ancestry: Ancestry;
		center  : Point;
	} = $props();

	const title          = $derived(ancestry.thing?.title ?? '');
	const thing_color    = $derived(ancestry.thing?.color ?? colors.thing);
	const isGrabbed      = $derived(ux.isGrabbed(ancestry));
	const isFocus        = $derived(ancestry.equals(ux.ancestry_focus));
	const showing_reveal = $derived(ancestry.hasChildren);
	const g_widget       = $derived(new G_Widget(center, title, showing_reveal));

	function handle_click(event: MouseEvent) {
		event.stopPropagation();
		if (event.shiftKey) {
			ux.grab(ancestry);
		} else {
			ux.grabOnly(ancestry);
		}
	}

	const border_style = $derived(
		isFocus   ? `2px solid ${thing_color}` :
		isGrabbed ? `1px solid ${thing_color}` :
		            '1px solid transparent'
	);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class      = 'widget'
	style:left = '{g_widget.origin.x}px'
	style:top  = '{g_widget.origin.y}px'
	style:width  = '{g_widget.width}px'
	style:height = '{g_widget.height}px'
	style:color  = {thing_color}
	style:background = 'white'
	style:border = {border_style}
	style:border-radius = '4px'
	onclick={handle_click}>
	<Widget_Drag color={thing_color} center={ancestry.isRoot ? g_widget.center_ofDrag.offsetByY(-1) : g_widget.center_ofDrag} />
	<Widget_Title {title} left={g_widget.origin_ofTitle.x} />
	{#if showing_reveal}
		<Widget_Reveal {ancestry} left={g_widget.width - 14} top={(g_widget.height - 14) / 2 - 0.3 - (ancestry.isRoot ? 1 : 0)} />
	{/if}
</div>

<style>
	.widget {
		position    : absolute;
		display     : flex;
		align-items : center;
		font-size   : 14px;
		cursor      : pointer;
		box-sizing  : border-box;
	}
</style>
