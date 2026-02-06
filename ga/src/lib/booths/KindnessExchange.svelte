<script lang="ts">
  import { regard } from '../stores/regard';

  const kindMessages = [
    "You make the world a little brighter just by being in it.",
    "Someone out there is grateful for something you did today.",
    "Your patience with others is a gift they may not know to thank you for.",
    "The way you listen — really listen — matters more than you think.",
    "You don't have to be perfect to be wonderful.",
    "Your kindness ripples further than you'll ever see.",
    "Someone smiled today because of you.",
    "The effort you put in, even when no one notices, shapes the world.",
  ];

  let playerMessage = $state('');
  let receivedMessage = $state('');
  let hasSent = $state(false);

  function sendKindness() {
    if (playerMessage.trim()) {
      receivedMessage = kindMessages[Math.floor(Math.random() * kindMessages.length)];
      hasSent = true;
      regard.earn(3);
    }
  }

  function reset() {
    playerMessage = '';
    receivedMessage = '';
    hasSent = false;
  }

  interface Props {
    onclose: () => void;
  }
  let { onclose }: Props = $props();
</script>

<div class="booth">
  <h2>Kindness Exchange</h2>
  <p class="description">Write something kind. Receive something kind. Both earn regard.</p>

  {#if !hasSent}
    <textarea
      bind:value={playerMessage}
      placeholder="Write something kind for a stranger..."
      rows="3"
    ></textarea>
    <button class="send-button" onclick={sendKindness}>
      Send Kindness (+3 regard)
    </button>
  {:else}
    <div class="sent">
      <p class="label">You sent:</p>
      <p class="message yours">{playerMessage}</p>
    </div>
    <div class="received">
      <p class="label">You received:</p>
      <p class="message theirs">{receivedMessage}</p>
    </div>
    <div class="reward-note">+3 regard earned</div>
    <button class="send-button" onclick={reset}>Send Another</button>
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
    margin-bottom: 24px;
  }
  textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid #a8a0b8;
    color: #e0d8c8;
    padding: 14px;
    border-radius: 8px;
    font-family: Georgia, serif;
    font-size: 16px;
    resize: none;
    margin-bottom: 16px;
  }
  .send-button {
    background: #c8a030;
    color: #1a1a2e;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-family: Georgia, serif;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 16px;
    display: block;
    width: 100%;
  }
  .send-button:hover {
    background: #f0c040;
  }
  .label {
    color: #a8a0b8;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .message {
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 16px;
    line-height: 1.5;
  }
  .yours {
    background: rgba(200, 160, 48, 0.12);
    border: 1px solid rgba(200, 160, 48, 0.3);
    color: #e0d8c8;
  }
  .theirs {
    background: rgba(240, 192, 64, 0.1);
    border: 1px solid rgba(240, 192, 64, 0.3);
    color: #f0c040;
  }
  .reward-note {
    color: #f0c040;
    font-weight: bold;
    margin-bottom: 16px;
  }
  .back-button {
    background: none;
    border: 1px solid #a8a0b8;
    color: #a8a0b8;
    padding: 8px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-family: Georgia, serif;
    margin-top: 8px;
  }
  .back-button:hover {
    border-color: #e0d8c8;
    color: #e0d8c8;
  }
</style>
