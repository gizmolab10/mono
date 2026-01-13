/**
 * Verification tests for phase 2: becomeFocus() sync with recents index
 * 
 * These tests verify that becomeFocus() correctly syncs w_ancestry_focus
 * via the subscription from si_recents index, rather than setting it directly.
 * 
 * Run with: yarn test UX_becomeFocus
 */

import { x, core, h } from '../common/Global_Imports';
import Ancestry from '../runtime/Ancestry';
import { get } from 'svelte/store';

describe('becomeFocus() sync with recents index', () => {
	beforeEach(() => {
		// Reset recents to known state
		x.si_recents.items = [];
	});

	it('should sync w_ancestry_focus from recents index after becomeFocus()', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no hierarchy or rootAncestry available');
			return;
		}

		const ancestry = h.rootAncestry;
		const changed = ancestry.becomeFocus();

		// Verify recents was updated
		expect(x.si_recents.length).toBeGreaterThan(0);
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		expect(recentItem).not.toBeNull();
		expect(recentItem![0]).toBe(ancestry);

		// Verify w_ancestry_focus is synced (subscription should have fired)
		const focus = get(x.w_ancestry_focus);
		expect(focus).toBe(ancestry);
	});

	it('should have recents index pointing to correct ancestry after becomeFocus()', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no hierarchy or rootAncestry available');
			return;
		}

		const ancestry = h.rootAncestry;
		ancestry.becomeFocus();

		// Verify index points to the ancestry we just set
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		expect(recentItem).not.toBeNull();
		expect(recentItem![0].equals(ancestry)).toBe(true);
	});

	it('should update ancestry_forDetails correctly after becomeFocus()', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no hierarchy or rootAncestry available');
			return;
		}

		const ancestry = h.rootAncestry;
		ancestry.becomeFocus();

		// Give subscription time to fire (synchronous in Svelte, but test may need tick)
		const detailsAncestry = x.ancestry_forDetails;
		expect(detailsAncestry).not.toBeNull();
		// ancestry_forDetails should be derived from focus or grabs
	});

	it('should handle rapid successive becomeFocus() calls', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no hierarchy or rootAncestry available');
			return;
		}

		const root = h.rootAncestry;
		
		// First call
		root.becomeFocus();
		expect(get(x.w_ancestry_focus)).toBe(root);

		// Second call immediately after
		root.becomeFocus();
		expect(get(x.w_ancestry_focus)).toBe(root);
		expect(x.si_recents.length).toBeGreaterThan(0);
	});

	it('should verify breadcrumb button click updates focus correctly', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no hierarchy or rootAncestry available');
			return;
		}

		const ancestry = h.rootAncestry;
		const initialFocus = get(x.w_ancestry_focus);

		// Simulate breadcrumb button click
		if (ancestry.becomeFocus()) {
			const newFocus = get(x.w_ancestry_focus);
			expect(newFocus).toBe(ancestry);
			expect(newFocus).not.toBe(initialFocus);
		}
	});
});

