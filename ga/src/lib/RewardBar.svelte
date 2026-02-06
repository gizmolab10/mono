<script lang="ts">
  import { regard } from './stores/regard';
</script>

<div class="reward-bar">
  <span class="label">Regard</span>
  <span class="value">{$regard}</span>
</div>

<style>
  .reward-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 48px;
    background: linear-gradient(135deg, #16213e, #0f3460);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    z-index: 100;
    border-bottom: 2px solid #c8a030;
    font-family: Georgia, serif;
  }
  .label {
    color: #a8a0b8;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .value {
    color: #f0c040;
    font-size: 24px;
    font-weight: bold;
    text-shadow: 0 0 12px rgba(240, 192, 64, 0.4);
  }
</style>
