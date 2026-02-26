import { defineConfig } from 'vitepress'
import taskLists from 'markdown-it-task-lists'

export default defineConfig({
  srcDir: './notes',
  title: "ga",
  description: "ga docs",

  markdown: {
    config: (md) => {
      md.use(taskLists)
    }
  },

  vite: {
    server: {
      port: parseInt(process.env.VITE_PORT || '5182')
    }
  },

  themeConfig: {
    search: {
      provider: 'local'
    }
  }
})
