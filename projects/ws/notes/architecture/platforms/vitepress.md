# VitePress

i asked the AI to write instructions for installing, configuring and running vitepress in a way that i could understand it and it could read it and do it.

## Quick Start

```bash
yarn docs:dev    # start server on port 5176
yarn docs:build  # build static site
yarn docs:preview # preview built site
```

No NVM needed - yarn handles Node version.

### Tool Scripts

Go to `/notes/tools`:

```bash
./update-docs.sh  # full workflow: build, fix links, sync sidebar
./reset-docs.sh   # rebuild and restart dev server
```

### TypeScript Tools

Go to `/notes/tools`. Source in `lib/`, compiled to `dist/`. Run `npx tsc`, then run the compiled js in `dist` using the `node` command. The first two can be passed a `-v` option for verbose information.

| File | Options | Purpose |
|----|----|----|
| `fix-links` | Fixes broken links by examining build errors | `-v` `--test` |
| `sync-sidebar` | Regenerates sidebar from filesystem | `-v` |
| `generate-sidebar` | Helper: walks srcDir, adds sidebar items |    |
| `markdown-parser` | Extracts and updates links in markdown |    |
| `link-finder` | Searches repo for files by name |    |
| `config-updater` | Updates sidebar links in config.mts |    |
| `merge-files` | Merges markdown by section | `-v` `A B` |

## Setup


1. Add to package.json devDependencies: `"vitepress": "^1.6.4"`
2. Add scripts: `docs:dev`, `docs:build`, `docs:preview`
3. Create `.vitepress/config.mts` - see actual file for config
4. `yarn install`


Configuration file is `.vitepress/config.mts`. Key settings:

* `srcDir: './notes/designs'` - markdown source
* `srcExclude: ['obsolete/**', 'next/**']` - skip these
* `search: { provider: 'local' }` - enables search

## Customizations

### Prev/Next in Navbar

Moved prev/next navigation from bottom of page to top navbar (before the light/dark toggle). Files involved:

* `Layout.vue` - wraps default, injects PrevNext into `nav-bar-content-after` slot
* `PrevNext.vue` - renders ← → arrows using VitePress's `usePrevNext` composable
* `custom.css` - hides original footer pager, reorders navbar elements via flex order

### Sidebar Toggle

VitePress has a `watchPostEffect` that auto-expands sections containing the active page. Can't fight Vue reactivity directly. Solution: CSS layer on top.

**The trick:** `data-user-collapsed` and `data-user-expanded` attributes. CSS uses `!important` to override VitePress styles. JS manages the attributes, localStorage persists state.

When user clicks a heading:

* Expanded → add `data-user-collapsed`, visually collapse
* Collapsed → add `data-user-expanded`, visually expand

VitePress still thinks it controls state. We just override the visuals.

Files:

* `index.ts` - click handler, localStorage read/write, applies state on load/route change
* `custom.css` - `[data-user-collapsed] > .items { display: none !important }` etc.

Also hides the carets entirely since headings now toggle on click.

### Favicon



1. Put icon in `.vitepress/public/favicon.png`
2. Add to config: `head: [['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }]]`
3. Fix build: `"docs:build": "vitepress build && cp .vitepress/public/favicon.png .vitepress/dist/"`

**Note:** favicon only works in build mode, not dev. VitePress bug.


## Annotations

Two special comments control how `update-docs.sh` handles files:

### `<!-- @manual -->` — Protect index.md from overwriting

Add ***anywhere*** in an index.md file:

```markdown
<!-- @manual -->

### My Custom Index

This content won't be touched by sync-index-files.sh
```

The script will skip the file and (in ***verbose*** mode) enter into the log:

`Skipping index.md in: folder_name (marked @manual)`

### `// @keep` — Preserve sidebar items

Add after any sidebar item in `.vitepress/config.mts`:

```typescript
sidebar: [
  {
    text: 'Project',
    link: '/project'
  }, // @keep
  // ... auto-generated items below
]
```

The sync-sidebar script will:




1. Extract all `@keep` items before regenerating
2. Place them at the top of the sidebar
3. Add auto-generated items below
4. Report: `Preserved: N @keep item(s)`

Use this for links to files outside `srcDir` or custom entries that don't map to the filesystem.

## Gotchas

### Anchors Starting with Numbers

VitePress prepends an underscore to anchor IDs that start with a number. So:

| Heading | Generated anchor |
|---------|------------------|
| `#### 1. Organization` | `#_1-organization` |
| `#### 3. Voice Consistency` | `#_3-voice-consistency` |

If your in-page links don't work, check the actual `id` attribute in dev tools.

## To Have Claude Set This Up

Say: "Read vitepress.md and set it up"