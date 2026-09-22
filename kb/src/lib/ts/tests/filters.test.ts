import { T_Picking, foot_is_all_folds, inverted, kept_from, tags_match, words_match, ordered_tags } from '../managers/Filters';
import { folder_matches } from '../managers/Filters';
import { folder_of, T_Bundle, type File } from '../types/File';
import { describe, expect, it } from 'vitest';

describe('the foot of a stack of rows', () => {
	it('is all folds only when both the kinds and the tags are folded away', () => {
		expect(foot_is_all_folds(true, true)).toBe(true);
	});

	it('is not, while the kinds stand open', () => {
		expect(foot_is_all_folds(false, true)).toBe(false);
	});

	it('is not, while the tags stand open', () => {
		expect(foot_is_all_folds(true, false)).toBe(false);
	});

	it('is not, with neither folded', () => {
		expect(foot_is_all_folds(false, false)).toBe(false);
	});
});

// What the search field looks in: a file's own name as well as its title and its brief. The
// three disagree often enough — a file called "assessment of our guides" whose title still
// reads "Synopsis of the Shared Guides" is found by either word.

describe('the words looked for', () => {
	const found = (words: string) => words_match(words, 'assessment of our guides', 'Synopsis of the Shared Guides', 'A hand-kept rundown.');

	it('lets everything through when nothing is typed', () => {
		expect(words_match('', 'a', 'b', 'c')).toBe(true);
		expect(words_match('   ', 'a', 'b', 'c')).toBe(true);
	});

	it('finds a file by its own name', () => {
		expect(found('asse')).toBe(true);
	});

	it('finds it by its title and by its brief too', () => {
		expect(found('synopsis')).toBe(true);
		expect(found('rundown')).toBe(true);
	});

	it('ignores which letters are capital', () => {
		expect(found('SYNOPSIS')).toBe(true);
		expect(found('ASSESSMENT')).toBe(true);
	});

	it('finds nothing when the word is in none of the three', () => {
		expect(found('quaternion')).toBe(false);
	});
});

// Which way the tags pick: a file shows if it wears any one of them, or only if it wears
// every one. With nothing picked, every file shows either way.

describe('picking by tag', () => {
	it('lets everything through when nothing is picked', () => {
		expect(tags_match(T_Picking.any, [], [])).toBe(true);
		expect(tags_match(T_Picking.all, [], ['prose'])).toBe(true);
		expect(tags_match(T_Picking.but, [], ['prose'])).toBe(true);
	});

	it('any of: one worn tag out of the picked ones is enough', () => {
		expect(tags_match(T_Picking.any, ['prose', 'team'], ['prose'])).toBe(true);
		expect(tags_match(T_Picking.any, ['prose', 'team'], ['debug'])).toBe(false);
	});

	it('all of: every picked tag has to be worn', () => {
		expect(tags_match(T_Picking.all, ['prose', 'team'], ['prose', 'team', 'debug'])).toBe(true);
		expect(tags_match(T_Picking.all, ['prose', 'team'], ['prose'])).toBe(false);
	});

	it('any but: not one of the picked tags may be worn', () => {
		expect(tags_match(T_Picking.but, ['prose', 'team'], ['debug'])).toBe(true);
		expect(tags_match(T_Picking.but, ['prose', 'team'], [])).toBe(true);
		expect(tags_match(T_Picking.but, ['prose', 'team'], ['prose'])).toBe(false);
		expect(tags_match(T_Picking.but, ['prose', 'team'], ['prose', 'team'])).toBe(false);
	});

	it('any but is exactly the opposite of any of', () => {
		const worn = [['prose'], ['debug'], [], ['prose', 'debug']];
		for (const tags of worn) {
			expect(tags_match(T_Picking.but, ['prose', 'team'], tags))
				.toBe(!tags_match(T_Picking.any, ['prose', 'team'], tags));
		}
	});

	it('reads an unknown way of picking as any of', () => {
		expect(tags_match('sideways', ['prose'], ['prose'])).toBe(true);
		expect(tags_match('sideways', ['prose'], ['team'])).toBe(false);
	});
});

