<script lang='ts'>
  // The page, which is panel's: the controls row, the details column, the operation view and
  // the status line, with gallery's parts in them. The edit button sits at the right end of
  // the row. The details column holds the sidebar, the list of pages. The operation view holds
  // the md file, or, while editing is on, the drop box and the file-and-caption table. The
  // status line says when a link leads nowhere, and is not drawn otherwise.
  //
  // Whether the column is shown is remembered, and counts only while the host's switch says
  // the sidebar may be drawn at all. With the switch off there is no column to show, so the
  // hamburger is not drawn either.
  //
  // The operation view's size is handed to the md file, so the pictures on it grow and shrink
  // to fill what the rest of the page leaves them.
  import { customizations } from '../ts/common/Customizations';
  import { s_sidebar } from '../ts/utilities/S_Sidebar.svelte';
  import { router } from '../ts/utilities/Router.svelte';
  import { Panel } from '../ts/common/Panel';
  import Renderer from './Renderer.svelte';
  import Sidebar from './Sidebar.svelte';
  import Edit from './Edit.svelte';
</script>

{#snippet controls()}<Edit />{/snippet}
{#snippet details()}<Sidebar />{/snippet}
{#snippet operation(width: number, height: number)}<Renderer fit={{ width, height }} />{/snippet}

<Panel name={customizations.name} details_shown={s_sidebar.visible} ontoggle={() => s_sidebar.toggle()}
  hamburger={customizations.enable_sidebar} {controls} {details} {operation} status={router.status} />
