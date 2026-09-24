// What a host hands kb as facts, set before anything mounts: the host's main.ts fills these the
// way lv's Main.ts fills gallery's, and every kb module reads them when asked, never at import.
// The defaults name no host, libraries.md's rule. What each holds, who fills it and at which step
// of the plan is memory/kb/truth/adopt kb.md's table.

import type { Tag_Area } from '../types/Tag_Areas';

// The label a hierarchy groups the rows by, and the label the rows within a group are ordered by.
export type Hierarchy = { label: string; order: string };

// An open button: a button at the left of the controls row while browsing, which opens one file
// in the editor, by the key the file hangs under, its bundle then its path.
export type Open_Button = { title: string; key: string };

export const customizations = {
	name        : 'kb',                  // what the controls row calls the host, while no file is open
	prefix      : 'kb_',                 // what every remembered value is saved under; read at step 9 of the plan
	host        : '',                    // the host's name, which ports.json pairs with its db; none asks for ov's db
	kinds       : [] as string[],        // the closed list of kinds, drawn in the kinds row
	tags        : [] as string[],        // the closed list of tags
	tag_areas   : [] as Tag_Area[],      // the tags gathered into areas, each folding its tags away
	kind_when_new : '',                  // the kind a new or unlabeled file starts with, read since step 12 of the plan
	tag_when_new  : '',                  // the tag a new or unlabeled file starts with
	hierarchies : [{ label: 'folder', order: 'name' }] as Hierarchy[],   // the hierarchies the list offers, folder first
	builds      : '',                    // the build notes table's text, which the build button opens
	open_buttons : [] as Open_Button[],  // the open buttons, each a title and the key of the file it opens; since 14 September 2026
};
