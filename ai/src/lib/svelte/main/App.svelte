<script lang='ts'>
	import Edit_Markdown from '../content/Edit_Markdown.svelte';
	import Edit_Fields from '../content/Edit_Fields.svelte';
	import { Main, type File } from '../../ts/common/Kb';

	// The host of kb's page: draws it, and hands it two snippets. The edit filter section since
	// step 10 of the plan, ai's information rows, given the file, its words and a call that sets
	// them. The operation view since step 11, the words drawn as a page, given the file, the width
	// and the height, the words and the call that sets them, a call that takes the html, and
	// the calls for drawn, redrawn and a note. The other two come with their steps.
</script>

{#snippet edit_filter(guide: File, text: string, set_text: (words: string) => void)}
	<Edit_Fields {guide} {text} {set_text} />
{/snippet}

{#snippet operation_view(guide: File, _width: number, _height: number, text: string, set_text: (words: string) => void, set_page: (page: HTMLElement | null) => void, ondrawn: () => void, onredrawn: () => void, onshow: (message: string) => void)}
	<Edit_Markdown name={guide.name} address={guide.address} {guide} {text} {set_text} {set_page} {ondrawn} {onredrawn} {onshow} />
{/snippet}

<Main {edit_filter} {operation_view} />
