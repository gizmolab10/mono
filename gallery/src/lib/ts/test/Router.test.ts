// @vitest-environment jsdom
//
// Tests for the router rules in `notes/work/bare bone website.md`:
// the address bar holds the current page name, going to a page updates both
// the name and the address, the home name maps to the root address, and going
// to a missing page shows a not-found message that the next good move clears.
//
// The home page's name is what gallery's own switches say: `Home`, the one page
// under `src/md`.

import { describe, it, expect } from 'vitest';
import { router, navigate } from '../utilities/Router.svelte';

const HOME = 'Home';

describe('going to a page', () => {
  it('starts on the home page at the root address', () => {
    navigate(HOME);
    expect(router.page).toBe(HOME);
    expect(window.location.pathname).toBe('/');
  });

  // Any name but the home one, since the home page is the root address. This
  // one need not be a page on disk: what is proved is that the name and the
  // address move together.
  it('changes the current name and the address together', () => {
    navigate('Sample Page');
    expect(router.page).toBe('Sample Page');
    expect(window.location.pathname).toBe('/Sample%20Page');
  });

  it('sends an empty name to the home page', () => {
    navigate('');
    expect(router.page).toBe(HOME);
    expect(window.location.pathname).toBe('/');
  });
});

describe('the status message', () => {
  it('is blank when the page exists', () => {
    navigate(HOME);
    expect(router.status).toBe('');
  });

  it('shows a not-found message for a missing page', () => {
    navigate('No Such Page');
    expect(router.status).toContain('No Such Page');
  });

  it('clears on the next good move', () => {
    navigate('No Such Page');
    expect(router.status).not.toBe('');
    navigate(HOME);
    expect(router.status).toBe('');
  });
});
