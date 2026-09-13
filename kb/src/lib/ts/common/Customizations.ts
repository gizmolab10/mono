// What a host hands kb as facts, set before anything mounts: the host's main.ts fills these the
// way lv's Main.ts fills gallery's, and every kb module reads them when asked, never at import.
// The defaults name no host, libraries.md's rule. What each holds, who fills it and at which step
// of the plan is memory/kb/zone/adopt kb.md's table.

import type { Tag_Area } from '../types/Tag_Areas';

// The label a hierarchy groups the rows by, and the label the rows within a group are ordered by.
export type Hierarchy = { label: string; order: string };

export const customizations = {
	name        : 'kb',                  // what the controls row calls the host, while no file is open
	prefix      : 'kb_',                 // what every remembered value is saved under; read at step 9 of the plan
	host        : '',                    // the host's name, which ports.json pairs with its db; none asks for ov's db
	kinds       : [] as string[],        // the closed list of kinds, drawn in the kinds row
	tags        : [] as string[],        // the closed list of tags
	tag_areas   : [] as Tag_Area[],      // the tags gathered into areas, each folding its tags away
	hierarchies : [{ label: 'folder', order: 'name' }] as Hierarchy[],   // the hierarchies the list offers, folder first
	builds      : '',                    // the build notes table's text, which the build button opens
};
