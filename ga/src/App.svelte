<script lang="ts">
  import RewardBar from './lib/RewardBar.svelte';
  import CarnivalMap from './lib/CarnivalMap.svelte';
  import KindnessExchange from './lib/booths/KindnessExchange.svelte';
  import TrustCircle from './lib/booths/TrustCircle.svelte';
  import NeedsSpotter from './lib/booths/NeedsSpotter.svelte';

  type View = 'map' | 'kindness' | 'trust' | 'needs';
  let currentView: View = $state('map');

  function selectBooth(booth: string) {
    currentView = booth as View;
  }

  function backToMap() {
    currentView = 'map';
  }
</script>

<RewardBar />

{#if currentView === 'map'}
  <CarnivalMap onselect={selectBooth} />
{:else if currentView === 'kindness'}
  <KindnessExchange onclose={backToMap} />
{:else if currentView === 'trust'}
  <TrustCircle onclose={backToMap} />
{:else if currentView === 'needs'}
  <NeedsSpotter onclose={backToMap} />
{/if}

<style>
  :global(body) {
    background: #1a1a2e;
    color: #e0d8c8;
    font-family: Georgia, 'Times New Roman', serif;
    min-height: 100vh;
  }
</style>
