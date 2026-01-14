import { defineConfig } from 'vitepress'
import ports from '../sites/ports.json'

export default defineConfig({
  srcDir: './notes/guides',
  title: "Shared Guides",
  description: "Cross-project documentation and best practices",
  ignoreDeadLinks: [
    /^http:\/\/localhost/
  ],

  vite: {
    server: {
      port: ports['core-docs']
    }
  },

  themeConfig: {
    sidebar: [
        {
          text: 'Collaborate >',
          link: '/collaborate/',
          collapsed: true,
          items: [
            {
              text: 'Access',
              link: '/collaborate/access'
            },
            {
              text: 'Chat',
              link: '/collaborate/chat'
            },
            {
              text: 'Evolve',
              link: '/collaborate/evolve'
            },
            {
              text: 'Markdown',
              link: '/collaborate/markdown'
            },
            {
              text: 'Repo',
              link: '/collaborate/repo'
            },
            {
              text: 'Vitepress Setup',
              link: '/collaborate/vitepress-setup'
            },
            {
              text: 'Voice',
              link: '/collaborate/voice'
            },
            {
              text: 'Work Site',
              link: '/collaborate/work-site'
            },
            {
              text: 'Workflow',
              link: '/collaborate/workflow'
            }
          ]
        },
        {
          text: 'Develop >',
          link: '/develop/',
          collapsed: true,
          items: [
            {
              text: 'Aesthetics',
              link: '/develop/aesthetics'
            },
            {
              text: 'Css',
              link: '/develop/css'
            },
            {
              text: 'Deliverables',
              link: '/develop/deliverables'
            },
            {
              text: 'Migration',
              link: '/develop/migration'
            },
            {
              text: 'Refactoring',
              link: '/develop/refactoring'
            },
            {
              text: 'Style',
              link: '/develop/style'
            }
          ]
        },
        {
          text: 'Setup >',
          link: '/setup/',
          collapsed: true,
          items: [
            {
              text: 'Deploy',
              link: '/setup/deploy'
            },
            {
              text: 'Jonathan',
              link: '/setup/jonathan'
            },
            {
              text: 'Monorepo',
              link: '/setup/monorepo'
            },
            {
              text: 'Onboarding',
              link: '/setup/onboarding'
            },
            {
              text: 'Single.project',
              link: '/setup/single.project'
            }
          ]
        },
        {
          text: 'Test >',
          link: '/test/',
          collapsed: true,
          items: [
            {
              text: 'Debugging',
              link: '/test/debugging'
            },
            {
              text: 'Testing',
              link: '/test/testing'
            }
          ]
        }
      ],

    search: {
      provider: 'local'
    }
  }
})
