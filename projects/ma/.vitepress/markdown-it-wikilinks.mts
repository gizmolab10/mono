import { readdirSync, statSync } from 'fs'
import { join, relative, dirname, basename } from 'path'
import type MarkdownIt from 'markdown-it'

// Build a map of filename (no extension) -> site-relative path
function buildFileMap(srcDir: string): Map<string, string> {
  const map = new Map<string, string>()

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        if (entry.startsWith('.')) continue
        walk(full)
      } else if (entry.endsWith('.md')) {
        const name = basename(entry, '.md')
        const rel = '/' + relative(srcDir, full).replace(/\.md$/, '')
        // index files map to their directory
        const href = name === 'index' ? rel.replace(/\/index$/, '/') || '/' : rel
        map.set(name, href)
      }
    }
  }

  walk(srcDir)
  return map
}

// Strip known prefixes from wikilink targets (e.g., "ma/notes/work/foo" -> "work/foo")
function normalize(target: string): string {
  return target
    .replace(/^ma\/notes\//, '')
    .replace(/^notes\//, '')
}

export default function wikilinkPlugin(md: MarkdownIt, opts?: { srcDir?: string }) {
  const srcDir = opts?.srcDir || join(process.cwd(), 'notes')
  const fileMap = buildFileMap(srcDir)

  // Override the core rule to find [[...]] in inline tokens
  md.core.ruler.after('inline', 'wikilink', (state) => {
    for (const blockToken of state.tokens) {
      if (blockToken.type !== 'inline' || !blockToken.children) continue
      if (!blockToken.content.includes('[[')) continue

      const newChildren: any[] = []

      for (const token of blockToken.children) {
        if (token.type !== 'text' || !token.content.includes('[[')) {
          newChildren.push(token)
          continue
        }

        // Split text on [[...]] patterns
        const text = token.content
        const regex = /\[\[([^\]]+)\]\]/g
        let lastIndex = 0
        let match

        while ((match = regex.exec(text)) !== null) {
          // Text before the wikilink
          if (match.index > lastIndex) {
            const before = new state.Token('text', '', 0)
            before.content = text.slice(lastIndex, match.index)
            newChildren.push(before)
          }

          const raw = match[1]
          const parts = raw.split('|')
          const target = parts[0].trim()
          const label = (parts[1] || target.split('/').pop() || target).trim()

          // Resolve the link
          const normalized = normalize(target)
          const name = normalized.split('/').pop() || normalized
          const href = fileMap.get(name)

          if (href) {
            const open = new state.Token('link_open', 'a', 1)
            open.attrSet('href', href)
            newChildren.push(open)

            const content = new state.Token('text', '', 0)
            content.content = label
            newChildren.push(content)

            const close = new state.Token('link_close', 'a', -1)
            newChildren.push(close)
          } else {
            // Broken link — render visibly
            const open = new state.Token('html_inline', '', 0)
            open.content = `<span class="broken-wikilink" title="unresolved: ${target}">`
            newChildren.push(open)

            const content = new state.Token('text', '', 0)
            content.content = `[[${raw}]]`
            newChildren.push(content)

            const close = new state.Token('html_inline', '', 0)
            close.content = '</span>'
            newChildren.push(close)
          }

          lastIndex = regex.lastIndex
        }

        // Text after the last wikilink
        if (lastIndex < text.length) {
          const after = new state.Token('text', '', 0)
          after.content = text.slice(lastIndex)
          newChildren.push(after)
        }
      }

      blockToken.children = newChildren
    }
  })
}
