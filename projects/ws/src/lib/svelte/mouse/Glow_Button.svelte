<script lang='ts'>
    import { c, k, u, hits, show, colors, svgPaths, elements, T_Mouse_Detection } from '../../ts/common/Global_Imports';
    import { Rect, Size, Point, T_Layer, S_Mouse, T_Hit_Target } from '../../ts/common/Global_Imports';
    import Identifiable from '../../ts/runtime/Identifiable';
    import SVG_Gradient from '../draw/SVG_Gradient.svelte';
    import { onMount } from 'svelte';
    export let handle_mouseUp: (title: string) => boolean;
    export let font_size: number = k.font_size.banners;
    export let detects_autorepeat: boolean = false;
    export let banner_id: string = k.empty;
    export let title = k.empty;
    export let name = k.empty;
    export let height: number;
    export let width: number;
    const gradient_name = 'glowing';
	const { w_background_color } = colors;
    const { w_s_hover, w_autorepeat } = hits;
    const icon_path = svgPaths.fat_polygon_path_for(title);
    const glow_rect = Rect.createWHRect(width, height);
    const click_title = !!icon_path ? title : banner_id;
    const s_element = elements.s_element_for(new Identifiable(`glow-${banner_id}-${title}`), T_Hit_Target.glow, click_title);
    let glow_button: HTMLElement | null = null;
    let banner_color = colors.banner;

    onMount(() => {
        return () => {
            hits.delete_hit_target(s_element);
        };
    });

    $: isHovering = s_element.hasSameID_as($w_s_hover);
    $: isAutorepeating = detects_autorepeat && s_element.hasSameID_as($w_autorepeat);

	$: {
		const _ = $w_background_color;
		banner_color = colors.banner;
	}

    // Set up handle_s_mouse and autorepeat reactively to capture current handle_mouseUp
    $: if (!!s_element && !!glow_button) {
        s_element.set_html_element(glow_button);
        // Capture current values to avoid stale closures
        const current_handle_mouseUp = handle_mouseUp;
        const current_click_title = click_title;
        
        if (detects_autorepeat) {
            // For autorepeat buttons: only set up autorepeat callback
            // The callback fires immediately on mouse down (handled by Hits.ts)
            s_element.mouse_detection = T_Mouse_Detection.autorepeat;
            s_element.autorepeat_callback = () => current_handle_mouseUp(current_click_title);
            s_element.autorepeat_id = 0;
            // handle_s_mouse just returns true (autorepeat handles the click)
            s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
                return true;
            };
        } else {
            // For non-autorepeat buttons: handle click directly
            s_element.mouse_detection = 0;
            s_element.autorepeat_callback = undefined;
            s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
                if (s_mouse.isDown) {
                    current_handle_mouseUp(current_click_title);
                }
                return true;
            };
        }
    }
    
</script>

<div class='glow-button'
    bind:this={glow_button}
	class:autorepeating={isAutorepeating}
	style='
        width: {width}px;
        height: {height}px;
        position: relative;'>
    {#if !isHovering}
        <div class='glow-button-background' class:autorepeating={isAutorepeating}>
            <SVG_Gradient
                isInverted={true}
                name={gradient_name}
                color={banner_color}
                size={glow_rect.size}
                path={svgPaths.rectangle(glow_rect)}/>
        </div>
    {/if}
    <div class='glow-button-title'
        style='
            top: 50%;
            left: 50%;
            margin: 0;
            padding: 0;
            width: 100%;
            user-select: none;
            text-align: center;
            position: absolute;
            -ms-user-select: none;
            -moz-user-select: none;
            font-size: {font_size}px;
            -webkit-user-select: none;
            background-color: transparent;
            transform: translate(-50%, -50%);'>
        {#if !!icon_path}
            <svg
                viewBox='-2.2 -3.2 20 20'
                class='svg-glow-button-path'>
                <path d={icon_path} stroke={colors.border} fill={isHovering ? 'black' : 'white'} stroke-width='0.75'/>
            </svg>
        {:else}
            {title}
        {/if}
    </div>
</div>

<style>
    .glow-button-background {
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        position: absolute;
    }
    .glow-button-background.autorepeating {
        transform: scale(0.95);
        transition: transform 0.1s ease;
    }
</style> 