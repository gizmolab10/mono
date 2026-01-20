/**
 * Tests for new recents system
 * 
 * Run with: yarn test recents_new
 */

import { x, h, g, S_Items, features } from '../common/Global_Imports';
import type { S_Recent } from '../state/S_Recent';
import type Ancestry from '../runtime/Ancestry';
import { get } from 'svelte/store';

describe('Phase 1: derived stores', () => {
	beforeEach(() => {
		// Reset new recents to known state
		x.si_recents_new.items = [];
	});

	it('reacts to si_recents_new push', () => {
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

		x.si_recents_new.push(recent);

		expect(get(x.w_focus_new)).toBe(A);
		expect(get(x.w_grabs_new)).toEqual([B]);
		expect(get(x.w_depth_new)).toBe(2);
	});

	it('returns defaults when empty', () => {
		expect(get(x.w_focus_new)).toBeNull();
		expect(get(x.w_grabs_new)).toEqual([]);
		expect(get(x.w_depth_new)).toBe(0);
	});

	it('updates when index changes', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		const si_grabs1 = new S_Items<Ancestry>([]);
		const si_grabs2 = new S_Items<Ancestry>([A]);

		const recent1: S_Recent = { focus: A, si_grabs: si_grabs1, depth: 1 };
		const recent2: S_Recent = { focus: A, si_grabs: si_grabs2, depth: 3 };

		x.si_recents_new.push(recent1);
		x.si_recents_new.push(recent2);

		// Should be at index 1 (most recent)
		expect(get(x.w_depth_new)).toBe(3);
		expect(get(x.w_grabs_new)).toEqual([A]);

		// Navigate back
		x.si_recents_new.index = 0;
		expect(get(x.w_depth_new)).toBe(1);
		expect(get(x.w_grabs_new)).toEqual([]);
	});
});

describe('Phase 2: snapshot creation', () => {
	beforeEach(() => {
		// Reset new recents to known state
		x.si_recents_new.items = [];
		x.si_grabs.items = [];
	});

	it('creates snapshot on becomeFocus', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		const initialLength = x.si_recents_new.length;

		x.becomeFocus(A);

		expect(x.si_recents_new.length).toBe(initialLength + 1);
		expect(x.si_recents_new.item?.focus).toBe(A);
	});

	it('creates snapshot on grabOnly', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		x.becomeFocus(A);  // Need a focus first
		const initialLength = x.si_recents_new.length;

		x.grabOnly(A);

		expect(x.si_recents_new.length).toBe(initialLength + 1);
		expect(x.si_recents_new.item?.si_grabs.items).toContain(A);
	});

	it('creates snapshot on grab', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		x.becomeFocus(A);
		const initialLength = x.si_recents_new.length;

		x.grab(A);

		expect(x.si_recents_new.length).toBe(initialLength + 1);
		expect(x.si_recents_new.item?.si_grabs.items).toContain(A);
	});

	it('creates snapshot on ungrab', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		x.becomeFocus(A);
		x.grabOnly(A);
		const initialLength = x.si_recents_new.length;

		x.ungrab(A);

		expect(x.si_recents_new.length).toBe(initialLength + 1);
	});

	it('clones grabs to prevent reference mutation', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		x.becomeFocus(A);
		x.grabOnly(A);

		const snapshotGrabs = x.si_recents_new.item?.si_grabs;

		// Mutate current grabs
		x.si_grabs.items = [];

		// Snapshot should be unaffected
		expect(snapshotGrabs?.items).toContain(A);
	});
});

describe('Phase 3: navigation', () => {
	beforeEach(() => {
		// Reset to known state
		x.si_recents_new.items = [];
		x.si_grabs.items = [];
	});

	it('navigates backward through history', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		// Create history: entry 0 (focus=A, grabs=[]), entry 1 (focus=A, grabs=[A])
		x.becomeFocus(A);           // index 0
		x.grabOnly(A);              // index 1

		expect(x.si_recents_new.length).toBe(2);
		expect(x.si_recents_new.index).toBe(1);  // at most recent

		// Navigate backward
		x.recents_go(false);

		expect(x.si_recents_new.index).toBe(0);
		expect(get(x.w_grabs_new)).toEqual([]);  // entry 0 had no grabs
	});

	it('navigates forward through history', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		x.becomeFocus(A);
		x.grabOnly(A);

		// Go backward first
		x.recents_go(false);
		expect(x.si_recents_new.index).toBe(0);

		// Go forward
		x.recents_go(true);
		expect(x.si_recents_new.index).toBe(1);
		expect(get(x.w_grabs_new)).toContain(A);
	});

	it('wraps circularly backward', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		x.becomeFocus(A);  // index 0
		x.grabOnly(A);     // index 1

		// Go backward twice (0 -> 1 circular wrap)
		x.recents_go(false);  // at 0
		x.recents_go(false);  // wraps to 1

		expect(x.si_recents_new.index).toBe(1);
	});

	it('wraps circularly forward', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		x.becomeFocus(A);  // index 0
		x.grabOnly(A);     // index 1

		// Go forward (wraps 1 -> 0)
		x.recents_go(true);

		expect(x.si_recents_new.index).toBe(0);
	});

	it('applies grabs to si_grabs on navigation', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		x.becomeFocus(A);  // entry 0: grabs=[]
		x.grabOnly(A);     // entry 1: grabs=[A]

		// Verify current state
		expect(x.si_grabs.items).toContain(A);

		// Navigate backward
		x.recents_go(false);

		// si_grabs should now be empty (from entry 0)
		expect(x.si_grabs.items).toEqual([]);
	});

	it('does nothing when history is empty', () => {
		// No entries
		expect(x.si_recents_new.length).toBe(0);

		// Should not throw
		x.recents_go(false);
		x.recents_go(true);

		expect(x.si_recents_new.length).toBe(0);
	});
});

