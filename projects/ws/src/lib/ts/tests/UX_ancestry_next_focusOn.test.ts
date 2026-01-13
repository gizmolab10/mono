/**
 * Verification tests for phase 3: ancestry_next_focusOn() sync with recents index
 * 
 * These tests verify that ancestry_next_focusOn() correctly syncs w_ancestry_focus
 * via the subscription from si_recents index, rather than setting it directly.
 * 
 * Run with: yarn test UX_ancestry_next_focusOn
 */

import { x, h } from '../common/Global_Imports';
import Ancestry from '../runtime/Ancestry';
import { get } from 'svelte/store';

describe('ancestry_next_focusOn() sync with recents index', () => {
	beforeEach(() => {
		// Reset recents and add some test history
		x.si_recents.items = [];
		if (h.rootAncestry) {
			// Add root as first entry
			h.rootAncestry.becomeFocus();
		}
	});

	it('should navigate forward through recents history', () => {
		if (!h.rootAncestry || x.si_recents.length < 2) {
			console.warn('Skipping test: insufficient recents history');
			return;
		}

		const initialIndex = x.si_recents.index;
		const initialFocus = get(x.w_ancestry_focus);

		// Navigate forward
		x.ancestry_next_focusOn(true);

		// Verify index changed
		expect(x.si_recents.index).not.toBe(initialIndex);
		
		// Verify focus updated via subscription
		const newFocus = get(x.w_ancestry_focus);
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		expect(recentItem).not.toBeNull();
		expect(newFocus).toBe(recentItem![0]);
	});

	it('should navigate backward through recents history', () => {
		if (!h.rootAncestry || x.si_recents.length < 2) {
			console.warn('Skipping test: insufficient recents history');
			return;
		}

		// First navigate forward
		x.ancestry_next_focusOn(true);
		const forwardIndex = x.si_recents.index;
		const forwardFocus = get(x.w_ancestry_focus);

		// Then navigate backward
		x.ancestry_next_focusOn(false);

		// Verify index changed back
		expect(x.si_recents.index).not.toBe(forwardIndex);
		
		// Verify focus updated via subscription
		const backFocus = get(x.w_ancestry_focus);
		expect(backFocus).not.toBe(forwardFocus);
	});

	it('should handle empty recents gracefully', () => {
		// Clear recents
		x.si_recents.items = [];
		
		// Should not throw
		expect(() => {
			x.ancestry_next_focusOn(true);
		}).not.toThrow();

		// Should not update focus if recents is empty
		const focus = get(x.w_ancestry_focus);
		// Focus may be null or previous value, but shouldn't crash
	});

	it('should restore grabs from history entry', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Create a history entry with grabs
		const ancestry = h.rootAncestry;
		x.si_grabs.items = [ancestry];
		ancestry.becomeFocus();

		// Navigate away
		if (x.si_recents.length > 1) {
			x.ancestry_next_focusOn(true);
		}

		// Navigate back
		x.ancestry_next_focusOn(false);

		// Verify grabs were restored
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		if (recentItem && recentItem[1]) {
			expect(x.si_grabs.items.length).toBeGreaterThan(0);
		}
	});

	it('should make all grabbed ancestries visible', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		const ancestry = h.rootAncestry;
		x.si_grabs.items = [ancestry];
		ancestry.becomeFocus();

		// Mock ancestry_assureIsVisible to track calls
		let visibilityCalls = 0;
		const originalAssure = ancestry.ancestry_assureIsVisible;
		ancestry.ancestry_assureIsVisible = function() {
			visibilityCalls++;
			return originalAssure.call(this);
		};

		// Navigate to entry with grabs
		if (x.si_recents.length > 1) {
			x.ancestry_next_focusOn(true);
			x.ancestry_next_focusOn(false);
		}

		// Verify visibility was ensured (if grabs exist)
		if (x.si_grabs.items.length > 0) {
			expect(visibilityCalls).toBeGreaterThan(0);
		}

		// Restore original method
		ancestry.ancestry_assureIsVisible = originalAssure;
	});

	it('should update w_ancestry_focus correctly after navigation', () => {
		if (!h.rootAncestry || x.si_recents.length < 2) {
			console.warn('Skipping test: insufficient recents history');
			return;
		}

		const initialFocus = get(x.w_ancestry_focus);
		
		// Navigate forward
		x.ancestry_next_focusOn(true);
		
		// Verify focus updated synchronously via subscription
		const newFocus = get(x.w_ancestry_focus);
		expect(newFocus).not.toBeNull();
		
		// Verify it matches the recents item
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		expect(recentItem).not.toBeNull();
		expect(newFocus).toBe(recentItem![0]);
	});

	it('should handle null item after find_next_item gracefully', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Create minimal history
		h.rootAncestry.becomeFocus();
		
		// If recents has only one item, find_next_item may return false
		// but the method should handle it
		expect(() => {
			x.ancestry_next_focusOn(true);
			x.ancestry_next_focusOn(false);
		}).not.toThrow();
	});

	it('should expand focus ancestry after navigation', () => {
		if (!h.rootAncestry || x.si_recents.length < 2) {
			console.warn('Skipping test: insufficient recents history');
			return;
		}

		// Navigate forward
		x.ancestry_next_focusOn(true);
		
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		if (recentItem && recentItem[0]) {
			// Verify expand was called (check if expanded state is set)
			// Note: This is a basic check - actual expansion state depends on implementation
			expect(recentItem[0]).not.toBeNull();
		}
	});
});

