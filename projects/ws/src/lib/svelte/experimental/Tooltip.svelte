<script lang='ts'>
  import { createPopperActions } from 'svelte-popperjs';
  const [popperRef, popperContent] = createPopperActions({
    placement: 'right',
    strategy: 'fixed',
  });
  const extraOpts = {
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } }
    ],
  };

  let showTooltip = false;
</script>

<button
  use:popperRef
  on:mouseenter={() => showTooltip = true}
  on:mouseleave={() => showTooltip = false}
>
  My button
</button>
{#if showTooltip}
  <div id="tooltip" use:popperContent={extraOpts}>
    My tooltip
    <div id="arrow" data-popper-arrow />
  </div>
{/if}