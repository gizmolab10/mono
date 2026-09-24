# adopt kb

What a host hands kb, two ways: the facts as configuration, set before anything mounts, and the drawing as snippets, rendered by kb. kb's Customizations.ts and Main.svelte are the two ways. What both hosts need of kb is [hosting kb](../../mu/zone/hosting%20kb.md); ai's own part is [how ai hosts kb](../../ai/truth/design/how%20ai%20hosts%20kb.md). mu hosts panel, not kb; what mu hands is step 29 of [kb hosted by music](../../mu/zone/kb%20hosted%20by%20music.md).

## the configuration

One object kb declares in its common folder, `customizations`, the name gallery, panel and mu give the same thing, which the host's main.ts fills before anything mounts. Every kb module reads it when asked, never at import. Its defaults name no host. One field per fact:

| field | holds | read by | ai fills |
| --- | --- | --- | --- |
| name | what the controls row calls the host, while no file is open | Main.svelte | ai |
| prefix | what every remembered value is saved under; a host sets it ahead of importing kb, since kb's stores read storage at import | Preferences.ts | `ai_`, set by Convert_Preferences.ts |
| host | the host's name, which ports.json pairs with its db; kb asks the dispatcher for that db's rows alone | Saving.ts | ai |
| kinds | the closed list of kinds, drawn in the kinds row | Kinds_Row.svelte, Browse_Filters.svelte, Filters.ts | analyze, arch, explain, howto, specify |
| tags | the closed list of tags | Tag_Rows.svelte, Edit_More.svelte, Filters.ts, Files.ts | the 42 |
| tag_areas | the tags gathered into areas, each folding its tags away | Tag_Rows.svelte, Edit_More.svelte, Browse_Filters.svelte | the ten |
| kind_when_new | the kind a new or unlabeled file starts with | Files.ts | analyze |
| tag_when_new | the tag a new or unlabeled file starts with | Files.ts | born |
| hierarchies | the hierarchies the list offers, folder first, each naming the label it groups by and the order within a group | no kb module reads it | folder, by name |
| builds | the build notes table's text, which the build button opens | Main.svelte | builds.md, read raw |
| open_buttons | the open buttons beside the hamburger while browsing, one segmented control, each a title and the key of the file it opens in the editor; the steppers walk them while the file is open | Controls.svelte, Operations.ts | six: de, wf, hb, sh, ca, co |

ai fills every field from its own Customizations.ts through Convert_Preferences.ts, which its main.ts imports ahead of kb.

```ts
import type { Tag_Area } from '../types/Tag_Areas';
export type Hierarchy = { label: string; order: string };
export type Open_Button = { title: string; key: string };
export const customizations = {
    name        : 'kb',
    prefix      : 'kb_',
    host        : '',
    kinds       : [] as string[],
    tags        : [] as string[],
    tag_areas   : [] as Tag_Area[],
    kind_when_new : '',
    tag_when_new  : '',
    hierarchies : [{ label: 'folder', order: 'name' }] as Hierarchy[],
    builds      : '',
    open_buttons : [] as Open_Button[],
};
```

## the snippets

The host's App.svelte draws kb's page, Main.svelte, which draws panel and hands panel kb's own regions: the controls row's right end, the details column, the operation view and the status line. Main.svelte takes six snippets from the host, each optional, each rendered in one place. Where a host hands none, kb draws nothing there.

| snippet | takes | rendered | ai hands |
| --- | --- | --- | --- |
| browse_filter | nothing | the last row of the browse filters | nothing: ai's projects are its collections |
| edit_filter | the file, its words and a call that sets them | in the editor's label form, above the kinds row | the information rows, Edit_Fields.svelte |
| search_row | the file's name | the label form's first subsection, whose line, gap and fold word are kb's | the field, the count and the steppers, Search.svelte, highlighting places in the drawn page |
| details_section | nothing | a section in the details column, below the rules | nothing |
| operation_view | the file, the width and height the frame gives it, the words, a call that sets them and a call for a note | inside kb's editor frame, Edit.svelte | the drawn markdown, Edit_Markdown.svelte, wired to ai's search: the renderer hands its page up, and a file drawn or drawn again tells the search |
| back_links | the file's key and its name | at the foot of the editor frame, above the status line | one pill per file pointing at the one read, Back_Links.svelte, from kb's map of who points at whom |

```ts
let { browse_filter, edit_filter, search_row, details_section, operation_view, back_links }: {
    browse_filter?   : Snippet;
    edit_filter?     : Snippet<[File, string, (words: string) => void]>;
    details_section? : Snippet;
    search_row?      : Snippet<[string]>;
    operation_view?  : Snippet<[File, number, number, string, (words: string) => void, (message: string) => void]>;
    back_links?      : Snippet<[string, string]>;
} = $props();
```

The kinds row and the tag areas are kb's, since every specialty has a kind and tags. The authors and from rows are kb's, since the sources table is kb's.

Not: a collection's rows, which the dispatcher's collections table holds and kb asks for by the configured host; the project of an ai file, held on the file's row as its collection and read off the path once when the row is made; is_design, ai's, from the path, in its own code; the listing rule, the tag reader and the streaming route, the plugin's, on the dispatcher side; rules, sources and preferences, kb's own sections and tables; ai's kind_when_drawn and tag_when_drawn, ai's own.
