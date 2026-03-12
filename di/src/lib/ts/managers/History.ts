import type { Portable_Scene } from './Versions';
import { scenes } from './Scenes';

const MAX_STACK = 50;

class History {
	private stack: Portable_Scene[] = [];
	private redo_stack: Portable_Scene[] = [];

	/** Capture current scene state before a mutation. */
	snapshot(): void {
		this.stack.push(structuredClone(scenes.capture()));
		if (this.stack.length > MAX_STACK) this.stack.shift();
		this.redo_stack.length = 0;
	}

	/** Pop the last snapshot and return it for restore. Pushes current state to redo. */
	undo(): Portable_Scene | null {
		if (this.stack.length === 0) return null;
		this.redo_stack.push(structuredClone(scenes.capture()));
		return this.stack.pop()!;
	}

	/** Pop the redo stack and return it for restore. Pushes current state to undo. */
	redo(): Portable_Scene | null {
		if (this.redo_stack.length === 0) return null;
		this.stack.push(structuredClone(scenes.capture()));
		return this.redo_stack.pop()!;
	}

	/** Reset both stacks (on file load / new scene). */
	clear(): void {
		this.stack.length = 0;
		this.redo_stack.length = 0;
	}

	get can_undo(): boolean { return this.stack.length > 0; }
	get can_redo(): boolean { return this.redo_stack.length > 0; }
}

export const history = new History();
