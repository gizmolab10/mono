// Importing the createPopper function from the Popper.js library
import { createPopper } from '../common/GlobalImports';

// Example usage of createPopper
const button = document.querySelector('#button'); // Your reference element
const tooltip = document.querySelector('#tooltip'); // The Popper element

if (button && tooltip) {
  // Create a Popper instance
  const popperInstance = createPopper(button, tooltip, {
    placement: 'top', // Defines where the tooltip is positioned relative to the button
  });

  // Function to make the tooltip visible
  function show() {
    tooltip.setAttribute('data-show', '');
    popperInstance.update();
  }

  // Function to hide the tooltip
  function hide() {
    tooltip.removeAttribute('data-show');
  }

  // Event listeners to show/hide the tooltip
  button.addEventListener('mouseenter', show);
  button.addEventListener('mouseleave', hide);
}
