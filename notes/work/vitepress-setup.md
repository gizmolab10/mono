# VitePress Setup Files

Run these commands first:

```bash
cd ~/GitHub/shared
mkdir -p .vitepress/theme
yarn install
```

Then create these files:

---

## .vitepress/config.mts

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  srcDir: './guides',
  title: "Shared Guides",
  description: "Cross-project documentation and best practices",

  vite: {
    server: {
      port: 5177
    }
  },

  themeConfig: {
    sidebar: [
      {
        text: 'Collaborate >',
        link: '/collaborate/',
        collapsed: true,
        items: [
          { text: 'Access', link: '/collaborate/access' },
          { text: 'Chat', link: '/collaborate/chat' },
          { text: 'Docs', link: '/collaborate/docs' },
          { text: 'Voice', link: '/collaborate/voice' },
          { text: 'Workflow', link: '/collaborate/workflow' }
        ]
      },
      {
        text: 'Develop >',
        link: '/develop/',
        collapsed: true,
        items: [
          { text: 'Aesthetics', link: '/develop/aesthetics' },
          { text: 'Jonathan', link: '/develop/jonathan' },
          { text: 'Markdown', link: '/develop/markdown' },
          { text: 'Migration', link: '/develop/migration' },
          { text: 'Onboarding', link: '/develop/onboarding' },
          { text: 'Refactoring', link: '/develop/refactoring' },
          { text: 'Style', link: '/develop/style' }
        ]
      },
      {
        text: 'Test >',
        link: '/test/',
        collapsed: true,
        items: [
          { text: 'Debugging', link: '/test/debugging' },
          { text: 'Testing', link: '/test/testing' }
        ]
      }
    ],

    search: {
      provider: 'local'
    }
  }
})
```

---

## .vitepress/theme/index.ts

```typescript
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ router }) {
    if (typeof window !== 'undefined') {
      setupSidebarToggle(router)
    }
  }
}

const COLLAPSED_KEY = 'shared-collapsed-sections'
const EXPANDED_KEY = 'shared-expanded-sections'

function getStoredSet(key: string): Set<string> {
  try {
    const stored = localStorage.getItem(key)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function saveSet(key: string, sections: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...sections]))
  } catch {
    // Ignore storage errors
  }
}

function getSectionId(item: HTMLElement): string | null {
  const link = item.querySelector(':scope > .item > .link') as HTMLAnchorElement
  return link?.getAttribute('href')
}

function applyStoredState() {
  const collapsed = getStoredSet(COLLAPSED_KEY)
  const expanded = getStoredSet(EXPANDED_KEY)
  
  document.querySelectorAll('.VPSidebarItem.collapsible').forEach(item => {
    const id = getSectionId(item as HTMLElement)
    if (!id) return
    
    if (collapsed.has(id)) {
      item.setAttribute('data-user-collapsed', 'true')
      item.removeAttribute('data-user-expanded')
    } else if (expanded.has(id)) {
      item.setAttribute('data-user-expanded', 'true')
      item.removeAttribute('data-user-collapsed')
    }
  })
}

function setupSidebarToggle(router: any) {
  setTimeout(applyStoredState, 100)
  
  router.onAfterRouteChanged = () => {
    setTimeout(applyStoredState, 100)
  }

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const item = target.closest('.VPSidebarItem.collapsible') as HTMLElement
    if (!item) return
    
    const itemDiv = item.querySelector(':scope > .item')
    if (!itemDiv?.contains(target)) return
    
    const link = itemDiv.querySelector(':scope > .link')
    if (!link?.contains(target)) return

    const sectionId = getSectionId(item)
    const isUserCollapsed = item.hasAttribute('data-user-collapsed')
    const isUserExpanded = item.hasAttribute('data-user-expanded')
    const isVitePressCollapsed = item.classList.contains('collapsed')
    const isExpanded = !isUserCollapsed && (isUserExpanded || !isVitePressCollapsed)
    
    const collapsed = getStoredSet(COLLAPSED_KEY)
    const expanded = getStoredSet(EXPANDED_KEY)
    
    if (isExpanded) {
      item.setAttribute('data-user-collapsed', 'true')
      item.removeAttribute('data-user-expanded')
      if (sectionId) {
        collapsed.add(sectionId)
        expanded.delete(sectionId)
        saveSet(COLLAPSED_KEY, collapsed)
        saveSet(EXPANDED_KEY, expanded)
      }
      e.preventDefault()
      e.stopPropagation()
    } else {
      item.setAttribute('data-user-expanded', 'true')
      item.removeAttribute('data-user-collapsed')
      if (sectionId) {
        expanded.add(sectionId)
        collapsed.delete(sectionId)
        saveSet(COLLAPSED_KEY, collapsed)
        saveSet(EXPANDED_KEY, expanded)
      }
      e.preventDefault()
      e.stopPropagation()
    }
  }, true)
}
```

---

## .vitepress/theme/Layout.vue

```vue
<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import PrevNext from './PrevNext.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <PrevNext />
    </template>
  </Layout>
