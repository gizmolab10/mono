<script lang='ts'>
  // The page shell. Four regions in a grid: a top row across the whole width, the
  // sidebar and the rendered md file beside each other, and the status line across
  // the foot. The hamburger is pinned over the top-left corner.
  import { customizations } from '../ts/common/Customizations';
  import { s_sidebar } from '../ts/utilities/S_Sidebar.svelte';
  import { Section, T_Edge } from '../ts/common/Core';
  import { Hamburger } from '../ts/common/Core';
  import StatusLine from './StatusLine.svelte';
  import Renderer from './Renderer.svelte';
  import Sidebar from './Sidebar.svelte';
  import Edit from './Edit.svelte';
</script>

<div class="shell" class:sidebar-hidden={!s_sidebar.visible}>
  <!-- The top row: one section, the whole width, holding nothing yet. It bounds the
       view above, so it draws no line there — what marks it off is the gap it holds. -->
  <div class="shell-top">
    <Section id='top.row' edge={T_Edge.view}>
      {#snippet contents()}{/snippet}
    </Section>
  </div>
  {#if customizations.enable_sidebar}
    <Hamburger id='shell.hamburger' size={44} label='show or hide the sidebar'
          tip={s_sidebar.visible ? 'hide the sidebar' : 'show the sidebar'}
          onpress={() => s_sidebar.toggle()} />
    <Sidebar />
  {/if}
  <Renderer />
  <StatusLine />
  <Edit />
</div>
