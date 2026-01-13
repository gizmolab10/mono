<script lang='ts'>
    import { e, g, k, core, u, x, hits, debug, colors, elements } from '../../ts/common/Global_Imports';
    import { T_Layer, T_Drag, T_Hit_Target, S_Mouse } from '../../ts/common/Global_Imports';
    import { Rect, Size, Point, Ancestry } from '../../ts/common/Global_Imports';
    import Identifiable from '../../ts/runtime/Identifiable';
    import { onMount } from 'svelte';
    export let strokeWidth = k.thickness.rubberband;
    export let bounds: Rect;
    const enabled = true;
    const { w_dragging } = hits;
    const { w_s_title_edit } = x;
    const { w_count_mouse_up } = e;
    const { w_user_graph_offset } = g;
	const { w_separator_color } = colors;
	const { w_mouse_location, w_scaled_movement } = e;
    const s_element = elements.s_element_for(new Identifiable('rubberband'), T_Hit_Target.rubberband, 'graph');
    let rbush_forRubberband = hits.rbush_forRubberband;
    let rubberband_hit_area: HTMLElement;
    let mouse_upCount = $w_count_mouse_up;
    let startPoint: Point | null = null;
    let has_rubberbanded_grabs = true;
    let has_intersections = false;
    let original_grab_count = 0;
    let rect = Rect.zero;
    let lastUpdate = 0;

    onMount(() => {
        // Set up hit area element
        if (rubberband_hit_area) {
            s_element.set_html_element(rubberband_hit_area);
        }
        s_element.handle_s_mouse = handle_s_mouse;

        // Block events during rubberband
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
        document.body.classList.add('rubberband-blocking');     // see style:global block below
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

    $: style = `
        top: ${rect.y}px;
        left: ${rect.x}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        z-index: ${T_Layer.rubberband};
        border-width: ${strokeWidth}px;
        border-color: ${$w_separator_color};
        display: ${$w_dragging === T_Drag.rubberband ? 'block' : 'none'};`
    ;

    $: if ($w_dragging !== T_Drag.none && startPoint && $w_mouse_location) {
        const now = Date.now();
        if (now - lastUpdate >= 40) {
            lastUpdate = now;
            const constrainedEnd = constrainToRect($w_mouse_location);
            rect.height = Math.abs(constrainedEnd.y - startPoint.y);
            rect.width = Math.abs(constrainedEnd.x - startPoint.x);
            rect.x = Math.min(constrainedEnd.x, startPoint.x);
            rect.y = Math.min(constrainedEnd.y, startPoint.y);
            detect_and_grab();
        }
    }

    $: if ($w_count_mouse_up !== mouse_upCount) {
        mouse_upCount = $w_count_mouse_up;
        if ($w_dragging === T_Drag.graph) {
            startPoint = null;
            $w_dragging = T_Drag.none;
        } else if ($w_dragging === T_Drag.rubberband) {
            if (!has_rubberbanded_grabs) {
                x.si_grabs.reset();
            }
            startPoint = null;
            rect.height = 0;
            rect.width = 0;
            $w_dragging = T_Drag.none;
        }
    }

    function ancestries_intersecting_rubberband(): Array<Ancestry> {
        return rbush_forRubberband.search(rect.asBBox).map(b => b.target.ancestry);
    }

    function constrainToRect(point: Point): Point {
        return new Point(
            point.x.force_between(bounds.x, bounds.right),
            point.y.force_between(bounds.y, bounds.bottom)
        );
    }

    function blockEvent(e: Event) {
        const target = e.target;
        // Only block events when rubberband is active and target is not an interactive element
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
            if (ancestries.length != 0) {
                x.si_grabs.items = ancestries;
            } else {
                x.si_grabs.reset();
            }
            // w_ancestry_forDetails is now automatically updated via derived store
        }
    }

    // Handle clicks on empty graph space
    // This only gets called if no higher-priority target (dot/widget/ring) handled the click
    function handle_s_mouse(s_mouse: S_Mouse): boolean {
        if (s_mouse.isDown && s_mouse.event) {
            const event = s_mouse.event;
            startPoint = new Point(event.clientX, event.clientY);
            if (event.metaKey) {
                $w_dragging = T_Drag.graph;
            } else {
                // Start rubberband - we know no widget/dot/ring was clicked
                // because handle_s_mouse_at prioritizes those targets
                const constrained = constrainToRect(startPoint);
                original_grab_count = x.si_grabs.items.length;
                rect.y = constrained.y;
                rect.x = constrained.x;
                $w_dragging = T_Drag.rubberband;
                rbush_forRubberband = hits.rbush_forRubberband;
            }
            return true;
        }
        return false;
    }

</script>

<!-- Hit area covering full graph bounds -->
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

{#if enabled && $w_dragging === T_Drag.rubberband}
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

    .rubberband {
        position: fixed;
        border-style: dashed;
        pointer-events: none;
        box-sizing: border-box;
        background-color: rgba(0, 0, 0, 0.05);
    }
</style>
