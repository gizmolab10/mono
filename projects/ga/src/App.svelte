<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Phaser_Game from './lib/game/Phaser_Game.svelte';
  import { regard } from './lib/stores/regard';
  import { needs } from './lib/stores/needs';
  import { eventBridge } from './lib/game/Event_Bridge';

  let regardValue = $state(0);
  let regardBump = $state(false);
  let showNeedInput = $state(false);
  let newNeedText = $state('');

  regard.subscribe(value => {
    if (value > regardValue) {
      regardBump = true;
      setTimeout(() => { regardBump = false; }, 600);
    }
    regardValue = value;
  });

  onMount(() => {
    const unsubRegard = eventBridge.on('regard:earn', (amount) => {
      regard.earn(amount as number);
    });
    const unsubNeedsRequest = eventBridge.on('needs:request', () => {
      eventBridge.emit('needs:data', get(needs));
    });
    const unsubNeedsVote = eventBridge.on('needs:vote', (id) => {
      needs.vote(id as string);
    });
    const unsubNeedsPrompt = eventBridge.on('needs:prompt-add', () => {
      showNeedInput = true;
    });
    return () => {
      unsubRegard();
      unsubNeedsRequest();
      unsubNeedsVote();
      unsubNeedsPrompt();
    };
  });

  function submitNeed() {
    const text = newNeedText.trim();
    if (!text) return;
    needs.add(text, 'player');
    regard.earn(3);
    newNeedText = '';
    showNeedInput = false;
    // tell NeedsScene to refresh with updated data
    eventBridge.emit('needs:refresh');
  }

  function cancelNeedInput() {
    newNeedText = '';
    showNeedInput = false;
  }
</script>

<Phaser_Game />

<div class="regard-overlay">
  <span class="regard-label">regard</span>
  <span class="regard-value" class:regard-bump={regardBump}>{regardValue}</span>
</div>

{#if showNeedInput}
  <div class="need-input-overlay">
    <div class="need-input-card">
      <h3>Spot a need</h3>
      <p>What does the community need?</p>
      <input
        type="text"
        bind:value={newNeedText}
        placeholder="e.g. A place to gather and share meals"
        onkeydown={(e) => e.key === 'Enter' && submitNeed()}
      />
      <div class="need-input-actions">
        <button class="cancel-button" onclick={cancelNeedInput}>cancel</button>
        <button class="submit-button" onclick={submitNeed}>add need (+3 regard)</button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #1a1a2e;
    font-family: Georgia, 'Times New Roman', serif;
  }

  .regard-overlay {
    position: fixed;
    top: 20px;
    right: 24px;
    display: flex;
    align-items: baseline;
    gap: 8px;
    z-index: 10;
    pointer-events: none;
  }

  .regard-label {
    font-size: 14px;
    color: #a89880;
    text-transform: lowercase;
  }

  .regard-value {
    font-size: 24px;
    color: #e0d8c8;
    font-weight: bold;
    transition: transform 0.3s ease, color 0.3s ease;
  }

  .regard-bump {
    transform: scale(1.4);
    color: #c97b4b;
  }

  .need-input-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(26, 26, 46, 0.92);
    z-index: 15;
  }

  .need-input-card {
    background: #2a2a3e;
    border: 1px solid #3a3a4e;
    border-radius: 8px;
    padding: 28px 32px;
    max-width: 420px;
    width: 90%;
  }

  .need-input-card h3 {
    font-size: 20px;
    color: #6b5b8a;
    margin: 0 0 8px;
  }

  .need-input-card p {
    font-size: 14px;
    color: #a89880;
    margin: 0 0 16px;
  }

  .need-input-card input {
    width: 100%;
    font-family: Georgia, serif;
    font-size: 15px;
    padding: 10px 12px;
    background: #1a1a2e;
    border: 1px solid #3a3a4e;
    border-radius: 4px;
    color: #e0d8c8;
    outline: none;
    box-sizing: border-box;
  }

  .need-input-card input:focus {
    border-color: #6b5b8a;
  }

  .need-input-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }

  .cancel-button, .submit-button {
    font-family: Georgia, serif;
    font-size: 14px;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #3a3a4e;
    background: none;
    transition: color 0.15s, border-color 0.15s;
  }

  .cancel-button {
    color: #b8b8d0;
  }

  .cancel-button:hover {
    color: #a89880;
    border-color: #b8b8d0;
  }

  .submit-button {
    color: #6b5b8a;
    border-color: #6b5b8a;
  }

  .submit-button:hover {
    color: #8070a8;
    border-color: #8070a8;
  }
</style>
