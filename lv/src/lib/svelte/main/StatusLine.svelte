<script lang='ts'>
  // The bottom status line. Stays blank by default. Shows a broken-link
  // error when the reader navigates to an md file missing on disk. The
  // next successful click clears it.
  import { router } from '../../ts/utilities/router.svelte';
</script>

<footer class="shell-status">
  {#if router.status}
    <span class="status-error">{router.status}</span>
  {:else}
    <span>&nbsp;</span>
  {/if}
</footer>
