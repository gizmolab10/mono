export class Focus {
	handle_focus_cleanup: (() => void) | null = null;

	// written by ChatGPT

	get focused_element(): Element | null { return document.activeElement; }

	get focused_element_deep(): Element | null {
		let focused = this.focused_element;
		// Traverse shadow DOM if present
		while (focused && focused.shadowRoot && focused.shadowRoot.activeElement) {
			focused = focused.shadowRoot.activeElement;
		}
		return focused;
	}

	start_watching_focus(): void {
		if (!this.handle_focus_cleanup) {
			this.handle_focus_cleanup = this.watch_focus(this.log_focus.bind(this));
		}
	}

	stop_watching_focus() {
		if (!!this.handle_focus_cleanup) {
			this.handle_focus_cleanup();
			this.handle_focus_cleanup = null;
		}
	}

	log_focus(): void {
		const focused = this.focused_element_deep;
		if (focused) {
			console.log('Focused element:', focused);
			console.log('Tag name:', focused.tagName);
			console.log('ID:', focused.id);
			console.log('Class list:', focused.classList);
		} else {
			console.log('No element is focused');
		}
	}

	watch_focus(callback?: (focused_element: Element | null) => void): () => void {
		const handleFocus = () => {
			const focused = this.focused_element_deep;
			if (callback) {
				callback(focused);
			} else {
				console.log(`Focus moved to: ${focused?.tagName ?? 'none'}`);
			}
		};
		document.addEventListener('focusin', handleFocus);
		return () => document.removeEventListener('focusin', handleFocus);	// cleanup function
	}
}

export const focus = new Focus();
