import { defineConfig } from 'vitepress'
import { resolve } from 'path'
import taskLists from 'markdown-it-task-lists'
import wikilinkPlugin from './markdown-it-wikilinks.mts'

export default defineConfig({
  srcDir: './notes',
  title: "ma",
  description: "ma docs",

  markdown: {
    config: (md) => {
      md.use(taskLists)
      md.use(wikilinkPlugin, { srcDir: resolve(__dirname, '../notes') })
    }
  },

  vite: {
    server: {
      port: parseInt(process.env.VITE_PORT || '5187')
    }
  },

  themeConfig: {
    search: {
      provider: 'local'
    }
  }
})
