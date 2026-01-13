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

const COLLAPSED_KEY = 'webseriously-collapsed-sections'
const EXPANDED_KEY = 'webseriously-expanded-sections'

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
  // Apply stored state after DOM is ready
  setTimeout(applyStoredState, 100)
  
  // Re-apply after route changes (sidebar may re-render)
  router.onAfterRouteChanged = () => {
    setTimeout(applyStoredState, 100)
  }

  // Handle clicks on sidebar headings - use capture phase
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    
    // Find sidebar item
    const item = target.closest('.VPSidebarItem.collapsible') as HTMLElement
    if (!item) return
    
    // Check if click was on the heading link area
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
      // Collapse
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
      // Expand
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
