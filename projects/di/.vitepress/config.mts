import { defineConfig } from 'vitepress'
import taskLists from 'markdown-it-task-lists'

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
        text: 'Architecture',
        link: '/architecture/',
        collapsed: true,
        items: [
          { text: 'Project', link: '/architecture/project' },
          { text: 'Files', link: '/architecture/files' },
          { text: 'Managers', link: '/architecture/managers' },
          { text: 'Rendering Types', link: '/architecture/rendering.types' }
        ]
      },
      {
        text: 'Designs',
        link: '/designs/',
        collapsed: true,
        items: [
          { text: 'Main', link: '/designs/Main' },
          { text: 'Box', link: '/designs/Box' },
          { text: 'Controls', link: '/designs/Controls' },
          { text: 'Details', link: '/designs/Details' },
          { text: 'Fillets', link: '/designs/Fillets' },
          { text: 'Graph', link: '/designs/Graph' },
          { text: 'Gull Wings', link: '/designs/Gull_Wings' },
          { text: 'Preferences', link: '/designs/Preferences' },
          { text: 'Separator', link: '/designs/Separator' }
        ]
      },
      {
        text: 'Guides',
        link: '/guides/',
        collapsed: true,
        items: [
          { text: 'Road Map', link: '/guides/road.map' },
          {
            text: 'Develop',
            link: '/guides/develop/',
            collapsed: true,
            items: [
              { text: 'Best Practices', link: '/guides/develop/best.practices' },
              { text: 'Gotchas', link: '/guides/develop/gotchas' }
            ]
          }
        ]
      },
      {
        text: 'Work',
        link: '/work/',
        collapsed: true,
        items: [
          { text: 'Layout Algorithm', link: '/work/layout-algorithm' },
          { text: 'Pacing', link: '/work/pacing' },
          { text: 'Simplicity', link: '/work/simplicity' },
          {
            text: 'Milestones',
            link: '/work/milestones/',
            collapsed: true,
            items: [
              { text: '1. Solid Foundation', link: '/work/milestones/1.solid.foundation' },
              { text: '3. Docs', link: '/work/milestones/3.docs' },
              { text: '4. Hits Manager', link: '/work/milestones/4.hits.manager' }
            ]
          },
          {
            text: 'Done',
            link: '/work/done/',
            collapsed: true,
            items: [
              { text: 'Article First Draft', link: '/work/done/article.first.draft' },
              { text: 'Quaternions', link: '/work/done/quaternions' },
              { text: 'Svelte', link: '/work/done/svelte' }
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
