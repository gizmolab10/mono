<script lang='ts'>
	import { onMount, onDestroy }  from 'svelte';
	import type { Ancestry }       from '../../nav/Ancestry';
	import { G_Widget }            from '../../geometry/G_Widget';
	import type { Point }          from '../../types/Coordinates';
	import { T_Hit_Target }        from '../../common/Enumerations';
	import { S_Hit_Target }        from '../../state/S_Hit_Target';
	import { colors }              from '../../colors/Colors.svelte';
	import { hits }                from '../../managers/Hits.svelte';
	import { ux }                  from '../../state/ux.svelte';
	import Widget_Drag             from './Widget_Drag.svelte';
	import Widget_Title            from './Widget_Title.svelte';
	import Widget_Reveal           from './Widget_Reveal.svelte';

	let { ancestry, center }: {
		ancestry: Ancestry;
		center  : Point;
	} = $props();

	const title          = $derived(ancestry.thing?.title ?? '');
	const thing_color    = $derived(ancestry.thing?.color ?? colors.thing);
	const isGrabbed      = $derived(ux.isGrabbed(ancestry));
	const isFocus        = $derived(ancestry.equals(ux.ancestry_focus));
	const isHovering     = $derived(hits.hovering?.ancestry !== null && ancestry.equals(hits.hovering?.ancestry));
	const showing_reveal = $derived(ancestry.hasChildren);
	const g_widget       = $derived(new G_Widget(center, title, showing_reveal));

	let element: HTMLDivElement;
	let hit_target: S_Hit_Target;

	onMount(() => {
		hit_target = new S_Hit_Target(T_Hit_Target.widget, ancestry);
		hit_target.handle_s_mouse = (s_mouse) => {
			if (s_mouse.isDown) {
				const shiftKey = s_mouse.event?.shiftKey ?? false;
				if (shiftKey) {
					ux.grab(ancestry);
				} else if (ux.isGrabbed(ancestry) && !ancestry.isRoot) {
					if (!ux.isEditing_ancestry(ancestry)) {
						s_mouse.event?.preventDefault();
						ux.startEdit(ancestry);
					}
				} else {
					ux.grabOnly(ancestry);
				}
			}
			return true;
		};
		hit_target.set_html_element(element);
		hits.add_hit_target(hit_target);
	});

	onDestroy(() => {
		if (hit_target) hits.delete_hit_target(hit_target);
	});

	const border_style = $derived(
		ux.isEditing_ancestry(ancestry) ? `1px dashed ${thing_color}` :
		isFocus    ? `2px solid ${thing_color}` :
		isGrabbed  ? `1px solid ${thing_color}` :
		isHovering ? `1px solid ${thing_color}66` :
		             '1px solid transparent'
	);

	const background = $derived(
		isHovering && !isGrabbed && !isFocus ? `${thing_color}0A` : 'white'
	);
</script>

<div
	class      = 'widget'
	bind:this  = {element}
	style:left = '{g_widget.origin.x}px'
	style:top  = '{g_widget.origin.y}px'
	style:width  = '{g_widget.width}px'
	style:height = '{g_widget.height}px'
	style:color  = {thing_color}
	style:background = {background}
	style:border = {border_style}
	style:border-radius = '4px'>
	<Widget_Drag {ancestry} color={thing_color} center={ancestry.isRoot ? g_widget.center_ofDrag.offsetByY(-1) : g_widget.center_ofDrag} />
	<Widget_Title {ancestry} left={g_widget.origin_ofTitle.x} />
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
