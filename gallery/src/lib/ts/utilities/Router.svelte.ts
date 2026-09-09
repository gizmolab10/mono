// Router. Holds the current md file name and the status message. Wires up
// the browser address bar so it follows the current name, and the other way
// round. Also drives the bottom status line: when the reader navigates to an
// md file that does not exist on disk, a broken-link error appears; the next
// successful navigation clears it.
//
// The home page's name is the host's, read from its switches when a page is asked
// for — never while this file loads, since the host sets them after its files load.

import { customizations } from '../common/Customizations';
import { pageExists } from './Resolver';

// What the address says, with the leading slash taken off. Nothing at the root.
function nameFromPath(): string {
  if (typeof window === 'undefined') return '';
  const path = decodeURIComponent(window.location.pathname);
  return path.startsWith('/') ? path.slice(1) : path;
}

class RouterState {
  // What the address says. Nothing here means the home page.
  name = $state<string>(nameFromPath());

  // The page showing: the name, or the home page where the address names none.
  get page(): string {
    return this.name || customizations.home;
  }

  // Blank while the page exists. The home page counts as existing whether or not a
  // file carries its name, so a site with no pages at all says nothing is wrong.
  get status(): string {
    const page = this.page;
    return page === customizations.home || pageExists(page) ? '' : `Page not found: ${page}`;
  }
}

export const router = new RouterState();

// Change the current md file. Updates the address bar via pushState and
// updates the reactive state so subscribers re-render.
export function navigate(name: string): void {
  const home = customizations.home;
  const page = name || home;
  const path = page === home ? '/' : '/' + encodeURIComponent(page);
  if (typeof window !== 'undefined' && window.location.pathname !== path) {
    history.pushState(null, '', path);
  }
  router.name = page === home ? '' : page;
}

// Wire up the browser back/forward buttons and the link interceptor.
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    router.name = nameFromPath();
  });

  window.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;

    const target = event.target as HTMLElement | null;
    const anchor = target?.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    if (anchor.target === '_blank') return;
    if (/^https?:\/\//i.test(href)) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (href.startsWith('#')) return;

    event.preventDefault();

    const path = decodeURIComponent(href);
    navigate(path.startsWith('/') ? path.slice(1) : path);
  });
}
