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
  import { inOrder, moved } from '../ts/utilities/order';
  import { loadPass, savePass } from '../ts/utilities/persistence';
  import type { Photo } from '../ts/utilities/loader';

  // Who does the writing. While `yarn dev` runs it is the dev server, which
  // writes straight to disk. On the published site it is a piece of code at
  // Netlify, which commits to the repository and asks for a passphrase first.
  const LIVE = !import.meta.env.DEV;
  const DOORWAY = LIVE ? '/.netlify/functions/recaption' : '/__recaption';
  const AWAY = LIVE ? '/.netlify/functions/delete-photo' : '/__delete-photo';
  const ADD = LIVE ? '/.netlify/functions/add-photo' : '/__caption';
  const ORDER = LIVE ? '/.netlify/functions/reorder' : '/__reorder';
  // The published site takes a file in the request itself, which Netlify caps
  // at about five megabytes. A photo fits; a movie is a job for the dev server.
  const MOST = LIVE ? 5 * 1024 * 1024 : Infinity;

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
  let edit_index = $state(0);
  let note = $state('');
  let over = $state(false);
  let thrown = $state<string[]>([]);
  // The order settled since the page was drawn. Empty until a file is moved,
  // and then it is what the table and the pictures both follow, so a move shows
  // at once instead of waiting for the site to be built again.
  let order = $state<string[]>([]);

  // What this gallery holds: everything the caller handed over, less whatever
  // has been thrown away since the page was drawn. They arrive in the order the
  // folder's own list names, so that order is kept until a move here settles a
  // new one.
  const here = $derived.by(() => {
    const left = photos.filter((one) => !thrown.includes(one.name));
    return order.length === 0 ? left : inOrder(left, order);
  });

  const showing = $derived(here[at]);
  const caption = $derived(captionFor(at, here));
  const plays = $derived(!!showing && isMovie(showing.name));

  function walk(by: number) {
    at = step(at, here.length, by);
  }

  // While a picture is showing, left and right step it. While the table is up,
  // up and down move the highlight, and holding option moves the file itself.
  function on_key(event: KeyboardEvent) {
    if (!technical.editing) {
      if (event.key === 'ArrowRight') { walk(1); }
      if (event.key === 'ArrowLeft')  { walk(-1); }
      return;
    }
    const by = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (by === 0) { return; }
    // A caption being typed keeps its own arrow keys, so the cursor can be
    // moved through the words.
    if ((event.target as HTMLElement | null)?.isContentEditable) { return; }
    event.preventDefault();
    if (event.altKey) { void reorder(by); } else { edit_index = step(edit_index, here.length, by); }
  }

  $effect(() => {
    window.addEventListener('keydown', on_key);
    return () => window.removeEventListener('keydown', on_key);
  });

  // One file moved a step, and the whole new order written back. Only the list
  // travels — the pictures are never touched — so this is the same small write
  // whatever the folder holds.
  async function reorder(by: number) {
    const next = moved(here.map((one) => one.name), edit_index, by);
    if (next.at === edit_index) { return; }
    const pass = passphrase();
    if (pass === null) { return; }
    const order_was = order;
    const index_was = edit_index;
    const which = here[edit_index]?.name ?? '';
    order = next.names;
    edit_index = next.at;
    note = `moving "${which}" …`;
    try {
      const answer = await fetch(ORDER, {
        method: 'POST',
        headers: {
          'x-folder': encodeURIComponent(folder),
          'x-pass': encodeURIComponent(pass),
        },
        body: next.names.join('\n'),
      });
      if (!answer.ok) {
        // The order on screen goes back to what the folder holds, so nothing is
        // shown that was never written.
        if (answer.status === 401) { savePass(''); }
        order = order_was;
        edit_index = index_was;
        note = await why(answer);
        return;
      }
      note = LIVE
        ? `"${which}" moved — the site rebuilds in a minute or two`
        : `"${which}" moved`;
    } catch (e) {
      order = order_was;
      edit_index = index_was;
      note = `nothing was moved — ${(e as Error).message}`;
    }
  }

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
        note = await why(answer);
        return;
      }
      note = LIVE
        ? `"${one.name}" now reads "${said}" — the site rebuilds in a minute or two`
        : `"${one.name}" now reads "${said}"`;
    } catch (e) {
      note = `nothing was written — ${(e as Error).message}`;
    }
  }

  // A file thrown away, asked about first: it cannot be undone from here, and
  // only a commit in the repository holds the old one.
  async function throwAway(one: Photo) {
    if (!window.confirm(`Throw "${one.name}" out of ${folder}? This cannot be undone here.`)) { return; }
    const pass = passphrase();
    if (pass === null) { return; }
    note = `throwing "${one.name}" away …`;
    try {
      const answer = await fetch(AWAY, {
        method: 'POST',
        headers: {
          'x-folder': encodeURIComponent(folder),
          'x-name': encodeURIComponent(one.name),
          'x-pass': encodeURIComponent(pass),
        },
      });
      if (!answer.ok) {
        if (answer.status === 401) { savePass(''); }
        note = await why(answer);
        return;
      }
      note = LIVE
        ? `"${one.name}" is gone — the site rebuilds in a minute or two`
        : `"${one.name}" is gone`;
      thrown = [...thrown, one.name];
      at = Math.min(at, Math.max(0, here.length - 1));
    } catch (e) {
      note = `nothing was thrown away — ${(e as Error).message}`;
    }
  }

  // What went wrong, in one line. A doorway that is not there answers with a
  // whole web page; saying so beats printing it.
  async function why(answer: Response): Promise<string> {
    const words = (await answer.text()).trim();
    if (words.startsWith('<')) { return `nothing is listening at ${answer.url.replace(location.origin, '')}`; }
    return words.length > 200 ? `${words.slice(0, 200)}…` : words;
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
    if (file.size > MOST) {
      note = `"${file.name}" is ${Math.round(file.size / 1024 / 1024)} MB — this site takes 5 MB at most. Add it with the dev server.`;
      return;
    }
    const said = window.prompt(`Caption for "${file.name}"`, '');
    if (said === null) { return; }
    const pass = passphrase();
    if (pass === null) { return; }
    note = `writing "${file.name}" …`;
    try {
      // The file goes as it is. Turning it into text first cost three copies
      // of it in the browser's own memory, and a movie died on the way.
      const answer = await fetch(ADD, {
        method: 'POST',
        headers: {
          'x-folder': encodeURIComponent(folder),
          'x-name': encodeURIComponent(file.name),
          'x-caption': encodeURIComponent(said),
          'x-pass': encodeURIComponent(pass),
        },
        body: file,
      });
      if (!answer.ok) {
        if (answer.status === 401) { savePass(''); }
        note = await why(answer);
        return;
      }
      note = LIVE
        ? `wrote "${file.name}" into ${folder} — the site rebuilds in a minute or two`
        : `wrote "${file.name}" into ${folder}`;
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
  {#if here.length > 0}
    <table class='gallery-captions'>
      <thead>
        <tr><th></th><th>file</th><th>caption</th><th></th></tr>
      </thead>
      <tbody>
        {#each here as one, row (one.name)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <tr class:picked={row === edit_index} onclick={() => { edit_index = row; }}>
            <td class='gallery-row'>{row}</td>
            <td>{one.name}</td>
            <td contenteditable='plaintext-only' onblur={(e) => recaption(one, e)}>{nameOf(one)}</td>
            <td class='gallery-throw'>
              <button type='button' onclick={() => throwAway(one)}>delete</button>
            </td>
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
