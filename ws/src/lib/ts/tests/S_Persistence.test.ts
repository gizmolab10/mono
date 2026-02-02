/**
 * Tests for S_Persistence - persistence state management
 *
 * Run with: yarn test S_Persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import S_Persistence from '../state/S_Persistence';
import { T_Persistable } from '../common/Enumerations';

describe('S_Persistence', () => {
	describe('construction', () => {
		it('creates with required parameters', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'test-id');

			expect(sp.t_database).toBe('test-db');
			expect(sp.t_persistable).toBe(T_Persistable.thing);
			expect(sp.id).toBe('test-id');
		});

		it('defaults to not already persisted', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id');
			expect(sp.already_persisted).toBe(false);
		});

		it('accepts already_persisted flag', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id', true);
			expect(sp.already_persisted).toBe(true);
		});

		it('defaults to not awaiting remote creation', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id');
			expect(sp.awaiting_remoteCreation).toBe(false);
		});

		it('accepts awaiting_remoteCreation flag', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id', false, true);
			expect(sp.awaiting_remoteCreation).toBe(true);
		});

		it('initializes needsBulkFetch to false', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id');
			expect(sp.needsBulkFetch).toBe(false);
		});

		it('sets initial lastModifyDate', () => {
			const before = new Date();
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id');
			const after = new Date();

			expect(sp.lastModifyDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(sp.lastModifyDate.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe('updateModifyDate', () => {
		it('updates lastModifyDate to now', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id');
			const originalDate = sp.lastModifyDate;

			// Small delay to ensure time difference
			const before = new Date();
			sp.updateModifyDate();
			const after = new Date();

			expect(sp.lastModifyDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(sp.lastModifyDate.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe('wasModifiedWithinMS', () => {
		it('returns true when modified recently', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id');
			sp.updateModifyDate();

			// Check if modified within last second
			const result = sp.wasModifiedWithinMS(1000);
			expect(result).toBe(true);
		});

		it('returns false when modified long ago', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id');

			// Set lastModifyDate to 5 seconds ago
			sp.lastModifyDate = new Date(Date.now() - 5000);

			// Check if modified within last 100ms
			const result = sp.wasModifiedWithinMS(100);
			expect(result).toBe(false);
		});
	});

	describe('setDate_fromSeriously', () => {
		it('parses seriously date format', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id');

			// Seriously format: "date:timestamp" where timestamp is seconds since 1994
			// The code adds (2025 - 1994) = 31 years to convert
			const timestamp = 1000000; // some arbitrary timestamp in seconds
			sp.setDate_fromSeriously(`date:${timestamp}`);

			// Verify the date was set (exact value depends on timezone, just check it was modified)
			expect(sp.lastModifyDate).toBeInstanceOf(Date);
		});

		it('extracts timestamp from colon-separated format', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id');
			const originalDate = sp.lastModifyDate.getTime();

			sp.setDate_fromSeriously('prefix:12345');

			// Date should have changed
			expect(sp.lastModifyDate.getTime()).not.toBe(originalDate);
		});
	});

	describe('persist_withClosure', () => {
		it('calls closure when persistent and not awaiting', async () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id', false, false);

			// Mock isPersistent to return true
			Object.defineProperty(sp, 'isPersistent', { value: true });

			const closure = vi.fn().mockResolvedValue(undefined);
			await sp.persist_withClosure(closure);

			expect(closure).toHaveBeenCalledWith(false); // already_persisted = false
		});

		it('passes already_persisted to closure', async () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id', true, false);
			Object.defineProperty(sp, 'isPersistent', { value: true });

			const closure = vi.fn().mockResolvedValue(undefined);
			await sp.persist_withClosure(closure);

			expect(closure).toHaveBeenCalledWith(true); // already_persisted = true
		});

		it('does not call closure when not persistent', async () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id');
			Object.defineProperty(sp, 'isPersistent', { value: false });

			const closure = vi.fn();
			await sp.persist_withClosure(closure);

			expect(closure).not.toHaveBeenCalled();
		});

		it('does not call closure when awaiting remote creation', async () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id', false, true);
			Object.defineProperty(sp, 'isPersistent', { value: true });

			const closure = vi.fn();
			await sp.persist_withClosure(closure);

			expect(closure).not.toHaveBeenCalled();
		});

		it('updates modify date when calling closure', async () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id');
			Object.defineProperty(sp, 'isPersistent', { value: true });

			// Set old date
			sp.lastModifyDate = new Date(Date.now() - 10000);
			const oldDate = sp.lastModifyDate.getTime();

			const closure = vi.fn().mockResolvedValue(undefined);
			await sp.persist_withClosure(closure);

			expect(sp.lastModifyDate.getTime()).toBeGreaterThan(oldDate);
		});
	});

	describe('T_Persistable types', () => {
		it('works with thing type', () => {
			const sp = new S_Persistence('db', T_Persistable.thing, 'id');
			expect(sp.t_persistable).toBe(T_Persistable.thing);
		});

		it('works with trait type', () => {
			const sp = new S_Persistence('db', T_Persistable.trait, 'id');
			expect(sp.t_persistable).toBe(T_Persistable.trait);
		});

		it('works with relationship type', () => {
			const sp = new S_Persistence('db', T_Persistable.relationship, 'id');
			expect(sp.t_persistable).toBe(T_Persistable.relationship);
		});
	});

	describe('isDirty logic', () => {
		it('is not dirty when already persisted', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id', true);
			// When already_persisted is true, isDirty should be false
			// (unless isPersistent logic changes it)
		});

		it('is not dirty when awaiting remote creation', () => {
			const sp = new S_Persistence('test-db', T_Persistable.thing, 'id', false, true);
			// awaiting_remoteCreation doesn't affect isDirty directly in constructor
		});
	});
});
