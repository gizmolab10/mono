import { describe, test, expect, beforeEach } from 'vitest';
import { Hierarchy }    from './Hierarchy.svelte';
import { Thing }        from '../entities/Thing';
import { Relationship } from '../entities/Relationship';
import { T_Predicate }  from '../common/Enumerations';
import { DB_Test }      from '../db/DB_Test';

const BASE = 'test';

describe('Hierarchy', () => {
	let h: Hierarchy;

	beforeEach(() => {
		h = new Hierarchy();
	});

	test('remember_thing stores a thing', () => {
		const t = new Thing(BASE, 'x', 'X');
		h.remember_thing(t);
		expect(h.things.get('x')).toBe(t);
	});

	test('remember_thing is idempotent', () => {
		const t = new Thing(BASE, 'x', 'X');
		h.remember_thing(t);
		h.remember_thing(t);
		expect(h.things.size).toBe(1);
	});

	test('add thing → children_of updates', () => {
		const parent = new Thing(BASE, 'p', 'Parent');
		const child  = new Thing(BASE, 'c', 'Child');
		const rel    = new Relationship(BASE, 'r', T_Predicate.contains, 'p', 'c', [0, 0]);

		h.remember_thing(parent);
		h.remember_thing(child);
		h.remember_relationship(rel);

		const kids = h.children_of('p');
		expect(kids).toHaveLength(1);
		expect(kids[0].id).toBe('c');
	});

	test('parents_of returns the parent', () => {
		const parent = new Thing(BASE, 'p', 'Parent');
		const child  = new Thing(BASE, 'c', 'Child');
		const rel    = new Relationship(BASE, 'r', T_Predicate.contains, 'p', 'c', [0, 0]);

		h.remember_thing(parent);
		h.remember_thing(child);
		h.remember_relationship(rel);

		const parents = h.parents_of('c');
		expect(parents).toHaveLength(1);
		expect(parents[0].id).toBe('p');
	});

	test('children_of ignores non-contains relationships', () => {
		const a   = new Thing(BASE, 'a', 'A');
		const b   = new Thing(BASE, 'b', 'B');
		const rel = new Relationship(BASE, 'r', T_Predicate.isRelated, 'a', 'b', [0, 0]);

		h.remember_thing(a);
		h.remember_thing(b);
		h.remember_relationship(rel);

		expect(h.children_of('a')).toHaveLength(0);
	});

	test('forget_thing removes it', () => {
		const t = new Thing(BASE, 'x', 'X');
		h.remember_thing(t);
		h.forget_thing(t.hid);
		expect(h.things.has('x')).toBe(false);
	});

	test('DB_Test.fetch_all builds 15 things and 14 relationships', async () => {
		const db = new DB_Test();
		await db.fetch_all();
		expect(db.hierarchy.things.size).toBe(15);
		expect(db.hierarchy.relationships.size).toBe(14);
	});

	test('DB_Test.fetch_all: root has 4 children', async () => {
		const db = new DB_Test();
		await db.fetch_all();
		expect(db.hierarchy.children_of('root')).toHaveLength(4);
	});

	test('DB_Test.fetch_all: Concepts has 3 children', async () => {
		const db = new DB_Test();
		await db.fetch_all();
		expect(db.hierarchy.children_of('a')).toHaveLength(3);
	});
});
