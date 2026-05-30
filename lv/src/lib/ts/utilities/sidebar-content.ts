// Builds the sidebar list at runtime from every md file's top settings.
// There is no hand-written sidebar file. The page whose top settings mark it
// as the home page is pinned first, in bold, with a divider under it, and is
// labelled by its pretty title. Top-level pages follow alphabetically, then
// one section per folder (folders alphabetical, each holding its pages
// alphabetically). The result is plain markdown text, fed through the same
// renderer the rest of the site uses; the fold-maker turns each folder
// heading into a collapsible section.

import { loadMdEntries } from './loader';

export type PageInfo = { name: string; title?: string; home: boolean; folder: string };

// Read the top three-dashed settings block and return its key/value pairs.
// Blank lines and lines without a colon are ignored. If there is no top
// block, the result is empty.
export function parseFrontMatter(md: string): Record<string, string> {
  const result: Record<string, string> = {};
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return result;
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

// Gather one entry per md file on disk, reading each file's top settings to
// learn its pretty title and whether it is the home page, and noting the
// folder it sits in.
export function collectPages(): PageInfo[] {
  return loadMdEntries().map(({ name, folder, text }) => {
    const front = parseFrontMatter(text);
    return { name, title: front.title, home: front.home?.trim() === 'true', folder };
  });
}

// Turn the gathered pages into the sidebar's markdown text: the home page
// pinned first in bold with a divider, then the other top-level pages
// alphabetically, then one heading per folder with its pages underneath.
export function composeSidebarMd(pages: PageInfo[]): string {
  const home = pages.find((p) => p.home);
  const byName = (a: PageInfo, b: PageInfo) => a.name.localeCompare(b.name);

  const topLevel = pages.filter((p) => p !== home && p.folder === '').sort(byName);
  const folders = [...new Set(pages.filter((p) => p.folder !== '').map((p) => p.folder))].sort(
    (a, b) => a.localeCompare(b),
  );

  const lines: string[] = [];
  if (home) {
    const label = home.title ?? home.name;
    lines.push(`**[${label}](${home.name})**`, '', '---', '');
  }
  for (const p of topLevel) lines.push(`[[${p.name}]]`, '');
  for (const folder of folders) {
    lines.push(`## ${folder}`, '');
    for (const p of pages.filter((x) => x !== home && x.folder === folder).sort(byName)) {
      lines.push(`[[${p.name}]]`, '');
    }
  }

  return lines.join('\n').trim() + '\n';
}

// The whole job in one call: read the files, then build the markdown.
export function buildSidebarMd(): string {
  return composeSidebarMd(collectPages());
}
