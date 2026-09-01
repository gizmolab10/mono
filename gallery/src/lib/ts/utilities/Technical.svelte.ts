// Shared state for editing, read once as the app launches.
//
//   said       what `gallery.technical` answers: nothing, false, or true
//   offered    the edit button shows at all — the preference said something
//   on         a file may be added, not only captions read and typed
//
// Editing is remembered, since writing a caption sends the page around again.

import { loadEditing, loadTechnical, saveEditing } from './Persistence';

class Technical {
  readonly said = loadTechnical();               // read at launch, never after
  readonly offered = this.said !== null;
  readonly on = this.said === true;
  editing = $state<boolean>(loadTechnical() !== null && loadEditing());

  toggle(): void {
    if (!this.offered) { return; }
    this.editing = !this.editing;
    saveEditing(this.editing);
    // Done: read the assets again. The page holds the list the build handed it,
    // and a photo written since then is not in it — only a fresh launch sees it.
    if (!this.editing) { location.reload(); }
  }
}

export const technical = new Technical();
