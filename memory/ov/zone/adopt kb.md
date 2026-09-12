# adopt kb

What a host hands kb, two ways, as strip step 2 in [music and ai](music%20and%20ai.md) says: the facts as switches, set before anything mounts, and the drawing as snippets, rendered by kb. Proposed 11 September 2026, not decided. Written here to move to memory/kb at strip step 1.

## the switches

One object kb declares in its common folder, `customizations`, the name gallery, panel and mu give the same thing, which the host's Main.ts fills before anything mounts, as lv's Main.ts fills gallery's. Every kb module reads it when asked, never at import. Its defaults name no host, libraries.md's rule. One field per fact:

| field | holds | today in ov | ai fills | mu fills |
| --- | --- | --- | --- | --- |
| name | what the controls row calls the host | Controls.svelte | ai | mu |
| prefix | what every remembered value is saved under | Preferences.ts, `ov_` | ai and an underscore | mu and an underscore |
| collection | the specialty's name, which the collections table keys on, so kb asks the dispatcher for that collection's rows alone | none, the dispatcher answers everything | ai | music |
| kinds | the closed list of kinds, drawn in the kinds row | T_Kind in File.ts | the six | music, one |
| tags | the closed list of tags | ALL_TAGS in File.ts | the 39 | open, the keys question |
| tag_areas | the tags gathered into areas, each folding its tags away | TAG_AREAS in Tag_Areas.ts | the ten | none, until tags are decided |
| hierarchies | the labels a hierarchy can group by, folder first, which the list offers | the folders alone, Files.ts | folder | folder, artist, album, name |
| builds | the build notes table's text, which the build button opens | builds.md, read raw in App.svelte | ai's file | mu's file |

## the snippets

The host's App.svelte draws kb's page, Main.svelte, which draws panel and hands panel kb's own four, controls, details, operation and status. Main.svelte takes four snippets from the host and renders each in one place. Where a host hands none, kb draws nothing there.

| snippet | takes | rendered | ai hands | mu hands |
| --- | --- | --- | --- | --- |
| the browse filter section | nothing | among the browse filter sections, beside kb's kind, tag and search rows | the project row, Browse_Filters.svelte's today, the project read off the path | nothing |
| the edit filter section | the clicked file | in the editor's label form, where the four fields' rows sit today, between kb's kinds row and tag areas | the four rows, title, date, brief and use when, with the title's two tools, Edit_Filters.svelte's today | nothing |
| the details section | nothing | a section in the details column, below preferences and rules | repair, D_Repair.svelte | nothing |
| the operation view | the clicked file, and the width and height kb's frame gives it | inside kb's editor frame, Edit.svelte, below the label form | the drawn markdown, Edit_Markdown.svelte, with search and back links | the player |

The authors and from rows stay kb's, since the sources table is kb's. The kinds row and the tag areas stay kb's, since every specialty has a kind and tags, and each becomes a kb component of its own at strip step 7.

## not handed

1. **A collection's rows.** The dispatcher's collections table holds them. kb asks by the collection switch.
2. **The project of an ai file.** Read off its path by ai's own code, in its browse snippet, never a switch.
3. **is_design.** ai's, from the path, in its own code.
4. **The listing rule, the tag reader and the streaming route.** The plugin's, on the dispatcher side, never the page's.
5. **Rules, sources and preferences.** kb's own sections and tables.

## the type

```ts
export type Tag_Area = { name: string; tags: string[] };
export const customizations = {
    name        : 'kb',
    prefix      : 'kb_',
    collection  : '',
    kinds       : [] as string[],
    tags        : [] as string[],
    tag_areas   : [] as Tag_Area[],
    hierarchies : ['folder'],
    builds      : '',
};
```

Main.svelte's four snippet props, named for the four places above: the two sections that take nothing, the edit filter section that takes the file, and the operation view that takes the file, the width and the height. Each is optional.

## proof

kb's check clean with ai's values in. One test in kb that every default names no host. ai's own alias test, as libraries.md's fourth rule asks, that only its bridge names kb.

## open

1. Where the browse snippet sits among kb's rows, above or below.
2. Whether music's list takes tags at all, the keys question under the music definition, which settles the tags and tag_areas fields for mu.
3. Whether a hierarchy switch names the label alone, as above, or the label and its order within a group, which music's track order would need.
