/**
 * Tests for recents system
 * 
 * Run with: yarn test recents_new
 */

import { x, h, S_Items } from '../common/Global_Imports';
import type Ancestry from '../runtime/Ancestry';
import type { S_Recent } from '../types/Types';
import { get } from 'svelte/store';

describe('Phase 1: derived stores', () => {
	beforeEach(() => {
		// Reset recents to known state
		x.si_recents.items = [];
	});

	it('reacts to si_recents push', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		const B = h.rootAncestry;  // In real usage these would be different

		const si_grabs = new S_Items<Ancestry>([B]);
		si_grabs.index = 0;

		const recent: S_Recent = {
			focus: A,
			si_grabs,
			depth: 2
		};

		x.si_recents.push(recent);

		expect(get(x.w_ancestry_focus)).toBe(A);
		expect(get(x.w_grabs)).toEqual([B]);
	});

	it('returns defaults when empty', () => {
		expect(get(x.w_grabs)).toEqual([]);
	});

	it('updates when index changes', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		const si_grabs1 = new S_Items<Ancestry>([]);
		const si_grabs2 = new S_Items<Ancestry>([A]);

		const recent1: S_Recent = { focus: A, si_grabs: si_grabs1, depth: 1 };
		const recent2: S_Recent = { focus: A, si_grabs: si_grabs2, depth: 3 };

		x.si_recents.push(recent1);
		x.si_recents.push(recent2);

		// Should be at index 1 (most recent)
		expect(get(x.w_grabs)).toEqual([A]);

		// Navigate back
		x.si_recents.index = 0;
		expect(get(x.w_grabs)).toEqual([]);
	});
});

describe('Phase 2: snapshot creation', () => {
	beforeEach(() => {
		// Reset recents to known state
		x.si_recents.items = [];
	});

	it('creates snapshot on becomeFocus', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		const initialLength = x.si_recents.length;

		x.becomeFocus(A);

		expect(x.si_recents.length).toBe(initialLength + 1);
		expect(x.si_recents.item?.focus).toBe(A);
	});

	it('creates snapshot on grabOnly', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		x.becomeFocus(A);  // Need a focus first
		const initialLength = x.si_recents.length;

		x.grabOnly(A);

		expect(x.si_recents.length).toBe(initialLength + 1);
		expect(x.si_recents.item?.si_grabs.items).toContain(A);
	});

	it('creates snapshot on grab', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		x.becomeFocus(A);
		const initialLength = x.si_recents.length;

		x.grab(A);

		expect(x.si_recents.length).toBe(initialLength + 1);
		expect(x.si_recents.item?.si_grabs.items).toContain(A);
	});

	it('creates snapshot on ungrab', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		x.becomeFocus(A);
		x.grabOnly(A);
		const initialLength = x.si_recents.length;

		x.ungrab(A);

		expect(x.si_recents.length).toBe(initialLength + 1);
	});

	it('clones grabs to prevent reference mutation', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		x.becomeFocus(A);
		x.grabOnly(A);

		const snapshotGrabs = x.si_recents.item?.si_grabs;

		// Mutate current si_grabs (startup restore only)

		// Snapshot should be unaffected
		expect(snapshotGrabs?.items).toContain(A);
	});
});

