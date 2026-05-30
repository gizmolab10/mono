<script lang='ts'>
  // Renderer. Reads the current md file name from the router, looks the file
  // up via the name-resolver, parses it, and drops the rendered HTML into the
  // content region.
  import { router } from '../../ts/utilities/router.svelte';
  import { getMdText } from '../../ts/utilities/resolver';
  import { render } from '../../ts/utilities/parser';

  const source = $derived(getMdText(router.name));
  const html = $derived(
    source !== undefined
      ? render(source)
      : `<h1>Missing</h1><p>No md file named "${router.name}".</p>`
  );
</script>

<main class="shell-content">
  {@html html}
</main>
