import type { Config } from "tailwindcss";
import { skeleton } from '@skeletonlabs/tw-plugin';

export default {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    require('path').join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
  ],

  theme: {
    extend: {}
  },

  plugins: [
    require("@tailwindcss/typography"),
    skeleton({
      themes: { preset: [ "skeleton" ] }
    })
  ]
} as Config;