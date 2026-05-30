// Shared state for whether the sidebar is currently shown.
// On a wide screen, hiding the sidebar collapses it and gives all the room
// to the content. On a narrow screen, the state picks which of the two
// mobile modes is shown: sidebar-plus-status or content-plus-status.

class SidebarUI {
  visible = $state<boolean>(true);

  toggle(): void {
    this.visible = !this.visible;
  }
}

export const sidebar = new SidebarUI();
