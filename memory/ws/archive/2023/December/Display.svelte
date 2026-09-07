<script>
	import { signal, Signals, PersistID, persistLocal } from '../../ts/common/GlobalImports';
	import { row_height } from '../../ts/managers/State';

	function handleInput(event) {
		// signal(Signals.layout);
		persistLocal.writeToKey(PersistID.row_height, $row_height);
	}

  </script>

<input
  min='15'
  max='30'
  type='range'
  bind:value={$row_height}
  oninput={handleInput}
  onkeydown={(event) => { event.preventDefault(); }}
/>
<div style='text-align: center;'>
  Size: {$row_height}
</div>

<style>
  input {
    width: 70px;  
    &:focus {
      outline: none;
    }
  }
</style>
