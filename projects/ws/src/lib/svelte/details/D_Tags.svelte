<script lang='ts'>
    import { k, x } from '../../ts/common/Global_Imports';
	const { w_item: w_tag } = x.si_thing_tags;
    x.update_grabs_forSearch();
</script>

{#if !!$w_tag}
    <div class='tags-list'
        style='
            width: 100%;
            display: flex;
            padding: 4px 0;
            flex-wrap: wrap;
            text-align: center;
            align-items: center;
            white-space: pre-line;
            word-break: break-word;
            justify-content: center;
            min-height: {k.height.empty}px;
            font-size: {k.font_size.details}px;'>
        {$w_tag?.type}
    </div>
{:else}
    <div class='no-tags'
        style='
            width: 100%;
            display: flex;
            position: relative;
            text-align: center;
            align-items: center;
            justify-content: center;
            min-height: {k.height.empty}px;
            font-size: {k.font_size.details}px;'>
            no tags
    </div>
{/if}
