<script lang='ts'>
  // Hamburger button. Lives at the top left of every page. Tapping it flips
  // the shared "sidebar visible" state. On a wide screen, the sidebar
  // collapses; on a narrow screen, the layout switches between sidebar
  // mode and content mode.
  import { s_sidebar } from '../ts/utilities/S_Sidebar.svelte';
  import { hamburger } from '../ts/utilities/icons';
</script>

<button class="shell-toggle" aria-label="Hamburger sidebar" type="button" onclick={() => s_sidebar.toggle()}>
  <svg class="toggle-icon" viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
    <path d={hamburger(44)} />
  </svg>
</button>
