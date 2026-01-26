import { defineConfig } from 'vitepress'
import taskLists from 'markdown-it-task-lists'
import taskListPlusPlugin from '../../.vitepress/markdown-it-task-list-plus.mts'

export default defineConfig({
  srcDir: './notes',
  title: "Design Intuition",
  description: "Project documentation and design notes",
  ignoreDeadLinks: [
    /^http:\/\/localhost/
  ],

  markdown: {
    config: (md) => {
      md.use(taskLists)
      md.use(taskListPlusPlugin)
    }
  },

  vite: {
    server: {
      port: parseInt(process.env.VITE_PORT || '5177')
    }
  },

  themeConfig: {
    sidebar: [
        {
          text: 'Architecture >',
          link: '/architecture/',
          collapsed: true,
          items: [
            {
              text: 'Files',
              link: '/architecture/files'
            },
            {
              text: 'Managers',
              link: '/architecture/managers'
            },
            {
              text: 'Project',
              link: '/architecture/project'
            },
            {
              text: 'Rendering.types',
              link: '/architecture/rendering.types'
            }
          ]
        },
        {
          text: 'Designs >',
          link: '/designs/',
          collapsed: true,
          items: [
            {
              text: 'Box',
              link: '/designs/Box'
            },
            {
              text: 'Controls',
              link: '/designs/Controls'
            },
            {
              text: 'Details',
              link: '/designs/Details'
            },
            {
              text: 'Fillets',
              link: '/designs/Fillets'
            },
            {
              text: 'Graph',
              link: '/designs/Graph'
            },
            {
              text: 'Gull Wings',
              link: '/designs/Gull_Wings'
            },
            {
              text: 'Main',
              link: '/designs/Main'
            },
            {
              text: 'Preferences',
              link: '/designs/Preferences'
            },
            {
              text: 'Separator',
              link: '/designs/Separator'
            }
          ]
        },
        {
          text: 'Guides >',
          link: '/guides/',
          collapsed: true,
          items: [
            {
              text: 'Road.map',
              link: '/guides/road.map'
            },
            {
              text: 'Develop >',
              link: '/guides/develop/',
              collapsed: true,
              items: [
                {
                  text: 'Best.practices',
                  link: '/guides/develop/best.practices'
                },
                {
                  text: 'Gotchas',
                  link: '/guides/develop/gotchas'
                }
              ]
            }
          ]
        },
        {
          text: 'Tools',
          link: '/tools/',
          collapsed: true,
        },
        {
          text: 'Work >',
          link: '/work/',
          collapsed: true,
          items: [
            {
              text: 'Pacing',
              link: '/work/pacing'
            },
            {
              text: 'Simplicity',
              link: '/work/simplicity'
            },
            {
              text: 'Done >',
              link: '/work/done/',
              collapsed: true,
              items: [
                {
                  text: 'Article.first.draft',
                  link: '/work/done/article.first.draft'
                },
                {
                  text: 'Layout Algorithm',
                  link: '/work/done/layout-algorithm'
                },
                {
                  text: 'Quaternions',
                  link: '/work/done/quaternions'
                },
                {
                  text: 'Svelte',
                  link: '/work/done/svelte'
                }
              ]
            },
            {
              text: 'Milestones >',
              link: '/work/milestones/',
              collapsed: true,
              items: [
                {
                  text: '1.solid.foundation',
                  link: '/work/milestones/1.solid.foundation'
                },
                {
                  text: '3.docs',
                  link: '/work/milestones/3.docs'
                },
                {
                  text: '4.hits.manager',
                  link: '/work/milestones/4.hits.manager'
                },
                {
                  text: '2.panel >',
                  link: '/work/milestones/2.panel/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Architecture',
                      link: '/work/milestones/2.panel/architecture'
                    },
                    {
                      text: 'Components',
                      link: '/work/milestones/2.panel/components'
                    },
                    {
                      text: 'Implement',
                      link: '/work/milestones/2.panel/implement'
                    },
                    {
                      text: 'Milestone 2',
                      link: '/work/milestones/2.panel/milestone 2'
                    }
                  ]
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
