import { h, T_Thing, T_Trait, T_Predicate } from '../common/Global_Imports';
import { getDocsStructure, type DocNode } from '../files/Docs';
import { T_Persistence } from '../common/Enumerations';
import { DB_Name, T_Database } from './DB_Common';
import DB_Common from './DB_Common';

export default class DB_Docs extends DB_Common {
	docs_hostname = 'http://docs.webseriously.org/';
	t_persistence = T_Persistence.none;
	t_database = T_Database.docs;
	idBase = 'Docs' as DB_Name;
	
	private thingCounter = 0;
	
	get details_forStorage(): Object { return ['documentation', 'hierarchy'] }

	async fetch_all_fromLocal(): Promise<boolean> {
		// Create root thing for documentation
		const idRoot = 'docs_root';
		h.predicate_defaults_remember_runtimeCreate();
		h.thing_remember_runtimeCreateUnique(
			this.idBase, 
			idRoot, 
			'Documentation', 
			'#4a90e2',
			T_Thing.root
		);

		// Build the hierarchy from imported docs structure
		const docsStructure = getDocsStructure();
		this.buildHierarchy(docsStructure, idRoot, 0);
		h.trait_remember_runtimeCreateUnique(
			this.idBase,
			`trait_link_${idRoot}`,
			idRoot,
			T_Trait.link,
			this.docs_hostname
		);
		return true;
	}

	private buildHierarchy(nodes: DocNode[], parentId: string, depth: number): void {
		let order = 0;

		for (const node of nodes) {
			const nodeId = `${node.type}_${node.id}_${this.thingCounter++}`;

			// Create Thing for this node
			h.thing_remember_runtimeCreateUnique(
				this.idBase,
				nodeId,
				node.name,
				this.getColorForDepth(depth + 1)
			);

			// Add link trait if present (for files or folders with index.md)
			const linkPath = node.type === 'file' ? node.path : node.link;
			if (linkPath) {
				h.trait_remember_runtimeCreateUnique(
					this.idBase,
					`trait_link_${nodeId}`,
					nodeId,
					T_Trait.link,
					`${this.docs_hostname}${linkPath}`
				);
			}

			// Create relationship: parent contains this node
			h.relationship_remember_runtimeCreateUnique(
				this.idBase,
				`rel_${parentId}_${nodeId}`,
				T_Predicate.contains,
				parentId,
				nodeId,
				[order, depth]
			);

			// Recursively process children
			if (node.children && node.children.length > 0) {
				this.buildHierarchy(node.children, nodeId, depth + 1);
			}

			order++;
		}
	}

	private getColorForDepth(depth: number): string {
		const colors = [
			'#4a90e2',  // blue
			'#7b68ee',  // medium slate blue
			'#9370db',  // medium purple
			'#ba55d3',  // medium orchid
			'#da70d6',  // orchid
			'#ee82ee',  // violet
		];
		return colors[depth % colors.length];
	}
}
