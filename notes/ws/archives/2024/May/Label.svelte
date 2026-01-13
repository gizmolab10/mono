<script lang="ts">
	interface Props {
		style?: string;
		children?: import('svelte').Snippet<[any]>;
	}

	let { style = '', children }: Props = $props();
</script>

{@render children?.({ style, })}
