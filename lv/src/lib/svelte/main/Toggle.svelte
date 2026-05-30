<script lang='ts'>
  // Toggle button. Lives at the top left of every page. Tapping it flips
  // the shared "sidebar visible" state. On a wide screen, the sidebar
  // collapses; on a narrow screen, the layout switches between sidebar
  // mode and content mode.
  import { sidebar } from '../../ts/utilities/sidebar.svelte';
</script>

<button class="shell-toggle" aria-label="Toggle sidebar" type="button" onclick={() => sidebar.toggle()}>
  &#9776;
</button>
