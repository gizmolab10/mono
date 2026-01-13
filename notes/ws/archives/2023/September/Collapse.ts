export default class Collapse {
	id: string;
	kind: string;
	idRelationship: string; // it's idTo points to collapsed thing

	constructor(id: string, kind: string, idRelationship: string) {
		this.id = id;
		this.kind = kind;
		this.idRelationship = idRelationship;
	}
}