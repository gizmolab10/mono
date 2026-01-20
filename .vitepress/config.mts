import ports from '../sites/ports.json'
import { defineConfig } from 'vitepress'
import taskLists from 'markdown-it-task-lists'
import taskListPlusPlugin from '../sites/markdown-it-task-list-plus.mts'

export default defineConfig({
  srcDir: '.',
  title: "Mono Docs",
  description: "Unified documentation for all projects",
  ignoreDeadLinks: true,

  srcExclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/src/**',
    '**/test/**',
    '**/tests/**',
    '**/.vitepress/**',
    '**/sites/**',
    '**/tools/**',
    '**/logs/**',
    '**/README.md',
    '**/CLAUDE.md'
  ],

  markdown: {
    config: (md) => {
      md.use(taskLists)
      md.use(taskListPlusPlugin)
    }
  },

  rewrites: {
    'notes/:path*': ':path*',
    'projects/ws/notes/:path*': 'ws/:path*',
    'projects/di/notes/:path*': 'di/:path*'
  },

  vite: {
    server: {
      port: ports['mono-docs']
    }
  },

  themeConfig: {
    nav: [
      { text: 'WS', link: '/ws/' },
      { text: 'DI', link: '/di/' },
      { text: 'Guides', link: '/guides/' }
    ],

    sidebar: {
      '/ws/': [
        {
          text: 'Guides >',
          link: '/guides/',
          collapsed: true,
          items: [
            {
              text: 'Collaborate >',
              link: '/guides/collaborate/',
              collapsed: true,
              items: [
                { text: 'Access', link: '/guides/collaborate/access' },
                { text: 'Chat', link: '/guides/collaborate/chat' },
                { text: 'Evolve', link: '/guides/collaborate/evolve' },
                { text: 'Journals', link: '/guides/collaborate/journals' },
                { text: 'Markdown', link: '/guides/collaborate/markdown' },
                { text: 'Repo', link: '/guides/collaborate/repo' },
                { text: 'Shorthand', link: '/guides/collaborate/shorthand' },
                { text: 'Voice', link: '/guides/collaborate/voice' },
                { text: 'Workflow', link: '/guides/collaborate/workflow' }
              ]
            },
            {
              text: 'Develop >',
              link: '/guides/develop/',
              collapsed: true,
              items: [
                { text: 'Aesthetics', link: '/guides/develop/aesthetics' },
                { text: 'Class Lists', link: '/guides/develop/class-lists' },
                { text: 'Css', link: '/guides/develop/css' },
                { text: 'Hub App', link: '/guides/develop/hub-app' },
                { text: 'Migration', link: '/guides/develop/migration' },
                { text: 'Refactoring', link: '/guides/develop/refactoring' },
                { text: 'Single Line', link: '/guides/develop/single-line' },
                { text: 'Style', link: '/guides/develop/style' }
              ]
            },
            {
              text: 'Setup >',
              link: '/guides/setup/',
              collapsed: true,
              items: [
                { text: 'Deploy', link: '/guides/setup/deploy' },
                { text: 'Jonathan', link: '/guides/setup/jonathan' },
                { text: 'Monorepo', link: '/guides/setup/monorepo' },
                { text: 'Onboarding', link: '/guides/setup/onboarding' },
                { text: 'VitePress', link: '/guides/setup/vitepress' }
              ]
            },
            {
              text: 'Test >',
              link: '/guides/test/',
              collapsed: true,
              items: [
                { text: 'Debugging', link: '/guides/test/debugging' },
                { text: 'Testing', link: '/guides/test/testing' }
              ]
            }
          ]
        },
        {
          text: 'Work >',
          link: '/ws/work/',
          collapsed: true,
          items: [
            { text: 'Book', link: '/ws/work/book' },
            { text: 'Deliverables', link: '/ws/work/deliverables' },
            { text: 'Docs', link: '/ws/work/docs' },
            { text: 'Plugin Bugs', link: '/ws/work/plugin-bugs' },
            { text: 'Search Links', link: '/ws/work/search-links' },
            {
              text: 'Done >',
              link: '/ws/work/done/',
              collapsed: true,
              items: []
            },
            {
              text: 'Next >',
              link: '/ws/work/next/',
              collapsed: true,
              items: []
            }
          ]
        }
      ],

      '/di/': [
        {
          text: 'Design Intuition',
          link: '/di/',
          items: [
            { text: 'Architecture >', link: '/di/architecture/', collapsed: true, items: [] },
            { text: 'Designs >', link: '/di/designs/', collapsed: true, items: [] },
            { text: 'Guides >', link: '/di/guides/', collapsed: true, items: [] },
            { text: 'Work >', link: '/di/work/', collapsed: true, items: [] }
          ]
        }
      ],

      '/guides/': [
        {
          text: 'Collaborate >',
          link: '/guides/collaborate/',
          collapsed: true,
          items: [
            { text: 'Access', link: '/guides/collaborate/access' },
            { text: 'Chat', link: '/guides/collaborate/chat' },
            { text: 'Evolve', link: '/guides/collaborate/evolve' },
            { text: 'Markdown', link: '/guides/collaborate/markdown' },
            { text: 'Repo', link: '/guides/collaborate/repo' },
            { text: 'Voice', link: '/guides/collaborate/voice' },
            { text: 'Workflow', link: '/guides/collaborate/workflow' }
          ]
        },
        {
          text: 'Develop >',
          link: '/guides/develop/',
          collapsed: true,
          items: [
            { text: 'Aesthetics', link: '/guides/develop/aesthetics' },
            { text: 'CSS', link: '/guides/develop/css' },
            { text: 'Migration', link: '/guides/develop/migration' },
            { text: 'Refactoring', link: '/guides/develop/refactoring' },
            { text: 'Style', link: '/guides/develop/style' }
          ]
        },
        {
          text: 'Setup >',
          link: '/guides/setup/',
          collapsed: true,
          items: [
            { text: 'Deploy', link: '/guides/setup/deploy' },
            { text: 'Jonathan', link: '/guides/setup/jonathan' },
            { text: 'Monorepo', link: '/guides/setup/monorepo' },
            { text: 'Onboarding', link: '/guides/setup/onboarding' }
          ]
        },
        {
          text: 'Test >',
          link: '/guides/test/',
          collapsed: true,
          items: [
            { text: 'Debugging', link: '/guides/test/debugging' },
            { text: 'Testing', link: '/guides/test/testing' }
          ]
        }
      ]
    },

    search: {
      provider: 'local'
    }
  }
})
