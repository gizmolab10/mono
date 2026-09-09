# gallery

A library, imported by lv and mj. Pages are md files, drawn with Obsidian's syntax. A gallery is one folder of pictures shown one at a time, each captioned by the title written inside its own file. Editing — a picture added, a caption changed, a file thrown out, a folder reordered — is done by the dev server's plugins here, and by the netlify functions on a published site.

What is here for its own sake: `App.svelte` and `Main.ts`, the smallest host of the library, and the sample page and pictures its tests read.

## Setup

```bash
yarn install
yarn dev
yarn test
```

## License

MIT
