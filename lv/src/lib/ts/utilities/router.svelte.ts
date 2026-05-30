// Router. Holds the current md file name and the status message. Wires up
// the browser address bar so it follows the current name, and the other way
// round. Also drives the bottom status line: when the reader navigates to an
// md file that does not exist on disk, a broken-link error appears; the next
// successful navigation clears it.

import { pageExists } from './resolver';

const HOME = 'Little Cloud Vineyard';

function nameFromPath(): string {
  if (typeof window === 'undefined') return HOME;
  const path = decodeURIComponent(window.location.pathname);
  const name = path.startsWith('/') ? path.slice(1) : path;
  return name || HOME;
}

class RouterState {
  name = $state<string>(nameFromPath());
  status = $state<string>('');
}

export const router = new RouterState();

function updateStatus(name: string): void {
  const target = name || HOME;
  if (target === HOME || pageExists(target)) {
    router.status = '';
  } else {
    router.status = `Page not found: ${target}`;
  }
}

// Set the initial status based on the address the page loaded at.
updateStatus(nameFromPath());

// Change the current md file. Updates the address bar via pushState and
// updates the reactive state so subscribers re-render.
export function navigate(name: string): void {
  const target = name || HOME;
  const path = target === HOME ? '/' : '/' + encodeURIComponent(target);
  if (typeof window !== 'undefined' && window.location.pathname !== path) {
    history.pushState(null, '', path);
  }
  router.name = target;
  updateStatus(target);
}

// Wire up the browser back/forward buttons and the link interceptor.
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const name = nameFromPath();
    router.name = name;
    updateStatus(name);
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
    const name = path.startsWith('/') ? path.slice(1) : path;
    navigate(name || HOME);
  });
}
