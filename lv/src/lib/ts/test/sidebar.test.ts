// Tests for the toggle rule in `notes/work/bare bone website.md`:
// the toggle button hides or shows the sidebar, driven by one shared on/off
// value. (How that value paints the screen is left to the styling and the
// click-through tests.)

import { describe, it, expect } from 'vitest';
import { sidebar } from '../utilities/sidebar.svelte';

describe('the sidebar show/hide value', () => {
  it('starts shown', () => {
    expect(sidebar.visible).toBe(true);
  });

  it('flips off then back on with each toggle', () => {
    const start = sidebar.visible;
    sidebar.toggle();
    expect(sidebar.visible).toBe(!start);
    sidebar.toggle();
    expect(sidebar.visible).toBe(start);
  });
});
