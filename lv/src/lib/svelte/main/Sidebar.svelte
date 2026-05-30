<script lang='ts'>
  // The sidebar. Builds its list at runtime from every page's top settings
  // (no hand-written sidebar file) and renders it through the parser. Two
  // polish layers run after the HTML lands in the DOM:
  //   - makeCollapsible: wraps each heading + its following content in a
  //     foldable section, so the writer can group entries with `## Section`.
  //   - highlightActive: marks the anchor whose target matches the current
  //     page with an "active" class for the pill background.
  import { router } from '../../ts/utilities/router.svelte';
  import { render } from '../../ts/utilities/parser';
  import { buildSidebarMd } from '../../ts/utilities/sidebar-content';
  import { loadFolderOpen, saveFolderOpen } from '../../ts/utilities/persistence';

  const html = render(buildSidebarMd());

  // Group each heading with the elements that follow it (until the next
  // heading) inside a <details>/<summary> pair. Folding state is owned by
  // the browser's native disclosure widget.
  function makeCollapsible(node: HTMLElement) {
    const headingPattern = /^H[1-6]$/;
    const kids = Array.from(node.children);
    for (let i = 0; i < kids.length; i++) {
      const heading = kids[i];
      if (!headingPattern.test(heading.tagName)) continue;

      const sectionChildren: Element[] = [];
      let j = i + 1;
      while (j < kids.length && !headingPattern.test(kids[j].tagName)) {
        sectionChildren.push(kids[j]);
        j++;
      }
      if (sectionChildren.length === 0) continue;

      const folderName = heading.textContent?.trim() ?? '';
      const details = document.createElement('details');
      details.open = loadFolderOpen(folderName, true);
      details.addEventListener('toggle', () => saveFolderOpen(folderName, details.open));
      const summary = document.createElement('summary');
      summary.className = 'sidebar-section ' + heading.tagName.toLowerCase();
      while (heading.firstChild) summary.appendChild(heading.firstChild);
      details.appendChild(summary);
      for (const child of sectionChildren) details.appendChild(child);
      heading.replaceWith(details);
    }
  }

  // Add `active` to the anchor whose target matches the current name.
  function highlightActive(node: HTMLElement, name: string) {
    function update(current: string) {
      node.querySelectorAll('a.active').forEach((a) => a.classList.remove('active'));
      node.querySelectorAll('a').forEach((a) => {
        const href = a.getAttribute('href') ?? '';
        let target = href;
        try {
          const decoded = decodeURIComponent(href);
          target = decoded.startsWith('/') ? decoded.slice(1) : decoded;
        } catch {
          // Malformed URI — leave as-is.
        }
        if (target === current) a.classList.add('active');
      });
    }
    update(name);
    return { update };
  }
</script>

<nav class="shell-sidebar" use:makeCollapsible use:highlightActive={router.name}>
  {@html html}
</nav>
