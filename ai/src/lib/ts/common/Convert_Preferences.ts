// Imported by main.ts ahead of kb, so this runs before any kb module does: kb's facts are set
// here, the prefix among them, since kb's remembered stores read storage the moment kb is
// imported. Then every value ai's page saved under ov_, its prefix until 14 September 2026,
// comes under ai_, and the old keys go. The one file besides Kb.ts that reaches kb through its
// alias, for kb's customizations alone, which core_alias.test allows by name.

import { customizations as kb_customizations } from 'kb/ts/common/Customizations';
import { customizations } from './Customizations';
import { debug, Preferences } from './Core';
import buildsRaw from '../../md/builds.md?raw';

// kb draws ai, and reads ai's facts only when asked: what the controls row calls the host, what
// every remembered value is saved under, the host whose db the dispatcher answers from, the
// hierarchies the list offers, the build notes table, since step 7 of the plan the kinds, the
// tags and the tag areas, and since step 12 the kind and the tag a new or unlabeled file starts with, and the open buttons.
kb_customizations.name = customizations.name;
kb_customizations.prefix = customizations.prefix;
kb_customizations.host = customizations.host;
kb_customizations.hierarchies = customizations.hierarchies;
kb_customizations.builds = buildsRaw;
kb_customizations.kinds = customizations.kinds;
kb_customizations.tags = customizations.tags;
kb_customizations.tag_areas = customizations.tag_areas;
kb_customizations.kind_when_new = customizations.kind_when_new;
kb_customizations.tag_when_new = customizations.tag_when_new;
kb_customizations.open_buttons = customizations.open_buttons;

// What was remembered under the old prefix is remembered under ai's from now on.
const moved = new Preferences(customizations.prefix).adopt('ov_');
debug.log(`Preferences: ${moved} value(s) saved under ov_ now sit under ${customizations.prefix}, and no key begins with ov_.`);
