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
