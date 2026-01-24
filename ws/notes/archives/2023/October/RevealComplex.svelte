<script lang="ts">
    import RevealDot from './RevealDot.svelte';
	let { thing = Thing } = $props();
</script>

<RevealDot thing={thing}/>
