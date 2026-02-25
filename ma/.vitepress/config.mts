import { defineConfig } from 'vitepress'
import taskLists from 'markdown-it-task-lists'

export default defineConfig({
  srcDir: './notes',
  title: "ma",
  description: "ma docs",

  markdown: {
    config: (md) => {
      md.use(taskLists)
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
