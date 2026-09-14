<script lang='ts'>
	import Edit_Fields from '../content/Edit_Fields.svelte';
	import { Main, type File } from '../../ts/common/Kb';

	// The host of kb's page: draws it, and hands it the edit filter section since step 10 of the
	// plan, ai's information rows, given the file, its words and a call that sets them. The other
	// three snippets come with their steps.
</script>

{#snippet edit_filter(guide: File, text: string, set_text: (words: string) => void)}
	<Edit_Fields {guide} {text} {set_text} />
{/snippet}

<Main {edit_filter} />
