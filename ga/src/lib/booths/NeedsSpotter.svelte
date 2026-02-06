<script lang="ts">
  import { needs } from '../stores/needs';
  import { regard } from '../stores/regard';

  let newNeedText = $state('');

  function voteForNeed(id: string) {
    needs.vote(id);
    regard.earn(1);
  }

  function addNeed() {
    if (newNeedText.trim()) {
      needs.add(newNeedText.trim(), 'player');
      regard.earn(2);
      newNeedText = '';
    }
  }

  let sortedNeeds = $derived(
    [...$needs].sort((a, b) => b.votes - a.votes)
  );

  interface Props {
    onclose: () => void;
  }
  let { onclose }: Props = $props();
</script>

<div class="booth">
  <h2>Needs Spotter</h2>
  <p class="description">What does our community need most? Vote on priorities or add your own.</p>

  <div class="needs-list">
    {#each sortedNeeds as need (need.id)}
      <div class="need-item">
        <button class="vote-button" onclick={() => voteForNeed(need.id)}>
          +1
        </button>
        <span class="vote-count">{need.votes}</span>
        <span class="need-text">{need.text}</span>
      </div>
    {/each}
  </div>

  <div class="add-need">
    <input
      type="text"
      bind:value={newNeedText}
      placeholder="What does the community need?"
      onkeydown={(event: KeyboardEvent) => event.key === 'Enter' && addNeed()}
    />
    <button class="add-button" onclick={addNeed}>Add (+2 regard)</button>
  </div>

  <button class="back-button" onclick={onclose}>Back to Map</button>
</div>

<style>
  .booth {
    max-width: 600px;
    margin: 0 auto;
    padding: 80px 24px 24px;
  }
  h2 {
    color: #f0c040;
    font-size: 28px;
    margin-bottom: 8px;
    text-align: center;
  }
  .description {
    color: #a8a0b8;
    font-style: italic;
    margin-bottom: 24px;
    text-align: center;
  }
  .needs-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }
  .need-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.05);
    padding: 12px 16px;
    border-radius: 8px;
  }
  .vote-button {
    background: #0f3460;
    color: #f0c040;
    border: 1px solid #f0c040;
    border-radius: 4px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 14px;
    font-family: Georgia, serif;
  }
  .vote-button:hover {
    background: #1a4a7a;
  }
  .vote-count {
    color: #f0c040;
    font-weight: bold;
    min-width: 24px;
    text-align: center;
  }
  .need-text {
    color: #e0d8c8;
    flex: 1;
  }
  .add-need {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
  }
  .add-need input {
    flex: 1;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid #a8a0b8;
    color: #e0d8c8;
    padding: 10px 14px;
    border-radius: 8px;
    font-family: Georgia, serif;
    font-size: 14px;
  }
  .add-button {
    background: #c8a030;
    color: #1a1a2e;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-family: Georgia, serif;
    font-weight: bold;
  }
  .add-button:hover {
    background: #f0c040;
  }
  .back-button {
    background: none;
    border: 1px solid #a8a0b8;
    color: #a8a0b8;
    padding: 8px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-family: Georgia, serif;
    display: block;
    margin: 0 auto;
  }
  .back-button:hover {
    border-color: #e0d8c8;
    color: #e0d8c8;
  }
</style>
