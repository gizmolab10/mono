import { describe, test, expect, beforeEach } from 'vitest';
import { store }        from './store.svelte';
import { Thing }        from '../entities/Thing';
import { Relationship } from '../entities/Relationship';
import { T_Predicate }  from '../common/Enumerations';
import { DB_Test }       from '../db/DB_Test';

const BASE = 'test';
const db_test = new DB_Test();

async function load_test_data() {
	store.forget_all();
	await db_test.fetch_all();
}

describe('store', () => {
	beforeEach(() => store.forget_all());

	test('remember_thing stores a thing', () => {
		const t = new Thing(BASE, 'x', 'X');
		store.remember_thing(t);
		expect(store.things.get('x')).toBe(t);
	});

	test('remember_thing is idempotent', () => {
		const t = new Thing(BASE, 'x', 'X');
		store.remember_thing(t);
		store.remember_thing(t);
		expect(store.things.size).toBe(1);
	});

	test('add thing → children_of updates', () => {
		const parent = new Thing(BASE, 'p', 'Parent');
		const child  = new Thing(BASE, 'c', 'Child');
		const rel    = new Relationship(BASE, 'r', T_Predicate.contains, 'p', 'c', [0, 0]);

		store.remember_thing(parent);
		store.remember_thing(child);
		store.remember_relationship(rel);

		const kids = store.children_of('p');
		expect(kids).toHaveLength(1);
		expect(kids[0].id).toBe('c');
	});

	test('parents_of returns the parent', () => {
		const parent = new Thing(BASE, 'p', 'Parent');
		const child  = new Thing(BASE, 'c', 'Child');
		const rel    = new Relationship(BASE, 'r', T_Predicate.contains, 'p', 'c', [0, 0]);

		store.remember_thing(parent);
		store.remember_thing(child);
		store.remember_relationship(rel);

		const parents = store.parents_of('c');
		expect(parents).toHaveLength(1);
		expect(parents[0].id).toBe('p');
	});

	test('children_of ignores non-contains relationships', () => {
		const a   = new Thing(BASE, 'a', 'A');
		const b   = new Thing(BASE, 'b', 'B');
		const rel = new Relationship(BASE, 'r', T_Predicate.isRelated, 'a', 'b', [0, 0]);

		store.remember_thing(a);
		store.remember_thing(b);
		store.remember_relationship(rel);

		expect(store.children_of('a')).toHaveLength(0);
	});

	test('forget_thing removes it', () => {
		const t = new Thing(BASE, 'x', 'X');
		store.remember_thing(t);
		store.forget_thing(t.hid);
		expect(store.things.has('x')).toBe(false);
	});

	test('DB_Test.fetch_all builds 15 things and 14 relationships', async () => {
		await load_test_data();
		expect(store.things.size).toBe(15);
		expect(store.relationships.size).toBe(14);
	});

	test('DB_Test.fetch_all: root has 4 children', async () => {
		await load_test_data();
		expect(store.children_of('root')).toHaveLength(4);
	});

	test('DB_Test.fetch_all: Concepts has 3 children', async () => {
		await load_test_data();
		expect(store.children_of('a')).toHaveLength(3);
	});
});
