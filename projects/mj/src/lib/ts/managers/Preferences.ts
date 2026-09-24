// What mj remembers between visits, and the names it saves them under. The way to read and
// write is core's; the keys and the prefix are mj's. Every key is saved as the prefix and
// the key, so show_details is saved as mj.show_details.

import { customizations } from '../common/Customizations';
import { Preferences } from '../common/Core';

export enum T_Preference {
	show_details     = 'show_details',		// the details column is shown
	preferences_open = 'preferences_open',	// the preferences section in it is open
	color_accent     = 'color_accent',		// the accent, picked in the preferences
	color_background = 'color_background',	// the page color behind everything, picked there too
}

export const preferences = new Preferences(customizations.prefix);
