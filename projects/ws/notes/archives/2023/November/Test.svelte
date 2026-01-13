<script>
  import ChildComponent from './ChildComponent.svelte';

  // Define an array of messages
  let messages = $state(["A", "B", "C"]);

  // Define an array of Foo elements
  let foos = [
    { id: "cA", otherProp: "Other Prop A" },
    { id: "cB", otherProp: "Other Prop B" },
    { id: "cC", otherProp: "Other Prop C" }
  ];

  function handleChangeB() {
    // Update the value of B
    messages[1] = "New Value for B";
  }

  // Define a function to get Foo at a specific index
  function getFooAt(index) {
    return foos[index];
  }
</script>

<button onclick={handleChangeB}>Change Value of B</button>

<!-- Loop through the messages array and create child components -->
{#each messages as message, index}
  <ChildComponent message={message} foo={getFooAt(index)} />
{/each}
