<script lang="ts">
  import { regard } from '../stores/regard';

  type Choice = 'share' | 'keep' | null;

  let playerChoice: Choice = $state(null);
  let otherChoice: Choice = $state(null);
  let roundResult = $state('');
  let regardEarned = $state(0);

  function choose(choice: 'share' | 'keep') {
    playerChoice = choice;
    // The "other player" tends toward sharing (70/30) to model 2.0 culture
    otherChoice = Math.random() < 0.7 ? 'share' : 'keep';

    if (playerChoice === 'share' && otherChoice === 'share') {
      regardEarned = 5;
      roundResult = 'Both shared! Trust flourishes. Abundance for everyone.';
    } else if (playerChoice === 'share' && otherChoice === 'keep') {
      regardEarned = 0;
      roundResult = 'You shared, they kept. It stings — but your generosity is noted.';
    } else if (playerChoice === 'keep' && otherChoice === 'share') {
      regardEarned = 1;
      roundResult = 'They shared, you kept. A small gain, but trust erodes.';
    } else {
      regardEarned = 0;
      roundResult = 'Both kept. Nobody gains. Scarcity thinking wins.';
    }

    regard.earn(regardEarned);
  }

  function reset() {
    playerChoice = null;
    otherChoice = null;
    roundResult = '';
    regardEarned = 0;
  }

  interface Props {
    onclose: () => void;
  }
  let { onclose }: Props = $props();
</script>

<div class="booth">
  <h2>Trust Circle</h2>
  <p class="description">You and another player each choose: share or keep. Trust pays off.</p>

  {#if !playerChoice}
    <div class="choices">
      <button class="choice share" onclick={() => choose('share')}>
        <span class="icon">🤝</span>
        <span class="choice-label">Share</span>
        <span class="choice-hint">Risk more, gain more together</span>
      </button>
      <button class="choice keep" onclick={() => choose('keep')}>
        <span class="icon">✊</span>
        <span class="choice-label">Keep</span>
        <span class="choice-hint">Safe, but alone</span>
      </button>
    </div>
  {:else}
    <div class="result">
      <div class="matchup">
        <span class="player-choice">You: {playerChoice}</span>
        <span class="vs">vs</span>
        <span class="other-choice">Other: {otherChoice}</span>
      </div>
      <p class="outcome">{roundResult}</p>
      {#if regardEarned > 0}
        <p class="reward-note">+{regardEarned} regard earned</p>
      {/if}
      <button class="play-again" onclick={reset}>Play Again</button>
    </div>
  {/if}

  <button class="back-button" onclick={onclose}>Back to Map</button>
</div>

<style>
  .booth {
    max-width: 500px;
    margin: 0 auto;
    padding: 80px 24px 24px;
    text-align: center;
  }
  h2 {
    color: #f0c040;
    font-size: 28px;
    margin-bottom: 8px;
  }
  .description {
    color: #a8a0b8;
    font-style: italic;
    margin-bottom: 32px;
  }
  .choices {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
  .choice {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #a8a0b8;
    border-radius: 12px;
    padding: 24px 32px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    min-width: 160px;
  }
  .choice:hover {
    border-color: #f0c040;
    background: rgba(240, 192, 64, 0.08);
  }
  .icon {
    font-size: 36px;
  }
  .choice-label {
    color: #e0d8c8;
    font-size: 20px;
    font-weight: bold;
    font-family: Georgia, serif;
  }
  .choice-hint {
    color: #a8a0b8;
    font-size: 12px;
    font-family: Georgia, serif;
  }
  .result {
    margin-bottom: 24px;
  }
  .matchup {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    font-size: 18px;
  }
  .player-choice {
    color: #f0c040;
    text-transform: capitalize;
  }
  .vs {
    color: #a8a0b8;
  }
  .other-choice {
    color: #d4b040;
    text-transform: capitalize;
  }
  .outcome {
    color: #e0d8c8;
    font-size: 18px;
    line-height: 1.6;
    margin-bottom: 12px;
  }
  .reward-note {
    color: #f0c040;
    font-weight: bold;
    margin-bottom: 16px;
  }
  .play-again {
    background: #c8a030;
    color: #1a1a2e;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-family: Georgia, serif;
    font-size: 16px;
    font-weight: bold;
  }
  .play-again:hover {
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
    margin-top: 16px;
  }
  .back-button:hover {
    border-color: #e0d8c8;
    color: #e0d8c8;
  }
</style>
