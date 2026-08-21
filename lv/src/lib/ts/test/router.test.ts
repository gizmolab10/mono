// @vitest-environment jsdom
//
// Tests for the router rules in `notes/work/bare bone website.md`:
// the address bar holds the current page name, going to a page updates both
// the name and the address, the home name maps to the root address, and going
// to a missing page shows a not-found message that the next good move clears.

import { describe, it, expect } from 'vitest';
import { router, navigate } from '../utilities/router.svelte';

const HOME = 'Little Cloud Vineyard';

describe('going to a page', () => {
  it('starts on the home page at the root address', () => {
    navigate(HOME);
    expect(router.name).toBe(HOME);
    expect(window.location.pathname).toBe('/');
  });

  // Any name but the home one, since the home page is the root address. This
  // one need not be a page on disk: what is proved is that the name and the
  // address move together.
  it('changes the current name and the address together', () => {
    navigate('The Vineyard');
    expect(router.name).toBe('The Vineyard');
    expect(window.location.pathname).toBe('/The%20Vineyard');
  });

  it('sends an empty name to the home page', () => {
    navigate('');
    expect(router.name).toBe(HOME);
    expect(window.location.pathname).toBe('/');
  });
});

describe('the status message', () => {
  it('is blank when the page exists', () => {
    navigate('Little Cloud Vineyard');
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
