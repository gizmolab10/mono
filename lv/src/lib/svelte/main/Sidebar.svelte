<script lang='ts'>
  // The sidebar. Reads `Sidebar.md` from the loader and renders it through
  // the parser. Three polish layers run after the HTML lands in the DOM:
  //   - makeCollapsible: wraps each heading + its following content in a
  //     foldable section, so the writer can group entries with `## Section`.
  //   - highlightActive: marks the anchor whose target matches the current
  //     page with an "active" class for the pill background.
  //
  // If `Sidebar.md` is missing or empty, the sidebar shows only a link to
  // the home file.
  import { router } from '../../ts/utilities/router.svelte';
  import { getMdText, resolveHref } from '../../ts/utilities/resolver';
  import { render } from '../../ts/utilities/parser';

  const HOME = 'Little Cloud Vineyard';

  const sourceMd = getMdText('Sidebar');
  const fallbackMd = `[${HOME}](${resolveHref(HOME)})`;
  const effectiveMd = sourceMd && sourceMd.trim().length > 0 ? sourceMd : fallbackMd;
  const html = render(effectiveMd);

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

      const details = document.createElement('details');
      details.open = true;
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
