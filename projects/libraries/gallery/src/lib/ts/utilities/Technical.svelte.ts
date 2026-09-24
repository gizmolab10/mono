// Shared state for editing.
//
//   said       what the technical preference answers: nothing, false, or true
//   offered    the edit button shows at all — the preference said something
//   on         a file may be added, not only captions read and typed
//
// Editing is remembered, since writing a caption sends the page around again.
//
// Nothing is read while this file loads. The host sets the prefix its remembered values
// are saved under after its files load, so each answer is read when it is asked for.

import { loadEditing, loadTechnical, saveEditing } from './Persistence';

class Technical {
  get said(): boolean | null { return loadTechnical(); }
  get offered(): boolean { return this.said !== null; }
  get on(): boolean { return this.said === true; }

  // What a toggle here set, and nothing until the first one. Before that, editing is
  // whatever was remembered.
  private changed = $state<boolean | null>(null);

  get editing(): boolean {
    return this.changed ?? (this.offered && loadEditing());
  }

  toggle(): void {
    if (!this.offered) { return; }
    this.changed = !this.editing;
    saveEditing(this.changed);
    // Done: read the assets again. The page holds the list the build handed it,
    // and a photo written since then is not in it — only a fresh launch sees it.
    if (!this.changed) { location.reload(); }
  }
}

export const technical = new Technical();
