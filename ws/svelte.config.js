import sveltePreprocess from 'svelte-preprocess';

export default {
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