// Shared state for whether the sidebar is currently shown.
// On a wide screen, hiding the sidebar collapses it and gives all the room
// to the content. On a narrow screen, the state picks which of the two
// mobile modes is shown: sidebar-plus-status or content-plus-status.

import { loadSidebarVisible, saveSidebarVisible } from './Persistence';
import { customizations } from '../common/Customizations';

class S_Sidebar {
	// What a toggle here set, and nothing until the first one. Before that, what was
	// remembered from the last visit counts. Nothing is read while this file loads, so
	// the remembered value is read under the prefix the host set.
	private changed = $state<boolean | null>(null);

	private get remembered(): boolean {
		return this.changed ?? loadSidebarVisible(false);
	}

	// With the sidebar switched off there is nothing to show and no way to ask for it,
	// so a remembered yes is ignored — otherwise the content keeps a column's width of
	// space for a sidebar that is never drawn.
	get visible(): boolean {
		return customizations.enable_sidebar && this.remembered;
	}

	toggle(): void {
		if (!customizations.enable_sidebar) { return; }
		this.changed = !this.remembered;
		saveSidebarVisible(this.changed);
	}
}

export const s_sidebar = new S_Sidebar();
