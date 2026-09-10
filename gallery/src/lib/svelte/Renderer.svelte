<script lang='ts'>
  // Renderer. Reads the current md file name from the router, looks the file
  // up via the name-resolver, parses it, and drops the rendered HTML into the
  // content region.
  //
  // The html the parser hands back is text, and text cannot answer a click. So
  // after each drop, every empty gallery box in it gets a live component built
  // inside it, holding that folder's photos. Each one is taken off before the
  // next page arrives: its arrow-key listener sits on the window and would
  // outlive the html it belongs to.
  //
  // Where the host hands over the operation view's size, each gallery is handed
  // the space the rest of the page leaves it: the view less the region's gap and
  // the page's own border, less every part of the page that is not a gallery,
  // shared among the galleries. The picture in it grows or shrinks to fit.
  //
  // While editing is on, the md file is not drawn at all. In its place, the
  // editing content of every gallery the page holds: the drop box and the
  // file-and-caption table of each folder the page names.
  import { technical } from '../ts/utilities/Technical.svelte';
  import { photosInFolder } from '../ts/utilities/Loader';
  import { galleriesIn, render } from '../ts/utilities/Parser';
  import { router } from '../ts/utilities/Router.svelte';
  import { getMdText } from '../ts/utilities/Resolver';
  import type { Photo } from '../ts/utilities/Loader';
  import { k } from '../ts/common/Core';
  import { mount, unmount, untrack } from 'svelte';
  import Gallery from './Gallery.svelte';

  let { fit = null }: { fit?: { width: number; height: number } | null } = $props();

  const source = $derived(getMdText(router.page));
  const folders = $derived(source !== undefined ? galleriesIn(source) : []);
  const html = $derived(
    source !== undefined
      ? render(source)
      : `<h1>Missing</h1><p>No md file named "${router.page}".</p>`
  );

  type Space = { width: number; height: number } | null;
  type Props = { folder: string; height: number | null; photos: Photo[]; fit: Space };

  let content: HTMLElement | null = $state(null);
  let galleries: { app: ReturnType<typeof mount>; props: Props }[] = [];

  function take_off() {
    for (const one of galleries) { unmount(one.app); }
    galleries = [];
  }

  function px(said: string): number {
    return parseFloat(said) || 0;
  }

  // The space the page leaves its galleries, handed to each of them. Nothing where the host
  // handed no size, and then each picture keeps the stylesheet's caps.
  function refit() {
    if (!content || !fit) { return; }
    const gap = k.gap.normal;
    const page = getComputedStyle(content);
    const wide = fit.width - gap * 2 - px(page.paddingLeft) - px(page.paddingRight);
    let tall = fit.height - gap * 2 - px(page.paddingTop) - px(page.paddingBottom);
    for (const child of content.children) {
      const style = getComputedStyle(child);
      tall -= px(style.marginTop) + px(style.marginBottom);
      if (!child.classList.contains('gallery')) { tall -= (child as HTMLElement).offsetHeight; }
    }
    const each = galleries.length > 0 ? tall / galleries.length : tall;
    for (const one of galleries) { one.props.fit = { width: wide, height: each }; }
  }

  $effect(() => {
    html;   // read, so a new page builds the galleries again
    take_off();
    if (!content) { return take_off; }
    for (const box of content.querySelectorAll<HTMLElement>('.gallery')) {
      const folder = box.dataset.folder ?? '';
      const said = Number(box.dataset.height);
      const height = Number.isFinite(said) && said > 0 ? said : null;
      const props = $state<Props>({ folder, height, photos: photosInFolder(folder), fit: null });
      galleries.push({ app: mount(Gallery, { target: box, props }), props });
    }
    // Read without being watched: the size the host hands over changes with every resize,
    // and this must not rebuild the galleries for that — the effect below refits them.
    untrack(refit);
    return take_off;
  });

  // The size the host hands over changes with the window, and each gallery is handed its
  // share again.
  $effect(() => {
    fit;
    refit();
  });
</script>

{#if technical.editing}
  <div class="shell-content">
    {#each folders as folder (folder)}
      <Gallery {folder} photos={photosInFolder(folder)} />
    {/each}
  </div>
{:else}
  <main class="shell-content" bind:this={content}>
    {@html html}
  </main>
{/if}
