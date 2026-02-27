import taskListPlusPlugin from './markdown-it-task-list-plus.mts'
import crossProjectPlugin from './markdown-it-cross-project.mts'
import ports from '../notes/tools/hub/ports.json'
import taskLists from 'markdown-it-task-lists'
import { defineConfig } from 'vitepress'

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
      md.use(taskLists),
      md.use(taskListPlusPlugin),
      md.use(crossProjectPlugin)
    }
  },

  rewrites: {
    'notes/:path*': ':path*',
    'projects/ws/notes/:path*': 'ws/:path*',
    'projects/di/notes/:path*': 'di/:path*'
  },

  vite: {
    server: {
      port: ports.mono.docs
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
          collapsed: true,
          items: [
            {
              text: 'Notes >',
              link: '/di/notes/',
              collapsed: true,
              items: [
                {
                  text: 'Map',
                  link: '/di/notes/map'
                },
                {
                  text: 'Architecture >',
                  link: '/di/notes/architecture/',
                  collapsed: true,
                  items: [
                    {
                      text: 'File Layout',
                      link: '/di/notes/architecture/file layout'
                    },
                    {
                      text: 'Project',
                      link: '/di/notes/architecture/project'
                    },
                    {
                      text: 'Core >',
                      link: '/di/notes/architecture/core/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Algebra',
                          link: '/di/notes/architecture/core/algebra'
                        },
                        {
                          text: 'Enlarged.algebra',
                          link: '/di/notes/architecture/core/enlarged.algebra'
                        },
                        {
                          text: 'Managers',
                          link: '/di/notes/architecture/core/managers'
                        },
                        {
                          text: 'Migration',
                          link: '/di/notes/architecture/core/migration'
                        },
                        {
                          text: 'Versions',
                          link: '/di/notes/architecture/core/versions'
                        }
                      ]
                    },
                    {
                      text: 'Graph >',
                      link: '/di/notes/architecture/graph/',
                      collapsed: true,
                      items: [
                        {
                          text: '3D.primer',
                          link: '/di/notes/architecture/graph/3D.primer'
                        },
                        {
                          text: 'Drag',
                          link: '/di/notes/architecture/graph/drag'
                        },
                        {
                          text: 'Intersecting.faces',
                          link: '/di/notes/architecture/graph/intersecting.faces'
                        },
                        {
                          text: 'Quaternions',
                          link: '/di/notes/architecture/graph/quaternions'
                        },
                        {
                          text: 'Rendering.types',
                          link: '/di/notes/architecture/graph/rendering.types'
                        },
                        {
                          text: 'Spatial',
                          link: '/di/notes/architecture/graph/spatial'
                        },
                        {
                          text: 'Three.dimensions',
                          link: '/di/notes/architecture/graph/three.dimensions'
                        },
                        {
                          text: 'Two.dimensions',
                          link: '/di/notes/architecture/graph/two.dimensions'
                        }
                      ]
                    },
                    {
                      text: 'UI >',
                      link: '/di/notes/architecture/ui/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Details',
                          link: '/di/notes/architecture/ui/details'
                        },
                        {
                          text: 'Panel.layout',
                          link: '/di/notes/architecture/ui/panel.layout'
                        }
                      ]
                    }
                  ]
                },
                {
                  text: 'Components >',
                  link: '/di/notes/components/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Controls',
                      link: '/di/notes/components/Controls'
                    },
                    {
                      text: 'Details',
                      link: '/di/notes/components/Details'
                    },
                    {
                      text: 'Graph',
                      link: '/di/notes/components/Graph'
                    },
                    {
                      text: 'Hits 3D',
                      link: '/di/notes/components/Hits_3D'
                    },
                    {
                      text: 'Main',
                      link: '/di/notes/components/Main'
                    },
                    {
                      text: 'Preferences',
                      link: '/di/notes/components/Preferences'
                    },
                    {
                      text: 'Smart Objects',
                      link: '/di/notes/components/Smart_Objects'
                    }
                  ]
                },
                {
                  text: 'Guides >',
                  link: '/di/notes/guides/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Best.practices',
                      link: '/di/notes/guides/best.practices'
                    },
                    {
                      text: 'Gotchas',
                      link: '/di/notes/guides/gotchas'
                    },
                    {
                      text: 'Road.map',
                      link: '/di/notes/guides/road.map'
                    },
                    {
                      text: 'Style',
                      link: '/di/notes/guides/style'
                    },
                    {
                      text: 'Testing',
                      link: '/di/notes/guides/testing'
                    }
                  ]
                },
                {
                  text: 'User Manual >',
                  link: '/di/notes/user manual/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Repeaters',
                      link: '/di/notes/user manual/repeaters'
                    }
                  ]
                },
                {
                  text: 'Work >',
                  link: '/di/notes/work/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Code.debt',
                      link: '/di/notes/work/code.debt'
                    },
                    {
                      text: 'Collaboration Priorities',
                      link: '/di/notes/work/collaboration priorities'
                    },
                    {
                      text: 'More Milestones',
                      link: '/di/notes/work/more milestones'
                    },
                    {
                      text: 'Revisit.di',
                      link: '/di/notes/work/revisit.di'
                    },
                    {
                      text: 'Done >',
                      link: '/di/notes/work/done/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Article.first.draft',
                          link: '/di/notes/work/done/article.first.draft'
                        },
                        {
                          text: 'Code.debt.done',
                          link: '/di/notes/work/done/code.debt.done'
                        },
                        {
                          text: 'Cruft',
                          link: '/di/notes/work/done/cruft'
                        },
                        {
                          text: 'Enlarged Algebra',
                          link: '/di/notes/work/done/enlarged algebra'
                        },
                        {
                          text: 'Layout Algorithm',
                          link: '/di/notes/work/done/layout-algorithm'
                        },
                        {
                          text: 'Quaternions',
                          link: '/di/notes/work/done/quaternions'
                        },
                        {
                          text: 'Scene.model',
                          link: '/di/notes/work/done/scene.model'
                        },
                        {
                          text: 'Svelte',
                          link: '/di/notes/work/done/svelte'
                        }
                      ]
                    },
                    {
                      text: 'Milestones >',
                      link: '/di/notes/work/milestones/',
                      collapsed: true,
                      items: [
                        {
                          text: '20.repeaters',
                          link: '/di/notes/work/milestones/20.repeaters'
                        },
                        {
                          text: '21.selection Algorithm',
                          link: '/di/notes/work/milestones/21.selection algorithm'
                        },
                        {
                          text: '22.rubberband',
                          link: '/di/notes/work/milestones/22.rubberband'
                        },
                        {
                          text: '23.cut.lists',
                          link: '/di/notes/work/milestones/23.cut.lists'
                        },
                        {
                          text: '24.user.manual',
                          link: '/di/notes/work/milestones/24.user.manual'
                        },
                        {
                          text: '25.licensing',
                          link: '/di/notes/work/milestones/25.licensing'
                        },
                        {
                          text: '26.marketing',
                          link: '/di/notes/work/milestones/26.marketing'
                        },
                        {
                          text: 'Done >',
                          link: '/di/notes/work/milestones/done/',
                          collapsed: true,
                          items: [
                            {
                              text: '1.solid.foundation',
                              link: '/di/notes/work/milestones/done/1.solid.foundation'
                            },
                            {
                              text: '10.controls',
                              link: '/di/notes/work/milestones/done/10.controls'
                            },
                            {
                              text: '11.units',
                              link: '/di/notes/work/milestones/done/11.units'
                            },
                            {
                              text: '12.hierarchy',
                              link: '/di/notes/work/milestones/done/12.hierarchy'
                            },
                            {
                              text: '13.algebra',
                              link: '/di/notes/work/milestones/done/13.algebra'
                            },
                            {
                              text: '14.details',
                              link: '/di/notes/work/milestones/done/14.details'
                            },
                            {
                              text: '15.attributes',
                              link: '/di/notes/work/milestones/done/15.attributes'
                            },
                            {
                              text: '16.formulas',
                              link: '/di/notes/work/milestones/done/16.formulas'
                            },
                            {
                              text: '17.library',
                              link: '/di/notes/work/milestones/done/17.library'
                            },
                            {
                              text: '18.user.constants',
                              link: '/di/notes/work/milestones/done/18.user.constants'
                            },
                            {
                              text: '19.skills',
                              link: '/di/notes/work/milestones/done/19.skills'
                            },
                            {
                              text: '2.panel',
                              link: '/di/notes/work/milestones/done/2.panel'
                            },
                            {
                              text: '3.docs',
                              link: '/di/notes/work/milestones/done/3.docs'
                            },
                            {
                              text: '4.hits.manager',
                              link: '/di/notes/work/milestones/done/4.hits.manager'
                            },
                            {
                              text: '5.smart.objects',
                              link: '/di/notes/work/milestones/done/5.smart.objects'
                            },
                            {
                              text: '6.build.notes',
                              link: '/di/notes/work/milestones/done/6.build.notes'
                            },
                            {
                              text: '7.edit.drags',
                              link: '/di/notes/work/milestones/done/7.edit.drags'
                            },
                            {
                              text: '8.dimensionals',
                              link: '/di/notes/work/milestones/done/8.dimensionals'
                            },
                            {
                              text: '9.persistence',
                              link: '/di/notes/work/milestones/done/9.persistence'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      text: 'Next >',
                      link: '/di/notes/work/next/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Pacing',
                          link: '/di/notes/work/next/pacing'
                        },
                        {
                          text: 'Punch List',
                          link: '/di/notes/work/next/punch list'
                        },
                        {
                          text: 'Roots',
                          link: '/di/notes/work/next/roots'
                        },
                        {
                          text: 'Separators',
                          link: '/di/notes/work/next/separators'
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
          text: 'Ga >',
          collapsed: true,
          items: [
            {
              text: 'Notes >',
              link: '/ga/notes/',
              collapsed: true,
              items: [
                {
                  text: 'Design >',
                  link: '/ga/notes/design/',
                  collapsed: true,
                  items: [
                    {
                      text: 'File.layout',
                      link: '/ga/notes/design/file.layout'
                    },
                    {
                      text: 'Game.engines',
                      link: '/ga/notes/design/game.engines'
                    },
                    {
                      text: 'Keep.in.mind',
                      link: '/ga/notes/design/keep.in.mind'
                    },
                    {
                      text: 'Original.sites',
                      link: '/ga/notes/design/original.sites'
                    },
                    {
                      text: 'Project',
                      link: '/ga/notes/design/project'
                    },
                    {
                      text: 'Vision',
                      link: '/ga/notes/design/vision'
                    }
                  ]
                },
                {
                  text: 'Work >',
                  link: '/ga/notes/work/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Map',
                      link: '/ga/notes/work/map'
                    },
                    {
                      text: 'Phaser.editor',
                      link: '/ga/notes/work/phaser.editor'
                    },
                    {
                      text: 'Phaser.start',
                      link: '/ga/notes/work/phaser.start'
                    },
                    {
                      text: 'Revisit.ga',
                      link: '/ga/notes/work/revisit.ga'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'Ma >',
          collapsed: true,
          items: [
            {
              text: 'Notes >',
              link: '/ma/notes/',
              collapsed: true,
              items: [
                {
                  text: 'Work >',
                  link: '/ma/notes/work/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Plan',
                      link: '/ma/notes/work/plan'
                    },
                    {
                      text: 'Revisit.ma',
                      link: '/ma/notes/work/revisit.ma'
                    },
                    {
                      text: 'Wendy',
                      link: '/ma/notes/work/wendy'
                    },
                    {
                      text: 'Done >',
                      link: '/ma/notes/work/done/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Describe',
                          link: '/ma/notes/work/done/describe'
                        },
                        {
                          text: 'Jonathan',
                          link: '/ma/notes/work/done/jonathan'
                        },
                        {
                          text: 'Next Steps',
                          link: '/ma/notes/work/done/next steps'
                        },
                        {
                          text: 'Proposal',
                          link: '/ma/notes/work/done/proposal'
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
          text: 'Me >',
          collapsed: true,
          items: [
            {
              text: 'Notes >',
              collapsed: true,
              items: [
                {
                  text: 'Work >',
                  collapsed: true,
                  items: [
                    {
                      text: 'Jonathan',
                      link: '/me/notes/work/jonathan'
                    },
                    {
                      text: 'Revisit.me',
                      link: '/me/notes/work/revisit.me'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'Notes >',
          link: '/notes/',
          collapsed: true,
          items: [
            {
              text: 'Archives >',
              collapsed: true,
              items: [
                {
                  text: 'Always.old',
                  link: '/notes/archives/always.old'
                }
              ]
            },
            {
              text: 'Guides >',
              link: '/notes/guides/',
              collapsed: true,
              items: [
                {
                  text: 'Jonathan',
                  link: '/notes/guides/jonathan'
                },
                {
                  text: 'Collaborate >',
                  link: '/notes/guides/collaborate/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Chat',
                      link: '/notes/guides/collaborate/chat'
                    },
                    {
                      text: 'Exclude',
                      link: '/notes/guides/collaborate/exclude'
                    },
                    {
                      text: 'Journals',
                      link: '/notes/guides/collaborate/journals'
                    },
                    {
                      text: 'Voice',
                      link: '/notes/guides/collaborate/voice'
                    },
                    {
                      text: 'Workflow',
                      link: '/notes/guides/collaborate/workflow'
                    }
                  ]
                },
                {
                  text: 'Design >',
                  link: '/notes/guides/design/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Port',
                      link: '/notes/guides/design/port'
                    }
                  ]
                },
                {
                  text: 'Develop >',
                  link: '/notes/guides/develop/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Aesthetics',
                      link: '/notes/guides/develop/aesthetics'
                    },
                    {
                      text: 'Build',
                      link: '/notes/guides/develop/build'
                    },
                    {
                      text: 'Css',
                      link: '/notes/guides/develop/css'
                    },
                    {
                      text: 'Markdown',
                      link: '/notes/guides/develop/markdown'
                    },
                    {
                      text: 'Migration',
                      link: '/notes/guides/develop/migration'
                    },
                    {
                      text: 'Refactoring',
                      link: '/notes/guides/develop/refactoring'
                    },
                    {
                      text: 'Style',
                      link: '/notes/guides/develop/style'
                    }
                  ]
                },
                {
                  text: 'Philosophy >',
                  link: '/notes/guides/philosophy/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Limitations',
                      link: '/notes/guides/philosophy/limitations'
                    },
                    {
                      text: 'Motive',
                      link: '/notes/guides/philosophy/motive'
                    }
                  ]
                },
                {
                  text: 'Pre Flight >',
                  link: '/notes/guides/pre-flight/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Always',
                      link: '/notes/guides/pre-flight/always'
                    },
                    {
                      text: 'Gates',
                      link: '/notes/guides/pre-flight/gates'
                    },
                    {
                      text: 'Keywords',
                      link: '/notes/guides/pre-flight/keywords'
                    },
                    {
                      text: 'Kinds.of.tasks',
                      link: '/notes/guides/pre-flight/kinds.of.tasks'
                    },
                    {
                      text: 'Pitfalls',
                      link: '/notes/guides/pre-flight/pitfalls'
                    },
                    {
                      text: 'Shorthand',
                      link: '/notes/guides/pre-flight/shorthand'
                    },
                    {
                      text: 'Tools',
                      link: '/notes/guides/pre-flight/tools'
                    }
                  ]
                },
                {
                  text: 'Setup >',
                  link: '/notes/guides/setup/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Access',
                      link: '/notes/guides/setup/access'
                    },
                    {
                      text: 'Netlify',
                      link: '/notes/guides/setup/netlify'
                    },
                    {
                      text: 'Onboarding',
                      link: '/notes/guides/setup/onboarding'
                    },
                    {
                      text: 'VitePress',
                      link: '/notes/guides/setup/vitepress'
                    }
                  ]
                }
              ]
            },
            {
              text: 'Work >',
              link: '/notes/work/',
              collapsed: true,
              items: [
                {
                  text: 'Agent Skills',
                  link: '/notes/work/Agent Skills'
                },
                {
                  text: 'Co',
                  link: '/notes/work/co'
                },
                {
                  text: 'Faster',
                  link: '/notes/work/faster'
                },
                {
                  text: 'Journal',
                  link: '/notes/work/journal'
                },
                {
                  text: 'Learn',
                  link: '/notes/work/learn'
                },
                {
                  text: 'Revisit.mo',
                  link: '/notes/work/revisit.mo'
                },
                {
                  text: 'Worktrees',
                  link: '/notes/work/worktrees'
                },
                {
                  text: 'Articles >',
                  link: '/notes/work/articles/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Accidental.programmer',
                      link: '/notes/work/articles/accidental.programmer'
                    },
                    {
                      text: 'How.to.build.it',
                      link: '/notes/work/articles/how.to.build.it'
                    },
                    {
                      text: 'Write.article',
                      link: '/notes/work/articles/write.article'
                    }
                  ]
                },
                {
                  text: 'Done >',
                  collapsed: true,
                  items: [
                    {
                      text: 'Class Lists',
                      link: '/notes/work/done/class-lists'
                    },
                    {
                      text: 'Cleanup',
                      link: '/notes/work/done/cleanup'
                    },
                    {
                      text: 'Code',
                      link: '/notes/work/done/code'
                    },
                    {
                      text: 'February.1.2026',
                      link: '/notes/work/done/february.1.2026'
                    },
                    {
                      text: 'Gating',
                      link: '/notes/work/done/gating'
                    },
                    {
                      text: 'Guides Clutter',
                      link: '/notes/work/done/guides-clutter'
                    },
                    {
                      text: 'Hub App Spec Old',
                      link: '/notes/work/done/hub-app-spec-old'
                    },
                    {
                      text: 'January.2026',
                      link: '/notes/work/done/january.2026'
                    },
                    {
                      text: 'Jonathan Old',
                      link: '/notes/work/done/jonathan-old'
                    },
                    {
                      text: 'Migrations',
                      link: '/notes/work/done/migrations'
                    },
                    {
                      text: 'Monorepo',
                      link: '/notes/work/done/monorepo'
                    },
                    {
                      text: 'Repo Old',
                      link: '/notes/work/done/repo-old'
                    },
                    {
                      text: 'Single Line Progress',
                      link: '/notes/work/done/single-line-progress'
                    },
                    {
                      text: 'Single.project',
                      link: '/notes/work/done/single.project'
                    },
                    {
                      text: 'Sites Hub',
                      link: '/notes/work/done/sites-hub'
                    },
                    {
                      text: 'Tools Sites',
                      link: '/notes/work/done/tools-sites'
                    },
                    {
                      text: 'Docs >',
                      collapsed: true,
                      items: [
                        {
                          text: 'Combined Docs',
                          link: '/notes/work/done/docs/combined-docs'
                        },
                        {
                          text: 'Docs',
                          link: '/notes/work/done/docs/docs'
                        },
                        {
                          text: 'History >',
                          collapsed: true,
                          items: [
                            {
                              text: 'CLAUDE MD UPDATED',
                              link: '/notes/work/done/docs/history/CLAUDE-MD-UPDATED'
                            },
                            {
                              text: 'FINAL ORGANIZATION',
                              link: '/notes/work/done/docs/history/FINAL-ORGANIZATION'
                            },
                            {
                              text: 'FIXTURES RELOCATED',
                              link: '/notes/work/done/docs/history/FIXTURES-RELOCATED'
                            },
                            {
                              text: 'PHASE1 COMPLETE',
                              link: '/notes/work/done/docs/history/PHASE1-COMPLETE'
                            },
                            {
                              text: 'PHASE1 FINAL',
                              link: '/notes/work/done/docs/history/PHASE1-FINAL'
                            },
                            {
                              text: 'PHASE1 RESULTS',
                              link: '/notes/work/done/docs/history/PHASE1-RESULTS'
                            },
                            {
                              text: 'PHASE2 COMPLETE',
                              link: '/notes/work/done/docs/history/PHASE2-COMPLETE'
                            },
                            {
                              text: 'PHASE2 FINAL',
                              link: '/notes/work/done/docs/history/PHASE2-FINAL'
                            },
                            {
                              text: 'PHASE2 MINIMIZED',
                              link: '/notes/work/done/docs/history/PHASE2-MINIMIZED'
                            },
                            {
                              text: 'REORGANIZATION',
                              link: '/notes/work/done/docs/history/REORGANIZATION'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  text: 'Jeff',
                  link: '/notes/work/jeff/',
                  collapsed: true,
                },
                {
                  text: 'Next >',
                  link: '/notes/work/next/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Commoditize',
                      link: '/notes/work/next/commoditize'
                    },
                    {
                      text: 'Curiosity',
                      link: '/notes/work/next/curiosity'
                    },
                    {
                      text: 'Pacing',
                      link: '/notes/work/next/pacing'
                    },
                    {
                      text: 'Personas',
                      link: '/notes/work/next/personas'
                    },
                    {
                      text: 'Retention Test',
                      link: '/notes/work/next/retention-test'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'S3 >',
          collapsed: true,
          items: [
            {
              text: 'Notes >',
              link: '/s3/notes/',
              collapsed: true,
              items: [
                {
                  text: 'Work >',
                  link: '/s3/notes/work/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Code.debt',
                      link: '/s3/notes/work/code.debt'
                    },
                    {
                      text: 'Fresh.build',
                      link: '/s3/notes/work/fresh.build'
                    },
                    {
                      text: 'Revisit.s3',
                      link: '/s3/notes/work/revisit.s3'
                    },
                    {
                      text: 'S3',
                      link: '/s3/notes/work/s3'
                    },
                    {
                      text: 'Weak.spots',
                      link: '/s3/notes/work/weak.spots'
                    },
                    {
                      text: 'Subsystems >',
                      link: '/s3/notes/work/subsystems/',
                      collapsed: true,
                      items: [
                        {
                          text: '10 Utilities',
                          link: '/s3/notes/work/subsystems/10 utilities'
                        },
                        {
                          text: '11 Database',
                          link: '/s3/notes/work/subsystems/11 database'
                        },
                        {
                          text: '12 Signals',
                          link: '/s3/notes/work/subsystems/12 signals'
                        },
                        {
                          text: '13 Managers',
                          link: '/s3/notes/work/subsystems/13 managers'
                        },
                        {
                          text: '3 Types',
                          link: '/s3/notes/work/subsystems/3 types'
                        },
                        {
                          text: '4 Entities',
                          link: '/s3/notes/work/subsystems/4 entities'
                        },
                        {
                          text: '5 Hierarchy',
                          link: '/s3/notes/work/subsystems/5 hierarchy'
                        },
                        {
                          text: '5.1 Hierarchy',
                          link: '/s3/notes/work/subsystems/5.1 hierarchy'
                        },
                        {
                          text: '6 Rendering',
                          link: '/s3/notes/work/subsystems/6 rendering'
                        },
                        {
                          text: '7 Geometry',
                          link: '/s3/notes/work/subsystems/7 geometry'
                        },
                        {
                          text: '8 Ancestry',
                          link: '/s3/notes/work/subsystems/8 ancestry'
                        },
                        {
                          text: '9 Ux',
                          link: '/s3/notes/work/subsystems/9 ux'
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
          collapsed: true,
          items: [
            {
              text: 'Notes >',
              link: '/ws/notes/',
              collapsed: true,
              items: [
                {
                  text: 'Project',
                  link: '/ws/notes/project'
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
                              link: '/ws/notes/archives/bubble/2/bubble tears'
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
                              link: '/ws/notes/archives/experiments/simulate bubble/README-test'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  text: 'Guides >',
                  link: '/ws/notes/guides/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Architecture >',
                      link: '/ws/notes/guides/architecture/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Overview',
                          link: '/ws/notes/guides/architecture/overview'
                        },
                        {
                          text: 'Core >',
                          link: '/ws/notes/guides/architecture/core/',
                          collapsed: true,
                          items: [
                            {
                              text: 'Components',
                              link: '/ws/notes/guides/architecture/core/components'
                            },
                            {
                              text: 'Databases',
                              link: '/ws/notes/guides/architecture/core/databases'
                            },
                            {
                              text: 'Geometry',
                              link: '/ws/notes/guides/architecture/core/geometry'
                            },
                            {
                              text: 'Hits',
                              link: '/ws/notes/guides/architecture/core/hits'
                            },
                            {
                              text: 'Managers',
                              link: '/ws/notes/guides/architecture/core/managers'
                            },
                            {
                              text: 'State',
                              link: '/ws/notes/guides/architecture/core/state'
                            },
                            {
                              text: 'UX',
                              link: '/ws/notes/guides/architecture/core/ux'
                            }
                          ]
                        },
                        {
                          text: 'Internals >',
                          link: '/ws/notes/guides/architecture/internals/',
                          collapsed: true,
                          items: [
                            {
                              text: 'Debounce',
                              link: '/ws/notes/guides/architecture/internals/debounce'
                            },
                            {
                              text: 'Layout',
                              link: '/ws/notes/guides/architecture/internals/layout'
                            },
                            {
                              text: 'Persistable',
                              link: '/ws/notes/guides/architecture/internals/persistable'
                            },
                            {
                              text: 'Preferences',
                              link: '/ws/notes/guides/architecture/internals/preferences'
                            },
                            {
                              text: 'Reactivity',
                              link: '/ws/notes/guides/architecture/internals/reactivity'
                            },
                            {
                              text: 'Recents',
                              link: '/ws/notes/guides/architecture/internals/recents'
                            },
                            {
                              text: 'Styles',
                              link: '/ws/notes/guides/architecture/internals/styles'
                            },
                            {
                              text: 'Timers',
                              link: '/ws/notes/guides/architecture/internals/timers'
                            }
                          ]
                        },
                        {
                          text: 'Platforms >',
                          link: '/ws/notes/guides/architecture/platforms/',
                          collapsed: true,
                          items: [
                            {
                              text: 'Bubble',
                              link: '/ws/notes/guides/architecture/platforms/bubble'
                            },
                            {
                              text: 'Plugin',
                              link: '/ws/notes/guides/architecture/platforms/plugin'
                            },
                            {
                              text: 'Svelte 5',
                              link: '/ws/notes/guides/architecture/platforms/svelte.5'
                            },
                            {
                              text: 'Svelte',
                              link: '/ws/notes/guides/architecture/platforms/svelte'
                            },
                            {
                              text: 'VitePress',
                              link: '/ws/notes/guides/architecture/platforms/vitepress'
                            }
                          ]
                        },
                        {
                          text: 'UX >',
                          link: '/ws/notes/guides/architecture/ux/',
                          collapsed: true,
                          items: [
                            {
                              text: 'Breadcrumbs',
                              link: '/ws/notes/guides/architecture/ux/breadcrumbs'
                            },
                            {
                              text: 'Buttons',
                              link: '/ws/notes/guides/architecture/ux/buttons'
                            },
                            {
                              text: 'Components',
                              link: '/ws/notes/guides/architecture/ux/components'
                            },
                            {
                              text: 'Controls',
                              link: '/ws/notes/guides/architecture/ux/controls'
                            },
                            {
                              text: 'Details',
                              link: '/ws/notes/guides/architecture/ux/details'
                            },
                            {
                              text: 'Paging',
                              link: '/ws/notes/guides/architecture/ux/paging'
                            },
                            {
                              text: 'Preferences',
                              link: '/ws/notes/guides/architecture/ux/preferences'
                            },
                            {
                              text: 'Search',
                              link: '/ws/notes/guides/architecture/ux/search'
                            },
                            {
                              text: 'Titles',
                              link: '/ws/notes/guides/architecture/ux/titles'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      text: 'Collaborate >',
                      link: '/ws/notes/guides/collaborate/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Composition',
                          link: '/ws/notes/guides/collaborate/composition'
                        },
                        {
                          text: 'Gotchas',
                          link: '/ws/notes/guides/collaborate/gotchas'
                        },
                        {
                          text: 'Style',
                          link: '/ws/notes/guides/collaborate/style'
                        }
                      ]
                    }
                  ]
                },
                {
                  text: 'Manuals >',
                  link: '/ws/notes/manuals/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Plugin >',
                      link: '/ws/notes/manuals/plugin/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Bubble.plugin',
                          link: '/ws/notes/manuals/plugin/bubble.plugin'
                        }
                      ]
                    },
                    {
                      text: 'User >',
                      link: '/ws/notes/manuals/user/',
                      collapsed: true,
                      items: [
                        {
                          text: '1.what.is.webseriously',
                          link: '/ws/notes/manuals/user/1.what.is.webseriously'
                        },
                        {
                          text: '2.getting.started',
                          link: '/ws/notes/manuals/user/2.getting.started'
                        },
                        {
                          text: '3.the.graph',
                          link: '/ws/notes/manuals/user/3.the.graph'
                        },
                        {
                          text: '4.working.with.items',
                          link: '/ws/notes/manuals/user/4.working.with.items'
                        },
                        {
                          text: '5.details.panel',
                          link: '/ws/notes/manuals/user/5.details.panel'
                        },
                        {
                          text: '6.search',
                          link: '/ws/notes/manuals/user/6.search'
                        },
                        {
                          text: '7.import.export',
                          link: '/ws/notes/manuals/user/7.import.export'
                        },
                        {
                          text: '8.preferences',
                          link: '/ws/notes/manuals/user/8.preferences'
                        }
                      ]
                    }
                  ]
                },
                {
                  text: 'Work >',
                  link: '/ws/notes/work/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Deliverables',
                      link: '/ws/notes/work/deliverables'
                    },
                    {
                      text: 'Revisit.ws',
                      link: '/ws/notes/work/revisit.ws'
                    },
                    {
                      text: 'Done >',
                      collapsed: true,
                      items: [
                        {
                          text: 'February.1.2026',
                          link: '/ws/notes/work/done/february.1.2026'
                        },
                        {
                          text: 'Ai >',
                          collapsed: true,
                          items: [
                            {
                              text: 'Claude.write',
                              link: '/ws/notes/work/done/ai/claude.write'
                            },
                            {
                              text: 'Docs',
                              link: '/ws/notes/work/done/ai/docs'
                            },
                            {
                              text: 'Filesystem',
                              link: '/ws/notes/work/done/ai/filesystem'
                            },
                            {
                              text: 'Truth',
                              link: '/ws/notes/work/done/ai/truth'
                            }
                          ]
                        },
                        {
                          text: 'Deliverables >',
                          collapsed: true,
                          items: [
                            {
                              text: 'February.4.2026',
                              link: '/ws/notes/work/done/deliverables/february.4.2026'
                            },
                            {
                              text: 'January.27.2026',
                              link: '/ws/notes/work/done/deliverables/january.27.2026'
                            },
                            {
                              text: 'January.28.2026',
                              link: '/ws/notes/work/done/deliverables/january.28.2026'
                            }
                          ]
                        },
                        {
                          text: 'Migrations >',
                          collapsed: true,
                          items: [
                            {
                              text: 'Breadcrumbs >',
                              link: '/ws/notes/work/done/migrations/breadcrumbs/',
                              collapsed: true,
                              items: [
                                {
                                  text: 'Banners',
                                  link: '/ws/notes/work/done/migrations/breadcrumbs/banners'
                                },
                                {
                                  text: 'Breadcrumbs Re Compositioon',
                                  link: '/ws/notes/work/done/migrations/breadcrumbs/breadcrumbs re-compositioon'
                                },
                                {
                                  text: 'Breadcrumbs',
                                  link: '/ws/notes/work/done/migrations/breadcrumbs/breadcrumbs'
                                },
                                {
                                  text: 'Layout',
                                  link: '/ws/notes/work/done/migrations/breadcrumbs/layout'
                                }
                              ]
                            },
                            {
                              text: 'Focus >',
                              link: '/ws/notes/work/done/migrations/focus/',
                              collapsed: true,
                              items: [
                                {
                                  text: 'Focus',
                                  link: '/ws/notes/work/done/migrations/focus/focus'
                                },
                                {
                                  text: 'Grow Shrink',
                                  link: '/ws/notes/work/done/migrations/focus/grow-shrink'
                                }
                              ]
                            },
                            {
                              text: 'Mono >',
                              link: '/ws/notes/work/done/migrations/mono/',
                              collapsed: true,
                              items: [
                                {
                                  text: 'Combined',
                                  link: '/ws/notes/work/done/migrations/mono/combined'
                                },
                                {
                                  text: 'Next',
                                  link: '/ws/notes/work/done/migrations/mono/next'
                                },
                                {
                                  text: 'Proposal',
                                  link: '/ws/notes/work/done/migrations/mono/proposal'
                                },
                                {
                                  text: 'Steppers',
                                  link: '/ws/notes/work/done/migrations/mono/steppers'
                                }
                              ]
                            }
                          ]
                        },
                        {
                          text: 'Other >',
                          link: '/ws/notes/work/done/other/',
                          collapsed: true,
                          items: [
                            {
                              text: 'Bad.tree.center',
                              link: '/ws/notes/work/done/other/bad.tree.center'
                            },
                            {
                              text: 'Focus',
                              link: '/ws/notes/work/done/other/focus'
                            },
                            {
                              text: 'Hits Detection',
                              link: '/ws/notes/work/done/other/hits-detection'
                            },
                            {
                              text: 'Recents',
                              link: '/ws/notes/work/done/other/recents'
                            },
                            {
                              text: 'Relocate.controls',
                              link: '/ws/notes/work/done/other/relocate.controls'
                            },
                            {
                              text: 'Startup',
                              link: '/ws/notes/work/done/other/startup'
                            }
                          ]
                        },
                        {
                          text: 'VitePress >',
                          link: '/ws/notes/work/done/vitepress/',
                          collapsed: true,
                          items: [
                            {
                              text: 'Redox',
                              link: '/ws/notes/work/done/vitepress/redox'
                            },
                            {
                              text: 'Webseriously Driven Docs',
                              link: '/ws/notes/work/done/vitepress/webseriously-driven-docs'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      text: 'Next >',
                      link: '/ws/notes/work/next/',
                      collapsed: true,
                      items: [
                        {
                          text: 'Amnesia',
                          link: '/ws/notes/work/next/amnesia'
                        },
                        {
                          text: 'Holons.api',
                          link: '/ws/notes/work/next/holons.api'
                        },
                        {
                          text: 'Resize Optimization AI',
                          link: '/ws/notes/work/next/Resize_Optimization_AI'
                        },
                        {
                          text: 'Search Links',
                          link: '/ws/notes/work/next/search-links'
                        },
                        {
                          text: 'Search',
                          link: '/ws/notes/work/next/search'
                        },
                        {
                          text: 'User.manual',
                          link: '/ws/notes/work/next/user.manual'
                        },
                        {
                          text: 'Crazy >',
                          link: '/ws/notes/work/next/crazy/',
                          collapsed: true,
                          items: [
                            {
                              text: 'Ai Ux Spider Guide',
                              link: '/ws/notes/work/next/crazy/ai-ux-spider-guide'
                            },
                            {
                              text: 'Book',
                              link: '/ws/notes/work/next/crazy/book'
                            },
                            {
                              text: 'Ethernet',
                              link: '/ws/notes/work/next/crazy/ethernet'
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
