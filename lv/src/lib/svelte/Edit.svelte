<script lang='ts'>
  // The edit button, at the top right of every page. It shows only where the
  // technical preference says something — a browser that never set it sees
  // nothing. Pressing it puts every gallery on the page into editing: the files
  // in that folder and what each is called, with a box to drop a photo into
  // where the preference says true.
  import { technical } from '../ts/utilities/Technical.svelte';
</script>

{#if technical.offered}
  <button class='shell-edit' type='button' onclick={() => technical.toggle()}>
    {technical.editing ? 'done' : 'edit'}
  </button>
{/if}
