<script lang="ts">
  import { onMount } from 'svelte';
  import { init } from './lib/ts/tests/Render.test';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    init(canvas);
  });
</script>

<main>
  <h1>Quaternion Rotation + Perspective Projection</h1>
  <canvas bind:this={canvas} width="600" height="600"></canvas>
  <div class="info">Drag to rotate • No gimbal lock</div>
</main>

<style>
  :global(body) {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #1a1a2e;
    font-family: system-ui, sans-serif;
    color: #eee;
  }

  main {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  h1 {
    margin-bottom: 1rem;
    font-weight: 300;
  }

  canvas {
    background: #0f0f1a;
    border: 1px solid #333;
    cursor: grab;
  }

  canvas:active {
    cursor: grabbing;
  }

  .info {
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #888;
  }
</style>
