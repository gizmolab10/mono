<script lang='ts'>
	import { c, k, Rect, Point, T_Layer } from '../../ts/common/Global_Imports';
	import Separator from './Separator.svelte';
    export let corner_radius: number = k.radius.fillets.thick;
    export let thickness: number = k.thickness.separator.main;
    export let showBottom: boolean = true;
    export let showRight: boolean = true;
	export let zindex = T_Layer.details;
    export let showLeft: boolean = true;
    export let showTop: boolean = true;
    export let name: string = k.empty;
    export let height: number = 0;
    export let width: number = 0;
    export let left: number = 0;
    export let top: number = 0;
    const svg_rect = Rect.createWHRect(width, height);

    </script>

<div class='{name}-box'
    style='
        top: {top}px;
        display: flex;
        left: {left}px;
        z-index: {zindex};
        height: {height}px;
        position: absolute;
        width: {width + 2}px;
        box-sizing: border-box;
        flex-direction: column;'>
    <div class='{name}-central-box' style='
        flex: 1;
        display: flex;'>
        {#if showLeft}
            <Separator name='{name}-left-side'
                length={height + 1}
                isHorizontal={false}
                thickness={thickness}
                origin={new Point(2, 2.5)}
                corner_radius={corner_radius}/>
        {/if}
        <div class='{name}-content-box' style='flex: 1;'>
            <slot />
        </div>
        {#if showRight}
            <Separator name='{name}-right-side'
                isHorizontal={false}
                length={height + 1}
                thickness={thickness}
                corner_radius={corner_radius}
                origin={new Point(width + 1 - thickness / 2, 2.5)}/>
        {/if}
    </div>
    {#if showTop}
        <Separator name='{name}-top'
            length={width + 2}
            origin={Point.zero}
            isHorizontal={true}
            thickness={thickness}
			has_fillets={false}
            corner_radius={corner_radius}/>
    {/if}
    {#if showBottom}
        <Separator name='{name}-bottom'
            length={width + 2}
            isHorizontal={true}
            thickness={thickness}
			has_fillets={false}
            corner_radius={corner_radius}
            origin={Point.y(height - thickness)}/>
    {/if}
</div>