</template>
```

---

## .vitepress/theme/PrevNext.vue

```vue
<script setup lang="ts">
import { usePrevNext } from 'vitepress/dist/client/theme-default/composables/prev-next'
import VPLink from 'vitepress/dist/client/theme-default/components/VPLink.vue'

const control = usePrevNext()
</script>

<template>
  <div v-if="control.prev?.link || control.next?.link" class="nav-prev-next">
    <VPLink v-if="control.prev?.link" :href="control.prev.link" class="nav-link prev" :title="control.prev.text" :no-icon="true">
      ←
    </VPLink>
    <VPLink v-if="control.next?.link" :href="control.next.link" class="nav-link next" :title="control.next.text" :no-icon="true">
      →
    </VPLink>
  </div>
</template>

<style scoped>
.nav-prev-next {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-size: 16px;
  transition: color 0.2s, background-color 0.2s;
}

.nav-link:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}
</style>
```

---

## .vitepress/theme/custom.css

```css
/* Hide the entire bottom prev/next section */
.VPDocFooter .prev-next {
  display: none;
}

/* Reorder navbar elements */
.VPNavBar .content-body {
  display: flex;
}

.VPNavBar .content-body .appearance {
  order: 10;
}

.VPNavBar .content-body .social-links {
  order: 11;
}

.VPNavBar .content-body .extra {
  order: 12;
}

.VPNavBar .content-body .hamburger {
  order: 13;
}

.VPNavBar .content-body .nav-prev-next {
  order: 5;
}

/* Hide all sidebar carets */
.VPSidebarItem .caret {
  display: none;
}

/* User-collapsed override */
.VPSidebarItem[data-user-collapsed="true"] > .items {
  display: none !important;
}

.VPSidebarItem.level-0[data-user-collapsed="true"] {
  padding-bottom: 10px;
}

/* User-expanded override */
.VPSidebarItem[data-user-expanded="true"] > .items {
  display: block !important;
  border-left: 1px solid var(--vp-c-divider);
  padding-left: 16px;
}

.VPSidebarItem.level-0[data-user-expanded="true"] {
  padding-bottom: 24px;
}

/* Make items with children bold */
.VPSidebarItem.collapsible > .item .text {
  font-weight: 700;
}

/* Always show scrollbar */
html {
  overflow-y: scroll;
}
```

---

## netlify.toml

```toml
[build]
  command = "yarn docs:build"
  publish = ".vitepress/dist"

[build.environment]
  NODE_VERSION = "20.19.0"
```

---

## .gitignore additions

Add these to your .gitignore:

```
node_modules/
.vitepress/cache/
.vitepress/dist/
yarn.lock
```

---

## Index files needed

VitePress needs index.md files for section landing pages. Create these:

### guides/index.md

```markdown
# Shared Guides

Cross-project documentation and best practices.

- **Collaborate** — How to work with Claude effectively
- **Develop** — Code style, patterns, and practices  
- **Test** — Debugging and testing guides
```

### guides/collaborate/index.md

```markdown
# Collaborate

How to work effectively with Claude and maintain shared context.
```

### guides/develop/index.md

```markdown
# Develop

Code style, patterns, and development practices.
```

### guides/test/index.md

```markdown
# Test

Debugging and testing guides.
```

---

## Test it

```bash
cd ~/GitHub/shared
yarn docs:dev
```

Open http://localhost:5177
