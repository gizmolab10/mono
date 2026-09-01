// Tests for the toggle rule in `notes/work/bare bone website.md`:
// the toggle button hides or shows the sidebar, driven by one shared on/off
// value. (How that value paints the screen is left to the styling and the
// click-through tests.)

import { describe, it, expect } from 'vitest';
import { s_sidebar } from '../utilities/S_Sidebar.svelte';

describe('the s_sidebar show/hide value', () => {
  it('starts shown', () => {
    expect(s_sidebar.visible).toBe(true);
  });

  it('flips off then back on with each toggle', () => {
    const start = s_sidebar.visible;
    s_sidebar.toggle();
    expect(s_sidebar.visible).toBe(!start);
    s_sidebar.toggle();
    expect(s_sidebar.visible).toBe(start);
  });
});
