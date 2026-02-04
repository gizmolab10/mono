// Cross-project link resolver for VitePress
// Transforms links followed by @project/path comments to the correct host
//
// Usage in markdown:
//   [web seriously](../../ws/notes/work/resume.md) <!-- @ws/work/resume.md -->
//
// How it works:
//   - Obsidian follows the relative path (../../ws/notes/work/resume.md)
//   - VitePress detects the comment and rewrites href to correct host
//   - Dev: localhost:5174/work/resume.html
//   - Prod: docs.webseriously.org/work/resume.html

import ports from '../notes/tools/hub/ports.json'

const isDev = process.env.NODE_ENV !== 'production'

// Build host map from ports.json
const hostMap: Record<string, { dev: string; prod: string }> = {
  ws: {
    dev: `http://localhost:${ports.ws.docs}`,
    prod: ports.ws.docsPublic
  },
  di: {
    dev: `http://localhost:${ports.di.docs}`,
    prod: ports.di.docsPublic
  },
  mono: {
    dev: `http://localhost:${ports.mono.docs}`,
    prod: ports.mono.docsPublic
  },
  me: {
    dev: `http://localhost:${ports.me.docs}`,
    prod: ports.me.docsPublic
  }
}

export default function crossProjectPlugin(md: any) {
  // Store original parse to intercept raw content
  const originalParse = md.parse.bind(md)

  md.parse = function(src: string, env: any) {
    // Replace [text](path) <!-- @project/path --> with [text](@project/path)
    // This preprocessing lets us use the simpler link_open override
    const processed = src.replace(
      /\[([^\]]+)\]\([^)]+\)\s*<!--\s*@(ws|di|mono|me)\/([^\s]+)\s*-->/g,
      (match, text, project, path) => `[${text}](@${project}/${path})`
    )
    return originalParse(processed, env)
  }

  // Override the link_open renderer
  const defaultRender = md.renderer.rules.link_open || function(tokens: any, idx: any, options: any, env: any, self: any) {
    return self.renderToken(tokens, idx, options)
  }

  md.renderer.rules.link_open = function(tokens: any, idx: any, options: any, env: any, self: any) {
    const token = tokens[idx]
    const hrefIndex = token.attrIndex('href')

    if (hrefIndex >= 0) {
      let href = token.attrs[hrefIndex][1]

      // Match @project/path pattern (from preprocessing)
      const match = href.match(/^@(ws|di|mono|me)\/(.*)$/)
      if (match) {
        const [, project, path] = match
        const host = isDev ? hostMap[project].dev : hostMap[project].prod
        // Convert .md to .html for VitePress
        const finalPath = path.replace(/\.md$/, '.html')
        token.attrs[hrefIndex][1] = `${host}/${finalPath}`
      }
    }

    return defaultRender(tokens, idx, options, env, self)
  }
}
