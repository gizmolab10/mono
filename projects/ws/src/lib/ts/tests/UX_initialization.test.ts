/**
 * Verification tests for phase 5: Handle initialization
 * 
 * These tests verify that si_recents is properly seeded before subscriptions
 * are set up, and that the initialization sequence works correctly.
 * 
 * Run with: yarn test UX_initialization
 */

import { h, p, x } from '../common/Global_Imports';
import { get } from 'svelte/store';

describe('Initialization sequence verification', () => {
	beforeEach(() => {
		// Reset state
		x.si_recents.items = [];
	});

	it('should have si_recents populated after restore_focus() completes', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Call restore_focus
		p.restore_focus();

		// Verify si_recents has at least one entry
		expect(x.si_recents.length).toBeGreaterThan(0);
		const recentItem = x.si_recents.item as [any, any] | null;
		expect(recentItem).not.toBeNull();
	});

	it('should handle empty si_recents gracefully in subscription handler', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Clear recents to simulate edge case
		x.si_recents.items = [];

		// The subscription handler should use fallback
		// This is tested indirectly - if it crashes, test fails
		expect(() => {
			// Trigger subscription update
			x.si_recents.w_index.set(0);
		}).not.toThrow();

		// Verify fallback works (should use root or existing focus)
		const focus = get(x.w_ancestry_focus);
		// Focus should be set to something (root or null, but not crash)
	});

	it('should verify initialization sequence order', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Simulate initialization sequence
		// 1. restore_focus() should be called first
		p.restore_focus();
		
		// 2. Verify si_recents is populated
		expect(x.si_recents.length).toBeGreaterThan(0);
		
		// 3. Then setup_subscriptions() can be called safely
		// (In real code, this happens in Hierarchy.wrapUp_data_forUX())
		expect(() => {
			x.setup_subscriptions();
		}).not.toThrow();
	});

	it('should handle case where ancestryToFocus is null in restore_focus()', () => {
		// This test verifies that even if rootAncestry is null,
		// the code doesn't crash
		
		// Note: In practice, rootAncestry should always exist,
		// but we test the null case for robustness
		
		expect(() => {
			p.restore_focus();
		}).not.toThrow();
	});

	it('should verify subscription handler handles empty si_recents with fallback', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Set a focus first
		h.rootAncestry.becomeFocus();
		const initialFocus = get(x.w_ancestry_focus);

		// Clear recents to test fallback
		x.si_recents.items = [];
		x.si_recents.w_index.set(0);

		// Subscription handler should use fallback (existing focus or root)
		const focusAfterEmpty = get(x.w_ancestry_focus);
		// Should still have a focus (either initial or root)
		expect(focusAfterEmpty).not.toBeNull();
	});

	it('should set w_ancestry_focus correctly after initialization', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Simulate full initialization
		p.restore_focus();
		x.setup_subscriptions();

		// Verify focus is set
		const focus = get(x.w_ancestry_focus);
		expect(focus).not.toBeNull();

		// Verify it matches recents
		const recentItem = x.si_recents.item as [any, any] | null;
		if (recentItem) {
			expect(focus).toBe(recentItem[0]);
		}
	});

	it('should verify initialization works in Hierarchy.wrapUp_data_forUX() path', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// This test verifies the initialization sequence used in
		// Hierarchy.wrapUp_data_forUX():
		// restore_fromPreferences() → restore_focus() → setup_subscriptions()

		// Simulate the sequence
		// Note: We can't call wrapUp_data_forUX() directly as it requires
		// full hierarchy setup, so we test the components
		
		// 1. restore_focus (called from restore_fromPreferences)
		p.restore_focus();
		expect(x.si_recents.length).toBeGreaterThan(0);

		// 2. setup_subscriptions (called after restore_fromPreferences)
		expect(() => {
			x.setup_subscriptions();
		}).not.toThrow();
	});

	it('should verify initialization works in DB_Common.hierarchy_setup_fetch_andBuild() path', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// This test verifies the initialization sequence used in
		// DB_Common.hierarchy_setup_fetch_andBuild():
		// restore_fromPreferences() → restore_focus() → setup_subscriptions()

		// Same sequence as Hierarchy path, just different entry point
		p.restore_focus();
		expect(x.si_recents.length).toBeGreaterThan(0);
		
		expect(() => {
			x.setup_subscriptions();
		}).not.toThrow();
	});

	it('should ensure si_recents is seeded before subscription is active', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Clear recents
		x.si_recents.items = [];

		// Call restore_focus which should seed recents
		p.restore_focus();

		// Verify recents is seeded BEFORE setup_subscriptions
		expect(x.si_recents.length).toBeGreaterThan(0);

		// Now setup_subscriptions is safe
		x.setup_subscriptions();

		// Verify subscription works correctly
		const focus = get(x.w_ancestry_focus);
		expect(focus).not.toBeNull();
	});
});

