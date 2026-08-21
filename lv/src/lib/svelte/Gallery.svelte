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
  // The arrow keys are heard on the window, since what is showing may not hold
  // focus. A window listener outlives the element that set it, so the listener
  // is taken off when this component goes — the renderer unmounts it as the
  // page changes.
  import { captionFor, isMovie, step } from '../ts/utilities/gallery';
  import type { Photo } from '../ts/utilities/loader';

  let { photos, folder, height = null }: { photos: Photo[]; folder: string; height?: number | null } = $props();

  let at = $state(0);

  const showing = $derived(photos[at]);
  const caption = $derived(captionFor(at, photos));
  const plays = $derived(!!showing && isMovie(showing.name));

  function walk(by: number) {
    at = step(at, photos.length, by);
  }

  function on_key(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') { walk(1); }
    if (event.key === 'ArrowLeft')  { walk(-1); }
  }

  $effect(() => {
    window.addEventListener('keydown', on_key);
    return () => window.removeEventListener('keydown', on_key);
  });
</script>

{#if showing}
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
