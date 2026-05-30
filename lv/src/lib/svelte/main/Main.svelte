<script lang='ts'>
  // The page shell. Hosts four pieces: the toggle button, the sidebar,
  // the rendered md file area, and the status line. The `sidebar-hidden`
  // class is toggled on the shell to drive the hide/show and the mobile
  // two-mode layout from a single state.
  import { sidebar } from '../../ts/utilities/sidebar.svelte';
  import Toggle from './Toggle.svelte';
  import Sidebar from './Sidebar.svelte';
  import Renderer from './Renderer.svelte';
  import StatusLine from './StatusLine.svelte';
</script>

<div class="shell" class:sidebar-hidden={!sidebar.visible}>
  <Sidebar />
  <Renderer />
  <StatusLine />
  <Toggle />
</div>
