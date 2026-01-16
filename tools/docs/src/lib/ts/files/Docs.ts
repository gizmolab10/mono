// Documentation structure for DB_Docs
// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Run: bash shared/tools/create-docs-db-data.sh to regenerate

export interface DocNode {
	id: string;
	name: string;
	type: 'folder' | 'file';
	path: string;
	link?: string;
	children?: DocNode[];
}

export function getDocsStructure(): DocNode[] {
	return [
	];
}
