<script lang='ts'>
    import { k, show, Point, colors, Direction, S_Mouse, T_Mouse_Detection } from '../../ts/common/Global_Imports';
    import Triangle_Button from './Triangle_Button.svelte';
    export let hit_closure;
    const buttonSize = 20;
    const origin = new Point(19, 29);
    const offsetY = buttonSize / 2 - 1;
    const { w_t_directionals } = show;

	function hover_closure(isHovering) {
        const hover_color = colors.background_special_blend(colors.default, k.opacity.medium);
        return [isHovering ? hover_color : 'white', k.empty];
    }

	function handle_s_mouse(s_mouse: S_Mouse): boolean {
        const target = s_mouse.element;
        if (!!target && (s_mouse.isDown || s_mouse.isLong || s_mouse.isRepeat)) {
            const pointsUp = target.getAttribute('name') == 'up';
            hit_closure(pointsUp, s_mouse.event?.metaKey);
        }
        return true;
	}

</script>

<div class='steppers'>
    {#if $w_t_directionals[0]}
        <Triangle_Button
            mouse_detection={T_Mouse_Detection.autorepeat}
            center={origin.offsetByY(-offsetY)}
            handle_s_mouse={handle_s_mouse}
            hover_closure={hover_closure}
            strokeColor={colors.default}
            angle={Direction.up}
            size={buttonSize}
            name='up'
        />
    {/if}
    {#if $w_t_directionals[1]}
        <Triangle_Button
            mouse_detection={T_Mouse_Detection.autorepeat}
            center={origin.offsetByY(offsetY)}
            handle_s_mouse={handle_s_mouse}
            hover_closure={hover_closure}
            strokeColor={colors.default}
            angle={Direction.down}
            size={buttonSize}
            name='down'
        />
    {/if}
</div>

<style>
    .steppers {
		top: 0px;
		left: 0px;
		position: absolute;     
    }
</style>
