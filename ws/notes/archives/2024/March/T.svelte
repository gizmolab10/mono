<!-- T.svelte -->
<script>
  import { stopPropagation } from 'svelte/legacy';

  import { onMount } from 'svelte';

  let input = $state();
  let isGrabbed = false;
  let isEditing = false;

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && isGrabbed) {
      update(event);
    }
  };

  function update(event) {
    event.preventDefault();      // avoid focusing the input on the first click
    if (!isGrabbed) {
      isGrabbed = true;
    } else if (!isEditing) {
      isEditing = true;
      input.style.border = 'dashed red';
      input.focus();
      return;
    }
    isEditing = false;
    input.style.border = 'solid blue';
    input.blur();
  }

  onMount(() => {
    // Listen for the Enter keydown event on the whole component
    // This can be adjusted based on specific needs
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<style>
  input:focus {
    outline: none;
  }
</style>

<input
  bind:this={input}
  onclick={stopPropagation(update)}
  style="padding: 7px; margin: 8px; border: 1px solid gray; position:absolute; left:200px; top:-16.5px;"
  placeholder="Click me"
/>
