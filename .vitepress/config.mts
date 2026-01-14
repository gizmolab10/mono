import { defineConfig } from 'vitepress'
import ports from '../sites/ports.json'

export default defineConfig({
  srcDir: './notes',
  title: "Mono Docs",
  description: "Unified documentation for all projects",
  ignoreDeadLinks: [
    /^http:\/\/localhost/
  ],

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
          text: 'Di >',
          link: '/di/',
          collapsed: true,
          items: [
            {
              text: 'Architecture >',
              link: '/di/architecture/',
              collapsed: true,
              items: [
                {
                  text: 'Files',
                  link: '/di/architecture/files'
                },
                {
                  text: 'Managers',
                  link: '/di/architecture/managers'
                },
                {
                  text: 'Project',
                  link: '/di/architecture/project'
                },
                {
                  text: 'Rendering.types',
                  link: '/di/architecture/rendering.types'
                }
              ]
            },
            {
              text: 'Designs >',
              link: '/di/designs/',
              collapsed: true,
              items: [
                {
                  text: 'Box',
                  link: '/di/designs/Box'
                },
                {
                  text: 'Controls',
                  link: '/di/designs/Controls'
                },
                {
                  text: 'Details',
                  link: '/di/designs/Details'
                },
                {
                  text: 'Fillets',
                  link: '/di/designs/Fillets'
                },
                {
                  text: 'Graph',
                  link: '/di/designs/Graph'
                },
                {
                  text: 'Gull Wings',
                  link: '/di/designs/Gull_Wings'
                },
                {
                  text: 'Main',
                  link: '/di/designs/Main'
                },
                {
                  text: 'Preferences',
                  link: '/di/designs/Preferences'
                },
                {
                  text: 'Separator',
                  link: '/di/designs/Separator'
                }
              ]
            },
            {
              text: 'Guides >',
              link: '/di/guides/',
              collapsed: true,
              items: [
                {
                  text: 'Road.map',
                  link: '/di/guides/road.map'
                },
                {
                  text: 'Develop >',
                  link: '/di/guides/develop/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Best.practices',
                      link: '/di/guides/develop/best.practices'
                    },
                    {
                      text: 'Gotchas',
                      link: '/di/guides/develop/gotchas'
                    }
                  ]
                }
              ]
            },
            {
              text: 'Tools',
              link: '/di/tools/'
              collapsed: true,
            },
            {
              text: 'Work >',
              link: '/di/work/',
              collapsed: true,
              items: [
                {
                  text: 'Layout Algorithm',
                  link: '/di/work/layout-algorithm'
                },
                {
                  text: 'Done >',
                  link: '/di/work/done/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Article.first.draft',
                      link: '/di/work/done/article.first.draft'
                    },
                    {
                      text: 'Quaternions',
                      link: '/di/work/done/quaternions'
                    },
                    {
                      text: 'Svelte',
                      link: '/di/work/done/svelte'
                    }
                  ]
                },
                {
                  text: 'Milestones >',
                  link: '/di/work/milestones/',
                  collapsed: true,
                  items: [
                    {
                      text: '1.solid.foundation',
                      link: '/di/work/milestones/1.solid.foundation'
                    },
                    {
                      text: '3.docs',
                      link: '/di/work/milestones/3.docs'
                    },
                    {
                      text: '4.hits.manager',
                      link: '/di/work/milestones/4.hits.manager'
                    },
                    {
                      text: '2.panel >',
                      link: '/di/work/milestones/2.panel/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Architecture',
                          link: '/di/work/milestones/2.panel/architecture'
                        },
                        {
                          text: 'Components',
                          link: '/di/work/milestones/2.panel/components'
                        },
                        {
                          text: 'Implement',
                          link: '/di/work/milestones/2.panel/implement'
                        },
                        {
                          text: 'Milestone 2',
                          link: '/di/work/milestones/2.panel/milestone 2'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
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
                {
                  text: 'Access',
                  link: '/guides/collaborate/access'
                },
                {
                  text: 'Chat',
                  link: '/guides/collaborate/chat'
                },
                {
                  text: 'Evolve',
                  link: '/guides/collaborate/evolve'
                },
                {
                  text: 'Markdown',
                  link: '/guides/collaborate/markdown'
                },
                {
                  text: 'Repo',
                  link: '/guides/collaborate/repo'
                },
                {
                  text: 'Vitepress Setup',
                  link: '/guides/collaborate/vitepress-setup'
                },
                {
                  text: 'Voice',
                  link: '/guides/collaborate/voice'
                },
                {
                  text: 'Work Site',
                  link: '/guides/collaborate/work-site'
                },
                {
                  text: 'Workflow',
                  link: '/guides/collaborate/workflow'
                }
              ]
            },
            {
              text: 'Develop >',
              link: '/guides/develop/',
              collapsed: true,
              items: [
                {
                  text: 'Aesthetics',
                  link: '/guides/develop/aesthetics'
                },
                {
                  text: 'Css',
                  link: '/guides/develop/css'
                },
                {
                  text: 'Migration',
                  link: '/guides/develop/migration'
                },
                {
                  text: 'Refactoring',
                  link: '/guides/develop/refactoring'
                },
                {
                  text: 'Style',
                  link: '/guides/develop/style'
                }
              ]
            },
            {
              text: 'Setup >',
              link: '/guides/setup/',
              collapsed: true,
              items: [
                {
                  text: 'Deploy',
                  link: '/guides/setup/deploy'
                },
                {
                  text: 'Jonathan',
                  link: '/guides/setup/jonathan'
                },
                {
                  text: 'Monorepo',
                  link: '/guides/setup/monorepo'
                },
                {
                  text: 'Onboarding',
                  link: '/guides/setup/onboarding'
                },
                {
                  text: 'Single.project',
                  link: '/guides/setup/single.project'
                }
              ]
            },
            {
              text: 'Test >',
              link: '/guides/test/',
              collapsed: true,
              items: [
                {
                  text: 'Debugging',
                  link: '/guides/test/debugging'
                },
                {
                  text: 'Testing',
                  link: '/guides/test/testing'
                }
              ]
            }
          ]
        },
        {
          text: 'Work >',
          link: '/work/',
          collapsed: true,
          items: [
            {
              text: 'Crazy Idea',
              link: '/work/crazy-idea'
            },
            {
              text: 'Pacing',
              link: '/work/pacing'
            },
            {
              text: 'Projects',
              link: '/work/projects'
            },
            {
              text: 'Simplicity',
              link: '/work/simplicity'
            },
            {
              text: 'Working Minimum',
              link: '/work/working-minimum'
            },
            {
              text: 'Articles >',
              link: '/work/articles/',
              collapsed: true,
              items: [
                {
                  text: 'Accidental.programmer',
                  link: '/work/articles/accidental.programmer'
                },
                {
                  text: 'How.to.build.it',
                  link: '/work/articles/how.to.build.it'
                },
                {
                  text: 'Write.article',
                  link: '/work/articles/write.article'
                }
              ]
            },
            {
              text: 'Done >',
              collapsed: true,
              items: [
                {
                  text: 'Docs >',
                  collapsed: true,
                  items: [
                    {
                      text: 'Combined Docs',
                      link: '/work/done/docs/combined-docs'
                    },
                    {
                      text: 'Docs',
                      link: '/work/done/docs/docs'
                    },
                    {
                      text: 'README',
                      link: '/work/done/docs/README'
                    },
                    {
                      text: 'History >',
                      collapsed: true,
                      items: [
                        {
                          text: 'CLAUDE MD UPDATED',
                          link: '/work/done/docs/history/CLAUDE-MD-UPDATED'
                        },
                        {
                          text: 'FINAL ORGANIZATION',
                          link: '/work/done/docs/history/FINAL-ORGANIZATION'
                        },
                        {
                          text: 'FIXTURES RELOCATED',
                          link: '/work/done/docs/history/FIXTURES-RELOCATED'
                        },
                        {
                          text: 'PHASE1 COMPLETE',
                          link: '/work/done/docs/history/PHASE1-COMPLETE'
                        },
                        {
                          text: 'PHASE1 FINAL',
                          link: '/work/done/docs/history/PHASE1-FINAL'
                        },
                        {
                          text: 'PHASE1 RESULTS',
                          link: '/work/done/docs/history/PHASE1-RESULTS'
                        },
                        {
                          text: 'PHASE2 COMPLETE',
                          link: '/work/done/docs/history/PHASE2-COMPLETE'
                        },
                        {
                          text: 'PHASE2 FINAL',
                          link: '/work/done/docs/history/PHASE2-FINAL'
                        },
                        {
                          text: 'PHASE2 MINIMIZED',
                          link: '/work/done/docs/history/PHASE2-MINIMIZED'
                        },
                        {
                          text: 'REORGANIZATION',
                          link: '/work/done/docs/history/REORGANIZATION'
                        }
                      ]
                    },
                    {
                      text: 'Test >',
                      collapsed: true,
                      items: [
                        {
                          text: 'HOW TO TEST',
                          link: '/work/done/docs/test/HOW-TO-TEST'
                        },
                        {
                          text: 'README',
                          link: '/work/done/docs/test/README'
                        },
                        {
                          text: 'Fixtures >',
                          link: '/work/done/docs/test/fixtures/',
                          collapsed: true,
                          items: [
                            {
                              text: 'Advanced >',
                              collapsed: true,
                              items: [
                                {
                                  text: 'Test Moved',
                                  link: '/work/done/docs/test/fixtures/advanced/test-moved'
                                }
                              ]
                            }
                          ]
                        },
                        {
                          text: 'Merge Fixtures >',
                          collapsed: true,
                          items: [
                            {
                              text: 'File A',
                              link: '/work/done/docs/test/merge-fixtures/file-a'
                            },
                            {
                              text: 'File B',
                              link: '/work/done/docs/test/merge-fixtures/file-b'
                            },
                            {
                              text: 'Test Links',
                              link: '/work/done/docs/test/merge-fixtures/test-links'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'Ws >',
          link: '/ws/',
          collapsed: true,
          items: [
            {
              text: 'Project',
              link: '/ws/project'
            },
            {
              text: 'Architecture >',
              link: '/ws/architecture/',
              collapsed: true,
              items: [
                {
                  text: 'Overview',
                  link: '/ws/architecture/overview'
                },
                {
                  text: 'Core >',
                  link: '/ws/architecture/core/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Components',
                      link: '/ws/architecture/core/components'
                    },
                    {
                      text: 'Databases',
                      link: '/ws/architecture/core/databases'
                    },
                    {
                      text: 'Geometry',
                      link: '/ws/architecture/core/geometry'
                    },
                    {
                      text: 'Hits',
                      link: '/ws/architecture/core/hits'
                    },
                    {
                      text: 'Managers',
                      link: '/ws/architecture/core/managers'
                    },
                    {
                      text: 'State',
                      link: '/ws/architecture/core/state'
                    },
                    {
                      text: 'UX',
                      link: '/ws/architecture/core/ux'
                    }
                  ]
                },
                {
                  text: 'Internals >',
                  link: '/ws/architecture/internals/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Layout',
                      link: '/ws/architecture/internals/layout'
                    },
                    {
                      text: 'Persistable',
                      link: '/ws/architecture/internals/persistable'
                    },
                    {
                      text: 'Preferences',
                      link: '/ws/architecture/internals/preferences'
                    },
                    {
                      text: 'Reactivity',
                      link: '/ws/architecture/internals/reactivity'
                    },
                    {
                      text: 'Styles',
                      link: '/ws/architecture/internals/styles'
                    },
                    {
                      text: 'Timers',
                      link: '/ws/architecture/internals/timers'
                    }
                  ]
                },
                {
                  text: 'Platforms >',
                  link: '/ws/architecture/platforms/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Bubble',
                      link: '/ws/architecture/platforms/bubble'
                    },
                    {
                      text: 'Svelte 5',
                      link: '/ws/architecture/platforms/svelte.5'
                    },
                    {
                      text: 'Svelte',
                      link: '/ws/architecture/platforms/svelte'
                    },
                    {
                      text: 'VitePress',
                      link: '/ws/architecture/platforms/vitepress'
                    }
                  ]
                },
                {
                  text: 'UX >',
                  link: '/ws/architecture/ux/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Breadcrumbs',
                      link: '/ws/architecture/ux/breadcrumbs'
                    },
                    {
                      text: 'Buttons',
                      link: '/ws/architecture/ux/buttons'
                    },
                    {
                      text: 'Controls',
                      link: '/ws/architecture/ux/controls'
                    },
                    {
                      text: 'Details',
                      link: '/ws/architecture/ux/details'
                    },
                    {
                      text: 'Paging',
                      link: '/ws/architecture/ux/paging'
                    },
                    {
                      text: 'Preferences',
                      link: '/ws/architecture/ux/preferences'
                    },
                    {
                      text: 'Search',
                      link: '/ws/architecture/ux/search'
                    },
                    {
                      text: 'Titles',
                      link: '/ws/architecture/ux/titles'
                    }
                  ]
                }
              ]
            },
            {
              text: 'Archives >',
              collapsed: true,
              items: [
                {
                  text: 'Bubble >',
                  collapsed: true,
                  items: [
                    {
                      text: '2 >',
                      collapsed: true,
                      items: [
                        {
                          text: 'Bubble Tears',
                          link: '/ws/archives/bubble/2/bubble tears'
                        }
                      ]
                    }
                  ]
                },
                {
                  text: 'Experiments >',
                  collapsed: true,
                  items: [
                    {
                      text: 'Simulate Bubble >',
                      collapsed: true,
                      items: [
                        {
                          text: 'README Test',
                          link: '/ws/archives/experiments/simulate bubble/README-test'
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              text: 'Guides >',
              link: '/ws/guides/',
              collapsed: true,
              items: [
                {
                  text: 'Composition',
                  link: '/ws/guides/composition'
                },
                {
                  text: 'Gotchas',
                  link: '/ws/guides/gotchas'
                },
                {
                  text: 'Plugin',
                  link: '/ws/guides/plugin'
                }
              ]
            },
            {
              text: 'Tools',
              link: '/ws/tools/'
              collapsed: true,
            },
            {
              text: 'Work >',
              link: '/ws/work/',
              collapsed: true,
              items: [
                {
                  text: 'Book',
                  link: '/ws/work/book'
                },
                {
                  text: 'Docs',
                  link: '/ws/work/docs'
                },
                {
                  text: 'Plugin Bugs',
                  link: '/ws/work/plugin-bugs'
                },
                {
                  text: 'Search Links',
                  link: '/ws/work/search-links'
                },
                {
                  text: 'Done >',
                  link: '/ws/work/done/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Bad.tree.center',
                      link: '/ws/work/done/bad.tree.center'
                    },
                    {
                      text: 'Claude.write',
                      link: '/ws/work/done/claude.write'
                    },
                    {
                      text: 'Ethernet',
                      link: '/ws/work/done/ethernet'
                    },
                    {
                      text: 'Filesystem',
                      link: '/ws/work/done/filesystem'
                    },
                    {
                      text: 'Focus',
                      link: '/ws/work/done/focus'
                    },
                    {
                      text: 'Relocate.controls',
                      link: '/ws/work/done/relocate.controls'
                    },
                    {
                      text: 'Migration >',
                      link: '/ws/work/done/migration/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Focus',
                          link: '/ws/work/done/migration/focus'
                        },
                        {
                          text: 'Grow Shrink',
                          link: '/ws/work/done/migration/grow-shrink'
                        }
                      ]
                    },
                    {
                      text: 'Refactoring >',
                      link: '/ws/work/done/refactoring/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Banners',
                          link: '/ws/work/done/refactoring/banners'
                        },
                        {
                          text: 'Breadcrumbs Re Compositioon',
                          link: '/ws/work/done/refactoring/breadcrumbs re-compositioon'
                        },
                        {
                          text: 'Breadcrumbs',
                          link: '/ws/work/done/refactoring/breadcrumbs'
                        },
                        {
                          text: 'Layout',
                          link: '/ws/work/done/refactoring/layout'
                        }
                      ]
                    },
                    {
                      text: 'VitePress >',
                      link: '/ws/work/done/vitepress/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Redox',
                          link: '/ws/work/done/vitepress/redox'
                        },
                        {
                          text: 'Webseriously Driven Docs',
                          link: '/ws/work/done/vitepress/webseriously-driven-docs'
                        }
                      ]
                    }
                  ]
                },
                {
                  text: 'Next >',
                  link: '/ws/work/next/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Ai Ux Spider Guide',
                      link: '/ws/work/next/ai-ux-spider-guide'
                    },
                    {
                      text: 'Holons.api',
                      link: '/ws/work/next/holons.api'
                    },
                    {
                      text: 'Resize Optimization AI',
                      link: '/ws/work/next/Resize_Optimization_AI'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],

      '/di/': [
        {
          text: 'Design Intuition',
          link: '/di/',
          items: [
            {
              text: 'Architecture >',
              link: '/di/architecture/',
              collapsed: true,
              items: []
            },
            {
              text: 'Designs >',
              link: '/di/designs/',
              collapsed: true,
              items: []
            },
            {
              text: 'Guides >',
              link: '/di/guides/',
              collapsed: true,
              items: []
            },
            {
              text: 'Work >',
              link: '/di/work/',
              collapsed: true,
              items: []
            }
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
            { text: 'Vitepress Setup', link: '/guides/collaborate/vitepress-setup' },
            { text: 'Voice', link: '/guides/collaborate/voice' },
            { text: 'Work Site', link: '/guides/collaborate/work-site' },
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
            { text: 'Onboarding', link: '/guides/setup/onboarding' },
            { text: 'Single Project', link: '/guides/setup/single.project' }
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