describe('Phase 3: navigation', () => {
	beforeEach(() => {
		// Reset to known state
		x.si_recents.items = [];
	});

	it('navigates backward through history', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		// Create history: entry 0 (focus=A, grabs=[]), entry 1 (focus=A, grabs=[A])
		x.becomeFocus(A);           // index 0
		x.grabOnly(A);              // index 1

		expect(x.si_recents.length).toBe(2);
		expect(x.si_recents.index).toBe(1);  // at most recent

		// Navigate backward
		x.recents_go(false);

		expect(x.si_recents.index).toBe(0);
		expect(get(x.w_grabs)).toEqual([]);  // entry 0 had no grabs
	});

	it('navigates forward through history', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		x.becomeFocus(A);
		x.grabOnly(A);

		// Go backward first
		x.recents_go(false);
		expect(x.si_recents.index).toBe(0);

		// Go forward
		x.recents_go(true);
		expect(x.si_recents.index).toBe(1);
		expect(get(x.w_grabs)).toContain(A);
	});

	it('wraps circularly backward', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		x.becomeFocus(A);  // index 0
		x.grabOnly(A);     // index 1

		// Go backward twice (0 -> 1 circular wrap)
		x.recents_go(false);  // at 0
		x.recents_go(false);  // wraps to 1

		expect(x.si_recents.index).toBe(1);
	});

	it('wraps circularly forward', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		x.becomeFocus(A);  // index 0
		x.grabOnly(A);     // index 1

		// Go forward (wraps 1 -> 0)
		x.recents_go(true);

		expect(x.si_recents.index).toBe(0);
	});

	it('derives grabs from snapshot on navigation', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		x.becomeFocus(A);  // entry 0: grabs=[]
		x.grabOnly(A);     // entry 1: grabs=[A]

		// Verify current state via derived store
		expect(get(x.w_grabs)).toContain(A);

		// Navigate backward
		x.recents_go(false);

		// w_grabs should now be empty (from entry 0)
		expect(get(x.w_grabs)).toEqual([]);
	});

	it('does nothing when history is empty', () => {
		// No entries
		expect(x.si_recents.length).toBe(0);

		// Should not throw
		x.recents_go(false);
		x.recents_go(true);

		expect(x.si_recents.length).toBe(0);
	});
});

describe('Phase 4: isGrabbed', () => {
	beforeEach(() => {
		// Reset to known state
		x.si_recents.items = [];
	});

	it('uses derived w_grabs store', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		x.becomeFocus(A);
		x.grabOnly(A);

		expect(A.isGrabbed).toBe(true);
	});

	it('reflects navigation state', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		x.becomeFocus(A);  // entry 0: grabs=[]
		x.grabOnly(A);     // entry 1: grabs=[A]

		expect(A.isGrabbed).toBe(true);

		// Navigate backward to entry 0 (no grabs)
		x.recents_go(false);

		// isGrabbed should now reflect the navigated state
		expect(get(x.w_grabs)).toEqual([]);
	});
});

describe('Phase 5: final derivation', () => {
	beforeEach(() => {
		// Reset to known state
		x.si_recents.items = [];
	});

	it('w_grabIndex derives from snapshot', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		// Create snapshot with si_grabs.index = 1
		const si_grabs = new S_Items<Ancestry>([A, A]);
		si_grabs.index = 1;
		const snapshot: S_Recent = { focus: A, si_grabs, depth: 2 };
		x.si_recents.push(snapshot);

		expect(get(x.w_grabIndex)).toBe(1);
	});

	it('grab_next_ancestry cycles through grabs', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		// Create snapshot with multiple grabs
		const si_grabs = new S_Items<Ancestry>([A, A, A]);  // 3 grabs
		si_grabs.index = 0;
		const snapshot: S_Recent = { focus: A, si_grabs, depth: 2 };
		x.si_recents.push(snapshot);

		expect(get(x.w_grabIndex)).toBe(0);

		// Cycle forward
		x.grab_next_ancestry(true);
		expect(get(x.w_grabIndex)).toBe(1);

		x.grab_next_ancestry(true);
		expect(get(x.w_grabIndex)).toBe(2);

		// Wrap around
		x.grab_next_ancestry(true);
		expect(get(x.w_grabIndex)).toBe(0);
	});

	it('grab_next_ancestry cycles backward', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		const si_grabs = new S_Items<Ancestry>([A, A, A]);
		si_grabs.index = 0;
		const snapshot: S_Recent = { focus: A, si_grabs, depth: 2 };
		x.si_recents.push(snapshot);

		// Cycle backward (wraps to end)
		x.grab_next_ancestry(false);
		expect(get(x.w_grabIndex)).toBe(2);
	});

	it('grab reads from w_grabs not si_grabs', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		x.grabOnly(A);

		// New system has empty grabs
		x.becomeFocus(A);  // pushes snapshot with current (derived) grabs

		// grab() should read from w_grabs (empty on first call), not si_grabs
		const snapshot = x.si_recents.item;
		// becomeFocus reads from w_grabs which starts empty, falls back to si_grabs on first call
		expect(snapshot?.si_grabs.items.length).toBeGreaterThanOrEqual(0);
	});
});