describe('Phase 4: isGrabbed with flag', () => {
	beforeEach(() => {
		// Reset to known state
		x.si_recents_new.items = [];
		x.si_grabs.items = [];
	});

	afterEach(() => {
		// Reset flag after each test
		features.use_new_recents = false;
	});

	it('uses new system when flag is on', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		features.use_new_recents = true;

		x.becomeFocus(A);
		x.grabOnly(A);

		expect(A.isGrabbed).toBe(true);
	});

	it('uses old system when flag is off', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		features.use_new_recents = false;

		x.becomeFocus(A);
		x.grabOnly(A);

		expect(A.isGrabbed).toBe(true);
	});

	it('reflects navigation state when flag is on', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;
		features.use_new_recents = true;

		x.becomeFocus(A);  // entry 0: grabs=[]
		x.grabOnly(A);     // entry 1: grabs=[A]

		expect(A.isGrabbed).toBe(true);

		// Navigate backward to entry 0 (no grabs)
		x.recents_go(false);

		// isGrabbed should now reflect the navigated state
		expect(get(x.w_grabs_new)).toEqual([]);
	});
});

describe('Phase 4b: actual derivation', () => {
	beforeEach(() => {
		// Reset to known state
		x.si_recents_new.items = [];
		x.si_grabs.items = [];
		features.use_new_recents = true;
	});

	afterEach(() => {
		features.use_new_recents = false;
	});

	it('w_grabIndex_new derives from snapshot', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		// Create snapshot with si_grabs.index = 0
		const si_grabs = new S_Items<Ancestry>([A, A]);
		si_grabs.index = 1;
		const snapshot: S_Recent = { focus: A, si_grabs, depth: 2 };
		x.si_recents_new.push(snapshot);

		expect(get(x.w_grabIndex_new)).toBe(1);
	});

	it('grab_next_ancestry cycles through grabs', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		// Create snapshot with multiple grabs
		const si_grabs = new S_Items<Ancestry>([A, A, A]);  // 3 grabs
		si_grabs.index = 0;
		const snapshot: S_Recent = { focus: A, si_grabs, depth: 2 };
		x.si_recents_new.push(snapshot);

		expect(get(x.w_grabIndex_new)).toBe(0);

		// Cycle forward
		x.grab_next_ancestry(true);
		expect(get(x.w_grabIndex_new)).toBe(1);

		x.grab_next_ancestry(true);
		expect(get(x.w_grabIndex_new)).toBe(2);

		// Wrap around
		x.grab_next_ancestry(true);
		expect(get(x.w_grabIndex_new)).toBe(0);
	});

	it('grab_next_ancestry cycles backward', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		const si_grabs = new S_Items<Ancestry>([A, A, A]);
		si_grabs.index = 0;
		const snapshot: S_Recent = { focus: A, si_grabs, depth: 2 };
		x.si_recents_new.push(snapshot);

		// Cycle backward (wraps to end)
		x.grab_next_ancestry(false);
		expect(get(x.w_grabIndex_new)).toBe(2);
	});

	it('grab reads from w_grabs_new not si_grabs', () => {
		if (!h?.rootAncestry) return;

		const A = h.rootAncestry;

		// Put something in old si_grabs
		x.si_grabs.items = [A];

		// New system has empty grabs
		x.becomeFocus(A);  // pushes snapshot with current (derived) grabs

		// grab() should read from w_grabs_new (empty), not si_grabs
		const snapshot = x.si_recents_new.item;
		// When new system, becomeFocus reads from w_grabs_new which starts empty
		expect(snapshot?.si_grabs.items.length).toBe(0);
	});
});
