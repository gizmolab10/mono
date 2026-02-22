import { DB_Common, T_Database }                 from './DB_Common';
import { T_Persistence, T_Predicate, T_Thing }   from '../common/Enumerations';
import { Thing }                                  from '../entities/Thing';
import { Relationship }                           from '../entities/Relationship';
import { Predicate }                              from '../entities/Predicate';
import { store }                                  from '../store/store.svelte';

const BASE = 'test';

export class DB_Test extends DB_Common {
	t_persistence = T_Persistence.none;
	t_database    = T_Database.test;
	idBase        = BASE;

	async fetch_all(): Promise<void> {

		// ————————————————————————————————————————— Things

		const things: [string, string, string, T_Thing?][] = [
			['root',  'Root',       '#b4b4b4', T_Thing.root],
			['a',     'Concepts',   '#6ea8d9'],
			['a1',    'Ideas',      '#6ea8d9'],
			['a2',    'Principles', '#6ea8d9'],
			['a3',    'Models',     '#6ea8d9'],
			['b',     'Projects',   '#7bc47f'],
			['b1',    'Alpha',      '#7bc47f'],
			['b2',    'Beta',       '#7bc47f'],
			['c',     'People',     '#e8a86e'],
			['c1',    'Alice',      '#e8a86e'],
			['c2',    'Bob',        '#e8a86e'],
			['d',     'Resources',  '#b98fd9'],
			['d1',    'Books',      '#b98fd9'],
			['d2',    'Tools',      '#b98fd9'],
			['d3',    'Notes',      '#b98fd9'],
		];

		for (const [id, title, color, t_thing] of things) {
			store.remember_thing(new Thing(BASE, id, title, color, t_thing ?? T_Thing.generic));
		}

		// ————————————————————————————————————————— Relationships

		const edges: [string, string, string][] = [
			['r01', 'root', 'a'],
			['r02', 'root', 'b'],
			['r03', 'root', 'c'],
			['r04', 'root', 'd'],
			['r05', 'a',    'a1'],
			['r06', 'a',    'a2'],
			['r07', 'a',    'a3'],
			['r08', 'b',    'b1'],
			['r09', 'b',    'b2'],
			['r10', 'c',    'c1'],
			['r11', 'c',    'c2'],
			['r12', 'd',    'd1'],
			['r13', 'd',    'd2'],
			['r14', 'd',    'd3'],
		];

		for (const [id, parent, child] of edges) {
			store.remember_relationship(new Relationship(BASE, id, T_Predicate.contains, parent, child, [0, 0]));
		}

		// ————————————————————————————————————————— Predicates

		const predicateKinds: [string, boolean][] = [
			[T_Predicate.contains,    false],
			[T_Predicate.isRelated,   true],
			[T_Predicate.isTagged,    true],
			[T_Predicate.requires,    true],
			[T_Predicate.alliedWith,  true],
			[T_Predicate.appreciates, true],
			[T_Predicate.explainedBy, true],
			[T_Predicate.supportedBy, true],
		];

		for (const [kind, bidir] of predicateKinds) {
			store.remember_predicate(new Predicate(kind, kind, bidir));
		}
	}
}
