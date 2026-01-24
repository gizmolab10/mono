import sveltePreprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-netlify';
export default {
  kit: {
    adapter: adapter(),
    // other options...
  },
  preprocess: sveltePreprocess({
    scss: {
      prependData: ''
    },
    sassOptions: {
      silenceDeprecations: ["legacy-js-api"],
    },
    typescript: {
      tsconfigFile: './tsconfig.json'
    }
  }),
}