// Inverting picks exactly the tags that were not picked, out of the ones on offer.

describe('inverting what is picked', () => {
	const offered = ['prose', 'team', 'debug'];

	it('picks what was not picked, and drops what was', () => {
		expect(inverted(offered, ['prose'])).toEqual(['team', 'debug']);
	});

	it('turns nothing picked into all of them, and back again', () => {
		expect(inverted(offered, [])).toEqual(offered);
		expect(inverted(offered, offered)).toEqual([]);
	});

	it('leaves out a picked tag that is no longer on offer', () => {
		expect(inverted(offered, ['gone'])).toEqual(offered);
	});
});

// A word remembered from an earlier visit that is no longer one of the choices would narrow
// the list while showing nowhere — nothing to press to undo it. Said once, used by each.

describe('letting go of a remembered word', () => {
	it('keeps the ones still on offer', () => {
		expect(kept_from(['prose', 'gone'], ['prose', 'team'])).toEqual(['prose']);
	});

	it('hands back the very same list when every one is still real', () => {
		const remembered = ['prose', 'team'];
		expect(kept_from(remembered, ['prose', 'team', 'debug'])).toBe(remembered);
	});

	it('hands back nothing when none of them is', () => {
		expect(kept_from(['gone'], ['prose'])).toEqual([]);
	});
});


// Down the list's right edge, every row ends with the picked tags in the picked order.

describe('trailing the picked tags', () => {
	it('moves worn picked tags to the end, in the picked order', () => {
		expect(ordered_tags(['prose', 'team', 'debug'], ['debug', 'team'])).toEqual(['prose', 'debug', 'team']);
	});

	it('leaves a row alone when it wears none of the picked', () => {
		expect(ordered_tags(['prose'], ['debug'])).toEqual(['prose']);
	});

	it('leaves a row alone when nothing is picked', () => {
		expect(ordered_tags(['prose', 'team'], [])).toEqual(['prose', 'team']);
	});
});

// The folders seg control beside the kinds: a file's folder is the one directly holding it, by
// name, and one folder at a time is picked.

describe('the folder a file sits in', () => {
	const at = (bundle: T_Bundle, path: string) => folder_of({ bundle, path } as unknown as File);

	it('is the folder directly holding the file, down to the grandchildren of the project\'s folder', () => {
		expect(at(T_Bundle.memory, 'shared/truth/conventions.md')).toBe('truth');
		expect(at(T_Bundle.memory, 'shared/truth/artwork/workflow.svg')).toBe('artwork');
	});

	it('is the nearest folder within the depth for a file deeper than that', () => {
		expect(at(T_Bundle.memory, 'shared/zone/work/done/docs.md')).toBe('work');
	});

	it('is the child alone at depth 1, when the grandchildren do not fit the row', () => {
		const shallow = (path: string) => folder_of({ bundle: T_Bundle.memory, path } as unknown as File, 1);
		expect(shallow('shared/truth/artwork/workflow.svg')).toBe('truth');
		expect(shallow('shared/zone/work/done/docs.md')).toBe('zone');
		expect(shallow('shared/truth/conventions.md')).toBe('truth');
	});

	it('is none for a file at a project\'s top, or at memory\'s', () => {
		expect(at(T_Bundle.memory, 'shared/index.md')).toBe('');
		expect(at(T_Bundle.memory, 'index.md')).toBe('');
	});
});

describe('the folder picked', () => {
	it('lets everything through when none is picked', () => {
		expect(folder_matches('', 'truth')).toBe(true);
		expect(folder_matches('', '')).toBe(true);
	});

	it('keeps only the files in a folder of that name', () => {
		expect(folder_matches('truth', 'truth')).toBe(true);
		expect(folder_matches('truth', 'artwork')).toBe(false);
		expect(folder_matches('truth', '')).toBe(false);
	});
});
