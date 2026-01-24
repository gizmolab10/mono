import { Thing } from "../common/Global_Imports";

export class Search_Node {
	nodes_map_byCharCode: Map<number, Search_Node> = new Map();
	items: Set<Thing> = new Set();
	isEndOfWord: boolean = false;

	// TRIE NODE --- short for "retrieval tree" or "prefix tree"
	// For efficient prefix-based searches
	// pronounced "try"
	// 
	// It's a tree-like data structure where:
	// 
	// Each node represents a character
	// Paths from root to nodes spell out strings
	// Common prefixes share the same path

	// 	Optimization Strategies:
	// 
	// 1. Lazy Set allocation: Only create Sets when items > 0
	// 2. Node pooling: Reuse deallocated nodes
	// 3. Compact arrays for small branching factors: Use arrays instead of Maps for nodes with few children

	get results(): Array<Thing> {
		return Array.from(this.items).sort((a, b) =>
			a.title.localeCompare(b.title)
		);
	}
	
	insert_wordFor(word: string, thing: Thing): void {
		let current: Search_Node = this;
		for (const char of word) {
			const charCode = char.charCodeAt(0);
			if (!current.nodes_map_byCharCode.has(charCode)) {
				current.nodes_map_byCharCode.set(charCode, new Search_Node());
			}
			// walk down the trie
			current = current.nodes_map_byCharCode.get(charCode)! as Search_Node;
			current.items.add(thing);
		}
		current.isEndOfWord = true;
	}

	search_for(words: string[], use_AND_logic: boolean = false): Array<Thing> {
		if (words.length === 0) return [];
		
		// For single word, return results directly
		if (words.length === 1) {
			const node = this.find_nodeFor(words[0]);
			return node ? node.results : [];
		}
		
		if (use_AND_logic) {
			// INTERSECTION (AND logic) - items must match ALL words
			const resultSets = words
				.map(word => this.find_nodeFor(word))
				.filter(node => node !== null)
				.map(node => node!.items);
			
			if (resultSets.length !== words.length) return [];
			
			const intersection = this.apply_AND_logicTo(resultSets);
			return Array.from(intersection).sort((a, b) =>
				a.title.localeCompare(b.title)
			);
		} else {
			// UNION (OR logic) - items match ANY word
			const allResults = new Set<Thing>();
			
			for (const word of words) {
				const node = this.find_nodeFor(word);
				if (node) {
					node.items.forEach(item => allResults.add(item));
				}
			}
			
			return Array.from(allResults).sort((a, b) =>
				a.title.localeCompare(b.title)
			);
		}
	}
	
	private apply_AND_logicTo(sets: Set<Thing>[]): Set<Thing> {
		if (sets.length === 0) return new Set();
		if (sets.length === 1) return new Set(sets[0]);
		
		const intersection = new Set(sets[0]);
		for (let i = 1; i < sets.length; i++) {
			for (const item of intersection) {
				if (!sets[i].has(item)) {
					intersection.delete(item);
				}
			}
		}
		return intersection;
	}

	private find_nodeFor(word: string): Search_Node | null {
		if (word.length === 0) return null;
		let current: Search_Node = this;
		for (const char of word) {
			const charCode = char.charCodeAt(0);
			const child = current.nodes_map_byCharCode.get(charCode) as Search_Node;
			if (!child) return null;
			current = child;
		}
		return current;
	}

}