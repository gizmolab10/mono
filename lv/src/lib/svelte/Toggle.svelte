<script lang='ts'>
  // Toggle button. Lives at the top left of every page. Tapping it flips
  // the shared "sidebar visible" state. On a wide screen, the sidebar
  // collapses; on a narrow screen, the layout switches between sidebar
  // mode and content mode.
  import { sidebar } from '../ts/utilities/sidebar.svelte';
  import { hamburger } from '../ts/utilities/icons';
</script>

<button class="shell-toggle" aria-label="Toggle sidebar" type="button" onclick={() => sidebar.toggle()}>
  <svg class="toggle-icon" viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
    <path d={hamburger(44)} />
  </svg>
</button>
