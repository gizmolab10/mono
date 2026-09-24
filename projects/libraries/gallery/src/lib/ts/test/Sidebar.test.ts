// Tests for the rule in `notes/work/bare bone website.md`: the hamburger hides or
// shows the sidebar, driven by one shared on/off value. (How that value paints the
// screen is left to the styling and the click-through tests.)
//
// That value answers to gallery's own switch as well as to what was remembered. Switched
// off there is nothing to show and no button to ask with, so a remembered yes counts
// for nothing — otherwise the content keeps a column's width of space for a sidebar
// that is never drawn.

import { customizations } from '../common/Customizations';
import { s_sidebar } from '../utilities/S_Sidebar.svelte';
import { describe, it, expect } from 'vitest';

describe('the s_sidebar show/hide value', () => {
  it('stays hidden while the sidebar is switched off, whatever was remembered', () => {
    customizations.enable_sidebar = false;
    expect(s_sidebar.visible).toBe(false);
    s_sidebar.toggle();
    expect(s_sidebar.visible).toBe(false);
  });

  it('flips off then back on with each toggle, once the sidebar is switched on', () => {
    customizations.enable_sidebar = true;
    const start = s_sidebar.visible;
    s_sidebar.toggle();
    expect(s_sidebar.visible).toBe(!start);
    s_sidebar.toggle();
    expect(s_sidebar.visible).toBe(start);
    customizations.enable_sidebar = false;
  });
});
