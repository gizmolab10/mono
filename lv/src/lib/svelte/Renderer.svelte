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
  import { photosInFolder } from '../ts/utilities/loader';
  import { router } from '../ts/utilities/router.svelte';
  import { getMdText } from '../ts/utilities/resolver';
  import { render } from '../ts/utilities/parser';
  import { mount, unmount } from 'svelte';
  import Gallery from './Gallery.svelte';

  const source = $derived(getMdText(router.name));
  const html = $derived(
    source !== undefined
      ? render(source)
      : `<h1>Missing</h1><p>No md file named "${router.name}".</p>`
  );

  let content: HTMLElement | null = $state(null);
  let galleries: ReturnType<typeof mount>[] = [];

  function take_off() {
    for (const one of galleries) { unmount(one); }
    galleries = [];
  }

  $effect(() => {
    html;   // read, so a new page builds the galleries again
    take_off();
    if (!content) { return take_off; }
    for (const box of content.querySelectorAll<HTMLElement>('.gallery')) {
      const folder = box.dataset.folder ?? '';
      const said = Number(box.dataset.height);
      const height = Number.isFinite(said) && said > 0 ? said : null;
      galleries.push(mount(Gallery, { target: box, props: { folder, height, photos: photosInFolder(folder) } }));
    }
    return take_off;
  });
</script>

<main class="shell-content" bind:this={content}>
  {@html html}
</main>
