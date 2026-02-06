<script lang="ts">
  interface Props {
    onselect: (booth: string) => void;
  }
  let { onselect }: Props = $props();

  let hoveredBooth = $state('');
</script>

<div class="map-container">
  <h1>The Carnival</h1>
  <p class="welcome">Step right up. Each booth teaches something about a better world — and earns you regard.</p>

  <svg viewBox="0 0 800 500" class="carnival-svg">
    <!-- Ground -->
    <ellipse cx="400" cy="350" rx="350" ry="120" fill="rgba(15, 52, 96, 0.3)" stroke="#0f3460" stroke-width="1"/>

    <!-- Kindness Exchange booth -->
    <g
      class="booth-group"
      class:hovered={hoveredBooth === 'kindness'}
      onmouseenter={() => hoveredBooth = 'kindness'}
      onmouseleave={() => hoveredBooth = ''}
      onclick={() => onselect('kindness')}
      role="button"
      tabindex="0"
      onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && onselect('kindness')}
    >
      <rect x="120" y="240" width="140" height="100" rx="8" class="booth-rect"/>
      <polygon points="120,240 190,190 260,240" class="booth-roof"/>
      <text x="190" y="285" class="booth-title">Kindness</text>
      <text x="190" y="305" class="booth-title">Exchange</text>
      <text x="190" y="220" class="booth-hint">✉ Write & receive</text>
    </g>

    <!-- Trust Circle booth -->
    <g
      class="booth-group"
      class:hovered={hoveredBooth === 'trust'}
      onmouseenter={() => hoveredBooth = 'trust'}
      onmouseleave={() => hoveredBooth = ''}
      onclick={() => onselect('trust')}
      role="button"
      tabindex="0"
      onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && onselect('trust')}
    >
      <rect x="330" y="220" width="140" height="100" rx="8" class="booth-rect"/>
      <polygon points="330,220 400,170 470,220" class="booth-roof"/>
      <text x="400" y="265" class="booth-title">Trust</text>
      <text x="400" y="285" class="booth-title">Circle</text>
      <text x="400" y="200" class="booth-hint">🤝 Share or keep?</text>
    </g>

    <!-- Needs Spotter booth -->
    <g
      class="booth-group"
      class:hovered={hoveredBooth === 'needs'}
      onmouseenter={() => hoveredBooth = 'needs'}
      onmouseleave={() => hoveredBooth = ''}
      onclick={() => onselect('needs')}
      role="button"
      tabindex="0"
      onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && onselect('needs')}
    >
      <rect x="540" y="240" width="140" height="100" rx="8" class="booth-rect"/>
      <polygon points="540,240 610,190 680,240" class="booth-roof"/>
      <text x="610" y="285" class="booth-title">Needs</text>
      <text x="610" y="305" class="booth-title">Spotter</text>
      <text x="610" y="220" class="booth-hint">📋 What matters most?</text>
    </g>

    <!-- Decorative path between booths -->
    <path d="M 260 310 Q 330 370 400 310 Q 470 370 540 310" fill="none" stroke="#a8a0b8" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>
  </svg>
</div>

<style>
  .map-container {
    padding: 80px 24px 24px;
    text-align: center;
    max-width: 900px;
    margin: 0 auto;
  }
  h1 {
    color: #f0c040;
    font-size: 42px;
    margin-bottom: 8px;
    letter-spacing: 2px;
  }
  .welcome {
    color: #a8a0b8;
    font-style: italic;
    font-size: 16px;
    margin-bottom: 32px;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
  .carnival-svg {
    width: 100%;
    max-width: 800px;
  }
  .booth-group {
    cursor: pointer;
    outline: none;
  }
  .booth-rect {
    fill: rgba(22, 33, 62, 0.8);
    stroke: #a8a0b8;
    stroke-width: 2;
    transition: all 0.2s;
  }
  .booth-roof {
    fill: #c8a030;
    opacity: 0.7;
    transition: all 0.2s;
  }
  .booth-group.hovered .booth-rect {
    stroke: #f0c040;
    fill: rgba(240, 192, 64, 0.1);
  }
  .booth-group.hovered .booth-roof {
    opacity: 1;
    fill: #f0c040;
  }
  .booth-title {
    fill: #e0d8c8;
    font-family: Georgia, serif;
    font-size: 16px;
    text-anchor: middle;
  }
  .booth-group.hovered .booth-title {
    fill: #f0c040;
  }
  .booth-hint {
    fill: #a8a0b8;
    font-family: Georgia, serif;
    font-size: 11px;
    text-anchor: middle;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .booth-group.hovered .booth-hint {
    opacity: 1;
  }
</style>
