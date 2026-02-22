import { defineConfig } from 'vitepress'
import taskLists from 'markdown-it-task-lists'
import taskListPlusPlugin from '../../.vitepress/markdown-it-task-list-plus.mts'

export default defineConfig({
    srcDir: './notes',
    title: "Webseriously Inside Peak",
    srcExclude: ['archives/**'],
    description: "Project documentation and design notes",

    markdown: {
      config: (md) => {
        md.use(taskLists)
        md.use(taskListPlusPlugin)
      }
    },

    vite: {
      server: {
        port: parseInt(process.env.VITE_PORT || '5176')
      }
    },

    head: [
      ['link', { rel: 'icon', type: 'image/png', href: '/seriously-icon.png' }]
    ],

    themeConfig: {

      sidebar: [
        {
        text: 'Project',
        link: '/project'
        }, // @keep
        {
          text: 'Architecture >',
          link: '/guides/architecture/',
          collapsed: true,
          items: [
            {
              text: 'Overview',
              link: '/guides/architecture/overview'
            },
            {
              text: 'Core >',
              link: '/guides/architecture/core/',
              collapsed: true,
              items: [
                {
                  text: 'Components',
                  link: '/guides/architecture/core/components'
                },
                {
                  text: 'Databases',
                  link: '/guides/architecture/core/databases'
                },
                {
                  text: 'Geometry',
                  link: '/guides/architecture/core/geometry'
                },
                {
                  text: 'Hits',
                  link: '/guides/architecture/core/hits'
                },
                {
                  text: 'Managers',
                  link: '/guides/architecture/core/managers'
                },
                {
                  text: 'State',
                  link: '/guides/architecture/core/state'
                },
                {
                  text: 'UX',
                  link: '/guides/architecture/core/ux'
                }
              ]
            },
            {
              text: 'Internals >',
              link: '/guides/architecture/internals/',
              collapsed: true,
              items: [
                {
                  text: 'Debounce',
                  link: '/guides/architecture/internals/debounce'
                },
                {
                  text: 'Layout',
                  link: '/guides/architecture/internals/layout'
                },
                {
                  text: 'Persistable',
                  link: '/guides/architecture/internals/persistable'
                },
                {
                  text: 'Preferences',
                  link: '/guides/architecture/internals/preferences'
                },
                {
                  text: 'Reactivity',
                  link: '/guides/architecture/internals/reactivity'
                },
                {
                  text: 'Recents',
                  link: '/guides/architecture/internals/recents'
                },
                {
                  text: 'Styles',
                  link: '/guides/architecture/internals/styles'
                },
                {
                  text: 'Timers',
                  link: '/guides/architecture/internals/timers'
                }
              ]
            },
            {
              text: 'Platforms >',
              link: '/guides/architecture/platforms/',
              collapsed: true,
              items: [
                {
                  text: 'Bubble',
                  link: '/guides/architecture/platforms/bubble'
                },
                {
                  text: 'Plugin',
                  link: '/guides/architecture/platforms/plugin'
                },
                {
                  text: 'Svelte 5',
                  link: '/guides/architecture/platforms/svelte.5'
                },
                {
                  text: 'Svelte',
                  link: '/guides/architecture/platforms/svelte'
                },
                {
                  text: 'VitePress',
                  link: '/guides/architecture/platforms/vitepress'
                }
              ]
            },
            {
              text: 'UX >',
              link: '/guides/architecture/ux/',
              collapsed: true,
              items: [
                {
                  text: 'Breadcrumbs',
                  link: '/guides/architecture/ux/breadcrumbs'
                },
                {
                  text: 'Buttons',
                  link: '/guides/architecture/ux/buttons'
                },
                {
                  text: 'Controls',
                  link: '/guides/architecture/ux/controls'
                },
                {
                  text: 'Details',
                  link: '/guides/architecture/ux/details'
                },
                {
                  text: 'Paging',
                  link: '/guides/architecture/ux/paging'
                },
                {
                  text: 'Preferences',
                  link: '/guides/architecture/ux/preferences'
                },
                {
                  text: 'Search',
                  link: '/guides/architecture/ux/search'
                },
                {
                  text: 'Titles',
                  link: '/guides/architecture/ux/titles'
                }
              ]
            }
          ]
        },
        {
          text: 'Collaborate >',
          link: '/guides/collaborate/',
          collapsed: true,
          items: [
            {
              text: 'Composition',
              link: '/guides/collaborate/composition'
            },
            {
              text: 'Gotchas',
              link: '/guides/collaborate/gotchas'
            }
          ]
        },
        {
          text: 'Work >',
          link: '/work/',
          collapsed: true,
          items: [
            {
              text: 'Book',
              link: '/work/book'
            },
            {
              text: 'Deliverables',
              link: '/work/deliverables'
            },
            {
              text: 'New Chat',
              link: '/work/new-chat'
            },
            {
              text: 'Search Links',
              link: '/work/search-links'
            },
            {
              text: 'Search',
              link: '/work/search'
            },
            {
              text: 'Startup',
              link: '/work/startup'
            },
            {
              text: 'Done >',
              link: '/work/done/',
              collapsed: true,
              items: [
                {
                  text: 'Bad.tree.center',
                  link: '/work/done/bad.tree.center'
                },
                {
                  text: 'Claude.write',
                  link: '/work/done/claude.write'
                },
                {
                  text: 'Docs',
                  link: '/work/done/docs'
                },
                {
                  text: 'Ethernet',
                  link: '/work/done/ethernet'
                },
                {
                  text: 'Filesystem',
                  link: '/work/done/filesystem'
                },
                {
                  text: 'Focus',
                  link: '/work/done/focus'
                },
                {
                  text: 'Public Deliverables',
                  link: '/work/done/public-deliverables'
                },
                {
                  text: 'Recents',
                  link: '/work/done/recents'
                },
                {
                  text: 'Relocate.controls',
                  link: '/work/done/relocate.controls'
                },
                {
                  text: 'Truth',
                  link: '/work/done/truth'
                },
                {
                  text: 'Migration >',
                  link: '/work/done/migration/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Focus',
                      link: '/work/done/migration/focus'
                    },
                    {
                      text: 'Grow Shrink',
                      link: '/work/done/migration/grow-shrink'
                    }
                  ]
                },
                {
                  text: 'Refactoring >',
                  link: '/work/done/refactoring/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Banners',
                      link: '/work/done/refactoring/banners'
                    },
                    {
                      text: 'Breadcrumbs Re Compositioon',
                      link: '/work/done/refactoring/breadcrumbs re-compositioon'
                    },
                    {
                      text: 'Breadcrumbs',
                      link: '/work/done/refactoring/breadcrumbs'
                    },
                    {
                      text: 'Layout',
                      link: '/work/done/refactoring/layout'
                    }
                  ]
                },
                {
                  text: 'VitePress >',
                  link: '/work/done/vitepress/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Redox',
                      link: '/work/done/vitepress/redox'
                    },
                    {
                      text: 'Webseriously Driven Docs',
                      link: '/work/done/vitepress/webseriously-driven-docs'
                    }
                  ]
                }
              ]
            },
            {
              text: 'Next >',
              link: '/work/next/',
              collapsed: true,
              items: [
                {
                  text: 'Ai Ux Spider Guide',
                  link: '/work/next/ai-ux-spider-guide'
                },
                {
                  text: 'Holons.api',
                  link: '/work/next/holons.api'
                },
                {
                  text: 'Resize Optimization AI',
                  link: '/work/next/Resize_Optimization_AI'
                }
              ]
            }
          ]
        }
      ],

      search: {
        provider: 'local'
      }
    }
  })
