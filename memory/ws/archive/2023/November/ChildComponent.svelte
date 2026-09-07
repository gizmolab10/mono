<!-- ChildComponent.svelte -->
<script lang="ts">
import { onMount } from "svelte/internal";
  let { message, foo } = $props();

  onMount(() => {
    console.log('ChildComponent');
  })
</script>

<p>{message + ' ' + foo}</p>
