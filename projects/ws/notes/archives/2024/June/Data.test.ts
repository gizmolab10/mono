import { Dictionary } from '../types/Dictionary';

describe('Dictionary', () => {
	it('create a dictionary', () => {
		const dictionary = Dictionary.create<string, number>();
		dictionary.add('apple', 1);
		expect(dictionary['apple']).toBe(1);
	});
	it('look within dictionary', () => {
		const dictionary = Dictionary.create<string, number>();
		dictionary.add('apple', 1);
		dictionary.add("banana", 2);
		expect(dictionary['banana']).toBe(2);
	});
	it('shrink dictionary', () => {
		const dictionary = Dictionary.create<string, number>();
		dictionary.add('apple', 1);
		dictionary.add("banana", 2);
		dictionary.remove("apple");
		expect(dictionary.count()).toBe(1);
	});
});
