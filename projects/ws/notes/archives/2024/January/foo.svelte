<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    amplitude?: number; // Amplitude prop
  }

  let { amplitude = 0 }: Props = $props();
  let scale = $state(1);
  let time = 0;

  onMount(() => {
    let interval;
    if (amplitude !== 0) {
      interval = setInterval(() => {
        time += 0.05;
        scale = 1 + Math.sin(time) * amplitude;
      }, 50);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  });
</script>

<svg width={200 * scale} height={200 * scale} viewbox="0 0 200 200">
    <circle cx="100" cy="100" r="50" fill="blue"/>
</svg>
