// Parser. Turns one md file's text into rendered HTML.
//
// The chain:
//   preprocessObsidian     converts Obsidian wiki-link syntax to standard markdown
//   remark-parse           reads standard markdown
//   remark-frontmatter     pulls out the top three-dashed block
//   remark-callout         handles `> [!note]` and friends
//   remark-rehype          converts the markdown tree into an HTML tree
//   rehype-stringify       turns the HTML tree into an HTML string
//
// We do NOT use @portaljs/remark-wiki-link. That plugin's dependencies
// pin it to micromark v2; the rest of the stack uses micromark v4 and the
// plugin crashes at runtime. Working around that with a string preprocessor
// keeps Obsidian-flavoured input working with the current stack.

import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkCallout from 'remark-callout';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { resolveHref } from './resolver';

// Convert `![[name.png]]` and `[[Other Note]]` (and the `[[Target|Display]]`
// alias form) into standard markdown image and link syntax. Also relax
// standard `[Label](URL with spaces)` so the writer can use file names with
// spaces as link targets without having to wrap them in angle brackets or
// URL-encode the spaces.
//
// Once converted, remark-parse handles the rest without needing a special
// wiki-link plugin.
function preprocessObsidianSyntax(md: string): string {
  // Center line: `> [!center] text` becomes a centered line with no box, no
  // border, no icon. Handled here, before the callout plugin runs, because
  // that plugin maps the unknown "center" type to the default "note" look and
  // never tags it "center". The emitted block reuses the existing
  // `.callout.center` styling. The blank lines around the text let any inner
  // markdown (bold, links, image embeds) still parse normally.
  md = md.replace(/^> *\[!center\] *(.*)$/gim, (_m, text: string) => {
    return `<blockquote class="callout center"><div class="callout-content">\n\n${text}\n\n</div></blockquote>`;
  });

  // Image embeds first so the `!` prefix gets consumed before the link regex
  // can grab the surrounding `[[...]]`. The part after the bar is a size when
  // it reads as a number (width) or number-by-number (width by height); the
  // image is then drawn at that size. Any other text after the bar stays the
  // caption, as before.
  md = md.replace(/!\[\[([^\]\n|]+)(?:\|([^\]\n]+))?\]\]/g, (_m, target: string, extra?: string) => {
    const t = target.trim();
    const url = resolveHref(t);
    const spec = extra?.trim();
    if (spec) {
      const size = /^(\d+)(?:x(\d+))?$/.exec(spec);
      if (size) {
        const width = ` width="${size[1]}"`;
        const height = size[2] ? ` height="${size[2]}"` : '';
        return `<img src="${url}" alt="${t}"${width}${height}>`;
      }
      return `![${spec}](${url})`;
    }
    return `![${t}](${url})`;
  });

  // Regular wiki-links.
  md = md.replace(/\[\[([^\]\n|]+)(?:\|([^\]\n]+))?\]\]/g, (_m, target: string, alias?: string) => {
    const t = target.trim();
    const display = (alias ?? t).trim();
    const url = resolveHref(t);
    return `[${display}](${url})`;
  });

  // Relaxed standard-link form: `[Label](URL with spaces)`. Standard markdown
  // stops the URL at the first space. We replace internal spaces with `%20`
  // so the parser keeps reading. The pattern excludes quotes inside the
  // parentheses so the legitimate `[Label](url "title")` form is left alone.
  md = md.replace(/(\[[^\]\n]+\])\(([^)"'\n]+)\)/g, (m, label: string, target: string) => {
    if (!target.includes(' ')) return m;
    return `${label}(${target.replace(/ /g, '%20')})`;
  });

  return md;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ['yaml'])
  .use(remarkCallout)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

export function render(md: string): string {
  const preprocessed = preprocessObsidianSyntax(md);
  const file = processor.processSync(preprocessed);
  return String(file);
}
