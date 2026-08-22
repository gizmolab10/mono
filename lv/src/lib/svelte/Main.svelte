<script lang='ts'>
  // The page shell. Hosts two pieces: the rendered md file area and the status
  // line, with the edit button pinned over them.
  //
  // The sidebar and its toggle are out of sight for now. Both components and
  // all their styling stand; bringing them back is the three commented imports,
  // two lines in the markup, and the shell's own class:
  //
  //   <div class="shell" class:sidebar-hidden={!sidebar.visible}>
  //
  // import { sidebar } from '../ts/utilities/sidebar.svelte';
  // import Sidebar from './Sidebar.svelte';
  // import Toggle from './Toggle.svelte';
  import StatusLine from './StatusLine.svelte';
  import Renderer from './Renderer.svelte';
  import Edit from './Edit.svelte';
</script>

<div class="shell sidebar-hidden">
  <Renderer />
  <StatusLine />
  <Edit />
</div>
