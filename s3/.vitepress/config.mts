import { defineConfig } from 'vitepress'
import taskLists from 'markdown-it-task-lists'

export default defineConfig({
  srcDir: './notes',
  title: "s3",
  description: "s3 docs",

  markdown: {
    config: (md) => {
      md.use(taskLists)
    }
  },

  vite: {
    server: {
      port: parseInt(process.env.VITE_PORT || '5180')
    }
  },

  themeConfig: {
    search: {
      provider: 'local'
    }
  }
})
