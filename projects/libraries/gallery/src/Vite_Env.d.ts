/// <reference types="svelte" />
/// <reference types="vite/client" />

// The titles read out of the photos themselves while the site is built — see
// `plugins/photo-titles.ts`. File name -> title, holding only the files that
// carry one.
declare module 'virtual:photo-titles' {
  const titles: Record<string, string>;
  export default titles;
}
