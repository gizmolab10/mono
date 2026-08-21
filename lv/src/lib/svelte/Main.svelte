<script lang='ts'>
  // The page shell. Hosts three pieces: the sidebar, the rendered md file
  // area, and the status line. The `sidebar-hidden`
  // class is toggled on the shell to drive the hide/show and the mobile
  // two-mode layout from a single state.
  import { sidebar } from '../ts/utilities/sidebar.svelte';
  import StatusLine from './StatusLine.svelte';
  import Renderer from './Renderer.svelte';
  import Sidebar from './Sidebar.svelte';
  import Edit from './Edit.svelte';
  // Toggle is out of sight for now — the button and its styling stand, and
  // one line here brings it back.
  // import Toggle from './Toggle.svelte';
</script>

<div class="shell" class:sidebar-hidden={!sidebar.visible}>
  <Sidebar />
  <Renderer />
  <StatusLine />
  <Edit />
</div>
