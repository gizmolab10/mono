# adopt kb

What a host hands kb, two ways, as step 5 in [music and ai](../../ov/zone/music%20and%20ai.md) says: the facts as configuration, set before anything mounts, and the drawing as snippets, rendered by kb. Proposed 11 September 2026, moved here from memory/ai/zone at step 4, 12 September 2026, and built at step 5, 13 September 2026: kb's Customizations.ts and Main.svelte are the two ways.

## the configuration

One object kb declares in its common folder, `customizations`, the name gallery, panel and mu give the same thing, which the host's main.ts fills before anything mounts, as lv's Main.ts fills gallery's. Every kb module reads it when asked, never at import. Its defaults name no host, libraries.md's rule. One field per fact:

| field | holds | today in ov | ai fills | mu fills |
| --- | --- | --- | --- | --- |
| name | what the controls row calls the host | none: ov's row shows no host name, panel's centers one | ai | mu |
| prefix | what every remembered value is saved under, read when asked; a host sets it ahead of importing kb, since kb's stores read storage at import | Preferences.ts, `kb_` | `ai_`, set by Convert_Preferences.ts, the values saved under `ov_` moved once | mu and an underscore |
| host | the host's name, which ports.json pairs with its db, so kb asks the dispatcher for that db's rows alone. ai's entry names `ai.db`, made from `ov.db` on 13 September 2026 | none, the dispatcher answers ai's db | ai | mu |
| kinds | the closed list of kinds, drawn in the kinds row | T_Kind in File.ts | the five, music dropped 13 September 2026 | music, images, text and video, four, decided 13 September 2026 |
| tags | the closed list of tags | ALL_TAGS in File.ts | the 39 | jazz, classical, rock and hifi, four, decided 13 September 2026 |
| tag_areas | the tags gathered into areas, each folding its tags away | TAG_AREAS in Tag_Areas.ts | the ten | one or two, 29d's question |
| kind_when_new | the kind a new or unlabeled file starts with, since step 12 | KIND_UNTIL_TOLD in Labels.ts, analyze | analyze | undecided |
| tag_when_new | the tag a new or unlabeled file starts with, since step 12 | TAG_WHEN_NEW in Labels.ts, now | born, now until 15 September 2026 | decided |
| hierarchies | the hierarchies the list offers, folder first, each naming the label it groups by and the order within a group, decided 13 September 2026, which music's track order needs | the folders alone, Files.ts | folder | folder, artist, album, name |
| builds | the build notes table's text, which the build button opens | builds.md, read raw in App.svelte, Main.svelte in kb | ai's file | mu's file |
| open_buttons | the open buttons at the far right of the controls row while browsing, each a title and the key of the file it opens in the editor, since 14 September 2026 | none | code debt, memory/shared/zone/code debt.md | none |

At step 5 ai fills name, host, hierarchies and builds, and since step 7, 13 September 2026, kinds, tags and tag_areas. prefix is read since step 9, 14 September 2026, set by ai's Convert_Preferences.ts ahead of kb. The edit filter section is handed since step 10, the same day, and the operation view since step 11, the same day. kind_when_new and tag_when_new are filled since step 12, 14 September 2026, and open_buttons since the same day. The search row is handed since step 13, 15 September 2026, and the back links since step 14, the same day.

## the snippets

The host's App.svelte draws kb's page, Main.svelte, which draws panel and hands panel kb's own four: the right end of the controls row from Controls.svelte, less the hamburger panel draws, the name yielding to the file's section while a file is open, decided 13 September 2026, the details column from Details.svelte, the operation view from Operation.svelte, and the status line's words and offer from Status.ts, panel using core's status line, which carries the offer, in place of its own line of words, decided 13 September 2026. Main.svelte takes four snippets from the host and renders each in one place. Where a host hands none, kb draws nothing there, once the piece has moved. Until the step that moves a piece, kb draws it as today.

| snippet | takes | rendered | ai hands | mu hands |
| --- | --- | --- | --- | --- |
| the browse filter section | nothing | among browse's filters above its list of files, after kb's search, collection, kind and tag rows, last, decided 13 September 2026 | nothing: ai's projects are its collections, which kb's collection filter narrows | nothing |
| the edit filter section | the file, its words and a call handing changed words back | in the editor's label form, above kb's kinds row, where the information rows sit today; the slot moves up there from between the kinds and the tags at step 10 | the four rows, title and date, brief, use when, authors and from, Edit_More.svelte's today, the title's two tools with them; an element the rows mark with the class rides-the-line is put on the section's line, centered | nothing |
| the details section | nothing | a section in the details column, below preferences and rules | repair, D_Repair.svelte | nothing |
| the search row | the file's name, since step 13 | in the editor's label form, its first subsection, whose line, gap and fold word stay kb's | the field, the count and the steppers, Search.svelte, highlighting places in the html | nothing |
| the back links | the file's key and its name, since step 14 | at the foot of kb's editor frame, Edit.svelte, below the note line, above the status line | the pills, one per file pointing at the one read, Back_Links.svelte, from kb's map of who points at whom | nothing |
| the operation view | the file, the width and height kb's frame gives it, the words and a call handing changed words back, and a call for a note, since step 11; until step 13 also a call handing the html back and calls for drawn and redrawn, which the host wires to its own search from then on | inside kb's editor frame, Edit.svelte, in Edit_Markdown's place | the drawn markdown, Edit_Markdown.svelte, the search and the back links staying kb's | the player |

The authors and from rows stay kb's, since the sources table is kb's. The kinds row and the tag areas stay kb's, since every specialty has a kind and tags, and each becomes a kb component of its own at step 10.

## not handed

1. **A collection's rows.** The dispatcher's collections table holds them. kb asks by the configured host.
2. **The project of an ai file.** Held on the file's row as its collection, read off the path once when the row is made, and narrowed by kb's collection filter. Never part of the configuration.
3. **is_design.** ai's, from the path, in its own code.
4. **The listing rule, the tag reader and the streaming route.** The plugin's, on the dispatcher side, never the page's.
5. **Rules, sources and preferences.** kb's own sections and tables.

## the type

```ts
import type { Tag_Area } from '../types/Tag_Areas';   // kb's own type, until step 7 moves the areas to ai
export type Hierarchy = { label: string; order: string };
export const customizations = {
    name        : 'kb',
    prefix      : 'kb_',
    host        : '',
    kinds       : [] as string[],
    tags        : [] as string[],
    tag_areas   : [] as Tag_Area[],
    hierarchies : [{ label: 'folder', order: 'name' }] as Hierarchy[],
    builds      : '',
};
```

Main.svelte's snippet props, four until step 13, five from it and six from step 14, named for the places above, browse_filter, edit_filter, details_section and operation_view: the two sections that take nothing, the edit filter section that takes the file, its words and a call handing changed words back since step 10, and the operation view that takes the file, the width and the height, and since step 11 the words, a call handing changed words back, a call handing the html back, and calls for drawn, redrawn and a note. Each is optional.

## proof

kb's check clean with ai's values in. One test in kb that every default names no host, customizations.test.ts. ai's own alias test, as libraries.md's fourth rule asks, that only its bridge names kb. All three hold, 13 September 2026.

## open

None. 5a, 5b and 5c of the plan in [music and ai](../../ov/zone/music%20and%20ai.md) are answered, 13 September 2026: the browse snippet sits after tag, last, a hierarchy names its label and its order within a group, and panel uses core's status line, so the offer passes through.
