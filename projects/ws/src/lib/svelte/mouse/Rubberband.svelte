<script lang='ts'>
    import { e, g, k, u, x, h, hits, debug, colors, elements, features, S_Items } from '../../ts/common/Global_Imports';
    import { T_Layer, T_Drag, T_Hit_Target, S_Mouse } from '../../ts/common/Global_Imports';
    import { Rect, Size, Point, Ancestry } from '../../ts/common/Global_Imports';
    import { s_rubberband } from '../../ts/state/S_Rubberband';
    import Identifiable from '../../ts/runtime/Identifiable';
    import { get } from 'svelte/store';
    import { onMount } from 'svelte';
    export let strokeWidth = k.thickness.rubberband;
    export let bounds: Rect;
    const { w_dragging } = hits;
    const { w_user_graph_offset } = g;
    const { w_separator_color } = colors;
    const { w_s_title_edit } = x;
    const { w_count_mouse_up, w_mouse_location, w_scaled_movement } = e;
    const s_element = elements.s_element_for(new Identifiable('rubberband'), T_Hit_Target.rubberband, 'graph');
    let rubberband_hit_area: HTMLElement;
    let mouse_upCount = $w_count_mouse_up;

    onMount(() => {
        if (rubberband_hit_area) {
            s_element.set_html_element(rubberband_hit_area);
        }
        s_element.handle_s_mouse = handle_s_mouse;

        document.addEventListener('pointerenter', blockEvent, true);
        document.addEventListener('pointerleave', blockEvent, true);
        document.addEventListener('pointermove', blockEvent, true);
        document.addEventListener('pointerdown', blockEvent, true);
        document.addEventListener('pointerup', blockEvent, true);
        return () => {
            hits.delete_hit_target(s_element);
            document.removeEventListener('pointerenter', blockEvent, true);
            document.removeEventListener('pointerleave', blockEvent, true);
            document.removeEventListener('pointermove', blockEvent, true);
            document.removeEventListener('pointerdown', blockEvent, true);
            document.removeEventListener('pointerup', blockEvent, true);
        };
    });

    $: if ($w_dragging === T_Drag.rubberband) {
        document.body.classList.add('rubberband-blocking');
    } else {
        document.body.classList.remove('rubberband-blocking');
    }

    $: if ($w_dragging === T_Drag.graph) {
        const delta = $w_scaled_movement;
        const userOffset = $w_user_graph_offset;
        if (!!userOffset && !!delta && delta.magnitude > 1) {
            debug.log_action(` command drag GRAPH`);
            g.set_user_graph_offsetTo(userOffset.offsetBy(delta));
        }
    }

    $: rect = s_rubberband.rect;

    $: style = `
        position: fixed;
        top: ${rect.y}px;
        left: ${rect.x}px;
        border-style: dashed;
        pointer-events: none;
        box-sizing: border-box;
        width: ${rect.width}px;
        height: ${rect.height}px;
        z-index: ${T_Layer.rubberband};
        border-width: ${strokeWidth}px;
        border-color: ${$w_separator_color};
        background-color: rgba(0, 0, 0, 0.05);
        display: ${$w_dragging === T_Drag.rubberband ? 'block' : 'none'};`
    ;

    $: if ($w_dragging === T_Drag.rubberband && $w_mouse_location) {
        if (s_rubberband.update($w_mouse_location, bounds)) {
            rect = s_rubberband.rect;
            detect_and_grab();
        }
    }

    $: if ($w_count_mouse_up !== mouse_upCount) {
        mouse_upCount = $w_count_mouse_up;
        if ($w_dragging === T_Drag.graph) {
            s_rubberband.startPoint = null;
            $w_dragging = T_Drag.none;
        } else if ($w_dragging === T_Drag.rubberband) {
            const rubberbandGrabs = get(x.w_rubberband_grabs);
            if (rubberbandGrabs.length > 0) {
                const focus = get(x.w_ancestry_focus) ?? h?.rootAncestry;
                if (focus) {
                    const si_grabs = new S_Items<Ancestry>(rubberbandGrabs);
                    si_grabs.index = rubberbandGrabs.length - 1;
                    const snapshot = { focus, si_grabs, depth: get(g.w_depth_limit) };
                    x.si_recents.push(snapshot);
                }
            } else {
                x.grab_none();
            }
            x.setGrabs_forRubberband([]);
            s_rubberband.stop();
            rect = s_rubberband.rect;
        }
    }

    function ancestries_intersecting_rubberband(): Array<Ancestry> {
        const rbush = s_rubberband.rbush;
        if (!rbush) return [];
        return rbush.search(s_rubberband.rect.asBBox)
            .map(b => b.target.ancestry)
            .filter(a => !!a);
    }

    function blockEvent(e: Event) {
        const target = e.target;
        if ($w_dragging === T_Drag.rubberband && target instanceof HTMLElement) {
            if (!target.closest('.panel') && 
                !target.closest('.draggable') &&
                !target.closest('.rubberband') && 
                !target.closest('.tree-preferences')) {
                u.consume_event(e);
            }
        }
    }

    function detect_and_grab() {
        if ($w_dragging === T_Drag.rubberband) {
            const ancestries = ancestries_intersecting_rubberband();
            x.setGrabs_forRubberband(ancestries);
        }
    }

    function handle_s_mouse(s_mouse: S_Mouse): boolean {
        if (s_mouse.isDown && s_mouse.event) {
            const event = s_mouse.event;
            x.w_s_title_edit?.set(null);
            const startPoint = new Point(event.clientX, event.clientY);
            if (event.metaKey) {
                s_rubberband.startPoint = startPoint;
                $w_dragging = T_Drag.graph;
            } else if (event.shiftKey) {
                x.grab_none();
            } else if (features.has_rubber_band) {
                s_rubberband.start(startPoint, bounds);
                rect = s_rubberband.rect;
            }
            return true;
        }
        return false;
    }

</script>

<div class='rubberband-hit-area' 
    bind:this={rubberband_hit_area}
    style='
        top: 0;
        left: 0;
        position: absolute;
        pointer-events: none;
        width: {bounds.width}px;
        z-index: {T_Layer.graph};
        height: {bounds.height}px;'/>
{#if features.has_rubber_band && $w_dragging === T_Drag.rubberband}
    <div class='rubberband' {style}/>
{/if}

<style>
    :global(body.rubberband-blocking) {
        cursor: crosshair !important;
        user-select: none !important;
        -ms-user-select: none !important;
        -moz-user-select: none !important;
        -webkit-user-select: none !important;
    }

    :global(.rubberband-blocking .button,
            .rubberband-blocking .controls, 
            .rubberband-blocking .segmented, 
            .rubberband-blocking .details-stack,
            .rubberband-blocking .bottom-controls) {
        pointer-events: none !important;
    }
</style>
