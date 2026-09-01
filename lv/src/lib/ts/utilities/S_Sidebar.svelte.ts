// Shared state for whether the sidebar is currently shown.
// On a wide screen, hiding the sidebar collapses it and gives all the room
// to the content. On a narrow screen, the state picks which of the two
// mobile modes is shown: sidebar-plus-status or content-plus-status.

import { loadSidebarVisible, saveSidebarVisible } from './Persistence';
import { customizations } from '../common/Customizations';

class S_Sidebar {
	// What was remembered from the last visit. Nothing reads it directly: the switch
	// below decides whether it counts at all.
	private remembered = $state<boolean>(loadSidebarVisible(false));

	// With the sidebar switched off there is nothing to show and no way to ask for it,
	// so a remembered yes is ignored — otherwise the content keeps a column's width of
	// space for a sidebar that is never drawn.
	get visible(): boolean {
		return customizations.enable_sidebar && this.remembered;
	}

	toggle(): void {
		if (!customizations.enable_sidebar) { return; }
		this.remembered = !this.remembered;
		saveSidebarVisible(this.remembered);
	}
}

export const s_sidebar = new S_Sidebar();
