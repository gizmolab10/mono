<script lang="ts">
  import Phaser from 'phaser';
  import { onMount } from 'svelte';
  import { createGameConfig } from './config';

  let container: HTMLDivElement;
  let game: Phaser.Game;

  onMount(() => {
    game = new Phaser.Game(createGameConfig(container));

    return () => {
      game.destroy(true);
    };
  });
</script>

<div bind:this={container} class="phaser-container"></div>

<style>
  .phaser-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .phaser-container :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
</style>
