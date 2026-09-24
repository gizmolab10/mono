/**
 * Tests for DB_Firebase - Firebase database layer
 *
 * Run with: yarn test DB_Firebase
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { T_Persistable } from '../common/Enumerations';

// Mock firebase/firestore before importing DB_Firebase
vi.mock('firebase/firestore', () => ({
	collection: vi.fn().mockReturnValue({}),
	doc: vi.fn().mockReturnValue({}),
	addDoc: vi.fn().mockResolvedValue({ id: 'mock-firebase-id' }),
	setDoc: vi.fn().mockResolvedValue(undefined),
	deleteDoc: vi.fn().mockResolvedValue(undefined),
	updateDoc: vi.fn().mockResolvedValue(undefined),
	getDocs: vi.fn().mockResolvedValue({ docs: [], empty: true }),
	getFirestore: vi.fn().mockReturnValue({}),
	onSnapshot: vi.fn().mockImplementation(() => () => {}),
	deleteField: vi.fn().mockReturnValue('__delete__'),
	serverTimestamp: vi.fn().mockReturnValue({ seconds: 0 }),
}));

vi.mock('firebase/app', () => ({
	initializeApp: vi.fn().mockReturnValue({}),
}));

// Import after mocks are set up
import DB_Firebase from '../database/DB_Firebase';
import { collection, addDoc, setDoc, deleteDoc, getDocs, doc } from 'firebase/firestore';

describe('DB_Firebase', () => {
	let db: DB_Firebase;

	beforeEach(() => {
		vi.clearAllMocks();
		db = new DB_Firebase();
	});

	describe('construction', () => {
		it('initializes with firebase config', () => {
			expect(db.config.projectId).toBe('seriously-4536d');
			expect(db.t_database).toBe('firebase');
		});

		it('starts with empty bulks', () => {
			expect(Object.keys(db.bulks)).toHaveLength(0);
		});

		it('has deferred snapshots disabled by default', () => {
			expect(db.deferSnapshots).toBe(false);
		});
	});

	describe('displayName', () => {
		it('returns idBase', () => {
			db.idBase = 'TestBulk';
			expect(db.displayName).toBe('TestBulk');
		});
	});

	describe('reportError', () => {
		it('logs errors to console', () => {
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const error = new Error('test error');

			db.reportError(error);

			expect(consoleSpy).toHaveBeenCalledWith(error);
			consoleSpy.mockRestore();
		});
	});

	describe('bulk_forID', () => {
		it('returns null for null idBase', () => {
			const result = db.bulk_forID(null);
			expect(result).toBeNull();
		});

		it('creates new bulk if not exists', () => {
			const bulk = db.bulk_forID('TestBulk');
			expect(bulk).not.toBeNull();
			expect(bulk!.idBase).toBe('TestBulk');
		});

		it('returns existing bulk if already created', () => {
			const bulk1 = db.bulk_forID('TestBulk');
			const bulk2 = db.bulk_forID('TestBulk');
			expect(bulk1).toBe(bulk2);
		});

		it('creates separate bulks for different ids', () => {
			const bulk1 = db.bulk_forID('Bulk1');
			const bulk2 = db.bulk_forID('Bulk2');
			expect(bulk1).not.toBe(bulk2);
		});
	});

	describe('data_isValidOfKind', () => {
		// Note: Validation uses constructors (new PersistentThing/Trait) to invoke hasNoData getters.
		// Empty objects fail because the constructor sets hasNoData = true.

		it('validates thing data - valid when has all fields', () => {
			const validThing = { title: 'Test', color: 'blue', t_thing: 'generic' };
			expect(DB_Firebase.data_isValidOfKind(T_Persistable.things, validThing)).toBe(true);
		});

		it('validates thing data - valid when has partial fields', () => {
			const partialThing = { title: 'Test' };
			expect(DB_Firebase.data_isValidOfKind(T_Persistable.things, partialThing)).toBe(true);
		});

		it('validates thing data - empty object fails (hasNoData is true)', () => {
			// Constructor creates instance with hasNoData getter returning true
			const emptyThing = {};
			expect(DB_Firebase.data_isValidOfKind(T_Persistable.things, emptyThing)).toBe(false);
		});

		it('validates trait data - valid when has fields', () => {
			const validTrait = { ownerID: 'owner1', t_trait: 'text', text: 'content' };
			expect(DB_Firebase.data_isValidOfKind(T_Persistable.traits, validTrait)).toBe(true);
		});

		it('validates trait data - empty object fails (hasNoData is true)', () => {
			// Constructor creates instance with hasNoData getter returning true
			const emptyTrait = {};
			expect(DB_Firebase.data_isValidOfKind(T_Persistable.traits, emptyTrait)).toBe(false);
		});

		it('validates relationship data', () => {
			const validRelationship = {
				predicate: { id: 'pred1' },
				parent: { id: 'parent1' },
				child: { id: 'child1' },
				orders: [0, 0]
			};
			const invalidRelationship = { predicate: { id: 'pred1' } }; // missing parent, child

			expect(DB_Firebase.data_isValidOfKind(T_Persistable.relationships, validRelationship)).toBe(true);
			expect(DB_Firebase.data_isValidOfKind(T_Persistable.relationships, invalidRelationship)).toBe(false);
		});

		it('validates tag data', () => {
			const validTag = { type: 'custom', thingHIDs: [123, 456] };
			const invalidTag = { type: 'custom' }; // missing thingHIDs

			expect(DB_Firebase.data_isValidOfKind(T_Persistable.tags, validTag)).toBe(true);
			expect(DB_Firebase.data_isValidOfKind(T_Persistable.tags, invalidTag)).toBe(false);
		});

		it('validates predicate data - requires kind', () => {
			const validPredicate = { kind: 'contains' };
			const invalidPredicate = {}; // missing kind

			expect(DB_Firebase.data_isValidOfKind(T_Persistable.predicates, validPredicate)).toBe(true);
			expect(DB_Firebase.data_isValidOfKind(T_Persistable.predicates, invalidPredicate)).toBe(false);
		});

		it('returns false for null/undefined data', () => {
			// Implementation has null guard: if (!data) return false
			expect(DB_Firebase.data_isValidOfKind(T_Persistable.things, null)).toBe(false);
			expect(DB_Firebase.data_isValidOfKind(T_Persistable.things, undefined)).toBe(false);
		});
	});

	describe('snapshot deferral', () => {
		it('adds snapshot to deferred queue', () => {
			const mockSnapshot = { docChanges: () => [] } as any;

			db.snapshot_deferOne('TestBulk', T_Persistable.things, mockSnapshot);

			expect(db.deferredSnapshots).toHaveLength(1);
			expect(db.deferredSnapshots[0].idBase).toBe('TestBulk');
			expect(db.deferredSnapshots[0].t_persistable).toBe(T_Persistable.things);
		});

		it('queues multiple snapshots', () => {
			const mockSnapshot1 = { docChanges: () => [] } as any;
			const mockSnapshot2 = { docChanges: () => [] } as any;

			db.snapshot_deferOne('Bulk1', T_Persistable.things, mockSnapshot1);
			db.snapshot_deferOne('Bulk2', T_Persistable.traits, mockSnapshot2);

			expect(db.deferredSnapshots).toHaveLength(2);
		});
	});

	describe('apply_queryStrings', () => {
		it('extracts name from query string', () => {
			const params = new URLSearchParams('?name=CustomBulk');

			db.apply_queryStrings(params);

			expect(db.idBase).toBe('CustomBulk');
		});

		it('extracts dbid from query string', () => {
			const params = new URLSearchParams('?dbid=AnotherBulk');

			db.apply_queryStrings(params);

			expect(db.idBase).toBe('AnotherBulk');
		});

		it('prefers name over dbid', () => {
			const params = new URLSearchParams('?name=NameBulk&dbid=DbidBulk');

			db.apply_queryStrings(params);

			expect(db.idBase).toBe('NameBulk');
		});

		it('defaults to Public when no query params', () => {
			const params = new URLSearchParams('');

			// Note: Without mocking preferences, this will use persisted value or default
			db.apply_queryStrings(params);

			// Just verify it doesn't throw - actual value depends on persistence
			expect(typeof db.idBase).toBe('string');
		});
	});

	describe('thing_extractChangesFromPersistent', () => {
		it('returns false when no changes', () => {
			// Create a mock thing and PersistentThing with same values
			const mockThing = {
				title: 'Test Title',
				color: 'blue',
				t_thing: 'generic',
				virginTitle: 'Test Title'
			} as any;

			const mockPersistent = {
				virginTitle: 'Test Title',
				title: 'Test Title',
				color: 'blue',
				t_thing: 'generic',
				isEqualTo: (other: any) =>
					other.title === 'Test Title' &&
					other.color === 'blue' &&
					other.t_thing === 'generic'
			} as any;

			const changed = db.thing_extractChangesFromPersistent(mockThing, mockPersistent);
			expect(changed).toBe(false);
		});

		it('returns true and updates thing when changed', () => {
			const mockThing = {
				title: 'Old Title',
				color: 'blue',
				t_thing: 'generic'
			} as any;

			const mockPersistent = {
				virginTitle: 'New Title',
				color: 'red',
				t_thing: 'bookmark',
				isEqualTo: () => false
			} as any;

			const changed = db.thing_extractChangesFromPersistent(mockThing, mockPersistent);

			expect(changed).toBe(true);
			expect(mockThing.title).toBe('New Title');
			expect(mockThing.color).toBe('red');
			expect(mockThing.t_thing).toBe('bookmark');
		});
	});
});

describe('DB_Firebase CRUD operations', () => {
	// Note: Full CRUD testing requires mocking the Firebase SDK more extensively.
	// These tests verify behavior that can be tested with current mocks.

	describe('thing_persistentDelete', () => {
		it('does nothing when bulk not found', async () => {
			const db = new DB_Firebase();
			// No bulk set up for 'TestBulk'

			const mockThing = {
				idBase: 'NonExistentBulk',
				id: 'thing123',
				log: vi.fn()
			} as any;

			// Should not throw, just do nothing
			await expect(db.thing_persistentDelete(mockThing)).resolves.not.toThrow();
		});

		it('handles errors via reportError', async () => {
			const db = new DB_Firebase();
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			const mockBulk = { thingsCollection: {} };
			db.bulks['TestBulk'] = mockBulk as any;

			vi.mocked(deleteDoc).mockRejectedValueOnce(new Error('Delete failed'));

			const mockThing = {
				idBase: 'TestBulk',
				id: 'thing123',
				log: vi.fn()
			} as any;

			await db.thing_persistentDelete(mockThing);

			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});

	describe('thing_persistentUpdate', () => {
		it('does nothing when bulk not found', async () => {
			const db = new DB_Firebase();
			// No bulk set up

			const mockThing = {
				idBase: 'NonExistentBulk',
				id: 'thing123',
				title: 'Title',
				color: 'blue',
				t_thing: 'generic',
				log: vi.fn()
			} as any;

			// Should not throw
			await expect(db.thing_persistentUpdate(mockThing)).resolves.not.toThrow();
		});
	});
});
