<script lang='ts'>
  // One gallery: a folder of photos and movies, one showing. A click on a
  // photo, or the right arrow, shows the next; the left arrow goes back; the
  // last wraps to the first. Under it, one caption saying where you are and
  // what you see.
  //
  // A movie is not the button — its own controls own every press inside it, so
  // stepping past a movie is done with the arrow keys. It starts playing on its
  // own, with sound; a browser that forbids sound before you have touched the
  // page holds it until you press play.
  //
  // While editing is on, the whole gallery gives way to a box a photo can be
  // dropped into. The dropped file goes to the dev server, which writes the
  // caption inside the file and saves it into this gallery's folder.
  //
  // The arrow keys are heard on the window, since what is showing may not hold
  // focus. A window listener outlives the element that set it, so the listener
  // is taken off when this component goes — the renderer unmounts it as the
  // page changes.
  import { technical } from '../ts/utilities/technical.svelte';
  import { captionFor, isMovie, nameOf, step } from '../ts/utilities/gallery';
  import { loadPass, savePass } from '../ts/utilities/persistence';
  import type { Photo } from '../ts/utilities/loader';

  // Who does the writing. While `yarn dev` runs it is the dev server, which
  // writes straight to disk. On the published site it is a piece of code at
  // Netlify, which commits to the repository and asks for a passphrase first.
  const LIVE = !import.meta.env.DEV;
  const DOORWAY = LIVE ? '/.netlify/functions/recaption' : '/__recaption';

  // The passphrase, asked for once and remembered in this browser.
  function passphrase(): string | null {
    if (!LIVE) { return ''; }
    const held = loadPass();
    if (held !== '') { return held; }
    const said = window.prompt('The word that lets this browser write to the site', '');
    if (said === null || said.trim() === '') { return null; }
    savePass(said.trim());
    return said.trim();
  }

  let { photos, folder, height = null }: { photos: Photo[]; folder: string; height?: number | null } = $props();

  let at = $state(0);
  let note = $state('');
  let over = $state(false);

  const showing = $derived(photos[at]);
  const caption = $derived(captionFor(at, photos));
  const plays = $derived(!!showing && isMovie(showing.name));

  function walk(by: number) {
    at = step(at, photos.length, by);
  }

  function on_key(event: KeyboardEvent) {
    if (technical.editing) { return; }
    if (event.key === 'ArrowRight') { walk(1); }
    if (event.key === 'ArrowLeft')  { walk(-1); }
  }

  $effect(() => {
    window.addEventListener('keydown', on_key);
    return () => window.removeEventListener('keydown', on_key);
  });

  // The caption of a file already in the folder, written when the cell is left.
  // Only the words travel; the server reads that file, writes the caption in,
  // and saves it back.
  async function recaption(one: Photo, event: FocusEvent) {
    const said = (event.currentTarget as HTMLElement).textContent?.trim() ?? '';
    if (said === nameOf(one)) { return; }
    const pass = passphrase();
    if (pass === null) { return; }
    note = `writing the caption for "${one.name}" …`;
    try {
      const answer = await fetch(DOORWAY, {
        method: 'POST',
        headers: {
          'x-folder': encodeURIComponent(folder),
          'x-name': encodeURIComponent(one.name),
          'x-caption': encodeURIComponent(said),
          'x-pass': encodeURIComponent(pass),
        },
      });
      if (!answer.ok) {
        // A wrong word is worth forgetting, so the next try asks again.
        if (answer.status === 401) { savePass(''); }
        note = await answer.text();
        return;
      }
      note = LIVE
        ? `"${one.name}" now reads "${said}" — the site rebuilds in a minute or two`
        : `"${one.name}" now reads "${said}"`;
    } catch (e) {
      note = `nothing was written — ${(e as Error).message}`;
    }
  }

  async function dropped(event: DragEvent) {
    event.preventDefault();
    over = false;
    const file = event.dataTransfer?.files?.[0];
    if (!file) { return; }
    if (!/\.(png|jpe?g|gif|mov|mp4|m4v)$/i.test(file.name)) {
      note = `"${file.name}" cannot carry a caption — png, jpeg, gif and movies do`;
      return;
    }
    const said = window.prompt(`Caption for "${file.name}"`, '');
    if (said === null) { return; }
    note = `writing "${file.name}" …`;
    try {
      // The file goes as it is. Turning it into text first cost three copies
      // of it in the browser's own memory, and a movie died on the way.
      const answer = await fetch('/__caption', {
        method: 'POST',
        headers: {
          'x-folder': encodeURIComponent(folder),
          'x-name': encodeURIComponent(file.name),
          'x-caption': encodeURIComponent(said),
        },
        body: file,
      });
      note = answer.ok ? `wrote "${file.name}" into ${folder}` : `${await answer.text()}`;
    } catch (e) {
      note = `nothing was written — ${(e as Error).message}`;
    }
  }
</script>

{#if technical.editing}
  {#if technical.on}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class='gallery-drop' class:over
      ondragover={(e) => { e.preventDefault(); over = true; }}
      ondragleave={() => { over = false; }}
      ondrop={dropped}>
      <p>drop a file here for "{folder}"</p>
      {#if note}<p class='gallery-note'>{note}</p>{/if}
    </div>
  {:else if note}
    <p class='gallery-note'>{note}</p>
  {/if}


  <!-- Every file in the folder, and what it is called. A caption is written
       into its own file when the cell is left. -->
  {#if photos.length > 0}
    <table class='gallery-captions'>
      <thead>
        <tr><th>file</th><th>caption</th></tr>
      </thead>
      <tbody>
        {#each photos as one (one.name)}
          <tr>
            <td>{one.name}</td>
            <td contenteditable='plaintext-only' onblur={(e) => recaption(one, e)}>{nameOf(one)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{:else if showing}
  <!-- Keyed on the address, so stepping away builds a fresh element: the movie
       that was playing goes with the old one and stops. -->
  {#key showing.url}
    {#if plays}
      <video class='gallery-photo' src={showing.url} controls autoplay playsinline
        style:height={height ? `${height}px` : null}><track kind='captions' /></video>
    {:else}
      <button class='gallery-photo' aria-label='next photo' onclick={() => walk(1)}>
        <img src={showing.url} alt={caption} style:height={height ? `${height}px` : null} />
      </button>
    {/if}
  {/key}
  <p class='gallery-caption'>{caption}</p>
{:else}
  <p class='gallery-caption'>no photos in "{folder}"</p>
{/if}
